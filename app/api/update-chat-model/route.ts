import { requireAuth } from "@/lib/auth/require-auth"
import { createGuestServerClient } from "@/lib/supabase/server-guest"

export async function POST(request: Request) {
  try {
    const userId = await requireAuth(request)
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      })
    }

    const supabase = await createGuestServerClient()
    const { chatId, model } = await request.json()

    if (!chatId || !model) {
      return new Response(
        JSON.stringify({ error: "Missing chatId or model" }),
        { status: 400 }
      )
    }

    // If Supabase is not available, we still return success
    if (!supabase) {
      console.log("Supabase not enabled, skipping DB update")
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    }

    const { error } = await supabase
      .from("chats")
      .update({ model })
      .eq("id", chatId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating chat model:", error)
      return new Response(
        JSON.stringify({
          error: "Failed to update chat model",
          details: error.message,
        }),
        { status: 500 }
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    })
  } catch (err: unknown) {
    console.error("Error in update-chat-model endpoint:", err)
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500 }
    )
  }
}
