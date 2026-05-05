import { decryptKey } from "@/lib/encryption"
import { loadMcpTools, type McpTransport } from "@/lib/mcp/load-mcp-tools"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not available" }, { status: 500 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: server } = await (supabase as any)
      .from("mcp_servers")
      .select("name, url, encrypted_token, iv, transport")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!server) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const token = server.encrypted_token
      ? decryptKey(server.encrypted_token, server.iv)
      : undefined
    const transport: McpTransport = server.transport === "sse" ? "sse" : "http"

    let close: (() => Promise<void>) | undefined
    try {
      const result = await loadMcpTools([
        {
          name: server.name,
          url: server.url,
          token,
          transport,
        },
      ])
      close = result.close
      const tools = result.tools.map((t) => ({
        name: t.name,
        description: t.description ?? "",
      }))
      return NextResponse.json({ ok: true, tools })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Connection failed"
      return NextResponse.json(
        { ok: false, error: message },
        { status: 200 }
      )
    } finally {
      if (close) {
        try {
          await close()
        } catch {
          // ignore close errors
        }
      }
    }
  } catch (error) {
    console.error("Error in GET /api/mcp-servers/[id]/tools:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
