import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth/require-auth"

export async function POST(request: Request) {
  try {
    const userId = await requireAuth(request)

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing or invalid token/session" }), {
        status: 401,
      })
    }

    const { name } = await request.json()

    const supabase = await createGuestServerClient()
    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Supabase not available in this deployment." }),
        { status: 200 }
      )
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({ name, user_id: userId })
      .select()
      .single()

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error("Error in projects endpoint:", err)

    return new Response(
      JSON.stringify({
        error: (err as Error).message || "Internal server error",
      }),
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const userId = await requireAuth(request)
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createGuestServerClient()

  if (!supabase) {
    return new Response(
      JSON.stringify({ error: "Supabase not available in this deployment." }),
      { status: 200 }
    )
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
