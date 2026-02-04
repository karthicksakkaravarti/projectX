import { createClient } from "@/lib/supabase/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const supabase = await createClient()

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Database connection failed" }),
        { status: 500 }
      )
    }

    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from("ideation_sessions")
      .select()
      .eq("id", sessionId)
      .single()

    if (sessionError) {
      if (sessionError.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Session not found" }),
          { status: 404 }
        )
      }
      throw sessionError
    }

    // Get agent results
    const { data: agentResults, error: resultsError } = await supabase
      .from("ideation_agent_results")
      .select()
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (resultsError) {
      throw resultsError
    }

    return new Response(
      JSON.stringify({
        session,
        agentResults: agentResults || [],
      }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching ideation session:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const supabase = await createClient()

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Database connection failed" }),
        { status: 500 }
      )
    }

    // Delete agent results first
    await supabase
      .from("ideation_agent_results")
      .delete()
      .eq("session_id", sessionId)

    // Delete the session
    const { error } = await supabase
      .from("ideation_sessions")
      .delete()
      .eq("id", sessionId)

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting ideation session:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 }
    )
  }
}
