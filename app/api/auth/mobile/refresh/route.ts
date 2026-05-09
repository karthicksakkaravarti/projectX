import { getMobileAuthClient, readString } from "../utils"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { refresh_token?: unknown }
    const refreshToken = readString(body.refresh_token)

    if (!refreshToken) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }

    const { supabase, response } = await getMobileAuthClient()
    if (!supabase) return response

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      return NextResponse.json(
        { error: "invalid_refresh_token" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in:
        data.session.expires_in ??
        Math.max(
          0,
          (data.session.expires_at ?? 0) - Math.floor(Date.now() / 1000)
        ),
    })
  } catch (error) {
    console.error("Error in mobile refresh:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
