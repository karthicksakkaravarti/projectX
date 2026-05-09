import type { Database } from "@/app/types/database.types"
import { MODEL_DEFAULT } from "@/lib/config"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import {
  createClient as createSupabaseClient,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js"
import { NextResponse } from "next/server"

type SupabaseAdmin = SupabaseClient<Database>

export type MobileUser = {
  id: string
  email: string
  display_name: string | null
}

export async function getMobileAuthClient() {
  const supabase = await createGuestServerClient()
  if (!supabase) {
    return {
      supabase: null,
      response: NextResponse.json(
        { error: "supabase_unavailable" },
        { status: 503 }
      ),
    }
  }

  return { supabase, response: null }
}

export function createMobileOAuthClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: "implicit",
        persistSession: false,
      },
    }
  )
}

export function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function userDisplayName(user: User) {
  const metadata = user.user_metadata ?? {}
  const name = metadata.name ?? metadata.full_name ?? metadata.display_name
  return typeof name === "string" && name.trim().length > 0
    ? name.trim()
    : null
}

export function serializeUser(user: User): MobileUser {
  return {
    id: user.id,
    email: user.email ?? "",
    display_name: userDisplayName(user),
  }
}

export function serializeSession(session: Session, user: MobileUser) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in:
      session.expires_in ??
      Math.max(0, (session.expires_at ?? 0) - Math.floor(Date.now() / 1000)),
    user,
  }
}

export async function ensureUserRecord(
  supabase: SupabaseAdmin,
  user: User
): Promise<MobileUser> {
  if (!user.email) {
    throw new Error("Missing user email")
  }

  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id, email, display_name")
    .eq("id", user.id)
    .maybeSingle()

  if (existingError) {
    throw existingError
  }

  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      display_name: existing.display_name,
    }
  }

  const { error: insertError } = await supabase.from("users").insert({
    id: user.id,
    email: user.email,
    created_at: new Date().toISOString(),
    message_count: 0,
    premium: false,
    favorite_models: [MODEL_DEFAULT],
  })

  if (insertError && insertError.code !== "23505") {
    throw insertError
  }

  return serializeUser(user)
}
