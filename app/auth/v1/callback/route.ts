import { MODEL_DEFAULT } from "@/lib/config"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { NextResponse } from "next/server"

function mobileFragmentBridge() {
  return new Response(
    `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ProjectX Auth</title>
  </head>
  <body>
    <script>
      const hash = window.location.hash || "";
      if (hash.includes("access_token=") && hash.includes("refresh_token=")) {
        window.location.replace("projectx://auth/callback" + hash);
      } else {
        window.location.replace("/auth/error?message=Missing%20authentication%20code");
      }
    </script>
  </body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  const host = request.headers.get("host") ?? ""
  const isLocal = /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(host)
  const protocol = isLocal ? "http" : "https"
  const base = `${protocol}://${host}`

  if (!isSupabaseEnabled) {
    return NextResponse.redirect(
      `${base}/auth/error?message=${encodeURIComponent("Supabase is not enabled in this deployment.")}`
    )
  }

  if (!code) {
    return mobileFragmentBridge()
  }

  const supabase = await createClient()
  const supabaseAdmin = await createGuestServerClient()

  if (!supabase || !supabaseAdmin) {
    return NextResponse.redirect(
      `${base}/auth/error?message=${encodeURIComponent("Supabase is not enabled in this deployment.")}`
    )
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Auth error:", error)
    return NextResponse.redirect(
      `${base}/auth/error?message=${encodeURIComponent(error.message)}`
    )
  }

  const user = data?.user
  if (!user || !user.id || !user.email) {
    return NextResponse.redirect(
      `${base}/auth/error?message=${encodeURIComponent("Missing user info")}`
    )
  }

  try {
    const { error: insertError } = await supabaseAdmin.from("users").insert({
      id: user.id,
      email: user.email,
      created_at: new Date().toISOString(),
      message_count: 0,
      premium: false,
      favorite_models: [MODEL_DEFAULT],
    })

    if (insertError && insertError.code !== "23505") {
      console.error("Error inserting user:", insertError)
    }
  } catch (err) {
    console.error("Unexpected user insert error:", err)
  }

  return NextResponse.redirect(`${base}${next}`)
}
