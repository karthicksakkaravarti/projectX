import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import type { StructuredToolInterface } from "@langchain/core/tools";

export type McpTransport = "http" | "sse";

export type ServerConfig = {
  name: string;
  url: string;
  token?: string;
  transport?: McpTransport;
};

export async function loadMcpTools(servers: ServerConfig[]): Promise<{
  tools: StructuredToolInterface[];
  close: () => Promise<void>;
}> {
  if (servers.length === 0) {
    return { tools: [], close: async () => {} };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mcpServers: Record<string, any> = {};
  for (const s of servers) {
    mcpServers[s.name] = {
      transport: s.transport ?? "http",
      url: s.url,
      headers: s.token ? { Authorization: `Bearer ${s.token}` } : undefined,
    };
  }

  const client = new MultiServerMCPClient({ mcpServers });
  const tools = await client.getTools();
  return {
    tools,
    close: () => client.close(),
  };
}
