import { NextApiRequest, NextApiResponse } from "next"
import { prisma } from "@/lib/prisma" // adjust import as needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" })
  }

  const { id } = req.query

  try {
    // Update sale status to "Returned"
    await prisma.sale.update({
      where: { id: Number(id) },
      data: { status: "Returned" },
    })
    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to return sale" })
  }
}