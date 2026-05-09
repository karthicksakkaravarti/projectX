import { createClient } from "@/lib/supabase/server"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { headers } from "next/headers"
import { isSupabaseEnabled } from "../supabase/config"

async function getBearerTokenFromHeaders() {
  try {
    const headersList = await headers()
    return headersList.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]
  } catch {
    return null
  }
}

async function validateBearerUserIdentity(userId: string) {
  const bearer = await getBearerTokenFromHeaders()
  if (!bearer) return null

  const supabaseGuest = await createGuestServerClient()
  if (!supabaseGuest) return null

  const { data, error } = await supabaseGuest.auth.getUser(bearer)
  if (!error && data?.user?.id === userId) {
    return supabaseGuest
  }

  return null
}

/**
 * Validates the user's identity
 * @param userId - The ID of the user.
 * @param isAuthenticated - Whether the user is authenticated.
 * @returns The Supabase client.
 */
export async function validateUserIdentity(
  userId: string,
  isAuthenticated: boolean
) {
  if (!isSupabaseEnabled) {
    return null
  }

  const supabase = isAuthenticated
    ? await createClient()
    : await createGuestServerClient()

  if (!supabase) {
    throw new Error("Failed to initialize Supabase client")
  }

  if (isAuthenticated) {
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (!authError && authData?.user?.id === userId) {
      return supabase
    }

    const bearerSupabase = await validateBearerUserIdentity(userId)
    if (bearerSupabase) return bearerSupabase

    if (authError || !authData?.user?.id) {
      throw new Error("Unable to get authenticated user")
    }

    throw new Error("User ID does not match authenticated user")
  } else {
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .eq("anonymous", true)
      .maybeSingle()

    if (userError || !userRecord) {
      throw new Error("Invalid or missing guest user")
    }
  }

  return supabase
}
