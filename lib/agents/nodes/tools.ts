import type { StructuredToolInterface } from "@langchain/core/tools"
import { ToolNode } from "@langchain/langgraph/prebuilt"

export function createToolsNode(tools: StructuredToolInterface[]): ToolNode {
  return new ToolNode(tools)
}
