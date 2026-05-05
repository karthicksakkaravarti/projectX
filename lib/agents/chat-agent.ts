import type { BaseChatModel } from "@langchain/core/language_models/chat_models"
import type { StructuredToolInterface } from "@langchain/core/tools"
import { convertToOpenAITool } from "@langchain/core/utils/function_calling"
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph"
import { toolsCondition } from "@langchain/langgraph/prebuilt"
import { createModelNode } from "./nodes/model"
import { createToolsNode } from "./nodes/tools"

export type ChatAgentOptions = {
  llm: BaseChatModel
  tools?: StructuredToolInterface[]
}

/**
 * Convert tools to OpenAI ToolDefinition format so that bindTools()
 * uses them as-is instead of running them through zodFunction() which
 * crashes for MCP adapter tools whose schema is raw JSON Schema, not Zod.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeToolDefinitions(tools: StructuredToolInterface[]): any[] {
  return tools.map((tool) => {
    try {
      return convertToOpenAITool(tool)
    } catch {
      // Fallback: build the definition manually from the tool's properties.
      // tool.schema may be raw JSON Schema (from MCP adapters) — use it directly.
      return {
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description ?? "",
          parameters: tool.schema ?? { type: "object", properties: {} },
        },
      }
    }
  })
}

export function createChatAgent({ llm, tools = [] }: ChatAgentOptions) {
  // Bind tools to the LLM so it can generate tool_call messages.
  // Without this, the model has no knowledge of available tools and
  // toolsCondition will always route to END.
  //
  // We convert to OpenAI ToolDefinition format first to avoid the
  // zodFunction() crash that occurs with MCP adapter tools whose
  // schema is raw JSON Schema rather than Zod objects.
  const boundLlm =
    tools.length > 0 && typeof llm.bindTools === "function"
      ? llm.bindTools(safeToolDefinitions(tools))
      : llm

  const graph = new StateGraph(MessagesAnnotation)
    .addNode("model", createModelNode(boundLlm))
    .addNode("tools", createToolsNode(tools))
    .addEdge(START, "model")
    .addConditionalEdges("model", toolsCondition, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "model")

  return graph.compile()
}
