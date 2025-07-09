import { type NextRequest, NextResponse } from "next/server"
import { getCustomers, addCustomer } from "@/app/actions/customer-actions"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("userId") ? Number.parseInt(searchParams.get("userId") as string) : undefined

  const result = await getCustomers(userId)

  if (result.success) {
    return NextResponse.json(result.data)
  } else {
    return NextResponse.json({ error: result.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const result = await addCustomer(formData)

  if (result.success) {
    return NextResponse.json(result)
  } else {
    return NextResponse.json(result, { status: 400 })
  }
}
