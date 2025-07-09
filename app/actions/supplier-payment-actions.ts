"use server"

import { sql, getLastError, resetConnectionState } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { recordSupplierPayment } from "./simplified-accounting"

interface PaymentAllocation {
  purchaseId: number
  allocatedAmount: number
  newStatus: string
  remainingBalance: number
}

export async function paySupplierCredit(
  supplierId: number,
  paymentAmount: number,
  userId: number,
  deviceId: number,
  paymentMethod = "Cash",
  notes?: string,
) {
  console.log("paySupplierCredit: Starting payment process", {
    supplierId,
    paymentAmount,
    userId,
    deviceId,
    paymentMethod,
  })

  if (!supplierId || !paymentAmount || !userId || !deviceId) {
    return { success: false, message: "Missing required parameters" }
  }

  if (paymentAmount <= 0) {
    return { success: false, message: "Payment amount must be greater than zero" }
  }

  resetConnectionState()

  try {
    // Start transaction
    await sql`BEGIN`

    // Get supplier details
    const supplierResult = await sql`
      SELECT * FROM suppliers WHERE id = ${supplierId} AND created_by = ${userId}
    `

    if (supplierResult.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "Supplier not found" }
    }

    const supplier = supplierResult[0]

    // Get all credit purchases for this supplier, ordered by date (oldest first)
    // FIXED: Only get non-cancelled purchases for payment allocation
    const creditPurchases = await sql`
      SELECT 
        id,
        total_amount,
        received_amount,
        purchase_date,
        status
      FROM purchases
      WHERE TRIM(supplier) = TRIM(${supplier.name})
        AND created_by = ${userId}
        AND device_id = ${deviceId}
        AND status != 'Cancelled'
        AND (total_amount - COALESCE(received_amount, 0)) > 0
      ORDER BY purchase_date ASC, id ASC
    `

    console.log(`Found ${creditPurchases.length} credit purchases for supplier ${supplier.name}`)

    if (creditPurchases.length === 0) {
      await sql`ROLLBACK`
      return { success: false, message: "No outstanding credit purchases found for this supplier" }
    }

    // Calculate total outstanding amount (excluding cancelled)
    const totalOutstanding = creditPurchases.reduce((sum, purchase) => {
      return sum + (Number(purchase.total_amount) - Number(purchase.received_amount || 0))
    }, 0)

    if (paymentAmount > totalOutstanding) {
      await sql`ROLLBACK`
      return {
        success: false,
        message: `Payment amount (${paymentAmount}) exceeds total outstanding balance (${totalOutstanding})`,
      }
    }

    // Allocate payment to purchases (oldest first)
    let remainingPayment = paymentAmount
    const allocations: PaymentAllocation[] = []

    for (const purchase of creditPurchases) {
      if (remainingPayment <= 0) break

      const currentBalance = Number(purchase.total_amount) - Number(purchase.received_amount || 0)
      const allocationAmount = Math.min(remainingPayment, currentBalance)
      const newReceivedAmount = Number(purchase.received_amount || 0) + allocationAmount
      const newRemainingBalance = Number(purchase.total_amount) - newReceivedAmount

      // Update purchase with new received amount
      await sql`
        UPDATE purchases 
        SET received_amount = ${newReceivedAmount},
            status = ${newRemainingBalance <= 0.01 ? "Paid" : "Credit"}
        WHERE id = ${purchase.id}
      `

      allocations.push({
        purchaseId: purchase.id,
        allocatedAmount: allocationAmount,
        newStatus: newRemainingBalance <= 0.01 ? "Paid" : "Credit",
        remainingBalance: newRemainingBalance,
      })

      remainingPayment -= allocationAmount

      console.log(`Allocated ${allocationAmount} to purchase ${purchase.id}, remaining balance: ${newRemainingBalance}`)
    }

    // Calculate remaining credit after payment
    const remainingCredit = totalOutstanding - paymentAmount

    console.log("Payment allocation completed:", {
      totalPaid: paymentAmount,
      allocationsCount: allocations.length,
      remainingCredit,
    })

    // FIXED: Record the supplier payment transaction with proper local time
    const now = new Date()
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)

    const transactionResult = await recordSupplierPayment({
      supplierId: supplierId,
      supplierName: supplier.name,
      paymentAmount: paymentAmount,
      paymentMethod: paymentMethod,
      allocations: allocations,
      deviceId: deviceId,
      userId: userId,
      paymentDate: localDate, // Use timezone-adjusted local date
      notes: notes,
    })

    if (!transactionResult.success) {
      console.error("Failed to record supplier payment transaction:", transactionResult.error)
      // Don't rollback the payment, just log the error
      console.log("Payment completed but transaction recording failed")
    } else {
      console.log("Supplier payment transaction recorded successfully:", transactionResult.transactionId)
    }

    // Commit transaction
    await sql`COMMIT`

    // Revalidate paths to refresh data
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Payment processed successfully",
      data: {
        totalPaid: paymentAmount,
        allocations,
        remainingCredit,
        transactionId: transactionResult.transactionId,
      },
    }
  } catch (error) {
    await sql`ROLLBACK`
    console.error("paySupplierCredit: Error processing payment:", error)
    console.error("paySupplierCredit: Error details:", getLastError())
    return {
      success: false,
      message: `Payment processing failed: ${getLastError()?.message || "Unknown error"}`,
    }
  }
}
