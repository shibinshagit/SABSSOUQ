"use server"

import { sql } from "@/lib/db"
import { isMockMode } from "@/lib/db"

export async function setupDeviceCurrencyTable() {
  try {
    if (isMockMode()) {
      console.log("Mock mode: Skipping device currency table setup")
      return {
        success: true,
        message: "Mock mode: Device currency table setup skipped",
      }
    }

    // Check if the currency column already exists in the devices table
    const checkColumnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'devices' AND column_name = 'currency'
    `

    if (checkColumnExists.length === 0) {
      // Add the currency column to the devices table
      await sql`
        ALTER TABLE devices 
        ADD COLUMN currency VARCHAR(10) DEFAULT 'QAR'
      `

      console.log("Added currency column to devices table")
      return {
        success: true,
        message: "Currency column added to devices table",
      }
    } else {
      console.log("Currency column already exists in devices table")
      return {
        success: true,
        message: "Currency column already exists in devices table",
      }
    }
  } catch (error) {
    console.error("Error setting up device currency table:", error)
    return {
      success: false,
      message: "Failed to set up device currency table",
    }
  }
}
