import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { deviceId } = await request.json()

    // First, let's create the accounting tables if they don't exist
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS financial_ledger (
          id SERIAL PRIMARY KEY,
          transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
          transaction_type VARCHAR(50) NOT NULL,
          reference_type VARCHAR(50),
          reference_id INTEGER,
          amount DECIMAL(12,2) NOT NULL,
          description TEXT,
          category VARCHAR(100),
          account_type VARCHAR(50) NOT NULL,
          debit_amount DECIMAL(12,2) DEFAULT 0,
          credit_amount DECIMAL(12,2) DEFAULT 0,
          device_id INTEGER NOT NULL,
          company_id INTEGER NOT NULL,
          created_by INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS cogs_entries (
          id SERIAL PRIMARY KEY,
          sale_id INTEGER,
          product_id INTEGER,
          quantity INTEGER NOT NULL,
          cost_price DECIMAL(12,2) NOT NULL,
          total_cost DECIMAL(12,2) NOT NULL,
          device_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS accounts_receivable (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER,
          sale_id INTEGER,
          original_amount DECIMAL(12,2) NOT NULL,
          paid_amount DECIMAL(12,2) DEFAULT 0,
          outstanding_amount DECIMAL(12,2) NOT NULL,
          due_date TIMESTAMP,
          device_id INTEGER NOT NULL,
          company_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
    } catch (createError) {
      console.error("Error creating tables:", createError)
    }

    // Check if tables exist
    const tablesExist = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('financial_ledger', 'cogs_entries', 'accounts_receivable')
    `

    // Check table structure
    const ledgerColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'financial_ledger' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `

    // Count transactions
    let transactionCount = 0
    let transactions = []

    try {
      const result = await sql`
        SELECT COUNT(*) as count FROM financial_ledger WHERE device_id = ${deviceId}
      `
      transactionCount = Number(result[0]?.count || 0)

      if (transactionCount > 0) {
        transactions = await sql`
          SELECT * FROM financial_ledger WHERE device_id = ${deviceId} ORDER BY transaction_date DESC LIMIT 5
        `
      }
    } catch (error) {
      console.error("Error querying financial_ledger:", error)
    }

    // Check recent sales
    const recentSales = await sql`
      SELECT id, total_amount, status, created_at 
      FROM sales 
      WHERE device_id = ${deviceId} 
      ORDER BY created_at DESC 
      LIMIT 5
    `

    return NextResponse.json({
      success: true,
      data: {
        tablesExist: tablesExist.map((t) => t.table_name),
        ledgerColumns: ledgerColumns.map((c) => `${c.column_name} (${c.data_type})`),
        transactionCount,
        transactions,
        recentSales,
        deviceId,
      },
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
