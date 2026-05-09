import { encryptKey } from "@/lib/encryption";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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
    const { data, error } = await (supabase as any)
      .from("mcp_servers")
      .select("id, name, url, enabled, encrypted_token, transport, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const servers = (data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      enabled: s.enabled,
      hasToken: !!s.encrypted_token,
      transport: (s.transport as string) ?? "http",
      createdAt: s.created_at,
    }));

    return NextResponse.json({ servers });
  } catch (error) {
    console.error("Error in GET /api/mcp-servers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, url, apiToken, enabled = true, transport } = await request.json();

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    const normalizedTransport = transport === "sse" ? "sse" : "http";

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

    // Check if server with same name already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("mcp_servers")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A server with this name already exists" },
        { status: 409 }
      );
    }

    const row: Record<string, unknown> = {
      user_id: user.id,
      name,
      url,
      enabled,
      transport: normalizedTransport,
    };

    if (apiToken) {
      const { encrypted, iv } = encryptKey(apiToken);
      row.encrypted_token = encrypted;
      row.iv = iv;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("mcp_servers")
      .insert(row)
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
        hasToken: !!apiToken,
        transport: data.transport ?? "http",
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/mcp-servers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
