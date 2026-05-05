import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { hashToken } from "@/lib/user-tokens"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]

    if (!bearer) {
      return NextResponse.json({ error: "missing_token" }, { status: 401 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE) {
      console.error(
        "[verify-token] SUPABASE_SERVICE_ROLE is not set — token lookup will fail because RLS blocks anon reads of user_tokens."
      )
      return NextResponse.json(
        { error: "service_unavailable" },
        { status: 503 }
      )
    }

    const supabase = await createGuestServerClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "service_unavailable" },
        { status: 503 }
      )
    }

    const tokenHash = hashToken(bearer)

    const { data, error } = await supabase
      .from("user_tokens")
      .select("id, user_id")
      .eq("token_hash", tokenHash)
      .maybeSingle()

    if (error) {
      console.error("[verify-token] supabase lookup error:", error)
      return NextResponse.json({ error: "invalid_token" }, { status: 401 })
    }

    if (!data) {
      console.warn(
        `[verify-token] no token matched (prefix=${bearer.slice(0, 10)}…)`
      )
      return NextResponse.json({ error: "invalid_token" }, { status: 401 })
    }

    void supabase
      .from("user_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id)
      .then(() => {})

    return NextResponse.json({ userId: data.user_id })
  } catch (error) {
    console.error("[verify-token] unexpected error:", error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
