import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Very small auth-check endpoint – looks for an "auth_token" cookie and
 * returns `{ authenticated: boolean }`.  Replace with real logic as needed.
 */
export async function GET() {
  const isAuthed = Boolean(cookies().get("auth_token")?.value)
  return NextResponse.json({ authenticated: isAuthed })
}
