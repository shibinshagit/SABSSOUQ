"use server"

import { sql } from "@/lib/db"
import { financeTableSchemas, sampleFinanceData } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"

/**
 * Sets up the finance tables in the database if they don't exist
 * and populates them with sample data for testing
 */
export async function setupFinanceTables(companyId = 1) {
  try {
    // Create tables if they don't exist
    for (const [tableName, schema] of Object.entries(financeTableSchemas)) {
      await sql.unsafe(schema)
      console.log(`Created or verified table: ${tableName}`)
    }

    // Check if there's already data in the financial_transactions table
    const existingTransactions = await sql`
      SELECT COUNT(*) as count FROM financial_transactions WHERE company_id = ${companyId}
    `

    if (existingTransactions[0]?.count > 0) {
      console.log("Finance tables already contain data, skipping sample data insertion")
      return {
        success: true,
        message: "Finance tables already set up with data",
      }
    }

    // Insert expense categories
    for (const category of sampleFinanceData.expenseCategories) {
      await sql`
        INSERT INTO expense_categories (name, company_id, created_by)
        VALUES (${category.name}, ${category.company_id}, ${category.created_by})
      `
    }
    console.log("Inserted expense categories")

    // Insert income categories
    for (const category of sampleFinanceData.incomeCategories) {
      await sql`
        INSERT INTO income_categories (name, company_id, created_by)
        VALUES (${category.name}, ${category.company_id}, ${category.created_by})
      `
    }
    console.log("Inserted income categories")

    // Insert financial transactions
    for (const transaction of sampleFinanceData.transactions) {
      await sql`
        INSERT INTO financial_transactions (
          company_id, 
          transaction_date, 
          amount, 
          transaction_type, 
          description, 
          transaction_name, 
          category_name, 
          created_by
        ) VALUES (
          ${transaction.company_id},
          ${transaction.transaction_date},
          ${transaction.amount},
          ${transaction.transaction_type},
          ${transaction.description},
          ${transaction.transaction_name},
          ${transaction.category_name},
          ${transaction.created_by}
        )
      `
    }
    console.log("Inserted financial transactions")

    // Insert petty cash transactions
    for (const transaction of sampleFinanceData.pettyCash) {
      await sql`
        INSERT INTO petty_cash (
          company_id, 
          transaction_date, 
          amount, 
          operation_type, 
          description, 
          created_by
        ) VALUES (
          ${transaction.company_id},
          ${transaction.transaction_date},
          ${transaction.amount},
          ${transaction.operation_type},
          ${transaction.description},
          ${transaction.created_by}
        )
      `
    }
    console.log("Inserted petty cash transactions")

    revalidatePath("/admin")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Finance tables set up successfully with sample data",
    }
  } catch (error) {
    console.error("Error setting up finance tables:", error)
    return {
      success: false,
      message: `Failed to set up finance tables: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
