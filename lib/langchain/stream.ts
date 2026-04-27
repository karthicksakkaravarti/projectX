import { extractErrorMessage } from "@/app/api/chat/utils"
import type { StreamEvent, Source } from "@/app/types/chat.types"
import type { Json } from "@/app/types/database.types"
import type { BaseMessage } from "@langchain/core/messages"
import type { Runnable } from "@langchain/core/runnables"
import type { PersistAccumulator } from "./persist"

type AgentInput = { messages: BaseMessage[] }

type StreamEventV2 = {
  event: string
  name?: string
  run_id: string
  data?: {
    chunk?: unknown
    input?: unknown
    output?: unknown
  }
  metadata?: Record<string, unknown>
  tags?: string[]
}

function chunkToTextAndReasoning(chunk: unknown): {
  text: string
  reasoning: string
  sources: Source[]
} {
  let text = ""
  let reasoning = ""
  const sources: Source[] = []

  const c = chunk as
    | {
        content?:
          | string
          | Array<{
              type?: string
              text?: string
              thinking?: string
            }>
        additional_kwargs?: Record<string, unknown>
      }
    | undefined

  if (!c) return { text, reasoning, sources }

  if (typeof c.content === "string") {
    text += c.content
  } else if (Array.isArray(c.content)) {
    for (const block of c.content) {
      if (!block || typeof block !== "object") continue
      if (block.type === "text" && typeof block.text === "string") {
        text += block.text
      } else if (block.type === "thinking" && typeof block.thinking === "string") {
        reasoning += block.thinking
      } else if (block.type === "reasoning" && typeof block.text === "string") {
        reasoning += block.text
      }
    }
  }

  const citations = c.additional_kwargs?.citations
  if (Array.isArray(citations)) {
    citations.forEach((cit, idx) => {
      if (typeof cit === "string") {
        sources.push({ id: `cit-${idx}`, url: cit })
      } else if (cit && typeof cit === "object") {
        const { url, title, id } = cit as Record<string, unknown>
        if (typeof url === "string") {
          sources.push({
            id: typeof id === "string" ? id : `cit-${idx}`,
            url,
            title: typeof title === "string" ? title : undefined,
          })
        }
      }
    })
  }

  return { text, reasoning, sources }
}

function encode(event: StreamEvent): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(event) + "\n")
}

export function runAgentStream(
  agent: Runnable<AgentInput>,
  messages: BaseMessage[],
  persist: PersistAccumulator,
  abortSignal?: AbortSignal
): Response {
  const messageId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `msg-${Date.now()}`

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(encode(e))
      const seenSources = new Set<string>()

      try {
        const iter = (
          agent as unknown as {
            streamEvents: (
              input: AgentInput,
              opts: { version: "v2"; signal?: AbortSignal }
            ) => AsyncIterable<StreamEventV2>
          }
        ).streamEvents({ messages }, { version: "v2", signal: abortSignal })

        for await (const ev of iter) {
          if (abortSignal?.aborted) break

          if (ev.event === "on_chat_model_stream") {
            const { text, reasoning, sources } = chunkToTextAndReasoning(
              ev.data?.chunk
            )
            if (text) {
              persist.appendText(text)
              send({ type: "token", text })
            }
            if (reasoning) {
              persist.appendReasoning(reasoning)
              send({ type: "reasoning", text: reasoning })
            }
            for (const s of sources) {
              if (seenSources.has(s.url)) continue
              seenSources.add(s.url)
              send({ type: "source", source: s })
            }
          } else if (ev.event === "on_tool_start") {
            const input = ev.data?.input as
              | { input?: Json; args?: Json }
              | undefined
            const args = (input?.args ?? input?.input ?? input) as Json | undefined
            const toolCallId = ev.run_id
            const toolName = ev.name ?? "tool"
            persist.recordToolCall({ toolCallId, toolName, args })
            send({ type: "tool_call", toolCallId, toolName, args })
          } else if (ev.event === "on_tool_end") {
            const toolCallId = ev.run_id
            const toolName = ev.name ?? "tool"
            const result = ev.data?.output as Json | undefined
            persist.recordToolResult({ toolCallId, toolName, result })
            send({ type: "tool_result", toolCallId, toolName, result })
          }
        }

        await persist.flush()
        send({ type: "finish", message: persist.finalMessage(messageId) })
      } catch (err) {
        const message = extractErrorMessage(err)
        send({ type: "error", message })
      } finally {
        controller.close()
      }
    },
    cancel() {
      // Signal already wired through abortSignal; nothing more to do.
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  })
}
