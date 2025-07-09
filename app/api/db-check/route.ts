import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const column = searchParams.get("column")
  const table = searchParams.get("table")

  if (!column || !table) {
    return NextResponse.json({ error: "Missing column or table parameter" }, { status: 400 })
  }

  try {
    // Check if the column exists in the table
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = ${table} AND column_name = ${column}
      ) as exists
    `

    return NextResponse.json({ exists: result[0]?.exists || false })
  } catch (error) {
    console.error("Error checking column existence:", error)
    return NextResponse.json({ error: "Failed to check column existence", details: error.message }, { status: 500 })
  }
}
