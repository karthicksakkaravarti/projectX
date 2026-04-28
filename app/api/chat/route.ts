import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { toLangChainMessages } from "@/lib/langchain/messages"
import { makePersistHandler } from "@/lib/langchain/persist"
import { runAgentStream } from "@/lib/langchain/stream"
import { getAllModels } from "@/lib/models"
import { getProviderForModel } from "@/lib/openproviders/provider-map"
import type { ProviderWithoutOllama } from "@/lib/user-keys"
import type { Attachment } from "@/lib/file-handling"
import type { Message } from "@/app/types/chat.types"
import type { StructuredToolInterface } from "@langchain/core/tools"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import {
  incrementMessageCount,
  logUserMessage,
  validateAndTrackUsage,
} from "./api"
import { createErrorResponse } from "./utils"

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
    const tools: StructuredToolInterface[] = []
    const agent = createReactAgent({ llm, tools })

    const lcMessages = toLangChainMessages(messages, effectiveSystemPrompt)

    const persist = makePersistHandler({
      supabase: supabase ?? null,
      chatId,
      message_group_id,
      model,
    })

    return runAgentStream(agent, lcMessages, persist, req.signal)
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
