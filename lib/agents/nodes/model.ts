import type { BaseChatModel } from "@langchain/core/language_models/chat_models"
import type { AIMessage } from "@langchain/core/messages"
import type { LangGraphRunnableConfig } from "@langchain/langgraph"
import type { AgentState } from "../state"

export function createModelNode(llm: BaseChatModel) {
  return async function modelNode(
    state: AgentState,
    config?: LangGraphRunnableConfig
  ): Promise<{ messages: AIMessage[] }> {
    const response = (await llm.invoke(state.messages, config)) as AIMessage
    return { messages: [response] }
  }
}
