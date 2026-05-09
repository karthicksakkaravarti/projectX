import { requireAuth } from "@/lib/auth/require-auth"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const userId = await requireAuth(request)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const updateData: { title?: string; model?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.title === "string") {
      updateData.title = body.title.trim() || "New Chat"
    }

    if (typeof body.model === "string" && body.model.trim()) {
      updateData.model = body.model
    }

    if (!updateData.title && !updateData.model) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    const supabase = await createGuestServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not available" }, { status: 500 })
    }

    const { data, error } = await supabase
      .from("chats")
      .update(updateData)
      .eq("id", chatId)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ chat: data })
  } catch (err: unknown) {
    console.error("Error updating chat:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    const userId = await requireAuth(request)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createGuestServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not available" }, { status: 500 })
    }

    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", chatId)
      .eq("user_id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("Error deleting chat:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Internal server error" },
      { status: 500 }
    )
  }
}
