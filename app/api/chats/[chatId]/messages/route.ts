import { requireAuth } from "@/lib/auth/require-auth"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
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

    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("id, user_id")
      .eq("id", chatId)
      .eq("user_id", userId)
      .maybeSingle()

    if (chatError) {
      return NextResponse.json({ error: chatError.message }, { status: 500 })
    }

    if (!chat) {
      return NextResponse.json({ error: "chat_not_found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: data ?? [] })
  } catch (error) {
    console.error("Error in GET /api/chats/[chatId]/messages:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
