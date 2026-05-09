import { requireAuth } from "@/lib/auth/require-auth"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const userId = await requireAuth(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createGuestServerClient()
    const { chatId, pinned } = await request.json()

    if (!chatId || typeof pinned !== "boolean") {
      return NextResponse.json(
        { error: "Missing chatId or pinned" },
        { status: 400 }
      )
    }

    if (!supabase) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const toggle = pinned
      ? { pinned: true, pinned_at: new Date().toISOString() }
      : { pinned: false, pinned_at: null }

    const { error } = await supabase
      .from("chats")
      .update(toggle)
      .eq("id", chatId)
      .eq("user_id", userId)

    if (error) {
      return NextResponse.json(
        { error: "Failed to update pinned" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("toggle-chat-pin unhandled error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
