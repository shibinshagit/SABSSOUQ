"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateFinanceSchema() {
  try {
    // Check if device_id column exists
    const checkColumnResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'financial_transactions' 
      AND column_name = 'device_id'
    `.catch(() => [])

    const hasDeviceIdColumn = checkColumnResult && checkColumnResult.length > 0

    if (!hasDeviceIdColumn) {
      // Add device_id column to financial_transactions table
      await sql`
        ALTER TABLE financial_transactions
        ADD COLUMN device_id INTEGER
      `
      console.log("Added device_id column to financial_transactions table")
    } else {
      console.log("device_id column already exists in financial_transactions table")
    }

    revalidatePath("/admin")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Finance schema updated successfully",
    }
  } catch (error) {
    console.error("Error updating finance schema:", error)
    return {
      success: false,
      message: `Failed to update finance schema: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
