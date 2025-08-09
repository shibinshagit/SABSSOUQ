"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart3,
  Calendar,
  Clock,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Package,
  ArrowDownCircle,
  CreditCard,
  Users,
  Building,
  TrendingUp,
  ArrowUpCircle,
  Loader2,
} from "lucide-react"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { selectDevice, selectCompany } from "@/store/slices/deviceSlice"
import {
  selectFinancialData,
  selectLastUpdated,
  selectDateRange,
  selectIsLoading,
  selectIsBackgroundLoading,
  setFinancialData,
  setDateRange,
  setLoading,
  setBackgroundLoading,
  selectBalances,
  setBalances,
} from "@/store/slices/accountingSlice"
import { toast } from "sonner"
import {
  getFinancialSummary,
  recordManualTransaction,
  getAccountingBalances,
} from "@/app/actions/simplified-accounting"
import { SimpleDateInput } from "@/components/ui/date-picker"
import { format, startOfWeek, subWeeks, parseISO, isValid } from "date-fns"
import React from "react"

interface AccountingTabProps {
  userId: number
  companyId: number
  deviceId: number
}

// Skeleton Components
const SummaryCardSkeleton = () => (
  <Card>
    <CardContent className="p-3">
      <div className="flex items-center gap-1 mb-1">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-6 w-20" />
    </CardContent>
  </Card>
)

const TransactionSkeleton = () => (
  <div className="border rounded-lg p-4 border-l-4 border-l-gray-200 dark:border-l-gray-600">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-4" />
        <div>
          <Skeleton className="h-4 w-48 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-right">
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="text-right">
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="text-right">
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="text-right">
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="min-w-[120px] text-right">
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  </div>
)

const TableSkeleton = () => (
  <div className="border rounded-lg overflow-hidden dark:border-gray-700">
    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
      <div className="grid grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-16" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default function AccountingTab({ userId, companyId, deviceId }: AccountingTabProps) {
  // Redux state
  const dispatch = useAppDispatch()
  const financialData = useAppSelector(selectFinancialData)
  const lastUpdated = useAppSelector(selectLastUpdated)
  const storedDateRange = useAppSelector(selectDateRange)
  const isLoading = useAppSelector(selectIsLoading)
  const isBackgroundLoading = useAppSelector(selectIsBackgroundLoading)
  const balances = useAppSelector(selectBalances)

  // Local state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [activeTab, setActiveTab] = useState("transactions")

  // Date range modal state
  const [isDateModalOpen, setIsDateModalOpen] = useState(false)
  const [tempDateFrom, setTempDateFrom] = useState<Date>(new Date())
  const [tempDateTo, setTempDateTo] = useState<Date>(new Date())

  // Calculate proper last week's date range - from previous week start to today
  const today = new Date()
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday as start of week
  const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }) // Previous week Monday
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  // Helper function to safely parse dates
  const safeParseDateString = (dateValue: string | Date | undefined): Date | null => {
    if (!dateValue) return null

    if (dateValue instanceof Date) {
      return isValid(dateValue) ? dateValue : null
    }

    if (typeof dateValue === "string") {
      const parsed = parseISO(dateValue)
      return isValid(parsed) ? parsed : null
    }

    return null
  }

  // Initialize date range to today instead of last week
  const [dateFrom, setDateFrom] = useState<Date>(() => {
    if (storedDateRange.dateFrom) {
      const storedFrom = safeParseDateString(storedDateRange.dateFrom)
      if (storedFrom) return storedFrom
    }
    // Default to today instead of last week
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    return todayStart
  })

  const [dateTo, setDateTo] = useState<Date>(() => {
    if (storedDateRange.dateTo) {
      const storedTo = safeParseDateString(storedDateRange.dateTo)
      if (storedTo) return storedTo
    }
    // Default to today end
    return todayEnd
  })

  // Manual transaction dialog states
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const [manualAmount, setManualAmount] = useState("")
  const [manualType, setManualType] = useState<"debit" | "credit">("debit")
  const [manualDescription, setManualDescription] = useState("No Description")
  const [manualCategory, setManualCategory] = useState("")
  const [manualPaymentMethod, setManualPaymentMethod] = useState("Cash")
  const [manualDate, setManualDate] = useState<Date>(new Date())
  const [isAddingManual, setIsAddingManual] = useState(false)

  const device = useAppSelector(selectDevice)
  const company = useAppSelector(selectCompany)
  const currency = device?.currency || "AED"

  // Debug logging for date issues
  useEffect(() => {
    console.log("Current date range:", {
      dateFrom: format(dateFrom, "yyyy-MM-dd HH:mm:ss"),
      dateTo: format(dateTo, "yyyy-MM-dd HH:mm:ss"),
      fromLocal: dateFrom.toLocaleString(),
      toLocal: dateTo.toLocaleString(),
    })
  }, [dateFrom, dateTo])

  // Handle date changes and update Redux - using same approach as sales tab
  const handleDateFromChange = (date: Date | undefined) => {
    if (!date) return

    // Create a new date to avoid reference issues and set to start of day
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    setDateFrom(newDate)
    dispatch(
      setDateRange({
        dateFrom: newDate.toISOString(),
        dateTo: dateTo.toISOString(),
      }),
    )
  }

  const handleDateToChange = (date: Date | undefined) => {
    if (!date) return

    // Create a new date to avoid reference issues and set to end of day
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
    setDateTo(newDate)
    dispatch(
      setDateRange({
        dateFrom: dateFrom.toISOString(),
        dateTo: newDate.toISOString(),
      }),
    )
  }

  // Handle date range modal
  const openDateModal = () => {
    setTempDateFrom(dateFrom)
    setTempDateTo(dateTo)
    setIsDateModalOpen(true)
  }

  const applyDateRange = () => {
    handleDateFromChange(tempDateFrom)
    handleDateToChange(tempDateTo)
    setIsDateModalOpen(false)
  }

  // Load financial data with caching strategy
  const loadFinancialData = async (background = false) => {
    try {
      if (background) {
        dispatch(setBackgroundLoading(true))
      } else {
        dispatch(setLoading(true))
      }

      if (!deviceId) {
        console.error("No device ID provided to accounting tab")
        toast.error("Device ID not found")
        return
      }

      // Use the dates as they are - no additional timezone manipulation
      const fromDateFixed = new Date(dateFrom)
      const toDateFixed = new Date(dateTo)

      console.log("Fetching financial data with date range:", {
        from: format(fromDateFixed, "yyyy-MM-dd HH:mm:ss"),
        to: format(toDateFixed, "yyyy-MM-dd HH:mm:ss"),
        fromLocal: fromDateFixed.toLocaleString(),
        toLocal: toDateFixed.toLocaleString(),
      })

      const data = await getFinancialSummary(deviceId, fromDateFixed, toDateFixed)

      // Log the received data for debugging
      console.log("Received financial data:", {
        transactionCount: data.transactions?.length || 0,
        firstTransactionDate: data.transactions?.[0]?.date,
        dateRange: {
          from: format(fromDateFixed, "yyyy-MM-dd HH:mm:ss"),
          to: format(toDateFixed, "yyyy-MM-dd HH:mm:ss"),
        },
      })

      dispatch(setFinancialData(data))
    } catch (error) {
      console.error("Error loading financial data:", error)
      if (!background || error.message?.includes("critical")) {
        toast.error("Failed to load financial data: " + (error.message || "Unknown error"))
      }
    } finally {
      if (background) {
        dispatch(setBackgroundLoading(false))
      } else {
        dispatch(setLoading(false))
      }
    }
  }

  // Load accounting balances based on our date range
  const loadAccountingBalances = async (fromDate: Date, toDate: Date) => {
    try {
      console.log("Loading accounting balances for date range:", {
        from: format(fromDate, "yyyy-MM-dd"),
        to: format(toDate, "yyyy-MM-dd"),
      })

      if (!deviceId) {
        console.error("No device ID provided for balance calculation")
        return
      }

      // Calculate opening balance: all transactions BEFORE our date range
      const dayBeforeFrom = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        fromDate.getDate() - 1,
        23,
        59,
        59,
        999,
      )

      // Calculate closing balance: all transactions UP TO our end date
      const endOfToDate = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999)

      const balanceData = await getAccountingBalances(deviceId, dayBeforeFrom, endOfToDate)
      dispatch(setBalances(balanceData))

      console.log("Balances loaded for date range:", balanceData)
    } catch (error) {
      console.error("Error loading accounting balances:", error)
      toast.error("Failed to load account balances")
    }
  }

  // Initial load and date change effect
  useEffect(() => {
    if (deviceId) {
      // Load balances for our date range
      loadAccountingBalances(dateFrom, dateTo)

      if (
        financialData &&
        lastUpdated &&
        storedDateRange.dateFrom === dateFrom.toISOString() &&
        storedDateRange.dateTo === dateTo.toISOString()
      ) {
        const lastUpdatedTime = new Date(lastUpdated).getTime()
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000

        if (lastUpdatedTime < fiveMinutesAgo) {
          loadFinancialData(true)
        }
      } else {
        loadFinancialData(false)
      }
    }
  }, [deviceId, dateFrom, dateTo])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      currencyDisplay: "narrowSymbol",
    })
      .format(amount)
      .replace(/[A-Z]{3}\s?/, `${currency} `)
  }

  // Updated formatDateTime function to handle both string and Date inputs
  const formatDateTime = (dateInput: string | Date) => {
    let date: Date

    if (dateInput instanceof Date) {
      date = dateInput
    } else if (typeof dateInput === "string") {
      date = parseISO(dateInput)
    } else {
      return { date: "Invalid Date", time: "00:00" }
    }

    if (!isValid(date)) {
      return { date: "Invalid Date", time: "00:00" }
    }

    return {
      date: format(date, "MMM d, yyyy"), // e.g., "Dec 17, 2025" - same as sales page
      time: format(date, "HH:mm"), // e.g., "14:30" - 24-hour format
    }
  }

  // Updated formatDate function to handle both string and Date inputs
  const formatDateOnly = (dateInput: string | Date) => {
    let date: Date

    if (dateInput instanceof Date) {
      date = dateInput
    } else if (typeof dateInput === "string") {
      date = parseISO(dateInput)
    } else {
      return "Invalid Date"
    }

    if (!isValid(date)) {
      return "Invalid Date"
    }

    return format(date, "MMM d, yyyy") // e.g., "Dec 17, 2025"
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === "completed") {
      return (
        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700 text-xs">
          Completed
        </Badge>
      )
    } else if (statusLower === "credit") {
      return (
        <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700 text-xs">
          Credit
        </Badge>
      )
    } else if (statusLower === "cancelled") {
      return (
        <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700 text-xs">
          Cancelled
        </Badge>
      )
    } else if (statusLower === "adjustment") {
      return (
        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700 text-xs">
          Adjustment
        </Badge>
      )
    } else if (statusLower === "manual entry") {
      return (
        <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700 text-xs">
          Manual
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
          {status}
        </Badge>
      )
    }
  }

  const handleAddManualTransaction = async () => {
    if (!manualAmount || !manualCategory) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsAddingManual(true)

    try {
      const result = await recordManualTransaction({
        amount: Number(manualAmount),
        type: manualType,
        description: manualDescription,
        category: manualCategory,
        paymentMethod: manualPaymentMethod,
        deviceId,
        userId,
        transactionDate: manualDate,
      })

      if (result.success) {
        toast.success("Manual transaction added successfully")
        setIsManualDialogOpen(false)
        setManualAmount("")
        setManualDescription("")
        setManualCategory("")
        setManualPaymentMethod("Cash")
        setManualDate(new Date())
        loadFinancialData(false)
      } else {
        toast.error("Failed to add manual transaction")
      }
    } catch (error) {
      console.error("Error adding manual transaction:", error)
      toast.error("An error occurred while adding the transaction")
    } finally {
      setIsAddingManual(false)
    }
  }

  const handlePrintReport = () => {
    if (!financialData) {
      toast.error("No data available to print")
      return
    }

    try {
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        throw new Error("Could not open print window. Please check your popup blocker settings.")
      }

      const htmlContent = `
        <html>
          <head>
            <title>Financial Report - ${company?.name || "Company"}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
              .company-name { font-size: 24px; font-weight: bold; color: #3b82f6; }
              .report-title { font-size: 18px; margin: 10px 0; }
              .date-range { font-size: 14px; color: #666; }
              .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
              .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
              .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; }
              .summary-card .value { font-size: 20px; font-weight: bold; color: #1f2937; }
              .transactions-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
              .transactions-table th, .transactions-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
              .transactions-table th { background-color: #f9fafb; font-weight: bold; }
              .transactions-table tr:nth-child(even) { background-color: #f9fafb; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">${company?.name || "Company"}</div>
              <div class="report-title">Financial Report</div>
              <div class="date-range">
                Period: ${format(dateFrom, "MMM d, yyyy")} - ${format(dateTo, "MMM d, yyyy")}
              </div>
              <div class="date-range">
                Generated on: ${format(new Date(), "MMM d, yyyy 'at' HH:mm")}
              </div>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <h3>Opening Balance</h3>
                <div class="value">${currency} ${getOpeningBalance().toFixed(2)}</div>
              </div>
              <div class="summary-card">
                <h3>Total Sales</h3>
                <div class="value">${currency} ${getSalesTotal().toFixed(2)}</div>
              </div>
              <div class="summary-card">
                <h3>Total Purchases</h3>
                <div class="value">${currency} ${getPurchasesTotal().toFixed(2)}</div>
              </div>
              <div class="summary-card">
                <h3>Gross Profit</h3>
                <div class="value">${currency} ${getProfit().toFixed(2)}</div>
              </div>
              <div class="summary-card">
                <h3>Amount Received</h3>
                <div class="value">${currency} ${getAmountReceived().toFixed(2)}</div>
              </div>
              <div class="summary-card">
                <h3>Total Spends</h3>
                <div class="value">${currency} ${getSpends().toFixed(2)}</div>
              </div>
              <div class="summary-card">
                <h3>Closing Balance</h3>
                <div class="value">${currency} ${getClosingBalance().toFixed(2)}</div>
              </div>
              <div class="summary-card">
                <h3>Receivables</h3>
                <div class="value">${currency} ${(financialData.accountsReceivable || 0).toFixed(2)}</div>
              </div>
              <div class="summary-card">
                <h3>Payables</h3>
                <div class="value">${currency} ${(financialData.accountsPayable || 0).toFixed(2)}</div>
              </div>
            </div>

            <table class="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>${filteredTransactions.length > 0 ? "Received" : "Spend"}</th>
                  <th>Cost</th>
                  <th>Net Impact</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTransactions
                  .map((t) => {
                    const dateTime = formatDateTime(t.date)
                    const netImpact = getNetImpact(t)
                    return `
                    <tr>
                      <td>${dateTime.date}</td>
                      <td>${t.description || "No description"}</td>
                      <td>${t.type || "Unknown"}</td>
                      <td>${t.status}</td>
                      <td>${currency} ${t.amount.toFixed(2)}</td>
                      <td>${getNetImpact(t) >= 0 ? currency + " " + t.received.toFixed(2) : currency + " " + Math.abs(getNetImpact(t)).toFixed(2)}</td>
                      <td>${currency} ${t.cost.toFixed(2)}</td>
                      <td style="color: ${netImpact >= 0 ? "#059669" : "#dc2626"}">
                        ${netImpact >= 0 ? "" : "-"}${currency} ${Math.abs(netImpact).toFixed(2)}
                      </td>
                    </tr>
                  `
                  })
                  .join("")}
              </tbody>
            </table>

            <div class="footer">
              <p>Total Transactions: ${filteredTransactions.length}</p>
              <p>This report was generated on ${format(new Date(), "MMM d, yyyy 'at' HH:mm")}</p>
            </div>

            <button onclick="window.print(); window.close();" style="margin-top: 20px; padding: 10px 20px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
              Print Report
            </button>
          </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()

      toast.success("Print preview opened. Use your browser's print function to save as PDF.")
    } catch (error) {
      console.error("Error opening print preview:", error)
      toast.error("Failed to open print preview")
    }
  }

  // Enhanced filtering with income/expense and proper date comparison - using same date-fns approach
  const filteredTransactions =
    financialData?.transactions?.filter((transaction) => {
      // First apply search filter
      const description = transaction.description || ""
      const account = transaction.account || ""

      const matchesSearch =
        description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.status.toLowerCase().includes(searchTerm.toLowerCase())

      // Apply type filter including income/expense and description-based filtering
      let matchesType = true
      const netImpact = transaction.credit - transaction.debit

      if (filterType === "income") {
        matchesType = netImpact > 0 // Positive net impact
      } else if (filterType === "expense") {
        matchesType = netImpact < 0 // Negative net impact
      } else if (filterType === "sale") {
        // Match both transaction type "sale" and descriptions starting with "Sale"
        matchesType = transaction.type === "sale" || description.toLowerCase().startsWith("sale")
      } else if (filterType === "purchase") {
        // Match both transaction type "purchase" and descriptions starting with "Purchase"
        matchesType = transaction.type === "purchase" || description.toLowerCase().startsWith("purchase")
      } else if (filterType !== "all") {
        matchesType = transaction.type === filterType
      }

      // Date filtering using proper date comparison without timezone issues - same as sales tab
      let transactionDate: Date

      if (transaction.date instanceof Date) {
        transactionDate = transaction.date
      } else if (typeof transaction.date === "string") {
        transactionDate = parseISO(transaction.date)
      } else {
        return false // Skip invalid date types
      }

      if (!isValid(transactionDate)) {
        return false // Skip invalid dates
      }

      // Compare dates using year, month, day only - same as sales tab
      const transactionDateOnly = new Date(
        transactionDate.getFullYear(),
        transactionDate.getMonth(),
        transactionDate.getDate(),
      )
      const fromDateOnly = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate())
      const toDateOnly = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate())

      const isWithinDateRange = transactionDateOnly >= fromDateOnly && transactionDateOnly <= toDateOnly

      return matchesSearch && matchesType && isWithinDateRange
    }) || []

  const isDataLoading = isLoading && !financialData

  // Calculate specific metrics based on FILTERED data
  const getSalesTotal = () => {
    return (
      filteredTransactions?.reduce((sum, t) => {
        return t.type === "sale" || t.description?.toLowerCase().startsWith("sale") ? sum + t.amount : sum
      }, 0) || 0
    )
  }

  const getPurchasesTotal = () => {
    return (
      filteredTransactions?.reduce((sum, t) => {
        return t.type === "purchase" || t.description?.toLowerCase().startsWith("purchase") ? sum + t.amount : sum
      }, 0) || 0
    )
  }

  const getProfit = () => {
    // Calculate profit from filtered sales transactions only
    const filteredCogs =
      filteredTransactions?.reduce((sum, t) => {
        return t.type === "sale" || t.description?.toLowerCase().startsWith("sale") ? sum + t.cost : sum
      }, 0) || 0

    return getSalesTotal() - filteredCogs
  }

  const getAmountReceived = () => {
    return (
      filteredTransactions?.reduce((sum, t) => {
        return sum + t.credit
      }, 0) || 0
    )
  }

  const getSpends = () => {
    return (
      filteredTransactions?.reduce((sum, t) => {
        return sum + t.debit
      }, 0) || 0
    )
  }

  // Add new function to get filtered COGS
  const getFilteredCogs = () => {
    return (
      filteredTransactions?.reduce((sum, t) => {
        return sum + t.cost
      }, 0) || 0
    )
  }

  // Updated balance calculations to work with filtered data
  const getOpeningBalance = () => {
    return balances?.openingBalance || 0
  }

  const getClosingBalance = () => {
    // For filtered data, calculate closing balance as:
    // Opening Balance + Net Impact of Filtered Transactions
    const openingBalance = balances?.openingBalance || 0
    const netImpactFromFiltered = getAmountReceived() - getSpends()

    return openingBalance + netImpactFromFiltered
  }

  const getNetImpact = (transaction: any) => {
    return transaction.credit - transaction.debit
  }

  const getTransactionTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "sale":
        return <ShoppingCart className="h-4 w-4" />
      case "purchase":
        return <Package className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Use same date formatting as sales tab
  const formatDate = (date: Date) => {
    return format(date, "M/d/yyyy") // e.g., "12/17/2025"
  }

  const setToday = () => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0)
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    handleDateFromChange(todayStart)
    handleDateToChange(todayEnd)
  }

  const setLastWeek = () => {
    // Last week: from previous week start (Monday) to today
    const today = new Date()
    const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }) // Previous week Monday
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)

    handleDateFromChange(lastWeekStart)
    handleDateToChange(todayEnd)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-blue-600 dark:bg-blue-700 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-white" />
            <div>
              <h1 className="text-xl font-bold text-white">Financial Dashboard</h1>
              <div className="text-blue-100 text-sm">
                {format(dateFrom, "yyyy-MM-dd") === format(dateTo, "yyyy-MM-dd")
                  ? `${formatDate(dateFrom)} Transactions`
                  : `${formatDate(dateFrom)} - ${formatDate(dateTo)} Transactions`}
                {lastUpdated && (
                  <span className="ml-2 text-xs">Last updated: {format(new Date(lastUpdated), "HH:mm")}</span>
                )}
              </div>
            </div>
          </div>

          {/* Opening and Closing Balance in Header */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-blue-200">Opening Balance</div>
              <div className="text-lg font-bold text-white">
                {isDataLoading ? (
                  <Skeleton className="h-6 w-24 bg-white/20" />
                ) : (
                  `${getOpeningBalance() >= 0 ? "+" : ""}${currency} ${getOpeningBalance().toFixed(2)}`
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-blue-200">Closing Balance</div>
              <div className="text-lg font-bold text-white">
                {isDataLoading ? (
                  <Skeleton className="h-6 w-24 bg-white/20" />
                ) : (
                  `${getClosingBalance() >= 0 ? "+" : ""}${currency} ${getClosingBalance().toFixed(2)}`
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 text-white border-0 hover:bg-white/30"
            onClick={openDateModal}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {format(dateFrom, "yyyy-MM-dd") === format(dateTo, "yyyy-MM-dd")
              ? formatDate(dateFrom)
              : `${formatDate(dateFrom)} - ${formatDate(dateTo)}`}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 text-white border-0 hover:bg-white/30"
            onClick={setToday}
          >
            Today
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 text-white border-0 hover:bg-white/30"
            onClick={setLastWeek}
          >
            Last Week
          </Button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              placeholder="Search transactions..."
              className="pl-8 bg-white/20 border-0 text-white placeholder:text-white/70 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] bg-white/20 border-0 text-white h-9">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-green-600" />
                  Income
                </div>
              </SelectItem>
              <SelectItem value="expense">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-red-600" />
                  Expense
                </div>
              </SelectItem>
              <SelectItem value="sale">Sales</SelectItem>
              <SelectItem value="purchase">Purchases</SelectItem>
              <SelectItem value="adjustment">Adjustments</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 text-white border-0 hover:bg-white/30"
            onClick={handlePrintReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Print
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 text-white border-0 hover:bg-white/30"
            onClick={() => setIsManualDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 text-white border-0 hover:bg-white/30"
            onClick={() => {
              loadAccountingBalances(dateFrom, dateTo)
              loadFinancialData(false)
            }}
            disabled={isLoading || isBackgroundLoading}
          >
            {isLoading || isBackgroundLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Loading..." : isBackgroundLoading ? "Updating..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-2">
        {/* Filter indicator */}
        {(filterType !== "all" || searchTerm) && (
          <div className="text-sm text-blue-100 bg-blue-700/50 dark:bg-blue-800/50 px-3 py-1 rounded">
            📊 Showing {filteredTransactions.length} filtered transactions
            {filterType !== "all" && ` • Filter: ${filterType}`}
            {searchTerm && ` • Search: "${searchTerm}"`}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
          {isDataLoading ? (
            Array.from({ length: 7 }).map((_, i) => <SummaryCardSkeleton key={i} />)
          ) : (
            <>
              {/* Total Sales */}
              <Card className="bg-[#22c55e] text-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-xs">Sales</span>
                  </div>
                  <div className="text-lg font-bold">{`${currency} ${getSalesTotal().toFixed(2)}`}</div>
                  <div className="text-[10px] mt-1">
                    {
                      filteredTransactions.filter(
                        (t) => t.type === "sale" || t.description?.toLowerCase().startsWith("sale"),
                      ).length
                    }{" "}
                    transactions
                  </div>
                </CardContent>
              </Card>

              {/* Total Purchases */}
              <Card className="bg-[#f97316] text-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-xs">Purchases</span>
                  </div>
                  <div className="text-lg font-bold">{`${currency} ${getPurchasesTotal().toFixed(2)}`}</div>
                  <div className="text-[10px] mt-1">
                    {
                      filteredTransactions.filter(
                        (t) => t.type === "purchase" || t.description?.toLowerCase().startsWith("purchase"),
                      ).length
                    }{" "}
                    transactions
                  </div>
                </CardContent>
              </Card>

              {/* Profit */}
              <Card className="bg-[#3b82f6] text-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">Profit</span>
                  </div>
                  <div className="text-lg font-bold">{`${currency} ${getProfit().toFixed(2)}`}</div>
                  <div className="text-[10px] mt-1">
                    COGS: {currency} {getFilteredCogs().toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              {/* Amount Received */}
              <Card className="bg-[#10b981] text-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <ArrowDownCircle className="h-4 w-4" />
                    <span className="text-xs">Received</span>
                  </div>
                  <div className="text-lg font-bold">{`${currency} ${getAmountReceived().toFixed(2)}`}</div>
                  <div className="text-[10px] mt-1">
                    Credits: {filteredTransactions.filter((t) => t.credit > 0).length}
                  </div>
                </CardContent>
              </Card>

              {/* Spends */}
              <Card className="bg-[#ef4444] text-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-xs">Spends</span>
                  </div>
                  <div className="text-lg font-bold">{`${currency} ${getSpends().toFixed(2)}`}</div>
                  <div className="text-[10px] mt-1">
                    Debits: {filteredTransactions.filter((t) => t.debit > 0).length}
                  </div>
                </CardContent>
              </Card>

              {/* Receivables - Keep original calculation as it's not transaction-based */}
              <Card className="bg-[#a855f7] text-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Receivables</span>
                  </div>
                  <div className="text-lg font-bold">
                    {`${currency} ${(financialData?.accountsReceivable || 0).toFixed(2)}`}
                  </div>
                  <div className="text-[10px] mt-1">{(financialData?.receivables || []).length} outstanding</div>
                </CardContent>
              </Card>

              {/* Payables - Keep original calculation as it's not transaction-based */}
              <Card className="bg-[#eab308] text-white">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Building className="h-4 w-4" />
                    <span className="text-xs">Payables</span>
                  </div>
                  <div className="text-lg font-bold">
                    {`${currency} ${(financialData?.accountsPayable || 0).toFixed(2)}`}
                  </div>
                  <div className="text-[10px] mt-1">{(financialData?.payables || []).length} outstanding</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
        <Tabs defaultValue="transactions" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              <TabsTrigger value="transactions" className="rounded-md">
                Transactions
              </TabsTrigger>
              <TabsTrigger value="receivables" className="rounded-md">
                Receivables
              </TabsTrigger>
              <TabsTrigger value="payables" className="rounded-md">
                Payables
              </TabsTrigger>
              <TabsTrigger value="summary" className="rounded-md">
                Summary
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="transactions" className="p-4">
            {isDataLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TransactionSkeleton key={i} />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No transactions found for the selected period
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((transaction) => {
                  const dateTime = formatDateTime(transaction.date)
                  const netImpact = getNetImpact(transaction)
                  const isPositive = netImpact >= 0

                  return (
                    <div
                      key={transaction.id}
                      className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {transaction.description || "No description"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              {dateTime.date} at {dateTime.time}
                              <span className="inline-flex gap-1">
                                {getStatusBadge(transaction.status)}
                                <Badge variant="outline" className="text-xs dark:border-gray-600 dark:text-gray-300">
                                  {transaction.type || "unknown"}
                                </Badge>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div className="text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Amount</div>
                              <div className="text-gray-900 dark:text-gray-100">
                                {currency} {transaction.amount.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {getNetImpact(transaction) >= 0 ? "Received" : "Spend"}
                              </div>
                              <div
                                className={
                                  getNetImpact(transaction) >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }
                              >
                                {currency}{" "}
                                {getNetImpact(transaction) >= 0
                                  ? transaction.received.toFixed(2)
                                  : Math.abs(getNetImpact(transaction)).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Cost</div>
                              <div className="text-orange-600 dark:text-orange-400">
                                {currency} {transaction.cost.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Credit/Debit</div>
                              <div className="text-blue-600 dark:text-blue-400">
                                {currency} {transaction.credit.toFixed(2)} / {currency} {transaction.debit.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="min-w-[120px] text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Net Impact</div>
                            <div
                              className={`font-bold ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                            >
                              {isPositive ? "" : "- "}
                              {currency} {Math.abs(netImpact).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="receivables" className="p-4">
            {isDataLoading ? (
              <TableSkeleton />
            ) : (financialData?.receivables || []).length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">No outstanding receivables</div>
            ) : (
              <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Sale ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Received
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Outstanding
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Sale Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {financialData?.receivables.map((receivable) => (
                      <tr key={receivable.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          #{receivable.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {receivable.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                          {currency} {receivable.total_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 text-right">
                          {currency} {receivable.received_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-medium text-right">
                          {currency} {receivable.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDateOnly(receivable.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={receivable.days_overdue > 30 ? "destructive" : "default"}>
                            {receivable.days_overdue > 0 ? `${receivable.days_overdue} days old` : "Current"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payables" className="p-4">
            {isDataLoading ? (
              <TableSkeleton />
            ) : (financialData?.payables || []).length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">No outstanding payables</div>
            ) : (
              <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Purchase ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Paid
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Outstanding
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Purchase Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {financialData?.payables.map((payable) => (
                      <tr key={payable.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          #{payable.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {payable.supplier_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                          {currency} {payable.total_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 text-right">
                          {currency} {payable.received_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400 font-medium text-right">
                          {currency} {payable.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDateOnly(payable.due_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={payable.days_overdue > 30 ? "destructive" : "default"}>
                            {payable.days_overdue > 0 ? `${payable.days_overdue} days old` : "Current"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="p-4">
            {isDataLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border dark:border-gray-700 rounded-lg p-4">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="flex justify-between items-center">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <React.Fragment>
                {/* Filter Summary */}
                {(filterType !== "all" || searchTerm) && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">📊 Filtered Data Summary</h4>
                    <div className="text-sm text-blue-700 dark:text-blue-400 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="font-medium">Total Transactions:</span> {filteredTransactions.length}
                      </div>
                      <div>
                        <span className="font-medium">Date Range:</span> {format(dateFrom, "MMM d")} -{" "}
                        {format(dateTo, "MMM d")}
                      </div>
                      {filterType !== "all" && (
                        <div>
                          <span className="font-medium">Filter:</span> {filterType}
                        </div>
                      )}
                      {searchTerm && (
                        <div>
                          <span className="font-medium">Search:</span> "{searchTerm}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            )}

            {/* Key Metrics Row - Updated to use filtered data */}
            {!isDataLoading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="border dark:border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredTransactions.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Filtered Transactions</div>
                </div>
                <div className="border dark:border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {
                      filteredTransactions.filter(
                        (t) => t.type === "sale" || t.description?.toLowerCase().startsWith("sale"),
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sales Transactions</div>
                </div>
                <div className="border dark:border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {
                      filteredTransactions.filter(
                        (t) => t.type === "purchase" || t.description?.toLowerCase().startsWith("purchase"),
                      ).length
                    }
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Purchase Transactions</div>
                </div>
                <div className="border dark:border-gray-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {getSalesTotal() > 0
                      ? (
                          getSalesTotal() /
                          Math.max(
                            1,
                            filteredTransactions.filter(
                              (t) => t.type === "sale" || t.description?.toLowerCase().startsWith("sale"),
                            ).length,
                          )
                        ).toFixed(2)
                      : "0.00"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Sale Value</div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Date Range Modal */}
      <Dialog open={isDateModalOpen} onOpenChange={setIsDateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="temp-date-from">From Date</Label>
              <SimpleDateInput
                id="temp-date-from"
                value={tempDateFrom}
                onDateChange={setTempDateFrom}
                placeholder="Start date"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="temp-date-to">To Date</Label>
              <SimpleDateInput
                id="temp-date-to"
                value={tempDateTo}
                onDateChange={setTempDateTo}
                placeholder="End date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyDateRange} className="bg-blue-600 hover:bg-blue-700">
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Transaction Dialog */}
      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Manual Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="manual-type">Transaction Type</Label>
              <Select value={manualType} onValueChange={(value: "debit" | "credit") => setManualType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit (Money Out)</SelectItem>
                  <SelectItem value="credit">Credit (Money In)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="manual-amount">Amount ({currency})</Label>
              <Input
                id="manual-amount"
                type="number"
                step="0.01"
                min="0"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="manual-category">Category</Label>
              <Input
                id="manual-category"
                value={manualCategory}
                onChange={(e) => setManualCategory(e.target.value)}
                placeholder="e.g., Office Supplies, Petty Cash"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="manual-description">Description (optional)</Label>
              <Textarea
                id="manual-description"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Enter transaction description"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="manual-payment-method">Payment Method</Label>
              <Select value={manualPaymentMethod} onValueChange={setManualPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="manual-date">Transaction Date</Label>
              <SimpleDateInput
                id="manual-date"
                value={manualDate}
                onDateChange={setManualDate}
                placeholder="Select date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddManualTransaction}
              disabled={isAddingManual}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAddingManual ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Transaction"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
