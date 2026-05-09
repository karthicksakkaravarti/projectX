import { createClient } from "@/lib/supabase/server"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { hashToken } from "@/lib/user-tokens"
import { NextRequest } from "next/server"

export async function requireAuth(request: Request | NextRequest): Promise<string | null> {
  // 1. Try MCP Bearer token auth (for MCP server API calls)
  const authHeader = request.headers.get("authorization")
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]

  if (bearer) {
    const supabaseGuest = await createGuestServerClient()
    if (supabaseGuest) {
      const tokenHash = hashToken(bearer)
      const { data, error } = await supabaseGuest
        .from("user_tokens")
        .select("id, user_id")
        .eq("token_hash", tokenHash)
        .maybeSingle()
      
      if (!error && data?.user_id) {
        // Update last_used_at in the background
        void supabaseGuest
          .from("user_tokens")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", data.id)
          .then(() => {})

        return data.user_id
      }

      // Try as Supabase JWT (for mobile clients)
      const { data: userData } = await supabaseGuest.auth.getUser(bearer)
      if (userData?.user?.id) {
        return userData.user.id
      }
    }
  }

  // 2. Try standard Supabase session cookie auth (for web app API calls)
  const supabase = await createClient()
  if (supabase) {
    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user?.id) {
      return authData.user.id
    }
  }

  return null
}
