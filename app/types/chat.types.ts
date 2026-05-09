import type { Attachment } from "@/lib/file-handling"
import type { Json } from "@/app/types/database.types"

export type { Attachment }

export type MessageRole =
  | "user"
  | "assistant"
  | "system"
  | "data"
  | "tool"
  | "tool-call"

export type ChatStatus =
  | "ready"
  | "submitted"
  | "streaming"
  | "error"

export interface TextUIPart {
  type: "text"
  text: string
}

export interface ReasoningUIPart {
  type: "reasoning"
  reasoning?: string
  text?: string
  details?: unknown[]
}

export interface ToolInvocation {
  state: "partial-call" | "call" | "result"
  step?: number
  toolCallId: string
  toolName: string
  args?: unknown
  result?: unknown
}

export interface ToolInvocationUIPart {
  type: "tool-invocation"
  toolInvocation: ToolInvocation
}

export interface Source {
  id?: string
  url: string
  title?: string
  sourceType?: string
  providerMetadata?: Record<string, unknown>
}

export interface SourceUIPart {
  type: "source"
  source: Source
}

export interface StepStartUIPart {
  type: "step-start"
}

export interface FileUIPart {
  type: "file"
  mimeType: string
  data: string
}

export type MessagePart =
  | TextUIPart
  | ReasoningUIPart
  | ToolInvocationUIPart
  | SourceUIPart
  | StepStartUIPart
  | FileUIPart

export interface UIMessage {
  id: string
  role: MessageRole
  content: string
  createdAt?: Date
  parts?: MessagePart[]
  toolInvocations?: ToolInvocation[]
  experimental_attachments?: Attachment[]
  reasoning?: string
}

export type Message = UIMessage

export interface ChatRequestBody {
  chatId: string
  userId: string
  model: string
  isAuthenticated: boolean
  systemPrompt?: string
  enableSearch?: boolean
  message_group_id?: string
  editCutoffTimestamp?: string
}

export type StreamEvent =
  | { type: "token"; text: string }
  | { type: "reasoning"; text: string }
  | {
      type: "tool_call"
      toolCallId: string
      toolName: string
      args?: unknown
    }
  | {
      type: "tool_result"
      toolCallId: string
      toolName: string
      result?: unknown
    }
  | { type: "source"; source: Source }
  | { type: "step_start" }
  | { type: "finish"; message: UIMessage }
  | { type: "error"; message: string; code?: string }

// Internal Json reference for downstream code that needs structured payloads
export type { Json }

