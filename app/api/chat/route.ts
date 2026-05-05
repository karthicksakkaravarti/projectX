import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { decryptKey } from "@/lib/encryption"
import { toLangChainMessages } from "@/lib/langchain/messages"
import { loadMcpTools } from "@/lib/mcp/load-mcp-tools"
import { makePersistHandler } from "@/lib/langchain/persist"
import { runAgentStream } from "@/lib/langchain/stream"
import { createClient } from "@/lib/supabase/server"
import { getAllModels } from "@/lib/models"
import { getProviderForModel } from "@/lib/openproviders/provider-map"
import type { ProviderWithoutOllama } from "@/lib/user-keys"
import type { Attachment } from "@/lib/file-handling"
import type { Message } from "@/app/types/chat.types"
import type { StructuredToolInterface } from "@langchain/core/tools"
import { createChatAgent } from "@/lib/agents"
import {
  incrementMessageCount,
  logUserMessage,
  validateAndTrackUsage,
} from "./api"
import { createErrorResponse } from "./utils"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any

export const maxDuration = 60

type ChatRequest = {
  messages: Message[]
  chatId: string
  userId: string
  model: string
  isAuthenticated: boolean
  systemPrompt: string
  enableSearch: boolean
  message_group_id?: string
  editCutoffTimestamp?: string
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      chatId,
      userId,
      model,
      isAuthenticated,
      systemPrompt,
      enableSearch,
      message_group_id,
      editCutoffTimestamp,
    } = (await req.json()) as ChatRequest

    if (!messages || !chatId || !userId) {
      return new Response(
        JSON.stringify({ error: "Error, missing information" }),
        { status: 400 }
      )
    }

    const supabase = await validateAndTrackUsage({
      userId,
      model,
      isAuthenticated,
    })

    if (supabase) {
      await incrementMessageCount({ supabase, userId })
    }

    const userMessage = messages[messages.length - 1]

    if (supabase && editCutoffTimestamp) {
      try {
        await supabase
          .from("messages")
          .delete()
          .eq("chat_id", chatId)
          .gte("created_at", editCutoffTimestamp)
      } catch (err) {
        console.error("Failed to delete messages from cutoff:", err)
      }
    }

    if (supabase && userMessage?.role === "user") {
      await logUserMessage({
        supabase,
        userId,
        chatId,
        content:
          typeof userMessage.content === "string" ? userMessage.content : "",
        attachments: userMessage.experimental_attachments as Attachment[],
        model,
        isAuthenticated,
        message_group_id,
      })
    }

    const allModels = await getAllModels()
    const modelConfig = allModels.find((m) => m.id === model)

    if (!modelConfig || !modelConfig.apiSdk) {
      throw new Error(`Model ${model} not found`)
    }

    const effectiveSystemPrompt = systemPrompt || SYSTEM_PROMPT_DEFAULT

    let apiKey: string | undefined
    if (isAuthenticated && userId) {
      const { getEffectiveApiKey } = await import("@/lib/user-keys")
      const provider = getProviderForModel(model)
      apiKey =
        (await getEffectiveApiKey(userId, provider as ProviderWithoutOllama)) ||
        undefined
    }

    const llm = modelConfig.apiSdk(apiKey, { enableSearch })
    let tools: StructuredToolInterface[] = []
    let closeMcp: (() => Promise<void>) | undefined

    if (isAuthenticated && userId) {
      try {
        const supabase = await createClient()
        if (supabase) {
          const { data: mcpRows } = await (supabase as AnySupabase)
            .from("mcp_servers")
            .select("name, url, encrypted_token, iv, enabled, transport")
            .eq("user_id", userId)
            .eq("enabled", true)

          if (mcpRows && mcpRows.length > 0) {
            const servers = mcpRows
              .map((r: Record<string, unknown>) => ({
                name: r.name as string,
                url: r.url as string,
                token: r.encrypted_token
                  ? decryptKey(r.encrypted_token as string, r.iv as string)
                  : undefined,
                transport: ((r.transport as string) === "sse" ? "sse" : "http") as
                  | "http"
                  | "sse",
              }))
              .filter((s: { name: string; url: string; token?: string }) => s.url)

            if (servers.length > 0) {
              const { tools: mcpTools, close } = await loadMcpTools(servers)
              tools = mcpTools
              closeMcp = close
            }
          }
        }
      } catch (err) {
        console.error("Failed to load MCP tools:", err)
      }
    }

    const agent = createChatAgent({ llm, tools })

    const lcMessages = toLangChainMessages(messages, effectiveSystemPrompt)

    const persist = makePersistHandler({
      supabase: supabase ?? null,
      chatId,
      message_group_id,
      model,
    })

    return runAgentStream(agent, lcMessages, persist, req.signal, closeMcp)
  } catch (err: unknown) {
    console.error("Error in /api/chat:", err)
    const error = err as {
      code?: string
      message?: string
      statusCode?: number
    }

    return createErrorResponse(error)
  }
}
