import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId parameter" }),
        { status: 400 }
      )
    }

    const supabase = await createClient()

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Database connection failed" }),
        { status: 500 }
      )
    }

    const { data: sessions, error } = await supabase
      .from("ideation_sessions")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ sessions: sessions || [] }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error listing ideation sessions:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 }
    )
  }
}
