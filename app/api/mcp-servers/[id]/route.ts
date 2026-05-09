import { encryptKey } from "@/lib/encryption";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, url, apiToken, enabled, transport } = await request.json();

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not available" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("mcp_servers")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (name !== undefined) updates.name = name;
    if (url !== undefined) updates.url = url;
    if (enabled !== undefined) updates.enabled = enabled;
    if (transport !== undefined) {
      updates.transport = transport === "sse" ? "sse" : "http";
    }

    if (apiToken !== undefined) {
      if (apiToken) {
        const { encrypted, iv } = encryptKey(apiToken);
        updates.encrypted_token = encrypted;
        updates.iv = iv;
      } else {
        updates.encrypted_token = null;
        updates.iv = null;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("mcp_servers")
      .update(updates)
      .eq("id", id)
      .select("id, name, url, enabled, transport, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      server: {
        id: data.id,
        name: data.name,
        url: data.url,
        enabled: data.enabled,
        hasToken: !!updates.encrypted_token,
        transport: data.transport ?? "http",
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error("Error in PUT /api/mcp-servers/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not available" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("mcp_servers")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/mcp-servers/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
