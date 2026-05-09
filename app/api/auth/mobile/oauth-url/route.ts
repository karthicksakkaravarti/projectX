import { createMobileOAuthClient, readString } from "../utils"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: unknown
      redirect_uri?: unknown
    }
    const provider = readString(body.provider)
    const redirectTo = readString(body.redirect_uri)

    if (provider !== "google" || !redirectTo) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 })
    }

    const supabase = createMobileOAuthClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "supabase_unavailable" },
        { status: 503 }
      )
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    })

    if (error || !data.url) {
      return NextResponse.json({ error: "oauth_url_failed" }, { status: 500 })
    }

    return NextResponse.json({ url: data.url })
  } catch (error) {
    console.error("Error in mobile oauth-url:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
