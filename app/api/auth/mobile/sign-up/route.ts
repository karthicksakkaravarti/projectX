import {
  ensureUserRecord,
  getMobileAuthClient,
  readString,
  serializeSession,
} from "../utils"
import { NextResponse } from "next/server"

function isExistingUserError(error: { message?: string; code?: string }) {
  const message = error.message?.toLowerCase() ?? ""
  return (
    error.code === "email_exists" ||
    message.includes("already") ||
    message.includes("exists") ||
    message.includes("registered")
  )
}

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

    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (createError || !createData.user) {
      if (createError && isExistingUserError(createError)) {
        return NextResponse.json({ error: "user_exists" }, { status: 409 })
      }

      return NextResponse.json({ error: "sign_up_failed" }, { status: 400 })
    }

    await ensureUserRecord(supabase, createData.user)

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password })

    if (signInError || !signInData.session || !signInData.user) {
      return NextResponse.json(
        { error: "session_create_failed" },
        { status: 500 }
      )
    }

    const user = await ensureUserRecord(supabase, signInData.user)
    return NextResponse.json(serializeSession(signInData.session, user))
  } catch (error) {
    console.error("Error in mobile sign-up:", error)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
