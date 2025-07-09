"use server"

import { getFinancialSummary } from "./simplified-accounting"

export async function getFinancialData(deviceId: number, dateFrom?: Date, dateTo?: Date) {
  try {
    console.log("Getting financial data for device:", deviceId, "from:", dateFrom, "to:", dateTo)

    // Ensure dates are properly set with time components
    const fromDate = dateFrom ? new Date(dateFrom) : new Date()
    const toDate = dateTo ? new Date(dateTo) : new Date()

    // Set time to beginning/end of day in local time
    fromDate.setHours(0, 0, 0, 0)
    toDate.setHours(23, 59, 59, 999)

    console.log("Adjusted date range:", {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      fromLocal: fromDate.toLocaleString(),
      toLocal: toDate.toLocaleString(),
    })

    const result = await getFinancialSummary(deviceId, fromDate, toDate)

    console.log("Financial summary:", {
      totalIncome: result.totalIncome,
      totalCogs: result.totalCogs,
      transactionCount: result.transactions?.length || 0,
      firstTransactionDate: result.transactions?.[0]?.date,
    })

    return result
  } catch (error) {
    console.error("Error getting financial data:", error)
    return {
      totalIncome: 0,
      totalCogs: 0,
      totalProfit: 0,
      totalExpenses: 0,
      netProfit: 0,
      accountsReceivable: 0,
      accountsPayable: 0,
      outstandingReceivables: 0,
      transactions: [],
      receivables: [],
      payables: [],
    }
  }
}
