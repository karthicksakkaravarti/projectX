import type { BaseChatModel } from "@langchain/core/language_models/chat_models"
import type { StructuredToolInterface } from "@langchain/core/tools"
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph"
import { toolsCondition } from "@langchain/langgraph/prebuilt"
import { createModelNode } from "./nodes/model"
import { createToolsNode } from "./nodes/tools"

export type ChatAgentOptions = {
  llm: BaseChatModel
  tools?: StructuredToolInterface[]
}

export function createChatAgent({ llm, tools = [] }: ChatAgentOptions) {
  const graph = new StateGraph(MessagesAnnotation)
    .addNode("model", createModelNode(llm))
    .addNode("tools", createToolsNode(tools))
    .addEdge(START, "model")
    .addConditionalEdges("model", toolsCondition, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "model")

  return graph.compile()
}
