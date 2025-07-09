import { type NextRequest, NextResponse } from "next/server"
import { updateCustomer, deleteCustomer } from "@/app/actions/customer-actions"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData()
  formData.set("id", params.id)

  const result = await updateCustomer(formData)

  if (result.success) {
    return NextResponse.json(result)
  } else {
    return NextResponse.json(result, { status: 400 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)
  const result = await deleteCustomer(id)

  if (result.success) {
    return NextResponse.json(result)
  } else {
    return NextResponse.json(result, { status: 400 })
  }
}
