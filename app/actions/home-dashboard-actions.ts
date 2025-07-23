"use server"

import { sql, resetConnectionState, isConnected } from "@/lib/db"
import type { HomeDashboardData } from "@/store/slices/homeDashboardSlice"

const DEFAULT_CURRENCY = "INR"

export async function getComprehensiveDashboardData(
  userId: number,
  deviceId: number,
  period: "today" | "week" | "month" | "quarter" | "year" = "month",
): Promise<{ success: boolean; data?: HomeDashboardData; message?: string }> {
  if (!userId || !deviceId) {
    return {
      success: false,
      message: "User ID and Device ID are required",
    }
  }

  resetConnectionState()

  try {
    if (!isConnected()) {
      return {
        success: false,
        message: "Database connection failed",
      }
    }

    // Calculate date ranges based on period
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date
    let previousEndDate: Date

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
        previousEndDate = new Date(startDate.getTime() - 1)
        break
      case "week":
        // Last 7 days instead of current week
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousEndDate = new Date(startDate.getTime() - 1)
        break
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        previousStartDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1)
        previousEndDate = new Date(startDate.getTime() - 1)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1)
        previousEndDate = new Date(startDate.getTime() - 1)
        break
      default: // month (last 30 days)
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
        previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousEndDate = new Date(startDate.getTime() - 1)
    }

    // Build chart data query for the selected period
    let chartDataQuery
    if (period === "today") {
      // hourly
      chartDataQuery = sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('hour', sale_date), 'HH24:MI') AS period,
          DATE_TRUNC('hour', sale_date)                AS period_date,
          COALESCE(SUM(total_amount), 0)               AS income,
          0                                            AS expenses
        FROM sales
        WHERE status != 'Cancelled'
          AND created_by = ${userId}
          AND sale_date BETWEEN ${startDate.toISOString()} AND ${now.toISOString()}
        GROUP BY DATE_TRUNC('hour', sale_date)
        ORDER BY DATE_TRUNC('hour', sale_date);
      `
    } else if (period === "week" || period === "month") {
      /* daily points */
      chartDataQuery = sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('day', sale_date), 'Mon DD') AS period,
          DATE_TRUNC('day', sale_date)                    AS period_date,
          COALESCE(SUM(total_amount), 0)                  AS income,
          0                                               AS expenses
        FROM sales
        WHERE status != 'Cancelled'
          AND created_by = ${userId}
          AND sale_date BETWEEN ${startDate.toISOString()} AND ${now.toISOString()}
        GROUP BY DATE_TRUNC('day', sale_date)
        ORDER BY DATE_TRUNC('day', sale_date);
      `
    } else if (period === "quarter") {
      /* weekly points */
      chartDataQuery = sql`
        SELECT 
          'Week ' || EXTRACT(WEEK FROM DATE_TRUNC('week', sale_date)) AS period,
          DATE_TRUNC('week', sale_date)                               AS period_date,
          COALESCE(SUM(total_amount), 0)                              AS income,
          0                                                           AS expenses
        FROM sales
        WHERE status != 'Cancelled'
          AND created_by = ${userId}
          AND sale_date BETWEEN ${startDate.toISOString()} AND ${now.toISOString()}
        GROUP BY DATE_TRUNC('week', sale_date)
        ORDER BY DATE_TRUNC('week', sale_date);
      `
    } else {
      /* year → monthly points */
      chartDataQuery = sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', sale_date), 'Mon') AS period,
          DATE_TRUNC('month', sale_date)                 AS period_date,
          COALESCE(SUM(total_amount), 0)                 AS income,
          0                                              AS expenses
        FROM sales
        WHERE status != 'Cancelled'
          AND created_by = ${userId}
          AND sale_date BETWEEN ${startDate.toISOString()} AND ${now.toISOString()}
        GROUP BY DATE_TRUNC('month', sale_date)
        ORDER BY DATE_TRUNC('month', sale_date);
      `
    }

    console.log("Fetching dashboard data for user:", userId, "device:", deviceId, "period:", period)
    console.log("Date range:", startDate.toISOString(), "to", now.toISOString())

    // Execute all queries in parallel for better performance
    const [
      // Financial Overview
      currentPeriodSales,
      previousPeriodSales,
      currentPeriodPurchases,
      previousPeriodPurchases,
      currentPeriodIncome,
      currentPeriodExpenses,
      totalCOGS,

      // Cash Flow & Balances
      accountsReceivable,
      accountsPayable,

      // Recent Transactions
      recentSales,
      recentPurchases,
      recentFinancialTransactions,

      // Operational Metrics
      customerCount,
      supplierCount,
      productCount,
      lowStockProducts,
      overdueInvoicesCount,
      pendingPaymentsCount,

      // Chart Data
      chartData,
    ] = await Promise.all([
      // Current period sales
      sql`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE status != 'Cancelled' 
        AND created_by = ${userId}
        AND sale_date >= ${startDate.toISOString()}
        AND sale_date <= ${now.toISOString()}
      `,

      // Previous period sales
      sql`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM sales
        WHERE status != 'Cancelled' 
        AND created_by = ${userId}
        AND sale_date >= ${previousStartDate.toISOString()}
        AND sale_date <= ${previousEndDate.toISOString()}
      `,

      // Current period purchases
      sql`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM purchases
        WHERE status != 'Cancelled' 
        AND created_by = ${userId}
        AND purchase_date >= ${startDate.toISOString()}
        AND purchase_date <= ${now.toISOString()}
      `,

      // Previous period purchases
      sql`
        SELECT COALESCE(SUM(total_amount), 0) as total
        FROM purchases
        WHERE status != 'Cancelled' 
        AND created_by = ${userId}
        AND purchase_date >= ${previousStartDate.toISOString()}
        AND purchase_date <= ${previousEndDate.toISOString()}
      `,

      // Current period manual income
      sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM financial_transactions
        WHERE transaction_type = 'income' 
        AND device_id = ${deviceId}
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${now.toISOString()}
      `,

      // Current period manual expenses
      sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM financial_transactions
        WHERE transaction_type = 'expense' 
        AND device_id = ${deviceId}
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${now.toISOString()}
      `,

      // Total COGS
      sql`
        SELECT COALESCE(SUM(si.quantity * p.wholesale_price), 0) as total_cogs
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.status != 'Cancelled' 
        AND s.created_by = ${userId}
        AND s.sale_date >= ${startDate.toISOString()}
        AND s.sale_date <= ${now.toISOString()}
      `,

      // Accounts Receivable
      sql`
        SELECT COALESCE(SUM(total_amount - received_amount), 0) as total
        FROM sales
        WHERE status = 'Completed' 
        AND created_by = ${userId}
        AND total_amount > received_amount
      `,

      // Accounts Payable
      sql`
        SELECT COALESCE(SUM(total_amount - received_amount), 0) as total
        FROM purchases
        WHERE status = 'Received' 
        AND created_by = ${userId}
        AND total_amount > received_amount
      `,

      // Recent Sales
      sql`
        SELECT s.*, c.name as customer_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.created_by = ${userId}
        ORDER BY s.sale_date DESC
        LIMIT 5
      `,

      // Recent Purchases
      sql`
        SELECT p.*
        FROM purchases p
        WHERE p.created_by = ${userId}
        ORDER BY p.purchase_date DESC
        LIMIT 5
      `,

      // Recent Financial Transactions
      sql`
        SELECT *
        FROM financial_transactions
        WHERE device_id = ${deviceId}
        ORDER BY created_at DESC
        LIMIT 5
      `,

      // Customer Count - This is the important one
      sql`
        SELECT COUNT(*) as count
        FROM customers
        WHERE created_by = ${userId}
      `,

      // Supplier Count
      sql`
        SELECT COUNT(*) as count
        FROM suppliers
        WHERE created_by = ${userId}
      `,

      // Product Count
      sql`
        SELECT COUNT(*) as count
        FROM products
        WHERE created_by = ${userId}
      `,

      // Low Stock Products
      sql`
        SELECT COUNT(*) as count
        FROM products
        WHERE stock <= 5 AND created_by = ${userId}
      `,

      // Overdue Invoices
      sql`
        SELECT COUNT(*) as count
        FROM sales
        WHERE status = 'Completed' 
        AND created_by = ${userId}
        AND total_amount > received_amount
        AND sale_date < ${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()}
      `,

      // Pending Payments
      sql`
        SELECT COUNT(*) as count
        FROM purchases
        WHERE status = 'Received' 
        AND created_by = ${userId}
        AND total_amount > received_amount
      `,

      // Chart Data
      chartDataQuery,
    ])

    console.log("Raw query results:")
    console.log("Customer count result:", customerCount)
    console.log("Supplier count result:", supplierCount)
    console.log("Product count result:", productCount)
    console.log("Low stock result:", lowStockProducts)

    // Process the data
    const totalRevenue = Number(currentPeriodSales[0]?.total || 0) + Number(currentPeriodIncome[0]?.total || 0)
    const totalExpenses = Number(currentPeriodPurchases[0]?.total || 0) + Number(currentPeriodExpenses[0]?.total || 0)
    const totalCOGSValue = Number(totalCOGS[0]?.total_cogs || 0)
    const grossProfit = Number(currentPeriodSales[0]?.total || 0) - totalCOGSValue
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Calculate changes from previous period
    const previousRevenue = Number(previousPeriodSales[0]?.total || 0)
    const previousExpenses = Number(previousPeriodPurchases[0]?.total || 0)
    const previousProfit = previousRevenue - previousExpenses

    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const expenseChange = previousExpenses > 0 ? ((totalExpenses - previousExpenses) / previousExpenses) * 100 : 0
    const profitChange = previousProfit > 0 ? ((netProfit - previousProfit) / previousProfit) * 100 : 0

    // Build quick stats
    const quickStats = [
      {
        label: "Revenue",
        value: totalRevenue,
        change: revenueChange,
        changeType: revenueChange >= 0 ? "increase" : ("decrease" as const),
      },
      {
        label: "Expenses",
        value: totalExpenses,
        change: Math.abs(expenseChange),
        changeType: expenseChange <= 0 ? "increase" : ("decrease" as const),
      },
      {
        label: "Net Profit",
        value: netProfit,
        change: profitChange,
        changeType: profitChange >= 0 ? "increase" : ("decrease" as const),
      },
      {
        label: "Profit Margin",
        value: profitMargin,
        change: 0,
        changeType: "neutral" as const,
      },
    ]

    // Build recent transactions
    const recentTransactions = [
      ...recentSales.map((sale: any) => ({
        id: sale.id,
        type: "sale" as const,
        description: `Sale to ${sale.customer_name || "Walk-in Customer"}`,
        amount: Number(sale.total_amount),
        date: sale.sale_date,
        status: sale.status,
        customer: sale.customer_name,
      })),
      ...recentPurchases.map((purchase: any) => ({
        id: purchase.id,
        type: "purchase" as const,
        description: `Purchase from ${purchase.supplier || "Unknown Supplier"}`,
        amount: Number(purchase.total_amount),
        date: purchase.purchase_date,
        status: purchase.status,
        supplier: purchase.supplier,
      })),
      ...recentFinancialTransactions.map((transaction: any) => ({
        id: transaction.id,
        type: transaction.transaction_type as "income" | "expense",
        description: transaction.description || `${transaction.transaction_type} transaction`,
        amount: Number(transaction.amount),
        date: transaction.created_at,
        status: "Completed",
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    // Build alerts
    const alerts = []

    const lowStockCount = Number(lowStockProducts[0]?.count || 0)
    if (lowStockCount > 0) {
      alerts.push({
        id: "low-stock",
        type: "warning" as const,
        title: "Low Stock Alert",
        message: `${lowStockCount} products are running low on stock`,
        count: lowStockCount,
      })
    }

    const overdueCount = Number(overdueInvoicesCount[0]?.count || 0)
    if (overdueCount > 0) {
      alerts.push({
        id: "overdue-invoices",
        type: "error" as const,
        title: "Overdue Invoices",
        message: `${overdueCount} invoices are overdue for payment`,
        count: overdueCount,
      })
    }

    const pendingCount = Number(pendingPaymentsCount[0]?.count || 0)
    if (pendingCount > 0) {
      alerts.push({
        id: "pending-payments",
        type: "info" as const,
        title: "Pending Payments",
        message: `${pendingCount} payments are pending to suppliers`,
        count: pendingCount,
      })
    }

    // Process chart data - Fill in missing periods with zero values
    let processedCashFlowData = []

    if (chartData && chartData.length > 0) {
      // Create a complete date range based on period
      const dateRange = []
      const current = new Date(startDate)

      if (period === "today") {
        // Fill hourly data for today
        for (let hour = 0; hour < 24; hour++) {
          const hourDate = new Date(startDate)
          hourDate.setHours(hour, 0, 0, 0)
          if (hourDate <= now) {
            dateRange.push({
              period: hourDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
              period_date: hourDate,
              income: 0,
              expenses: 0,
              netFlow: 0,
            })
          }
        }
      } else if (period === "week") {
        // Fill daily data for the week
        while (current <= now) {
          dateRange.push({
            period: current.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
            period_date: new Date(current),
            income: 0,
            expenses: 0,
            netFlow: 0,
          })
          current.setDate(current.getDate() + 1)
        }
      } else if (period === "month") {
        // Fill daily data for the last 30 days
        while (current <= now) {
          dateRange.push({
            period: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            period_date: new Date(current),
            income: 0,
            expenses: 0,
            netFlow: 0,
          })
          current.setDate(current.getDate() + 1)
        }
      } else if (period === "quarter") {
        // Fill weekly data for the quarter
        while (current <= now) {
          const weekNum = Math.ceil(current.getDate() / 7)
          dateRange.push({
            period: `Week ${weekNum}`,
            period_date: new Date(current),
            income: 0,
            expenses: 0,
            netFlow: 0,
          })
          current.setDate(current.getDate() + 7)
        }
      } else {
        // Fill monthly data for the year
        while (current <= now && current.getFullYear() === startDate.getFullYear()) {
          dateRange.push({
            period: current.toLocaleDateString("en-US", { month: "short" }),
            period_date: new Date(current),
            income: 0,
            expenses: 0,
            netFlow: 0,
          })
          current.setMonth(current.getMonth() + 1)
        }
      }

      // Merge actual data with date range
      processedCashFlowData = dateRange.map((dateItem) => {
        const actualData = chartData.find((item: any) => {
          const itemDate = new Date(item.period_date)
          const rangeDate = dateItem.period_date

          if (period === "today") {
            return itemDate.getHours() === rangeDate.getHours()
          } else if (period === "week" || period === "month") {
            return itemDate.toDateString() === rangeDate.toDateString()
          } else {
            return itemDate.getTime() === rangeDate.getTime()
          }
        })

        const income = actualData ? Number(actualData.income || 0) : 0
        const expenses = actualData ? Number(actualData.expenses || 0) : 0

        return {
          period: dateItem.period,
          income,
          expenses,
          netFlow: income - expenses,
        }
      })
    } else {
      // If no data, create empty data points based on period
      if (period === "today") {
        for (let hour = 0; hour < 24; hour += 4) {
          // Show every 4 hours
          processedCashFlowData.push({
            period: `${hour.toString().padStart(2, "0")}:00`,
            income: 0,
            expenses: 0,
            netFlow: 0,
          })
        }
      } else if (period === "week") {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        days.forEach((day) => {
          processedCashFlowData.push({
            period: day,
            income: 0,
            expenses: 0,
            netFlow: 0,
          })
        })
      } else if (period === "month") {
        // Show first 30 days of month
        for (let day = 1; day <= 30; day += 5) {
          // Show every 5 days for brevity
          processedCashFlowData.push({
            period: day.toString(),
            income: 0,
            expenses: 0,
            netFlow: 0,
          })
        }
      } else {
        // Default monthly view
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        months.forEach((month) => {
          processedCashFlowData.push({
            period: month,
            income: 0,
            expenses: 0,
            netFlow: 0,
          })
        })
      }
    }

    // Extract counts properly - This is where the customer count gets processed
    const totalCustomersCount = Number(customerCount[0]?.count || 0)
    const totalSuppliersCount = Number(supplierCount[0]?.count || 0)
    const totalProductsCount = Number(productCount[0]?.count || 0)

    console.log("Processed counts:", {
      customers: totalCustomersCount,
      suppliers: totalSuppliersCount,
      products: totalProductsCount,
      lowStock: lowStockCount,
    })

    const dashboardData: HomeDashboardData = {
      totalRevenue,
      totalExpenses,
      netProfit,
      grossProfit,
      profitMargin,
      cashOnHand: totalRevenue - totalExpenses, // Simplified calculation
      accountsReceivable: Number(accountsReceivable[0]?.total || 0),
      accountsPayable: Number(accountsPayable[0]?.total || 0),
      netCashFlow: totalRevenue - totalExpenses,
      quickStats,
      recentTransactions,
      alerts,
      cashFlowData: processedCashFlowData,
      accountBalances: [
        { account: "Cash", balance: totalRevenue - totalExpenses, type: "asset" },
        { account: "Accounts Receivable", balance: Number(accountsReceivable[0]?.total || 0), type: "asset" },
        { account: "Accounts Payable", balance: Number(accountsPayable[0]?.total || 0), type: "liability" },
      ],
      currentPeriod: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: netProfit,
      },
      previousPeriod: {
        revenue: previousRevenue,
        expenses: previousExpenses,
        profit: previousProfit,
      },
      totalCustomers: totalCustomersCount,
      totalSuppliers: totalSuppliersCount,
      totalProducts: totalProductsCount,
      lowStockCount,
      overdueInvoices: overdueCount,
      pendingPayments: pendingCount,
    }

    console.log("Final dashboard data being returned:", {
      totalCustomers: dashboardData.totalCustomers,
      totalSuppliers: dashboardData.totalSuppliers,
      totalProducts: dashboardData.totalProducts,
      totalRevenue: dashboardData.totalRevenue,
    })

    return {
      success: true,
      data: dashboardData,
    }
  } catch (error) {
    console.error("Get comprehensive dashboard data error:", error)
    return {
      success: false,
      message: "Failed to load dashboard data",
    }
  }
}
