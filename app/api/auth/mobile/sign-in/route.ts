import {
  ensureUserRecord,
  getMobileAuthClient,
  readString,
  serializeSession,
} from "../utils"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown
      password?: unknown
    }
    const email = readString(body.email)
    const password = readString(body.password)

    if (!email || !password) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }

    const { supabase, response } = await getMobileAuthClient()
    if (!supabase) return response

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401 }
      )
    }

    const user = await ensureUserRecord(supabase, data.user)
    return NextResponse.json(serializeSession(data.session, user))
  } catch (error) {
    console.error("Error in mobile sign-in:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
