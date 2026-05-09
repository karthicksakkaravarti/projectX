import { MultiServerMCPClient } from "@langchain/mcp-adapters"
import type { StructuredToolInterface } from "@langchain/core/tools"

export async function loadMCPToolsFromURL(
  url: string
): Promise<{ tools: StructuredToolInterface[]; close: () => Promise<void> }> {
  const client = new MultiServerMCPClient({
    mcpServers: {
      remote: {
        transport: "sse",
        url,
      },
    },
  })

  const tools = await client.getTools()
  return {
    tools,
    close: async () => {
      await client.close()
    },
  }
}
