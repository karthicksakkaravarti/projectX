import {
  ensureUserRecord,
  getMobileAuthClient,
  readString,
} from "../utils"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      access_token?: unknown
      refresh_token?: unknown
    }
    const accessToken = readString(body.access_token)
    const refreshToken = readString(body.refresh_token)

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }

    const { supabase, response } = await getMobileAuthClient()
    if (!supabase) return response

    const { data, error } = await supabase.auth.getUser(accessToken)

    if (error || !data.user) {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 })
    }

    const user = await ensureUserRecord(supabase, data.user)
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error in mobile oauth-callback:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
