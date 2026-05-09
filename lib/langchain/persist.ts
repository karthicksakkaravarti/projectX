import { saveFinalAssistantMessage } from "@/app/api/chat/db"
import type {
  Message as ServerMessage,
  ContentPart,
} from "@/app/types/api.types"
import type { Database, Json } from "@/app/types/database.types"
import type { SupabaseClient } from "@supabase/supabase-js"

type ToolCallEntry = {
  toolCallId: string
  toolName: string
  args?: Json
  result?: Json
  state: "call" | "result"
  step: number
}

export type PersistAccumulator = {
  appendText(text: string): void
  appendReasoning(text: string): void
  recordToolCall(call: {
    toolCallId: string
    toolName: string
    args?: Json
  }): void
  recordToolResult(result: {
    toolCallId: string
    toolName: string
    result?: Json
  }): void
  finalMessage(messageId: string): import("@/app/types/chat.types").Message
  flush(): Promise<void>
}

type Options = {
  supabase: SupabaseClient<Database> | null
  chatId: string
  message_group_id?: string
  model?: string
}

export function makePersistHandler({
  supabase,
  chatId,
  message_group_id,
  model,
}: Options): PersistAccumulator {
  let textBuffer = ""
  let reasoningBuffer = ""
  const toolCalls = new Map<string, ToolCallEntry>()
  let stepCounter = 0

  return {
    appendText(text: string) {
      if (text) textBuffer += text
    },
    appendReasoning(text: string) {
      if (text) reasoningBuffer += text
    },
    recordToolCall({ toolCallId, toolName, args }) {
      stepCounter += 1
      toolCalls.set(toolCallId, {
        toolCallId,
        toolName,
        args,
        state: "call",
        step: stepCounter,
      })
    },
    recordToolResult({ toolCallId, toolName, result }) {
      const existing = toolCalls.get(toolCallId)
      toolCalls.set(toolCallId, {
        toolCallId,
        toolName: toolName || existing?.toolName || "",
        args: existing?.args,
        result,
        state: "result",
        step: existing?.step ?? ++stepCounter,
      })
    },
    finalMessage(messageId: string) {
      const parts: import("@/app/types/chat.types").MessagePart[] = []
      if (textBuffer) parts.push({ type: "text", text: textBuffer })
      if (reasoningBuffer) {
        parts.push({
          type: "reasoning",
          reasoning: reasoningBuffer,
          text: reasoningBuffer,
        })
      }
      for (const t of toolCalls.values()) {
        parts.push({
          type: "tool-invocation",
          toolInvocation: {
            state: t.state === "result" ? "result" : "call",
            step: t.step,
            toolCallId: t.toolCallId,
            toolName: t.toolName,
            args: t.args,
            result: t.result,
          },
        })
      }
      return {
        id: messageId,
        role: "assistant" as const,
        content: textBuffer,
        createdAt: new Date(),
        parts,
        reasoning: reasoningBuffer || undefined,
      }
    },
    async flush() {
      if (!supabase) return

      const contentParts: ContentPart[] = []
      if (textBuffer) contentParts.push({ type: "text", text: textBuffer })
      if (reasoningBuffer) {
        contentParts.push({
          type: "reasoning",
          text: reasoningBuffer,
        })
      }
      for (const t of toolCalls.values()) {
        contentParts.push({
          type: "tool-invocation",
          toolInvocation: {
            state: t.state === "result" ? "result" : "call",
            step: t.step,
            toolCallId: t.toolCallId,
            toolName: t.toolName,
            args: t.args,
            result: t.result,
          },
        })
      }

      const assistantMessage: ServerMessage = {
        role: "assistant",
        content: contentParts,
      }

      await saveFinalAssistantMessage(
        supabase,
        chatId,
        [assistantMessage],
        message_group_id,
        model
      )
    },
  }
}
