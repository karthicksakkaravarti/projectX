import type { Message, MessagePart } from "@/app/types/chat.types"
import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages"

type MultimodalContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }

function buildUserContent(message: Message): string | MultimodalContent[] {
  const text =
    typeof message.content === "string"
      ? message.content
      : ""

  const attachments = message.experimental_attachments ?? []
  if (attachments.length === 0) {
    return text
  }

  const blocks: MultimodalContent[] = []
  if (text) blocks.push({ type: "text", text })

  for (const att of attachments) {
    if (att.contentType?.startsWith("image/")) {
      blocks.push({ type: "image_url", image_url: { url: att.url } })
    } else if (att.url) {
      blocks.push({
        type: "text",
        text: `[attached file ${att.name}: ${att.url}]`,
      })
    }
  }

  return blocks
}

function flattenAssistantContent(message: Message): string {
  if (typeof message.content === "string") return message.content
  if (!message.parts) return ""
  return message.parts
    .filter((p): p is MessagePart & { type: "text" } => p.type === "text")
    .map((p) => p.text)
    .join("\n")
}

export function toLangChainMessages(
  messages: Message[],
  systemPrompt?: string
): BaseMessage[] {
  const out: BaseMessage[] = []
  if (systemPrompt) {
    out.push(new SystemMessage(systemPrompt))
  }

  for (const msg of messages) {
    switch (msg.role) {
      case "system":
        out.push(
          new SystemMessage(
            typeof msg.content === "string" ? msg.content : ""
          )
        )
        break
      case "user":
        out.push(new HumanMessage({ content: buildUserContent(msg) }))
        break
      case "assistant":
        out.push(new AIMessage({ content: flattenAssistantContent(msg) }))
        break
      case "tool":
      case "tool-call": {
        const toolPart = msg.parts?.find((p) => p.type === "tool-invocation") as
          | (MessagePart & { type: "tool-invocation" })
          | undefined
        if (toolPart) {
          out.push(
            new ToolMessage({
              content: JSON.stringify(toolPart.toolInvocation.result ?? ""),
              tool_call_id: toolPart.toolInvocation.toolCallId,
              name: toolPart.toolInvocation.toolName,
            })
          )
        }
        break
      }
      default:
        break
    }
  }

  return out
}
