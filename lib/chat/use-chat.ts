"use client"

import type {
  ChatStatus,
  Message,
  MessagePart,
  StreamEvent,
} from "@/app/types/chat.types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type SubmitOptions = {
  body?: Record<string, unknown>
  experimental_attachments?: Message["experimental_attachments"]
}

type AppendInput = Pick<Message, "role" | "content"> & Partial<Message>

export type UseChatOptions = {
  api: string
  id?: string
  initialMessages?: Message[]
  initialInput?: string
  onFinish?: (m: Message) => void | Promise<void>
  onError?: (e: Error) => void
  body?: Record<string, unknown>
}

export type UseChatHelpers = {
  messages: Message[]
  setMessages: (
    updater: Message[] | ((prev: Message[]) => Message[])
  ) => void
  input: string
  setInput: (value: string) => void
  handleSubmit: (
    event?: { preventDefault?: () => void } | undefined,
    options?: SubmitOptions
  ) => Promise<void>
  append: (
    message: AppendInput,
    options?: SubmitOptions
  ) => Promise<void>
  reload: (options?: SubmitOptions) => Promise<void>
  stop: () => void
  status: ChatStatus
  isLoading: boolean
  error: Error | null
}

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

function applyEvent(
  message: Message,
  event: StreamEvent
): Message {
  const next: Message = { ...message }
  next.parts = next.parts ? [...next.parts] : []

  switch (event.type) {
    case "token": {
      next.content = (next.content || "") + event.text
      const lastPart = next.parts[next.parts.length - 1]
      if (lastPart && lastPart.type === "text") {
        next.parts[next.parts.length - 1] = {
          type: "text",
          text: lastPart.text + event.text,
        }
      } else {
        next.parts.push({ type: "text", text: event.text })
      }
      break
    }
    case "reasoning": {
      const lastPart = next.parts[next.parts.length - 1]
      if (lastPart && lastPart.type === "reasoning") {
        const merged = (lastPart.text ?? "") + event.text
        next.parts[next.parts.length - 1] = {
          type: "reasoning",
          text: merged,
          reasoning: merged,
        }
      } else {
        next.parts.push({
          type: "reasoning",
          text: event.text,
          reasoning: event.text,
        })
      }
      next.reasoning = (next.reasoning ?? "") + event.text
      break
    }
    case "tool_call": {
      const part: MessagePart = {
        type: "tool-invocation",
        toolInvocation: {
          state: "call",
          toolCallId: event.toolCallId,
          toolName: event.toolName,
          args: event.args,
        },
      }
      next.parts.push(part)
      break
    }
    case "tool_result": {
      const idx = next.parts.findIndex(
        (p) =>
          p.type === "tool-invocation" &&
          p.toolInvocation.toolCallId === event.toolCallId
      )
      if (idx >= 0) {
        const existing = next.parts[idx] as Extract<
          MessagePart,
          { type: "tool-invocation" }
        >
        next.parts[idx] = {
          type: "tool-invocation",
          toolInvocation: {
            ...existing.toolInvocation,
            state: "result",
            result: event.result,
          },
        }
      } else {
        next.parts.push({
          type: "tool-invocation",
          toolInvocation: {
            state: "result",
            toolCallId: event.toolCallId,
            toolName: event.toolName,
            result: event.result,
          },
        })
      }
      break
    }
    case "source": {
      next.parts.push({ type: "source", source: event.source })
      break
    }
    case "step_start": {
      next.parts.push({ type: "step-start" })
      break
    }
    default:
      break
  }
  return next
}

async function* readNDJSON(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<StreamEvent> {
  const decoder = new TextDecoder()
  let buffer = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      const trailing = buffer.trim()
      if (trailing) {
        try {
          yield JSON.parse(trailing) as StreamEvent
        } catch {
          /* ignore */
        }
      }
      return
    }
    buffer += decoder.decode(value, { stream: true })
    let newlineIdx = buffer.indexOf("\n")
    while (newlineIdx >= 0) {
      const line = buffer.slice(0, newlineIdx).trim()
      buffer = buffer.slice(newlineIdx + 1)
      if (line) {
        try {
          yield JSON.parse(line) as StreamEvent
        } catch (err) {
          console.error("Failed to parse NDJSON line:", line, err)
        }
      }
      newlineIdx = buffer.indexOf("\n")
    }
  }
}

export function useChat(options: UseChatOptions): UseChatHelpers {
  const {
    api,
    initialMessages = [],
    initialInput = "",
    onFinish,
    onError,
    body: defaultBody,
  } = options

  const [messages, setMessagesState] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState(initialInput)
  const [status, setStatus] = useState<ChatStatus>("ready")
  const [error, setError] = useState<Error | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const onFinishRef = useRef(onFinish)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onFinishRef.current = onFinish
    onErrorRef.current = onError
  }, [onFinish, onError])

  const setMessages = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setMessagesState((prev) =>
        typeof updater === "function"
          ? (updater as (p: Message[]) => Message[])(prev)
          : updater
      )
    },
    []
  )

  const runRequest = useCallback(
    async (history: Message[], submitBody: Record<string, unknown>) => {
      const controller = new AbortController()
      abortRef.current = controller
      setStatus("submitted")
      setError(null)

      const assistantId = generateId("assistant")
      const placeholder: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
        parts: [],
      }
      setMessagesState((prev) => [...prev, placeholder])

      try {
        const response = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...defaultBody, ...submitBody, messages: history }),
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          let serverMessage = `Request failed (${response.status})`
          try {
            const data = (await response.json()) as { error?: string }
            if (data.error) serverMessage = data.error
          } catch {
            /* non-JSON */
          }
          throw new Error(serverMessage)
        }

        setStatus("streaming")
        const reader = response.body.getReader()
        let finalMessage: Message | null = null
        let streamError: string | null = null

        for await (const event of readNDJSON(reader)) {
          if (event.type === "finish") {
            finalMessage = { ...event.message, id: assistantId }
            continue
          }
          if (event.type === "error") {
            streamError = event.message
            continue
          }
          setMessagesState((prev) => {
            const idx = prev.findIndex((m) => m.id === assistantId)
            if (idx === -1) return prev
            const updated = [...prev]
            updated[idx] = applyEvent(updated[idx], event)
            return updated
          })
        }

        if (streamError) throw new Error(streamError)

        if (finalMessage) {
          setMessagesState((prev) => {
            const idx = prev.findIndex((m) => m.id === assistantId)
            if (idx === -1) return prev
            const updated = [...prev]
            updated[idx] = finalMessage as Message
            return updated
          })
          setStatus("ready")
          await onFinishRef.current?.(finalMessage)
        } else {
          setStatus("ready")
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setStatus("ready")
          return
        }
        const e = err instanceof Error ? err : new Error(String(err))
        setError(e)
        setStatus("error")
        onErrorRef.current?.(e)
        setMessagesState((prev) => prev.filter((m) => m.id !== assistantId))
      } finally {
        abortRef.current = null
      }
    },
    [api, defaultBody]
  )

  const handleSubmit = useCallback(
    async (
      event?: { preventDefault?: () => void } | undefined,
      submitOptions?: SubmitOptions
    ) => {
      event?.preventDefault?.()
      if (!input.trim()) return

      const userMessage: Message = {
        id: generateId("user"),
        role: "user",
        content: input,
        createdAt: new Date(),
        experimental_attachments: submitOptions?.experimental_attachments,
      }

      const next = [...messages, userMessage]
      setMessagesState(next)
      setInput("")
      await runRequest(next, submitOptions?.body ?? {})
    },
    [input, messages, runRequest]
  )

  const append = useCallback(
    async (message: AppendInput, submitOptions?: SubmitOptions) => {
      const newMessage: Message = {
        id: message.id ?? generateId("user"),
        role: message.role,
        content:
          typeof message.content === "string" ? message.content : "",
        createdAt: message.createdAt ?? new Date(),
        experimental_attachments:
          message.experimental_attachments ??
          submitOptions?.experimental_attachments,
        parts: message.parts,
        toolInvocations: message.toolInvocations,
      }

      const next = [...messages, newMessage]
      setMessagesState(next)
      await runRequest(next, submitOptions?.body ?? {})
    },
    [messages, runRequest]
  )

  const reload = useCallback(
    async (submitOptions?: SubmitOptions) => {
      const lastUserIndex = (() => {
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === "user") return i
        }
        return -1
      })()
      if (lastUserIndex === -1) return
      const trimmed = messages.slice(0, lastUserIndex + 1)
      setMessagesState(trimmed)
      await runRequest(trimmed, submitOptions?.body ?? {})
    },
    [messages, runRequest]
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setStatus("ready")
  }, [])

  const isLoading = status === "streaming" || status === "submitted"

  return useMemo(
    () => ({
      messages,
      setMessages,
      input,
      setInput,
      handleSubmit,
      append,
      reload,
      stop,
      status,
      isLoading,
      error,
    }),
    [
      messages,
      setMessages,
      input,
      handleSubmit,
      append,
      reload,
      stop,
      status,
      isLoading,
      error,
    ]
  )
}
