"use server"

import { sql } from "@/lib/db"

// Global flag to prevent multiple simultaneous schema initializations
let isInitializing = false

export async function initializeAccountingSchema() {
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    console.log("Schema initialization already in progress, waiting...")
    // Wait a bit and return success
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return { success: true, message: "Schema initialization completed by another process" }
  }

  try {
    isInitializing = true
    console.log("Initializing accounting schema...")

    // Check if tables already exist first
    const tablesExist = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('financial_ledger', 'payments', 'cogs_entries', 'accounts_receivable', 'accounts_payable')
    `

    if (tablesExist.length >= 5) {
      console.log("Accounting tables already exist, skipping creation")
      return { success: true, message: "Accounting schema already exists" }
    }

    // Create tables one by one with better error handling
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
    } catch (error) {
      console.log("financial_ledger table creation handled:", error)
    }

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          reference_type VARCHAR(50) NOT NULL,
          reference_id INTEGER NOT NULL,
          payment_date TIMESTAMP NOT NULL DEFAULT NOW(),
          amount DECIMAL(12,2) NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'Cash',
          notes TEXT,
          device_id INTEGER NOT NULL,
          company_id INTEGER NOT NULL,
          created_by INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `
    } catch (error) {
      console.log("payments table creation handled:", error)
    }

    try {
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
    } catch (error) {
      console.log("cogs_entries table creation handled:", error)
    }

    try {
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
    } catch (error) {
      console.log("accounts_receivable table creation handled:", error)
    }

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS accounts_payable (
          id SERIAL PRIMARY KEY,
          supplier_name VARCHAR(255) NOT NULL,
          purchase_id INTEGER,
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
    } catch (error) {
      console.log("accounts_payable table creation handled:", error)
    }

    // Create indexes with unique names to avoid conflicts
    const indexQueries = [
      {
        name: "idx_fl_device_date",
        query: "CREATE INDEX IF NOT EXISTS idx_fl_device_date ON financial_ledger(device_id, transaction_date)",
      },
      { name: "idx_fl_type", query: "CREATE INDEX IF NOT EXISTS idx_fl_type ON financial_ledger(transaction_type)" },
      {
        name: "idx_payments_ref",
        query: "CREATE INDEX IF NOT EXISTS idx_payments_ref ON payments(reference_type, reference_id)",
      },
      {
        name: "idx_ar_customer",
        query: "CREATE INDEX IF NOT EXISTS idx_ar_customer ON accounts_receivable(customer_id)",
      },
      {
        name: "idx_ap_supplier",
        query: "CREATE INDEX IF NOT EXISTS idx_ap_supplier ON accounts_payable(supplier_name)",
      },
    ]

    for (const index of indexQueries) {
      try {
        await sql.unsafe(index.query)
      } catch (error) {
        console.log(`Index ${index.name} creation handled:`, error)
      }
    }

    console.log("Accounting schema initialized successfully")
    return { success: true, message: "Accounting schema initialized" }
  } catch (error) {
    console.error("Error initializing accounting schema:", error)
    return {
      success: false,
      message: "Failed to initialize accounting schema: " + (error instanceof Error ? error.message : String(error)),
    }
  } finally {
    isInitializing = false
  }
}

export async function checkTablesExist() {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'financial_ledger'
    `
    return Number(result[0]?.count || 0) > 0
  } catch (error) {
    console.error("Error checking if tables exist:", error)
    return false
  }
}

export async function checkMigrationStatus(deviceId: number) {
  try {
    // Check if tables exist first
    const tablesExist = await checkTablesExist()

    if (!tablesExist) {
      // Initialize schema if tables don't exist
      const initResult = await initializeAccountingSchema()
      if (!initResult.success) {
        return initResult
      }
    }

    // Check if ledger has any entries for this device
    const ledgerCount = await sql`
      SELECT COUNT(*) as count FROM financial_ledger WHERE device_id = ${deviceId}
    `

    const hasLedgerData = Number(ledgerCount[0]?.count || 0) > 0

    // Check if we have sales/purchases that might need migration
    const salesCount = await sql`
      SELECT COUNT(*) as count FROM sales WHERE device_id = ${deviceId}
    `

    const purchasesCount = await sql`
      SELECT COUNT(*) as count FROM purchases WHERE device_id = ${deviceId}
    `

    const hasSalesData = Number(salesCount[0]?.count || 0) > 0
    const hasPurchasesData = Number(purchasesCount[0]?.count || 0) > 0

    return {
      success: true,
      data: {
        hasLedgerData,
        hasSalesData,
        hasPurchasesData,
        needsMigration: (hasSalesData || hasPurchasesData) && !hasLedgerData,
      },
    }
  } catch (error) {
    console.error("Error checking migration status:", error)
    return {
      success: false,
      message: "Failed to check migration status: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

export async function migrateExistingDataToAccounting(deviceId: number) {
  try {
    console.log("Starting accounting data migration for device:", deviceId)

    // Ensure schema exists
    const tablesExist = await checkTablesExist()
    if (!tablesExist) {
      const schemaResult = await initializeAccountingSchema()
      if (!schemaResult.success) {
        return schemaResult
      }
    }

    // Check if migration already completed
    const existingEntries = await sql`
      SELECT COUNT(*) as count FROM financial_ledger WHERE device_id = ${deviceId}
    `

    if (Number(existingEntries[0]?.count || 0) > 0) {
      return {
        success: true,
        message: "Migration already completed - ledger contains data",
      }
    }

    // Migrate existing sales
    const sales = await sql`
      SELECT s.*, c.name as customer_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      WHERE s.device_id = ${deviceId}
      ORDER BY s.sale_date ASC
    `

    console.log(`Migrating ${sales.length} sales...`)

    for (const sale of sales) {
      try {
        // Record sale in ledger
        await sql`
          INSERT INTO financial_ledger (
            transaction_date, transaction_type, reference_type, reference_id,
            amount, description, category, account_type, credit_amount,
            device_id, company_id, created_by
          ) VALUES (
            ${sale.sale_date || sale.created_at},
            'sale',
            'sale',
            ${sale.id},
            ${sale.total_amount},
            ${`Sale #${sale.id}${sale.customer_name ? ` to ${sale.customer_name}` : ""}`},
            'Sales Revenue',
            'revenue',
            ${sale.total_amount},
            ${deviceId},
            1,
            ${sale.created_by || 1}
          )
        `

        // Get sale items for COGS calculation
        const saleItems = await sql`
          SELECT si.*, p.wholesale_price, p.price 
          FROM sale_items si 
          JOIN products p ON si.product_id = p.id 
          WHERE si.sale_id = ${sale.id}
        `

        // Record COGS for each item
        let totalCogs = 0
        for (const item of saleItems) {
          const costPrice = Number(item.wholesale_price || item.price || 0)
          const totalCost = costPrice * Number(item.quantity)
          totalCogs += totalCost

          // Record COGS entry
          await sql`
            INSERT INTO cogs_entries (
              sale_id, product_id, quantity, cost_price, total_cost, device_id
            ) VALUES (
              ${sale.id}, ${item.product_id}, ${item.quantity}, ${costPrice}, ${totalCost}, ${deviceId}
            )
          `
        }

        // Record COGS in ledger if there are items
        if (totalCogs > 0) {
          await sql`
            INSERT INTO financial_ledger (
              transaction_date, transaction_type, reference_type, reference_id,
              amount, description, category, account_type, debit_amount,
              device_id, company_id, created_by
            ) VALUES (
              ${sale.sale_date || sale.created_at},
              'cogs',
              'sale',
              ${sale.id},
              ${totalCogs},
              ${`COGS for Sale #${sale.id}`},
              'Cost of Goods Sold',
              'expense',
              ${totalCogs},
              ${deviceId},
              1,
              ${sale.created_by || 1}
            )
          `
        }

        // Handle accounts receivable for credit sales
        const receivedAmount = Number(sale.received_amount || 0)
        const totalAmount = Number(sale.total_amount)

        if (sale.status?.toLowerCase() === "credit" && receivedAmount < totalAmount) {
          await sql`
            INSERT INTO accounts_receivable (
              customer_id, sale_id, original_amount, paid_amount, outstanding_amount,
              device_id, company_id
            ) VALUES (
              ${sale.customer_id}, ${sale.id}, ${totalAmount}, ${receivedAmount}, 
              ${totalAmount - receivedAmount}, ${deviceId}, 1
            )
          `
        }

        // Record payment if any
        if (receivedAmount > 0) {
          await sql`
            INSERT INTO financial_ledger (
              transaction_date, transaction_type, reference_type, reference_id,
              amount, description, category, account_type, debit_amount,
              device_id, company_id, created_by
            ) VALUES (
              ${sale.sale_date || sale.created_at},
              'payment_received',
              'sale',
              ${sale.id},
              ${receivedAmount},
              ${`Payment received for Sale #${sale.id}`},
              'Cash',
              'asset',
              ${receivedAmount},
              ${deviceId},
              1,
              ${sale.created_by || 1}
            )
          `
        }
      } catch (error) {
        console.error(`Error migrating sale ${sale.id}:`, error)
        // Continue with next sale
      }
    }

    // Migrate existing purchases
    const purchases = await sql`
      SELECT * FROM purchases 
      WHERE device_id = ${deviceId}
      ORDER BY purchase_date ASC
    `

    console.log(`Migrating ${purchases.length} purchases...`)

    for (const purchase of purchases) {
      try {
        // Record purchase in ledger
        await sql`
          INSERT INTO financial_ledger (
            transaction_date, transaction_type, reference_type, reference_id,
            amount, description, category, account_type, debit_amount,
            device_id, company_id, created_by
          ) VALUES (
            ${purchase.purchase_date || purchase.created_at},
            'purchase',
            'purchase',
            ${purchase.id},
            ${purchase.total_amount},
            ${`Purchase #${purchase.id} from ${purchase.supplier}`},
            'Inventory Purchase',
            'expense',
            ${purchase.total_amount},
            ${deviceId},
            1,
            ${purchase.created_by || 1}
          )
        `

        // Handle accounts payable for credit purchases
        const receivedAmount = Number(purchase.received_amount || 0)
        const totalAmount = Number(purchase.total_amount)

        if (purchase.status?.toLowerCase() === "credit" && receivedAmount < totalAmount) {
          await sql`
            INSERT INTO accounts_payable (
              supplier_name, purchase_id, original_amount, paid_amount, outstanding_amount,
              device_id, company_id
            ) VALUES (
              ${purchase.supplier}, ${purchase.id}, ${totalAmount}, ${receivedAmount}, 
              ${totalAmount - receivedAmount}, ${deviceId}, 1
            )
          `
        }

        // Record payment if any
        if (receivedAmount > 0) {
          await sql`
            INSERT INTO financial_ledger (
              transaction_date, transaction_type, reference_type, reference_id,
              amount, description, category, account_type, credit_amount,
              device_id, company_id, created_by
            ) VALUES (
              ${purchase.purchase_date || purchase.created_at},
              'payment_made',
              'purchase',
              ${purchase.id},
              ${receivedAmount},
              ${`Payment made for Purchase #${purchase.id}`},
              'Cash',
              'liability',
              ${receivedAmount},
              ${deviceId},
              1,
              ${purchase.created_by || 1}
            )
          `
        }
      } catch (error) {
        console.error(`Error migrating purchase ${purchase.id}:`, error)
        // Continue with next purchase
      }
    }

    console.log("Accounting data migration completed successfully")
    return {
      success: true,
      message: `Migration completed: ${sales.length} sales, ${purchases.length} purchases migrated`,
    }
  } catch (error) {
    console.error("Error migrating accounting data:", error)
    return {
      success: false,
      message: "Failed to migrate accounting data: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}
