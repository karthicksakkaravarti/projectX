import { MultiServerMCPClient } from "@langchain/mcp-adapters"
import type { StructuredToolInterface } from "@langchain/core/tools"

export async function loadMCPToolsFromLocal(
  command: string,
  env: Record<string, string> = {}
): Promise<{ tools: StructuredToolInterface[]; close: () => Promise<void> }> {
  const client = new MultiServerMCPClient({
    mcpServers: {
      local: {
        transport: "stdio",
        command,
        args: ["stdio"],
        env,
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
