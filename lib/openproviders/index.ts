import { ChatAnthropic } from "@langchain/anthropic"
import type { BaseChatModel } from "@langchain/core/language_models/chat_models"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatMistralAI } from "@langchain/mistralai"
import { ChatOllama } from "@langchain/ollama"
import { ChatOpenAI } from "@langchain/openai"
import { ChatXAI } from "@langchain/xai"
import { env } from "./env"
import { getProviderForModel } from "./provider-map"
import type { SupportedModel } from "./types"

export type OpenProvidersOptions<_T extends SupportedModel = SupportedModel> = {
  enableSearch?: boolean
  temperature?: number
  maxTokens?: number
}

const getOllamaBaseURL = (): string => {
  if (typeof window !== "undefined") {
    return "http://localhost:11434"
  }
  const fromEnv = process.env.OLLAMA_BASE_URL?.replace(/\/+$/, "")
  return fromEnv || "http://localhost:11434"
}

export function openproviders<T extends SupportedModel>(
  modelId: T,
  settings?: OpenProvidersOptions<T>,
  apiKey?: string
): BaseChatModel {
  const provider = getProviderForModel(modelId)

  const temperature = settings?.temperature
  const maxTokens = settings?.maxTokens

  if (provider === "openai") {
    return new ChatOpenAI({
      model: modelId,
      apiKey: apiKey ?? env.OPENAI_API_KEY,
      streaming: true,
      temperature,
      maxTokens,
    })
  }

  if (provider === "mistral") {
    return new ChatMistralAI({
      model: modelId,
      apiKey: apiKey ?? env.MISTRAL_API_KEY,
      streaming: true,
      temperature,
      maxTokens,
    })
  }

  if (provider === "google") {
    return new ChatGoogleGenerativeAI({
      model: modelId,
      apiKey: apiKey ?? env.GOOGLE_GENERATIVE_AI_API_KEY,
      streaming: true,
      temperature,
      maxOutputTokens: maxTokens,
    })
  }

  if (provider === "perplexity") {
    return new ChatOpenAI({
      model: modelId,
      apiKey: apiKey ?? env.PERPLEXITY_API_KEY,
      streaming: true,
      temperature,
      maxTokens,
      configuration: { baseURL: "https://api.perplexity.ai" },
    })
  }

  if (provider === "anthropic") {
    return new ChatAnthropic({
      model: modelId,
      apiKey: apiKey ?? env.ANTHROPIC_API_KEY,
      streaming: true,
      temperature,
      maxTokens,
    })
  }

  if (provider === "xai") {
    return new ChatXAI({
      model: modelId,
      apiKey: apiKey ?? env.XAI_API_KEY,
      streaming: true,
      temperature,
      maxTokens,
    })
  }

  if (provider === "ollama") {
    return new ChatOllama({
      model: modelId,
      baseUrl: getOllamaBaseURL(),
      streaming: true,
      temperature,
    })
  }

  if (provider === "minimax") {
    return new ChatOpenAI({
      model: modelId,
      apiKey: apiKey ?? env.MINIMAX_API_KEY,
      streaming: true,
      temperature,
      maxTokens,
      configuration: { baseURL: "https://api.minimaxi.chat/v1" },
    })
  }

  if (provider === "openrouter") {
    const upstreamId = String(modelId).replace(/^openrouter:/, "")
    return new ChatOpenAI({
      model: upstreamId,
      apiKey: apiKey ?? env.OPENROUTER_API_KEY,
      streaming: true,
      temperature,
      maxTokens,
      configuration: { baseURL: "https://openrouter.ai/api/v1" },
    })
  }

  throw new Error(`Unsupported model: ${String(modelId)}`)
}
