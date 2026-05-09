import { createClient } from "@/lib/supabase/server"
import { generateToken } from "@/lib/user-tokens"
import { NextResponse } from "next/server"

export async function GET() {
  try {
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

    const { data, error } = await supabase
      .from("user_tokens")
      .select("id, name, prefix, last_used_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const tokens = (data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      prefix: t.prefix,
      lastUsedAt: t.last_used_at,
      createdAt: t.created_at,
    }))

    return NextResponse.json({ tokens })
  } catch (error) {
    console.error("Error in GET /api/user-tokens:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

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

    const { data: existing } = await supabase
      .from("user_tokens")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", name)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "A token with this name already exists" },
        { status: 409 }
      )
    }

    const { plaintext, hash, prefix } = generateToken()

    const { data, error } = await supabase
      .from("user_tokens")
      .insert({
        user_id: user.id,
        name: name.trim(),
        token_hash: hash,
        prefix,
      })
      .select("id, name, prefix, created_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      token: {
        id: data.id,
        name: data.name,
        prefix: data.prefix,
        createdAt: data.created_at,
        plaintext,
      },
    })
  } catch (error) {
    console.error("Error in POST /api/user-tokens:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
