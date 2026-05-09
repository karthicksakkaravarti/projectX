import { requireAuth } from "@/lib/auth/require-auth"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request)

    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const supabase = await createGuestServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "supabase_unavailable" },
        { status: 503 }
      )
    }

    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ chats: data ?? [] })
  } catch (error) {
    console.error("Error in GET /api/chats:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
