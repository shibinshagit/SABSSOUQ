import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Fetch company info.  Expects a `companyId` query parameter.
 * Replace the mock response with real DB access when available.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get("companyId")

  if (!companyId) {
    return NextResponse.json({ error: "companyId query param missing" }, { status: 400 })
  }

  // TODO: real DB lookup here
  return NextResponse.json({
    companyId,
    name: "Demo Company",
  })
}
