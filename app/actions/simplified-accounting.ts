"use server"

import { sql } from "@/lib/db"

// Create a simplified financial transactions table from scratch
async function createFinancialTransactionsTable() {
  try {
    // First check if the table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'financial_transactions'
      ) as exists
    `

    if (!tableExists[0]?.exists) {
      console.log("Creating financial_transactions table from scratch")

      // Create the table with all required columns for detailed accounting
      await sql`
        CREATE TABLE financial_transactions (
          id SERIAL PRIMARY KEY,
          transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
          transaction_type VARCHAR(50) NOT NULL,
          reference_type VARCHAR(50) NOT NULL,
          reference_id INTEGER NOT NULL,
          amount DECIMAL(12,2) NOT NULL DEFAULT 0,
          received_amount DECIMAL(12,2) DEFAULT 0,
          cost_amount DECIMAL(12,2) DEFAULT 0,
          debit_amount DECIMAL(12,2) DEFAULT 0,
          credit_amount DECIMAL(12,2) DEFAULT 0,
          status VARCHAR(50),
          payment_method VARCHAR(50),
          description TEXT,
          notes TEXT,
          device_id INTEGER NOT NULL,
          company_id INTEGER DEFAULT 1,
          created_by INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `

      // Create indexes
      await sql`CREATE INDEX idx_financial_transactions_device ON financial_transactions(device_id, transaction_date)`
      await sql`CREATE INDEX idx_financial_transactions_ref ON financial_transactions(reference_type, reference_id)`

      console.log("Financial transactions table created successfully")
    } else {
      // Check if new columns exist and add them if needed
      try {
        await sql`ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS received_amount DECIMAL(12,2) DEFAULT 0`
        await sql`ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS cost_amount DECIMAL(12,2) DEFAULT 0`
        await sql`ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS debit_amount DECIMAL(12,2) DEFAULT 0`
        await sql`ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS credit_amount DECIMAL(12,2) DEFAULT 0`
        await sql`ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(50)`
        await sql`ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)`
        await sql`ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS notes TEXT`
        console.log("Added missing columns to financial_transactions table")
      } catch (err) {
        console.log("Columns might already exist:", err.message)
      }
    }

    return true
  } catch (error) {
    console.error("Error creating financial_transactions table:", error)
    return false
  }
}

// Record supplier payment transaction
export async function recordSupplierPayment(paymentData: {
  supplierId: number
  supplierName: string
  paymentAmount: number
  paymentMethod: string
  allocations: any[]
  deviceId: number
  userId: number
  paymentDate: Date
  notes?: string
}) {
  try {
    console.log("Recording supplier payment transaction:", {
      supplierId: paymentData.supplierId,
      supplierName: paymentData.supplierName,
      paymentAmount: paymentData.paymentAmount,
      paymentMethod: paymentData.paymentMethod,
      deviceId: paymentData.deviceId,
      userId: paymentData.userId,
      notes: paymentData.notes,
    })

    // Ensure table exists
    const tableCreated = await createFinancialTransactionsTable()
    if (!tableCreated) {
      console.error("Failed to ensure financial_transactions table exists")
      return { success: false, error: "Failed to create financial_transactions table" }
    }

    // For supplier payments: debit = payment amount (money going out), credit = 0
    const paymentAmount = Number(paymentData.paymentAmount) || 0
    const debitAmount = paymentAmount // Cash going out to pay supplier
    const creditAmount = 0 // No income from this transaction

    // Create detailed description including notes
    let description = `Supplier Payment - ${paymentData.supplierName} - ${paymentData.paymentMethod} - ${paymentData.allocations.length} purchase(s) affected`
    if (paymentData.notes && paymentData.notes.trim()) {
      description += ` - Notes: ${paymentData.notes.trim()}`
    }

    // Insert the supplier payment transaction
    const result = await sql`
      INSERT INTO financial_transactions (
        transaction_type, reference_type, reference_id,
        amount, received_amount, cost_amount, debit_amount, credit_amount,
        status, payment_method, description, notes, device_id, company_id, created_by, transaction_date
      ) VALUES (
        'supplier_payment', 'supplier', ${paymentData.supplierId},
        ${paymentAmount}, ${paymentAmount}, 0, ${debitAmount}, ${creditAmount},
        'Completed', ${paymentData.paymentMethod}, ${description}, ${paymentData.notes || null}, 
        ${paymentData.deviceId}, 1, ${paymentData.userId}, ${paymentData.paymentDate.toISOString()}
      ) RETURNING id
    `

    console.log(`Supplier payment transaction recorded successfully: ID ${result[0]?.id}`)
    return { success: true, transactionId: result[0]?.id }
  } catch (error) {
    console.error("Error recording supplier payment transaction:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Record sale transaction
export async function recordSaleTransaction(saleData: {
  saleId: number
  totalAmount: number
  cogsAmount: number
  receivedAmount: number
  outstandingAmount: number
  status: string
  paymentMethod: string
  deviceId: number
  userId: number
  customerId?: number
  saleDate: Date
}) {
  try {
    console.log("Recording sale transaction with data:", {
      saleId: saleData.saleId,
      totalAmount: saleData.totalAmount,
      cogsAmount: saleData.cogsAmount,
      receivedAmount: saleData.receivedAmount,
      status: saleData.status,
      deviceId: saleData.deviceId,
      userId: saleData.userId,
      saleDate: saleData.saleDate,
    })

    // Ensure table exists
    const tableCreated = await createFinancialTransactionsTable()
    if (!tableCreated) {
      console.error("Failed to ensure financial_transactions table exists")
      return { success: false, error: "Failed to create financial_transactions table" }
    }

    // Validate required fields
    if (!saleData.saleId || !saleData.deviceId || !saleData.userId) {
      console.error("Missing required fields:", {
        saleId: saleData.saleId,
        deviceId: saleData.deviceId,
        userId: saleData.userId,
      })
      return { success: false, error: "Missing required fields: saleId, deviceId, or userId" }
    }

    // Calculate accounting values based on sale status
    let debitAmount = 0
    let creditAmount = 0
    let costAmount = 0
    let description = ""
    let receivedAmountForRecord = Number(saleData.receivedAmount) || 0

    if (saleData.status === "Cancelled") {
      // Cancelled sales: debit = received amount (refund), credit = 0, NO COGS
      debitAmount = Number(saleData.receivedAmount) || 0
      creditAmount = 0
      costAmount = 0
      receivedAmountForRecord = 0
      description = `Sale #${saleData.saleId} - Cancelled - ${saleData.paymentMethod || "Cash"} - Customer: ${saleData.customerId ? `ID ${saleData.customerId}` : "Walk-in"}`
    } else if (saleData.status === "Credit") {
      // Credit sales - cash impact = received amount - proportional COGS
      creditAmount = Number(saleData.receivedAmount) || 0 // Count received amount as credit
      debitAmount = 0
      
      // Calculate proportional COGS based on payment received
      const totalAmount = Number(saleData.totalAmount) || 0
      const receivedAmount = Number(saleData.receivedAmount) || 0
      
      if (receivedAmount > 0 && totalAmount > 0) {
        const paymentRatio = receivedAmount / totalAmount
        costAmount = (Number(saleData.cogsAmount) || 0) * paymentRatio
      } else {
        costAmount = 0 // No COGS impact if no payment received
      }
      
      description = `Sale #${saleData.saleId} - Credit - ${saleData.paymentMethod || "Cash"} - Customer: ${saleData.customerId ? `ID ${saleData.customerId}` : "Walk-in"} - Received: ${receivedAmountForRecord}`
      
      console.log(`Credit sale recorded: Partial payment ${receivedAmountForRecord}, COGS: ${costAmount}`)
    } else {
      // Completed sales: credit = received amount, debit = 0
      creditAmount = Number(saleData.receivedAmount) || 0
      debitAmount = 0
      costAmount = Number(saleData.cogsAmount) || 0
      receivedAmountForRecord = Number(saleData.receivedAmount) || 0
      description = `Sale #${saleData.saleId} - Completed - ${saleData.paymentMethod || "Cash"} - Customer: ${saleData.customerId ? `ID ${saleData.customerId}` : "Walk-in"}`
    }

    // Record the transaction with all details
    const result = await sql`
      INSERT INTO financial_transactions (
        transaction_type, reference_type, reference_id,
        amount, received_amount, cost_amount, debit_amount, credit_amount,
        status, payment_method, description, device_id, company_id, created_by, transaction_date
      ) VALUES (
        'sale', 'sale', ${saleData.saleId},
        ${saleData.totalAmount}, ${receivedAmountForRecord}, ${costAmount}, ${debitAmount}, ${creditAmount},
        ${saleData.status}, ${saleData.paymentMethod || "Cash"}, ${description}, 
        ${saleData.deviceId}, 1, ${saleData.userId}, ${saleData.saleDate}
      ) RETURNING id
    `

    console.log(`Sale transaction recorded successfully: ID ${result[0]?.id}`, {
      status: saleData.status,
      creditAmount,
      receivedAmount: receivedAmountForRecord,
      totalAmount: saleData.totalAmount,
      costAmount
    })
    return { success: true, transactionId: result[0]?.id }
  } catch (error) {
    console.error("Error recording sale transaction:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      detail: error.detail,
      saleData: {
        saleId: saleData.saleId,
        deviceId: saleData.deviceId,
        userId: saleData.userId,
        totalAmount: saleData.totalAmount,
      },
    })
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Record sale adjustments
export async function recordSaleAdjustment(adjustmentData: {
  saleId: number
  changeType: "edit" | "cancel" | "payment" | "status_change" | "consolidated_edit"
  previousValues: any
  newValues: any
  deviceId: number
  userId: number
  description: string
  adjustmentDate?: Date
}) {
  try {
    // Ensure table exists
    await createFinancialTransactionsTable()

    // Calculate the NET differences (new minus old)
    const previousAmount = Number(adjustmentData.previousValues.totalAmount) || 0
    const newAmount = Number(adjustmentData.newValues.totalAmount) || 0
    const amountDiff = newAmount - previousAmount

    const previousReceived = Number(adjustmentData.previousValues.receivedAmount) || 0
    const newReceived = Number(adjustmentData.newValues.receivedAmount) || 0
    const receivedDiff = newReceived - previousReceived

    const previousCogs = Number(adjustmentData.previousValues.cogsAmount) || 0
    const newCogs = Number(adjustmentData.newValues.cogsAmount) || 0
    const cogsDiff = newCogs - previousCogs

    let debitAmount = 0
    let creditAmount = 0
    let costAmount = 0
    let description = adjustmentData.description
    let status = "Adjustment"

    console.log("Sale adjustment calculation:", {
      saleId: adjustmentData.saleId,
      previousAmount,
      newAmount,
      amountDiff,
      previousReceived,
      newReceived,
      receivedDiff,
      previousCogs,
      newCogs,
      cogsDiff,
      changeType: adjustmentData.changeType
    })

    // Handle different change types with NET calculations
    if (adjustmentData.changeType === "consolidated_edit") {
      // For consolidated edits, we track NET changes only
      
      // Handle received amount changes
      if (receivedDiff > 0) {
        // Additional payment received - money IN
        creditAmount = receivedDiff
        description = `Sale #${adjustmentData.saleId} - Updated - Additional Payment Received: ${receivedDiff}`
      } else if (receivedDiff < 0) {
        // Payment reduced - money OUT (refund)
        debitAmount = Math.abs(receivedDiff)
        description = `Sale #${adjustmentData.saleId} - Updated - Payment Reduced/Refund: ${Math.abs(receivedDiff)}`
      }

      // Handle amount changes (price/quantity changes)
      if (amountDiff !== 0) {
        description += ` - Amount Change: ${amountDiff > 0 ? '+' : ''}${amountDiff}`
      }

      // Handle COGS changes
      costAmount = cogsDiff

    } else if (adjustmentData.changeType === "payment") {
      // Payment adjustments - only track cash movements
      if (receivedDiff > 0) {
        creditAmount = receivedDiff
        status = "Payment"
        description = `Sale #${adjustmentData.saleId} - Payment Received: ${receivedDiff}`
      } else if (receivedDiff < 0) {
        debitAmount = Math.abs(receivedDiff)
        status = "Payment Reduction"
        description = `Sale #${adjustmentData.saleId} - Payment Refunded: ${Math.abs(receivedDiff)}`
      }
    } else if (adjustmentData.changeType === "cancel") {
      // Cancelled sales - refund any money received
      const previousReceived = Number(adjustmentData.previousValues.receivedAmount) || 0
      if (previousReceived > 0) {
        debitAmount = previousReceived
        costAmount = -previousCogs // Reverse COGS
        status = "Cancelled"
        description = `Sale #${adjustmentData.saleId} - Cancelled - Refund: ${previousReceived} - COGS Reversed: ${previousCogs}`
      }
    }

    const transactionDate = adjustmentData.adjustmentDate || new Date()

    // Only create adjustment if there are actual financial changes
    if (debitAmount !== 0 || creditAmount !== 0 || costAmount !== 0) {
      const result = await sql`
        INSERT INTO financial_transactions (
          transaction_type, reference_type, reference_id,
          amount, received_amount, cost_amount, debit_amount, credit_amount,
          status, description, device_id, company_id, created_by, transaction_date
        ) VALUES (
          'adjustment', 'sale', ${adjustmentData.saleId},
          ${amountDiff}, ${receivedDiff}, ${costAmount}, ${debitAmount}, ${creditAmount},
          ${status}, ${description}, 
          ${adjustmentData.deviceId}, 1, ${adjustmentData.userId}, ${transactionDate}
        ) RETURNING id
      `

      console.log(`Sale adjustment recorded: ${description}`, {
        debitAmount,
        creditAmount,
        costAmount,
        amountDiff,
        receivedDiff
      })
      return { success: true, transactionId: result[0]?.id }
    } else {
      return { success: true, transactionId: null, message: "No financial changes to record" }
    }
  } catch (error) {
    console.error("Error recording sale adjustment:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Record purchase transactions
export async function recordPurchaseTransaction(purchaseData: {
  purchaseId: number
  totalAmount: number
  receivedAmount: number
  outstandingAmount: number
  status: string
  paymentMethod: string
  supplierName: string
  deviceId: number
  userId: number
  purchaseDate: Date
}) {
  try {
    // Ensure table exists
    await createFinancialTransactionsTable()

    const totalAmount = Number(purchaseData.totalAmount) || 0
    const receivedAmount = Number(purchaseData.receivedAmount) || 0
    const status = purchaseData.status?.toLowerCase()

    let debitAmount = 0
    let creditAmount = 0
    let description = ""

    // Different handling for credit vs completed purchases
    if (status === "credit") {
      // For credit purchases: debit = received amount (actual money paid out), credit = 0
      debitAmount = receivedAmount // Money actually paid out
      creditAmount = 0
      description = `Purchase #${purchaseData.purchaseId} - Credit - ${purchaseData.paymentMethod} - Supplier: ${purchaseData.supplierName} - Paid: ${receivedAmount} - Outstanding: ${purchaseData.outstandingAmount}`
    } else {
      // For completed purchases: debit = received amount (money paid out), credit = 0
      debitAmount = receivedAmount
      creditAmount = 0
      description = `Purchase #${purchaseData.purchaseId} - ${purchaseData.status} - ${purchaseData.paymentMethod} - Supplier: ${purchaseData.supplierName}`
    }

    const costAmount = 0 // Purchases don't have COGS

    console.log("Recording purchase transaction:", {
      purchaseId: purchaseData.purchaseId,
      status,
      totalAmount,
      receivedAmount,
      debitAmount,
      creditAmount,
      description
    })

    // Insert the main purchase transaction
    const result = await sql`
      INSERT INTO financial_transactions (
        transaction_type, reference_type, reference_id,
        amount, received_amount, cost_amount, debit_amount, credit_amount,
        status, payment_method, description, device_id, company_id, created_by, transaction_date
      ) VALUES (
        'purchase', 'purchase', ${purchaseData.purchaseId},
        ${totalAmount}, ${receivedAmount}, ${costAmount}, ${debitAmount}, ${creditAmount},
        ${purchaseData.status}, ${purchaseData.paymentMethod}, ${description}, 
        ${purchaseData.deviceId}, 1, ${purchaseData.userId}, ${purchaseData.purchaseDate}
      ) RETURNING id
    `

    console.log(`Purchase transaction recorded: ID ${result[0]?.id}`, {
      status: purchaseData.status,
      debitAmount,
      creditAmount,
      totalAmount,
      receivedAmount
    })
    return { success: true, transactionId: result[0]?.id }
  } catch (error) {
    console.error("Error recording purchase transaction:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Record purchase adjustments
export async function recordPurchaseAdjustment(adjustmentData: {
  purchaseId: number
  changeType: "edit" | "cancel" | "payment" | "status_change" | "consolidated_edit"
  previousValues: any
  newValues: any
  deviceId: number
  userId: number
  description: string
  adjustmentDate?: Date
}) {
  try {
    await createFinancialTransactionsTable()

    // Calculate the NET differences
    const previousAmount = Number(adjustmentData.previousValues.totalAmount) || 0
    const newAmount = Number(adjustmentData.newValues.totalAmount) || 0
    const amountDiff = newAmount - previousAmount

    const previousReceived = Number(adjustmentData.previousValues.receivedAmount) || 0
    const newReceived = Number(adjustmentData.newValues.receivedAmount) || 0
    const receivedDiff = newReceived - previousReceived

    let debitAmount = 0
    let creditAmount = 0
    let description = adjustmentData.description
    let status = "Adjustment"

    console.log("Purchase adjustment calculation:", {
      purchaseId: adjustmentData.purchaseId,
      previousAmount,
      newAmount,
      amountDiff,
      previousReceived,
      newReceived,
      receivedDiff,
      changeType: adjustmentData.changeType
    })

    // Handle payment changes for purchases
    if (adjustmentData.changeType === "consolidated_edit" || adjustmentData.changeType === "payment") {
      if (receivedDiff > 0) {
        // Additional payment made - money going OUT
        debitAmount = receivedDiff
        status = "Payment"
        description = `Purchase #${adjustmentData.purchaseId} - Additional Payment - Paid ${receivedDiff}`
      } else if (receivedDiff < 0) {
        // Payment reduced - money coming IN (refund)
        creditAmount = Math.abs(receivedDiff)
        status = "Payment Reduction"
        description = `Purchase #${adjustmentData.purchaseId} - Payment Reduced - Refund ${Math.abs(receivedDiff)}`
      }
    } 
    else if (adjustmentData.changeType === "cancel") {
      // Cancelled purchases - refund any money paid
      const previousReceived = Number(adjustmentData.previousValues.receivedAmount) || 0
      if (previousReceived > 0) {
        creditAmount = previousReceived
        status = "Cancelled"
        description = `Purchase #${adjustmentData.purchaseId} - Cancelled - Refund ${previousReceived}`
      }
    }

    const transactionDate = adjustmentData.adjustmentDate || new Date()

    // Only create transaction if there are actual financial changes
    if (debitAmount !== 0 || creditAmount !== 0) {
      const result = await sql`
        INSERT INTO financial_transactions (
          transaction_type, reference_type, reference_id,
          amount, received_amount, cost_amount, debit_amount, credit_amount,
          status, description, device_id, company_id, created_by, transaction_date
        ) VALUES (
          'adjustment', 'purchase', ${adjustmentData.purchaseId},
          ${amountDiff}, ${receivedDiff}, 0, ${debitAmount}, ${creditAmount},
          ${status}, ${description}, 
          ${adjustmentData.deviceId}, 1, ${adjustmentData.userId}, ${transactionDate}
        ) RETURNING id
      `

      console.log(`Purchase adjustment recorded: ${description}`, {
        debitAmount,
        creditAmount,
        amountDiff,
        receivedDiff
      })
      return { success: true, transactionId: result[0]?.id }
    } else {
      return { success: true, transactionId: null, message: "No financial changes to record" }
    }
  } catch (error) {
    console.error("Error recording purchase adjustment:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Record manual transactions
export async function recordManualTransaction(transactionData: {
  amount: number
  type: "debit" | "credit"
  description: string
  category: string
  paymentMethod: string
  deviceId: number
  userId: number
  transactionDate: Date
}) {
  try {
    // Ensure table exists
    await createFinancialTransactionsTable()

    const amount = Number(transactionData.amount) || 0
    const debitAmount = transactionData.type === "debit" ? amount : 0
    const creditAmount = transactionData.type === "credit" ? amount : 0

    const description = `Manual Entry - ${transactionData.category} - ${transactionData.description}`

    // Insert the manual transaction
    const result = await sql`
      INSERT INTO financial_transactions (
        transaction_type, reference_type, reference_id,
        amount, received_amount, cost_amount, debit_amount, credit_amount,
        status, payment_method, description, device_id, company_id, created_by, transaction_date
      ) VALUES (
        'manual', 'manual', 0,
        ${amount}, ${amount}, 0, ${debitAmount}, ${creditAmount},
        'Manual Entry', ${transactionData.paymentMethod}, ${description}, 
        ${transactionData.deviceId}, 1, ${transactionData.userId}, ${transactionData.transactionDate}
      ) RETURNING id
    `

    console.log(`Manual transaction recorded: ID ${result[0]?.id}`)
    return { success: true, transactionId: result[0]?.id }
  } catch (error) {
    console.error("Error recording manual transaction:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Delete sale transaction
export async function deleteSaleTransaction(saleId: number, deviceId: number) {
  try {
    await createFinancialTransactionsTable()

    const result = await sql`
      DELETE FROM financial_transactions 
      WHERE reference_type = 'sale' 
        AND reference_id = ${saleId} 
        AND device_id = ${deviceId}
      RETURNING id
    `

    console.log(`Deleted ${result.length} financial transactions for sale ${saleId}`)
    return { success: true, deletedCount: result.length }
  } catch (error) {
    console.error("Error deleting sale transaction:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Delete purchase transaction
export async function deletePurchaseTransaction(purchaseId: number, deviceId: number) {
  try {
    await createFinancialTransactionsTable()

    const result = await sql`
      DELETE FROM financial_transactions 
      WHERE reference_type = 'purchase' 
        AND reference_id = ${purchaseId} 
        AND device_id = ${deviceId}
      RETURNING id
    `

    console.log(`Deleted ${result.length} financial transactions for purchase ${purchaseId}`)
    return { success: true, deletedCount: result.length }
  } catch (error) {
    console.error("Error deleting purchase transaction:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// MAIN FINANCIAL SUMMARY FUNCTION WITH ALL CALCULATIONS
export async function getFinancialSummary(deviceId: number, dateFrom?: Date, dateTo?: Date, cacheBuster?: number) {
  try {
    console.log("Getting financial summary for device:", deviceId, "date range:", dateFrom, "to", dateTo)

    // Ensure table exists first
    const tableCreated = await createFinancialTransactionsTable()
    if (!tableCreated) {
      console.error("Failed to ensure financial_transactions table exists")
      return getEmptyFinancialSummary()
    }

    // Fix timezone issues by using explicit date strings
    let fromDateStr = null
    let toDateStr = null

    if (dateFrom) {
      fromDateStr = `${dateFrom.getFullYear()}-${String(dateFrom.getMonth() + 1).padStart(2, "0")}-${String(dateFrom.getDate()).padStart(2, "0")} 00:00:00`
    }

    if (dateTo) {
      toDateStr = `${dateTo.getFullYear()}-${String(dateTo.getMonth() + 1).padStart(2, "0")}-${String(dateTo.getDate()).padStart(2, "0")} 23:59:59`
    }

    // Query transactions
    let transactions
    if (fromDateStr && toDateStr) {
      console.log("Querying with date range:", fromDateStr, "to", toDateStr)
      transactions = await sql`
        SELECT * FROM financial_transactions 
        WHERE device_id = ${deviceId} 
          AND transaction_date::date BETWEEN ${fromDateStr}::date AND ${toDateStr}::date
        ORDER BY transaction_date DESC, id DESC
      `
    } else {
      console.log("Querying all transactions for device:", deviceId)
      transactions = await sql`
        SELECT * FROM financial_transactions 
        WHERE device_id = ${deviceId}
        ORDER BY transaction_date DESC, id DESC
      `
    }

    console.log(`Found ${transactions.length} transactions for device ${deviceId}`)

    // Get receivables and payables
    const [receivablesQuery, payablesQuery] = await Promise.all([
      getReceivables(deviceId),
      getPayables(deviceId)
    ])

    // Get latest purchase and sale data for credit transactions
    const [purchaseDataMap, saleDataMap] = await Promise.all([
      getPurchaseDataMap(transactions),
      getSaleDataMap(transactions)
    ])

    // Calculate all financial metrics in backend
    const calculations = calculateFinancialMetrics(
      transactions, 
      receivablesQuery, 
      payablesQuery,
      purchaseDataMap,
      saleDataMap
    )

    console.log("Financial summary calculated:", {
      transactionCount: transactions.length,
      ...calculations.summary
    })

    return {
      ...calculations.summary,
      transactions: calculations.processedTransactions,
      receivables: calculations.receivables,
      payables: calculations.payables,
    }
  } catch (error) {
    console.error("Error getting financial summary:", error)
    return getEmptyFinancialSummary()
  }
}

// Helper function for empty summary
function getEmptyFinancialSummary() {
  return {
    totalIncome: 0,
    totalCogs: 0,
    totalProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    outstandingReceivables: 0,
    cashBalance: 0,
    totalSales: 0,
    totalPurchases: 0,
    amountReceived: 0,
    spends: 0,
    filteredCogs: 0,
    totalCashImpact: 0,
    transactions: [],
    receivables: [],
    payables: [],
  }
}

// Get receivables
async function getReceivables(deviceId: number) {
  return await sql`
    SELECT 
      s.id,
      s.total_amount,
      s.received_amount,
      s.sale_date,
      s.status,
      c.name as customer_name,
      (s.total_amount - COALESCE(s.received_amount, 0)) as outstanding_amount
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.device_id = ${deviceId}
      AND s.status != 'Cancelled'
      AND (s.total_amount - COALESCE(s.received_amount, 0)) > 0
    ORDER BY s.sale_date DESC
  `
}

// Get payables
async function getPayables(deviceId: number) {
  return await sql`
    SELECT 
      p.id,
      p.total_amount,
      p.received_amount,
      p.purchase_date,
      p.status,
      p.supplier as supplier_name,
      (p.total_amount - COALESCE(p.received_amount, 0)) as outstanding_amount
    FROM purchases p
    WHERE p.device_id = ${deviceId}
      AND p.status != 'Cancelled'
      AND (p.total_amount - COALESCE(p.received_amount, 0)) > 0
    ORDER BY p.purchase_date DESC
  `
}

// Get purchase data map
async function getPurchaseDataMap(transactions: any[]) {
  const purchaseIds = transactions
    .filter((tx: any) => tx.reference_type === 'purchase')
    .map((tx: any) => tx.reference_id)
  
  if (purchaseIds.length === 0) return new Map()
  
  const purchases = await sql`
    SELECT id, total_amount, received_amount, status, supplier
    FROM purchases 
    WHERE id = ANY(${purchaseIds})
  `
  
  const purchaseMap = new Map()
  purchases.forEach((p: any) => {
    purchaseMap.set(p.id, p)
  })
  return purchaseMap
}

// Get sale data map
async function getSaleDataMap(transactions: any[]) {
  const saleIds = transactions
    .filter((tx: any) => tx.reference_type === 'sale')
    .map((tx: any) => tx.reference_id)
  
  if (saleIds.length === 0) return new Map()
  
  const sales = await sql`
    SELECT s.id, s.total_amount, s.received_amount, s.status, c.name as customer_name
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.id = ANY(${saleIds})
  `
  
  const saleMap = new Map()
  sales.forEach((s: any) => {
    saleMap.set(s.id, s)
  })
  return saleMap
}

// MAIN CALCULATION FUNCTION - All frontend logic moved here
function calculateFinancialMetrics(
  transactions: any[], 
  receivablesQuery: any[], 
  payablesQuery: any[],
  purchaseDataMap: Map<any, any>,
  saleDataMap: Map<any, any>
) {
  const n = (v: any) => Number(v) || 0
  
  // Initialize totals
  let totalIncome = 0
  let totalExpenses = 0
  let totalCogs = 0
  let totalProfit = 0
  let totalSales = 0
  let totalPurchases = 0
  let amountReceived = 0
  let spends = 0
  let filteredCogs = 0
  let totalCashImpact = 0

  const saleAmounts = new Map()
  const purchaseAmounts = new Map()
  const cogsMap = new Map()

  // Process each transaction
  const processedTransactions = transactions.map((tx: any) => {
    const type = tx.transaction_type?.toLowerCase()
    const status = tx.status || "Unknown"
    const description = tx.description || `${tx.transaction_type} #${tx.reference_id}`
    
    // Use latest data from tables
    let amount = n(tx.amount)
    let received = n(tx.received_amount)
    let cost = n(tx.cost_amount)
    let credit = n(tx.credit_amount)
    let debit = n(tx.debit_amount)

    // Update with current purchase/sale data
    if (type === 'purchase' && tx.reference_id) {
      const purchaseData = purchaseDataMap.get(tx.reference_id)
      if (purchaseData) {
        amount = n(purchaseData.total_amount)
        received = n(purchaseData.received_amount)
      }
    }
    
    if (type === 'sale' && tx.reference_id) {
      const saleData = saleDataMap.get(tx.reference_id)
      if (saleData) {
        amount = n(saleData.total_amount)
        received = n(saleData.received_amount)
      }
    }

    // Calculate transaction-specific metrics
    const profit = calculateProfit(tx, type, description, saleDataMap, n)
    const cashImpact = calculateCashImpact(tx, type, description, saleDataMap, purchaseDataMap, n)
    const moneyFlowInfo = calculateMoneyFlowInfo(tx, type, description, n)
    const remainingAmount = calculateRemainingAmount(tx, type, description, saleDataMap, purchaseDataMap, transactions, n)
    const enhancedDescription = generateEnhancedDescription(tx, type, description, amount, received, status)

    // Update global totals
    totalIncome += credit
    totalExpenses += debit
    totalCogs += cost
    totalProfit += profit
    totalCashImpact += cashImpact

    // Update specific totals
    if (type === 'sale') {
      totalSales += amount
      amountReceived += received
      
      // Track sale amounts for adjustments
      if (tx.reference_id && !saleAmounts.has(tx.reference_id)) {
        saleAmounts.set(tx.reference_id, amount)
      }
    } else if (type === 'purchase') {
      totalPurchases += amount
      spends += received
      
      if (tx.reference_id && !purchaseAmounts.has(tx.reference_id)) {
        purchaseAmounts.set(tx.reference_id, amount)
      }
    } else if (type === 'adjustment') {
      if (description.includes('Sale')) {
        amountReceived += (received > 0 ? received : credit)
      } else if (description.includes('Purchase')) {
        spends += (received > 0 ? received : debit)
      }
    } else if (type === 'supplier_payment') {
      spends += Math.abs(debit)
    } else {
      // Manual transactions
      if (credit > 0) amountReceived += credit
      if (debit > 0) spends += debit
    }

    // Track COGS (avoid double counting)
    if (type === 'sale' && tx.reference_id) {
      if (!cogsMap.has(tx.reference_id)) {
        cogsMap.set(tx.reference_id, cost)
        filteredCogs += cost
      }
    } else if (type === 'adjustment' && description.includes('Sale')) {
      // Extract COGS from adjustment description
      const costMatch = description.match(/COGS recognized:?\s*([\d.]+)/i)
      if (costMatch) {
        filteredCogs += n(costMatch[1])
      }
    } else {
      filteredCogs += cost
    }

    return {
      id: tx.id,
      date: tx.transaction_date,
      description: enhancedDescription,
      type: tx.transaction_type,
      status: status,
      amount: amount,
      received: received,
      cost: cost,
      debit: debit,
      credit: credit,
      paymentMethod: tx.payment_method || "",
      notes: tx.notes || "",
      account: getAccountType(tx.transaction_type),
      reference: `${tx.reference_type} #${tx.reference_id}`,
      remaining: Math.max(0, remainingAmount),
      sale_id: tx.reference_type === 'sale' ? tx.reference_id : undefined,
      purchase_id: tx.reference_type === 'purchase' ? tx.reference_id : undefined,
      supplier_payment_id: tx.reference_type === 'supplier' ? tx.reference_id : undefined,
      reference_id: tx.reference_id,
      // Calculated fields
      profit,
      cashImpact,
      moneyFlow: moneyFlowInfo,
    }
  })

  // Process adjustments to update totals
  processAdjustments(transactions, saleAmounts, purchaseAmounts)

  // Final total calculations
  totalSales = Array.from(saleAmounts.values()).reduce((sum, amt) => sum + amt, 0)
  totalPurchases = Array.from(purchaseAmounts.values()).reduce((sum, amt) => sum + amt, 0)

  const accountsReceivable = receivablesQuery.reduce((sum, r) => sum + n(r.outstanding_amount), 0)
  const accountsPayable = payablesQuery.reduce((sum, p) => sum + n(p.outstanding_amount), 0)
  const netProfit = totalIncome - totalExpenses

  return {
    summary: {
      totalIncome,
      totalCogs,
      totalProfit,
      totalExpenses,
      netProfit,
      accountsReceivable,
      accountsPayable,
      outstandingReceivables: accountsReceivable,
      totalSales,
      totalPurchases,
      amountReceived,
      spends,
      filteredCogs,
      totalCashImpact,
    },
    processedTransactions,
    receivables: receivablesQuery.map((r: any) => ({
      id: r.id,
      customer_name: r.customer_name || "Walk-in Customer",
      amount: n(r.outstanding_amount),
      total_amount: n(r.total_amount),
      received_amount: n(r.received_amount) || 0,
      due_date: r.sale_date,
      days_overdue: Math.max(0, Math.floor((Date.now() - new Date(r.sale_date).getTime()) / (1000 * 60 * 60 * 24))),
      status: r.status,
    })),
    payables: payablesQuery.map((p: any) => ({
      id: p.id,
      supplier_name: p.supplier_name || "Unknown Supplier",
      amount: n(p.outstanding_amount),
      total_amount: n(p.total_amount),
      received_amount: n(p.received_amount) || 0,
      due_date: p.purchase_date,
      days_overdue: Math.max(0, Math.floor((Date.now() - new Date(p.purchase_date).getTime()) / (1000 * 60 * 60 * 24))),
      status: p.status,
    })),
  }
}

// INDIVIDUAL CALCULATION FUNCTIONS (moved from frontend)

function calculateProfit(transaction: any, type: string, description: string, saleDataMap: Map<any, any>, n: Function): number {
  if (!transaction) return 0
  
  const received = n(transaction.received_amount)
  const cost = n(transaction.cost_amount)
  const credit = n(transaction.credit_amount)
  
  // For sales - profit = money received - cost
  if (type === 'sale') {
    return received - cost
  }
  
  // For sale adjustments (additional payments)
  if (type === 'adjustment' && description.includes('Sale')) {
    const additionalMoneyIn = received || credit
    const saleId = extractIdFromDescription(description)
    
    if (saleId) {
      const originalSale = saleDataMap.get(saleId)
      if (originalSale) {
        const totalBill = n(originalSale.total_amount)
        const alreadyReceived = n(originalSale.received_amount)
        const originalCost = n(originalSale.cost_amount)
        
        // Extract COGS from description if available
        let extractedCost = 0
        const costMatch = description.match(/COGS recognized:?\s*([\d.]+)/i)
        if (costMatch) {
          extractedCost = n(costMatch[1])
        }
        
        if (extractedCost > 0) {
          return additionalMoneyIn - extractedCost
        }
        
        if (originalCost > 0 && alreadyReceived > 0) {
          const costPerMoneyUnit = originalCost / alreadyReceived
          const costForThisPayment = additionalMoneyIn * costPerMoneyUnit
          return additionalMoneyIn - costForThisPayment
        }
        
        return additionalMoneyIn * 0.5
      }
    }
    
    const costMatch = description.match(/COGS recognized:?\s*([\d.]+)/i)
    if (costMatch) {
      const extractedCost = n(costMatch[1])
      return additionalMoneyIn - extractedCost
    }
    
    return additionalMoneyIn * 0.5
  }
  
  // For purchases and other types - no profit impact
  if (type === 'purchase' || (type === 'adjustment' && description.includes('Purchase'))) {
    return 0
  }
  
  if (type === 'supplier_payment' || description.toLowerCase().includes('supplier payment')) {
    return 0
  }
  
  return credit - n(transaction.debit_amount)
}

function calculateCashImpact(transaction: any, type: string, description: string, saleDataMap: Map<any, any>, purchaseDataMap: Map<any, any>, n: Function): number {
  if (!transaction) return 0
  
  const received = n(transaction.received_amount)
  const credit = n(transaction.credit_amount)
  const debit = n(transaction.debit_amount)
  const cost = n(transaction.cost_amount)
  
  // For sales - cash impact = profit only (received - cost)
  if (type === 'sale') {
    return received - cost
  }
  
  // For sale adjustments - cash impact = profit only (received - proportional cost)
  if (type === 'adjustment' && description.includes('Sale')) {
    const additionalMoneyIn = received || credit
    const saleId = extractIdFromDescription(description)
    
    if (saleId) {
      const originalSale = saleDataMap.get(saleId)
      if (originalSale) {
        const alreadyReceived = n(originalSale.received_amount)
        const originalCost = n(originalSale.cost_amount)
        
        let extractedCost = 0
        const costMatch = description.match(/COGS recognized:?\s*([\d.]+)/i)
        if (costMatch) {
          extractedCost = n(costMatch[1])
        }
        
        if (extractedCost > 0) {
          return additionalMoneyIn - extractedCost
        }
        
        if (originalCost > 0 && alreadyReceived > 0) {
          const costPerMoneyUnit = originalCost / alreadyReceived
          const costForThisPayment = additionalMoneyIn * costPerMoneyUnit
          return additionalMoneyIn - costForThisPayment
        }
        
        return additionalMoneyIn * 0.5
      }
    }
    
    const costMatch = description.match(/COGS recognized:?\s*([\d.]+)/i)
    if (costMatch) {
      const extractedCost = n(costMatch[1])
      return additionalMoneyIn - extractedCost
    }
    
    return additionalMoneyIn * 0.5
  }
  
  // For purchases - cash impact is full amount spent (negative)
  if (type === 'purchase') {
    return -received
  }
  
  // For purchase adjustments - cash impact is money paid out (negative)
  if (type === 'adjustment' && description.includes('Purchase')) {
    if (debit > 0) {
      return -debit
    } else if (received > 0) {
      return -received
    } else {
      const paymentMatch = description.match(/Payment increased by\s*([\d.]+)/i) || 
                          description.match(/paid.*?([\d.]+)/i)
      if (paymentMatch) {
        const paymentAmount = n(paymentMatch[1])
        return -paymentAmount
      }
    }
    return 0
  }
  
  // For supplier payments - cash impact is full amount paid out (negative)
  if (type === 'supplier_payment' || description.toLowerCase().includes('supplier payment')) {
    return -Math.abs(debit)
  }
  
  // For manual/other transactions
  return credit - debit
}

function calculateMoneyFlowAmount(transaction: any, type: string, description: string, n: Function): number {
  if (!transaction) return 0
  
  const received = n(transaction.received_amount)
  const credit = n(transaction.credit_amount)
  const debit = n(transaction.debit_amount)
  
  // For sales - money in is the actual received amount
  if (type === 'sale') {
    return received
  }
  
  // For sale adjustments - money in is the additional payment received
  if (type === 'adjustment' && description.includes('Sale')) {
    return received || credit
  }
  
  // For purchases - money out is the actual paid amount
  if (type === 'purchase') {
    return received
  }
  
  // For purchase adjustments - money out is the additional payment made
  if (type === 'adjustment' && description.includes('Purchase')) {
    return received || debit
  }
  
  // For supplier payments - money out is the payment amount
  if (type === 'supplier_payment' || description.toLowerCase().includes('supplier payment')) {
    return Math.abs(debit)
  }
  
  // For manual transactions - money in/out based on type
  if (type === 'manual') {
    return credit > 0 ? credit : -debit
  }
  
  // Default for other transactions
  return credit > 0 ? credit : -debit
}

function calculateMoneyFlowInfo(transaction: any, type: string, description: string, n: Function) {
  if (!transaction) {
    return {
      type: 'none',
      text: 'No Cash Flow',
      color: 'text-gray-600 dark:text-gray-400',
      amount: 0
    }
  }
  
  const amount = calculateMoneyFlowAmount(transaction, type, description, n)
  const received = n(transaction.received_amount)
  const totalAmount = n(transaction.amount)
  
  // Sales - Money In
  if (type === 'sale') {
    if (received === 0) {
      return {
        type: 'none',
        text: 'Credit Sale',
        color: 'text-blue-600 dark:text-blue-400',
        amount: 0
      }
    }
    if (received < totalAmount) {
      return {
        type: 'in',
        text: 'Partial Payment',
        color: 'text-green-600 dark:text-green-400',
        amount: amount
      }
    }
    return {
      type: 'in',
      text: 'Full Payment',
      color: 'text-green-600 dark:text-green-400',
      amount: amount
    }
  }
  
  // Sale adjustments - Money In
  if (type === 'adjustment' && description.includes('Sale')) {
    return {
      type: 'in',
      text: 'Additional Payment',
      color: 'text-green-600 dark:text-green-400',
      amount: amount
    }
  }
  
  // Purchases - Money Out
  if (type === 'purchase') {
    if (received === 0) {
      return {
        type: 'none',
        text: 'Credit Purchase',
        color: 'text-blue-600 dark:text-blue-400',
        amount: 0
      }
    }
    if (received < totalAmount) {
      return {
        type: 'out',
        text: 'Partial Payment',
        color: 'text-red-600 dark:text-red-400',
        amount: amount
      }
    }
    return {
      type: 'out',
      text: 'Full Payment',
      color: 'text-red-600 dark:text-red-400',
      amount: amount
    }
  }
  
  // Purchase adjustments - Money Out
  if (type === 'adjustment' && description.includes('Purchase')) {
    return {
      type: 'out',
      text: 'Additional Payment',
      color: 'text-red-600 dark:text-red-400',
      amount: amount
    }
  }
  
  // Supplier payments - Money Out
  if (type === 'supplier_payment' || description.toLowerCase().includes('supplier payment')) {
    return {
      type: 'out',
      text: 'Supplier Payment',
      color: 'text-red-600 dark:text-red-400',
      amount: amount
    }
  }
  
  // Manual transactions
  if (type === 'manual') {
    const credit = n(transaction.credit_amount)
    const debit = n(transaction.debit_amount)
    
    if (credit > 0) {
      return {
        type: 'in',
        text: 'Money In',
        color: 'text-green-600 dark:text-green-400',
        amount: amount
      }
    } else if (debit > 0) {
      return {
        type: 'out',
        text: 'Money Out',
        color: 'text-red-600 dark:text-red-400',
        amount: amount
      }
    }
  }
  
  // Default cases
  const cashImpact = calculateCashImpact(transaction, type, description, new Map(), new Map(), n)
  if (cashImpact > 0) {
    return {
      type: 'in',
      text: 'Money In',
      color: 'text-green-600 dark:text-green-400',
      amount: Math.abs(cashImpact)
    }
  } else if (cashImpact < 0) {
    return {
      type: 'out',
      text: 'Money Out',
      color: 'text-red-600 dark:text-red-400',
      amount: Math.abs(cashImpact)
    }
  }
  
  return {
    type: 'none',
    text: 'No Cash Flow',
    color: 'text-gray-600 dark:text-gray-400',
    amount: 0
  }
}

function calculateRemainingAmount(transaction: any, type: string, description: string, saleDataMap: Map<any, any>, purchaseDataMap: Map<any, any>, allTransactions: any[], n: Function): number {
  if (!transaction) return 0
  
  const status = transaction.status?.toLowerCase()
  const totalAmount = n(transaction.amount)
  const receivedAmount = n(transaction.received_amount)
  
  // For sale adjustments - calculate remaining based on original sale
  if (type === 'adjustment' && description.includes('Sale')) {
    const saleId = extractIdFromDescription(description)
    
    if (saleId) {
      const originalSale = saleDataMap.get(saleId)
      if (originalSale) {
        const originalTotal = n(originalSale.total_amount)
        const originalReceived = n(originalSale.received_amount)
        
        // Find all adjustments for this sale to calculate total received so far
        const saleAdjustments = allTransactions.filter(
          (t: any) => t && t.transaction_type?.toLowerCase() === 'adjustment' && 
                   t.description?.includes(`#${saleId}`) &&
                   t.id !== transaction.id
        )
        
        let totalReceivedSoFar = originalReceived
        saleAdjustments.forEach((adj: any) => {
          totalReceivedSoFar += n(adj.received_amount) || n(adj.credit_amount)
        })
        
        // Add current transaction amount
        const currentAmount = n(transaction.received_amount) || n(transaction.credit_amount)
        totalReceivedSoFar += currentAmount
        
        const remaining = Math.max(0, originalTotal - totalReceivedSoFar)
        return remaining
      }
    }
    return 0
  }
  
  // For purchase adjustments - calculate remaining based on original purchase
  if (type === 'adjustment' && description.includes('Purchase')) {
    const purchaseId = extractIdFromDescription(description)
    
    if (purchaseId) {
      const originalPurchase = purchaseDataMap.get(purchaseId)
      if (originalPurchase) {
        const originalTotal = n(originalPurchase.total_amount)
        const originalPaid = n(originalPurchase.received_amount)
        
        // Find all adjustments for this purchase to calculate total paid so far
        const purchaseAdjustments = allTransactions.filter(
          (t: any) => t && t.transaction_type?.toLowerCase() === 'adjustment' && 
                   t.description?.includes(`#${purchaseId}`) &&
                   t.id !== transaction.id
        )
        
        let totalPaidSoFar = originalPaid
        purchaseAdjustments.forEach((adj: any) => {
          totalPaidSoFar += n(adj.received_amount) || n(adj.debit_amount)
        })
        
        // Add current transaction amount
        const currentAmount = n(transaction.received_amount) || n(transaction.debit_amount)
        totalPaidSoFar += currentAmount
        
        const remaining = Math.max(0, originalTotal - totalPaidSoFar)
        return remaining
      }
    }
    return 0
  }
  
  // For regular credit sales, remaining = total amount - received amount
  if (status === 'credit' && type === 'sale') {
    return Math.max(0, totalAmount - receivedAmount)
  }
  
  // For credit purchases, remaining = total amount - received amount
  if (status === 'credit' && type === 'purchase') {
    return Math.max(0, totalAmount - receivedAmount)
  }
  
  // For completed sales with partial payment
  if (status === 'completed' && receivedAmount < totalAmount) {
    return Math.max(0, totalAmount - receivedAmount)
  }
  
  // For paid purchases with partial payment
  if (status === 'paid' && receivedAmount < totalAmount) {
    return Math.max(0, totalAmount - receivedAmount)
  }
  
  return 0
}

function generateEnhancedDescription(transaction: any, type: string, description: string, amount: number, received: number, status: string): string {
  if (!transaction) return "Unknown Transaction"
  
  // Sale transactions
  if (type === 'sale') {
    if (status === 'credit') {
      return `Credit Sale #${transaction.reference_id || 'N/A'} - ${amount.toFixed(2)} (Pending: ${(amount - received).toFixed(2)})`
    } else if (status === 'completed') {
      if (received < amount) {
        return `Partial Payment Sale #${transaction.reference_id || 'N/A'} - ${amount.toFixed(2)} (Paid: ${received.toFixed(2)})`
      } else {
        return `Completed Sale #${transaction.reference_id || 'N/A'} - ${amount.toFixed(2)}`
      }
    }
    return `Sale #${transaction.reference_id || 'N/A'} - ${amount.toFixed(2)}`
  }
  
  // Purchase transactions
  if (type === 'purchase') {
    if (status === 'credit') {
      return `Credit Purchase #${transaction.reference_id || 'N/A'} - ${amount.toFixed(2)} (Pending: ${(amount - received).toFixed(2)})`
    } else if (status === 'paid') {
      if (received < amount) {
        return `Partial Payment Purchase #${transaction.reference_id || 'N/A'} - ${amount.toFixed(2)} (Paid: ${received.toFixed(2)})`
      } else {
        return `Paid Purchase #${transaction.reference_id || 'N/A'} - ${amount.toFixed(2)}`
      }
    }
    return `Purchase #${transaction.reference_id || 'N/A'} - ${amount.toFixed(2)}`
  }
  
  // Adjustment transactions
  if (type === 'adjustment') {
    if (description.includes('Sale')) {
      const saleId = extractIdFromDescription(description)
      return `Sale Adjustment #${saleId || 'N/A'} - ${description}`
    }
    if (description.includes('Purchase')) {
      const purchaseId = extractIdFromDescription(description)
      return `Purchase Adjustment #${purchaseId || 'N/A'} - ${description}`
    }
    return `Adjustment: ${description}`
  }
  
  // Supplier payments
  if (type === 'supplier_payment' || description.toLowerCase().includes('supplier payment')) {
    return `Supplier Payment - ${Math.abs(Number(transaction.debit_amount)).toFixed(2)}`
  }
  
  // Manual transactions
  if (type === 'manual') {
    return `Manual Entry: ${description || 'No description'}`
  }
  
  // Fallback to original description
  return description || "Transaction"
}

// Helper function to extract ID from description
function extractIdFromDescription(desc: string) {
  if (!desc) return null
  const match = desc.match(/#(\d+)/)
  return match ? parseInt(match[1]) : null
}

// Process adjustments to update totals
function processAdjustments(transactions: any[], saleAmounts: Map<any, any>, purchaseAmounts: Map<any, any>) {
  transactions.forEach((tx: any) => {
    const type = tx.transaction_type?.toLowerCase()
    const description = tx.description || ""
    
    if (type === 'adjustment' && description.includes('Sale')) {
      const saleId = extractIdFromDescription(description)
      if (saleId && saleAmounts.has(saleId)) {
        // Extract the new total amount from adjustment description
        const toMatch = description.match(/(?:increased|changed)\s+(?:from\s+[\d.]+\s+)?to\s+([\d.]+)/i)
        const increasedByMatch = description.match(/amount increased by\s+([\d.]+)/i)
        
        if (toMatch) {
          const newTotal = Number(toMatch[1]) || 0
          saleAmounts.set(saleId, newTotal)
        } else if (increasedByMatch) {
          const currentAmount = saleAmounts.get(saleId) || 0
          const increaseAmount = Number(increasedByMatch[1]) || 0
          saleAmounts.set(saleId, currentAmount + increaseAmount)
        } else if (Number(tx.amount) > 0) {
          const currentAmount = saleAmounts.get(saleId) || 0
          saleAmounts.set(saleId, currentAmount + Number(tx.amount))
        }
      }
    }
    
    if (type === 'adjustment' && description.includes('Purchase')) {
      const purchaseId = extractIdFromDescription(description)
      if (purchaseId && purchaseAmounts.has(purchaseId)) {
        const currentAmount = purchaseAmounts.get(purchaseId) || 0
        let adjustmentAmount = 0
        
        // Extract from description
        const paymentMatch = description.match(/Payment increased by\s*([\d.]+)/i)
        if (paymentMatch) {
          adjustmentAmount = Number(paymentMatch[1]) || 0
        }
        
        purchaseAmounts.set(purchaseId, currentAmount + adjustmentAmount)
      }
    }
  })
}

// Helper function to get account type for display
function getAccountType(transactionType: string): string {
  switch (transactionType) {
    case "sale":
      return "Sales"
    case "purchase":
      return "Purchases"
    case "manual":
      return "Manual"
    case "supplier_payment":
      return "Supplier Payment"
    case "adjustment":
      return "Adjustments"
    default:
      return "Other"
  }
}

// BALANCE CALCULATION FUNCTIONS

export async function getAccountingBalances(deviceId: number, openingDate: Date, closingDate?: Date) {
  try {
    console.log(
      "Getting accounting balances for device:",
      deviceId,
      "opening date:",
      openingDate,
      "closing date:",
      closingDate,
    )

    // Ensure table exists
    await createFinancialTransactionsTable()

    // Format dates properly without timezone conversion
    const openingDateStr = `${openingDate.getFullYear()}-${String(openingDate.getMonth() + 1).padStart(2, "0")}-${String(openingDate.getDate()).padStart(2, "0")} 00:00:00`

    let closingDateStr = `${openingDate.getFullYear()}-${String(openingDate.getMonth() + 1).padStart(2, "0")}-${String(openingDate.getDate()).padStart(2, "0")} 23:59:59`
    if (closingDate) {
      closingDateStr = `${closingDate.getFullYear()}-${String(closingDate.getMonth() + 1).padStart(2, "0")}-${String(closingDate.getDate()).padStart(2, "0")} 23:59:59`
    }

    console.log("Date strings for balance calculation:", { openingDateStr, closingDateStr })

    // Opening balance = Closing balance of PREVIOUS day
    const previousDayEnd = new Date(openingDate)
    previousDayEnd.setDate(previousDayEnd.getDate() - 1)
    const previousDayEndStr = `${previousDayEnd.getFullYear()}-${String(previousDayEnd.getMonth() + 1).padStart(2, "0")}-${String(previousDayEnd.getDate()).padStart(2, "0")} 23:59:59`

    const openingBalanceQuery = await sql`
      SELECT 
        COALESCE(SUM(credit_amount - debit_amount), 0) as net_balance
      FROM financial_transactions 
      WHERE device_id = ${deviceId} 
        AND transaction_date <= ${previousDayEndStr}::timestamp
    `

    // Period transactions: All transactions BETWEEN opening and closing dates (inclusive)
    const periodTransactionsQuery = await sql`
      SELECT 
        COALESCE(SUM(credit_amount), 0) as period_credits,
        COALESCE(SUM(debit_amount), 0) as period_debits,
        COALESCE(SUM(credit_amount - debit_amount), 0) as period_net
      FROM financial_transactions 
      WHERE device_id = ${deviceId} 
        AND transaction_date >= ${openingDateStr}::timestamp
        AND transaction_date <= ${closingDateStr}::timestamp
    `

    // Opening balance = Closing balance of previous day
    const openingBalance = Number(openingBalanceQuery[0]?.net_balance) || 0
    const periodCredits = Number(periodTransactionsQuery[0]?.period_credits) || 0
    const periodDebits = Number(periodTransactionsQuery[0]?.period_debits) || 0
    const periodNet = Number(periodTransactionsQuery[0]?.period_net) || 0
    
    // Closing balance = Opening balance + Period net cash flow
    const closingBalance = openingBalance + periodNet

    console.log("Balance calculation results:", {
      previousDayEnd: previousDayEndStr,
      openingBalance: `Opening (Previous Day's Closing): ${openingBalance}`,
      periodCredits: `Period Credits (Money In): ${periodCredits}`,
      periodDebits: `Period Debits (Money Out): ${periodDebits}`,
      periodNet: `Period Net: ${periodNet}`,
      closingBalance: `Closing: ${closingBalance}`,
      formula: `${openingBalance} + ${periodNet} = ${closingBalance}`
    })

    return {
      openingBalance,
      closingBalance,
      periodCredits,
      periodDebits,
      periodNet,
    }
  } catch (error) {
    console.error("Error getting accounting balances:", error)
    return {
      openingBalance: 0,
      closingBalance: 0,
      periodCredits: 0,
      periodDebits: 0,
      periodNet: 0,
    }
  }
}

// DEBUG FUNCTIONS

export async function debugFinancialTransactions(deviceId: number) {
  try {
    console.log("🔍 DEBUG FINANCIAL TRANSACTIONS FOR DEVICE", deviceId)
    
    // Check if table exists and has data
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'financial_transactions'
      ) as exists
    `
    
    console.log("Table exists:", tableExists[0]?.exists)
    
    if (!tableExists[0]?.exists) {
      console.log("❌ financial_transactions table doesn't exist!")
      return
    }
    
    // Get ALL transactions with detailed info
    const transactions = await sql`
      SELECT * FROM financial_transactions 
      WHERE device_id = ${deviceId}
      ORDER BY transaction_date, id
    `
    
    console.log(`📊 Found ${transactions.length} transactions in financial_transactions table`)
    
    // Show transaction flow with running balance
    let runningBalance = 0
    console.log("\n🧮 TRANSACTION FLOW WITH RUNNING BALANCE:")
    
    transactions.forEach((tx: any, index: number) => {
      const netChange = Number(tx.credit_amount) - Number(tx.debit_amount)
      runningBalance += netChange
      
      console.log(
        `${index + 1}. ${tx.transaction_date} | ${tx.transaction_type.padEnd(15)} | ` +
        `Amt: ${Number(tx.amount).toFixed(2).padStart(8)} | ` +
        `Debit: ${Number(tx.debit_amount).toFixed(2).padStart(8)} | ` +
        `Credit: ${Number(tx.credit_amount).toFixed(2).padStart(8)} | ` +
        `Net: ${netChange.toFixed(2).padStart(8)} | ` +
        `Balance: ${runningBalance.toFixed(2).padStart(10)} | ` +
        `${tx.description}`
      )
    })
    
    console.log(`\n💰 FINAL CALCULATED BALANCE: ${runningBalance.toFixed(2)}`)
    
    // Analyze transaction types
    const typeAnalysis = transactions.reduce((acc: any, tx: any) => {
      const type = tx.transaction_type
      if (!acc[type]) {
        acc[type] = { count: 0, totalDebit: 0, totalCredit: 0, net: 0 }
      }
      acc[type].count++
      acc[type].totalDebit += Number(tx.debit_amount)
      acc[type].totalCredit += Number(tx.credit_amount)
      acc[type].net += (Number(tx.credit_amount) - Number(tx.debit_amount))
      return acc
    }, {})
    
    console.log("\n📈 TRANSACTION TYPE ANALYSIS:")
    Object.entries(typeAnalysis).forEach(([type, data]: [string, any]) => {
      console.log(`- ${type.padEnd(15)}: ${data.count} transactions | Debit: ${data.totalDebit.toFixed(2)} | Credit: ${data.totalCredit.toFixed(2)} | Net: ${data.net.toFixed(2)}`)
    })
    
    return { transactions, finalBalance: runningBalance }
    
  } catch (error) {
    console.error("Error in debugFinancialTransactions:", error)
    return { error: error.message }
  }
}

export async function accountingHealthCheck(deviceId: number) {
  console.log("🏥 ACCOUNTING HEALTH CHECK")
  
  const transactions = await sql`
    SELECT * FROM financial_transactions 
    WHERE device_id = ${deviceId}
    ORDER BY transaction_date DESC
    LIMIT 100
  `
  
  // Analyze recent transactions
  const recentAnalysis = transactions.reduce((acc: any, tx: any) => {
    const type = tx.transaction_type
    if (!acc[type]) acc[type] = { count: 0, amount: 0 }
    acc[type].count++
    acc[type].amount += Number(tx.amount)
    return acc
  }, {})
  
  console.log("Recent Transaction Analysis:", recentAnalysis)
  
  // Check for potential accounting errors
  const potentialIssues = []
  
  // 1. Check supplier payments
  const supplierPayments = transactions.filter((t: any) => t.transaction_type === 'supplier_payment')
  if (supplierPayments.length > 0) {
    potentialIssues.push(`⚠️ ${supplierPayments.length} supplier payments - ensure these reduce liabilities, not just cash`)
  }
  
  // 2. Check manual expenses
  const manualExpenses = transactions.filter((t: any) => 
    t.transaction_type === 'manual' && Number(t.debit_amount) > 0
  )
  if (manualExpenses.length > 10) {
    potentialIssues.push(`⚠️ ${manualExpenses.length} manual expenses - review if these are business-related`)
  }
  
  // 3. Check if credits > debits overall
  const totalCredits = transactions.reduce((sum: number, t: any) => sum + Number(t.credit_amount), 0)
  const totalDebits = transactions.reduce((sum: number, t: any) => sum + Number(t.debit_amount), 0)
  
  if (totalDebits > totalCredits) {
    potentialIssues.push(`⚠️ Cash outflow (${totalDebits}) exceeds inflow (${totalCredits}) by ${totalDebits - totalCredits}`)
  }
  
  console.log("Potential Accounting Issues:", potentialIssues)
  
  return {
    recentAnalysis,
    potentialIssues,
    cashFlowHealth: totalCredits - totalDebits
  }
}
