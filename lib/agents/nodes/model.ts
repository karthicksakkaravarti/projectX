import type { AIMessage, BaseMessage } from "@langchain/core/messages"
import type { Runnable } from "@langchain/core/runnables"
import type { LangGraphRunnableConfig } from "@langchain/langgraph"
import type { AgentState } from "../state"

export function createModelNode(llm: Runnable<BaseMessage[], AIMessage>) {
  return async function modelNode(
    state: AgentState,
    config?: LangGraphRunnableConfig
  ): Promise<{ messages: AIMessage[] }> {
    const response = (await llm.invoke(state.messages, config)) as AIMessage
    return { messages: [response] }
  }
}
