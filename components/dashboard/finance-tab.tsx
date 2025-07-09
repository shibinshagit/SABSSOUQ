"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import type React from "react"

import { Label } from "@/components/ui/label"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon,
  Plus,
  Trash2,
  Download,
  Search,
  BarChart4,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  CreditCard,
  Info,
  CheckCircle,
  AlertCircle,
  X,
  Package,
  TrendingUp,
  RefreshCw,
} from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import {
  getFinancialTransactions,
  addFinancialTransaction,
  addExpenseCategory,
  deleteFinancialTransaction,
  getBudgets,
  addBudget,
  deleteBudget,
} from "@/app/actions/finance-actions"
import { checkDatabaseHealth } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import FinanceChart from "@/components/finance/finance-chart"
import { exportTransactionsAsPDF } from "@/lib/export-utils"
import CategoryAutocomplete from "@/components/finance/category-autocomplete"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useAppSelector } from "@/store/hooks"
import { selectDeviceCurrency, selectDeviceId, selectCompanyId } from "@/store/slices/deviceSlice"

interface FinanceTabProps {
  userId: number
}

interface SummaryCardProps {
  title: string
  value: string
  icon: React.ReactNode
  subtitle?: string
}

interface DetailedSummaryCardProps {
  title: string
  value: string
  icon: React.ReactNode
  details: { label: string; value: string }[]
}

function SummaryCard({ title, value, icon, subtitle }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center mt-1">
          {icon}
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DetailedSummaryCard({ title, value, icon, details }: DetailedSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="mt-2 space-y-1">
          {details.map((detail, index) => (
            <div key={index} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{detail.label}</span>
              <span>{detail.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function FinanceTab({ userId }: FinanceTabProps) {
  // Get data from Redux instead of props
  const deviceId = useAppSelector(selectDeviceId)
  const companyId = useAppSelector(selectCompanyId) || 1
  const currency = useAppSelector(selectDeviceCurrency)

  // Add debugging
  console.log("Finance Tab - Redux values:", { deviceId, companyId, currency })

  const [transactions, setTransactions] = useState<any[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<{ isHealthy: boolean; message: string; mockMode: boolean } | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("all") // Changed from "today" to "all"
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [showReports, setShowReports] = useState(false)
  const [budgets, setBudgets] = useState<any[]>([])
  const [forceRefresh, setForceRefresh] = useState(0)
  const [cogs, setCogs] = useState<number>(0)

  // Add Expense Dialog
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [expenseDate, setExpenseDate] = useState<Date>(new Date())
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseCategory, setExpenseCategory] = useState("")
  const [expenseDescription, setExpenseDescription] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState("monthly")

  // Add Income Dialog
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false)
  const [incomeDate, setIncomeDate] = useState<Date>(new Date())
  const [incomeAmount, setIncomeAmount] = useState("")
  const [incomeCategory, setIncomeCategory] = useState("")
  const [incomeDescription, setIncomeDescription] = useState("")
  const [isIncomeRecurring, setIsIncomeRecurring] = useState(false)
  const [incomeRecurringFrequency, setIncomeRecurringFrequency] = useState("monthly")

  // Budget Dialog
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false)
  const [budgetCategory, setBudgetCategory] = useState("")
  const [budgetAmount, setBudgetAmount] = useState("")
  const [budgetPeriod, setBudgetPeriod] = useState("monthly")

  // Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null)
  const [transactionSourceToDelete, setTransactionSourceToDelete] = useState<string | null>(null)

  // Delete Budget Confirmation Dialog
  const [isDeleteBudgetDialogOpen, setIsDeleteBudgetDialogOpen] = useState(false)
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null)

  // Loading states
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [isAddingIncome, setIsAddingIncome] = useState(false)
  const [isAddingBudget, setIsAddingBudget] = useState(false)

  // Custom notification state
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "warning"
    message: string
  } | null>(null)

  // Date picker states for custom filtering
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>()
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>()
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)

  const { toast } = useToast()

  // Update the formatCurrency function to handle additional cases
  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(0)
    }

    // Just use the Intl.NumberFormat without adding the currency code separately
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  // Fetch transactions and categories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      // CRITICAL SECURITY CHECK: Verify all required IDs are present and valid
      // CRITICAL SECURITY CHECK: Verify deviceId is present and valid
      if (!deviceId || deviceId <= 0) {
        console.warn("Security Warning: Missing or invalid device ID in finance tab:", deviceId)
        setError("Data access limited: Missing device ID. Please refresh the page.")

        // Set empty data for security
        setTransactions([])
        setFilteredTransactions([])
        setCategories([
          { id: 1, name: "General" },
          { id: 2, name: "Utilities" },
          { id: 3, name: "Rent" },
          { id: 4, name: "Salaries" },
          { id: 5, name: "Marketing" },
          { id: 6, name: "Sales" },
          { id: 7, name: "Purchases" },
        ])
        setBudgets([])
        setIsLoading(false)
        return
      }

      console.log(
        `SECURITY: Finance Tab - Fetching data for Company ID: ${companyId}, Device ID: ${deviceId}, User ID: ${userId}`,
      )

      try {
        // Check database health
        const status = await checkDatabaseHealth()
        setDbStatus(status)

        if (!status.isHealthy) {
          toast({
            title: "Database Connection Issue",
            description: "Operating in offline mode. Some features may be limited.",
            variant: "destructive",
          })

          // Set empty data when database is unhealthy for security
          setTransactions([])
          setFilteredTransactions([])
          setCategories([
            { id: 1, name: "General" },
            { id: 2, name: "Utilities" },
            { id: 3, name: "Rent" },
            { id: 4, name: "Salaries" },
            { id: 5, name: "Marketing" },
            { id: 6, name: "Sales" },
            { id: 7, name: "Purchases" },
          ])
          setBudgets([])
          setIsLoading(false)
          return
        }

        console.log(`SECURITY: Fetching financial data for Company ID: ${companyId}, Device ID: ${deviceId}`)

        // Fetch transactions with STRICT filtering by company and device
        // NEW - calling with only deviceId
        const transactionsResult = await getFinancialTransactions(deviceId)
        if (transactionsResult.success) {
          const data = transactionsResult.data || []
          const cogsValue = transactionsResult.cogs || 0

          console.log(
            `SECURITY: Fetched ${data.length} transactions for Company ID ${companyId}, Device ID ${deviceId}`,
          )

          // Set COGS value
          setCogs(cogsValue)

          // SECURITY: Double-check that all returned transactions belong to this company/device
          const validTransactions = data.filter((transaction) => {
            // For manual transactions, check company_id or device_id
            if (transaction.source === "manual") {
              const isValid =
                (transaction.company_id && transaction.company_id === companyId) ||
                (transaction.device_id && transaction.device_id === deviceId) ||
                (!transaction.company_id && !transaction.device_id) // Allow transactions without filtering columns

              if (!isValid) {
                console.error(
                  `SECURITY WARNING: Manual transaction ${transaction.id} does not belong to Company ${companyId}/Device ${deviceId}`,
                )
              }
              return isValid
            }

            // For sale/purchase transactions, they're already validated in their respective queries
            // so we trust them if they come from those sources
            if (transaction.source === "sale" || transaction.source === "purchase") {
              return true
            }

            // For other transactions, be more lenient but log for monitoring
            console.log(`Transaction ${transaction.id} from source ${transaction.source} - allowing through`)
            return true
          })

          if (validTransactions.length !== data.length) {
            console.error(
              `SECURITY WARNING: Filtered out ${data.length - validTransactions.length} unauthorized transactions`,
            )
          }

          // Ensure all transactions have a category_name property
          const processedData = validTransactions.map((transaction) => ({
            ...transaction,
            category_name: transaction.category_name || transaction.transaction_name || "General",
            source: transaction.source || "manual",
          }))

          setTransactions(processedData)
          console.log("DEBUG: Fetched transactions:", processedData.length, processedData.slice(0, 3))
          console.log("DEBUG: Date filter:", dateFilter)
          setFilteredTransactions(processedData)
        } else {
          setError(transactionsResult.message || "Failed to load transactions")
          // Set empty data for security
          setTransactions([])
          setFilteredTransactions([])
        }

        // Remove the getAllCategories API call and extract categories from data
        const categoriesResult = [
          ...new Set([
            ...transactions.map((t) => t.category_name || t.transaction_name || "General"),
            "Sales",
            "Purchases",
            "General",
            "Utilities",
            "Rent",
            "Salaries",
            "Marketing",
          ]),
        ].map((name, index) => ({ id: index + 1, name }))

        setCategories(categoriesResult)

        // Fetch budgets with STRICT filtering
        const budgetsResult = await getBudgets(companyId, deviceId)
        if (budgetsResult.success) {
          console.log(
            `SECURITY: Fetched ${budgetsResult.data?.length} budgets for Company ID ${companyId}, Device ID ${deviceId}`,
          )
          setBudgets(budgetsResult.data || [])
        } else {
          console.error("Failed to load budgets:", budgetsResult.message)
          setBudgets([])
        }

        // Get device currency
        // try {
        //   const deviceCurrency = await getDeviceCurrency(userId)
        //   setCurrency(deviceCurrency)
        // } catch (error) {
        //   console.error("Error fetching device currency:", error)
        // }
      } catch (error) {
        console.error("Error fetching finance data:", error)
        setError("An error occurred while loading finance data")

        // Set empty data for security
        setTransactions([])
        setFilteredTransactions([])
        setCategories([
          { id: 1, name: "General" },
          { id: 2, name: "Utilities" },
          { id: 3, name: "Rent" },
          { id: 4, name: "Salaries" },
          { id: 5, name: "Marketing" },
          { id: 6, name: "Sales" },
          { id: 7, name: "Purchases" },
          { id: 8, name: "Services" },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [companyId, toast, userId, forceRefresh, deviceId, currency])

  // Add state for filtered summary totals
  const [filteredSummary, setFilteredSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSales: 0,
    totalPurchases: 0,
    cogs: 0,
  })

  // Filter transactions based on search, date, category, source, and tab
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    console.log(
      "DEBUG: Filtering - transactions:",
      transactions.length,
      "dateFilter:",
      dateFilter,
      "activeTab:",
      activeTab,
    )
    let filtered = [...transactions]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          (t.description && t.description.toLowerCase().includes(query)) ||
          (t.category_name && t.category_name.toLowerCase().includes(query)) ||
          (t.transaction_name && t.transaction_name.toLowerCase().includes(query)),
      )
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date()
      let startDate, endDate

      switch (dateFilter) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          break
        case "thisMonth":
          startDate = startOfMonth(now)
          endDate = endOfMonth(now)
          break
        case "lastMonth":
          startDate = startOfMonth(subMonths(now, 1))
          endDate = endOfMonth(subMonths(now, 1))
          break
        case "last3Months":
          startDate = startOfMonth(subMonths(now, 3))
          endDate = endOfMonth(now)
          break
        case "custom":
          if (customDateFrom && customDateTo) {
            startDate = customDateFrom
            endDate = new Date(customDateTo.getTime() + 24 * 60 * 60 * 1000 - 1) // End of day
          } else {
            startDate = new Date(0)
            endDate = new Date()
          }
          break
        default:
          startDate = new Date(0)
          endDate = new Date()
      }

      filtered = filtered.filter((t) => {
        if (!t.transaction_date) return false
        const transactionDate = new Date(t.transaction_date)
        return isWithinInterval(transactionDate, { start: startDate, end: endDate })
      })
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => {
        const transactionCategory = (t.category_name || t.transaction_name || "General").toLowerCase()
        return (
          transactionCategory.includes(categoryFilter.toLowerCase()) ||
          categoryFilter.toLowerCase().includes(transactionCategory)
        )
      })
    }

    // Filter by source
    if (sourceFilter !== "all") {
      filtered = filtered.filter((t) => t.source === sourceFilter)
    }

    // Filter by transaction type (tab)
    if (activeTab !== "all") {
      filtered = filtered.filter((t) => t.transaction_type === activeTab)
    }

    setFilteredTransactions(filtered)

    // Calculate filtered summary totals
    const filteredTotalIncome = filtered
      .filter((t) => t.transaction_type === "income" && t.source === "manual")
      .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

    const filteredTotalExpenses = filtered
      .filter((t) => t.transaction_type === "expense" && t.source === "manual")
      .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

    const filteredTotalSales = filtered
      .filter((t) => t.source === "sale")
      .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

    const filteredTotalPurchases = filtered
      .filter((t) => t.source === "purchase")
      .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

    // Calculate COGS for filtered data (if needed, or use the global cogs)
    const filteredCogs =
      dateFilter === "all"
        ? cogs
        : filtered
            .filter((t) => t.source === "purchase")
            .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

    setFilteredSummary({
      totalIncome: filteredTotalIncome,
      totalExpenses: filteredTotalExpenses,
      totalSales: filteredTotalSales,
      totalPurchases: filteredTotalPurchases,
      cogs: filteredCogs,
    })
  }, [
    transactions,
    searchQuery,
    dateFilter,
    categoryFilter,
    sourceFilter,
    categories,
    customDateFrom,
    customDateTo,
    currency,
    cogs,
    activeTab,
  ])

  // Handle adding a new expense
  const handleAddExpense = async () => {
    if (!expenseAmount) {
      setNotification({
        type: "error",
        message: "Please fill in the amount field",
      })
      return
    }

    // CRITICAL SECURITY CHECK: Verify all required IDs before adding expense
    const securityErrors = []

    if (!companyId || companyId <= 0) {
      securityErrors.push("company ID")
    }

    if (!deviceId || deviceId <= 0) {
      securityErrors.push("device ID")
    }

    if (!userId || userId <= 0) {
      securityErrors.push("user ID")
    }

    if (securityErrors.length > 0) {
      const missingItems = securityErrors.join(", ")
      console.error(`SECURITY ERROR: Missing ${missingItems} when adding expense`)
      setNotification({
        type: "error",
        message: `Cannot add expense: Missing ${missingItems}`,
      })
      return
    }

    setIsAddingExpense(true)

    try {
      // Add the category if it doesn't exist
      let categoryId = null
      if (expenseCategory && !categories.some((c) => c.name.toLowerCase() === expenseCategory.toLowerCase())) {
        try {
          const result = await addExpenseCategory({
            name: expenseCategory,
            company_id: companyId,
            device_id: deviceId,
            created_by: userId,
          })

          if (result.success && result.data) {
            setCategories([...categories, result.data])
            categoryId = result.data.id
          }
        } catch (error) {
          console.error("Error adding category:", error)
          setNotification({
            type: "warning",
            message: "Could not add new category, but will continue with the transaction",
          })
        }
      }

      console.log(`SECURITY: Adding expense for Company ID: ${companyId}, Device ID: ${deviceId}, User ID: ${userId}`)

      const result = await addFinancialTransaction(
        {
          amount: expenseAmount,
          transaction_date: expenseDate.toISOString(),
          description: expenseDescription,
          transaction_type: "expense",
          company_id: companyId,
          device_id: deviceId,
          created_by: userId,
          transaction_name: expenseCategory || "General",
          category_name: expenseCategory || "General",
          source: "manual",
        },
        deviceId,
      )

      if (result.success) {
        setNotification({
          type: "success",
          message: "Expense added successfully",
        })

        // Process and update transactions
        const processedData = {
          ...result.data,
          category_name: result.data.category_name || expenseCategory || "General",
          source: "manual",
        }

        setTransactions([processedData, ...transactions])
        resetExpenseForm()
        setIsAddExpenseOpen(false)

        // Refresh budgets
        try {
          const budgetsResult = await getBudgets(companyId, deviceId)
          if (budgetsResult.success) {
            setBudgets(budgetsResult.data || [])
          }
        } catch (error) {
          console.error("Error refreshing budgets:", error)
        }

        if (isRecurring) {
          setNotification({
            type: "success",
            message: `Recurring expense set to repeat ${recurringFrequency}`,
          })
        }
      } else {
        setNotification({
          type: "error",
          message: result.message || "Failed to add expense",
        })
      }
    } catch (error) {
      console.error("Add expense error:", error)
      setNotification({
        type: "error",
        message: "An unexpected error occurred",
      })
    } finally {
      setIsAddingExpense(false)
    }
  }

  // Handle adding a new income
  const handleAddIncome = async () => {
    if (!incomeAmount) {
      setNotification({
        type: "error",
        message: "Please fill in the amount field",
      })
      return
    }

    // Security checks...
    const securityErrors = []
    if (!companyId || companyId <= 0) {
      securityErrors.push("company ID")
    }
    if (!deviceId || deviceId <= 0) {
      securityErrors.push("device ID")
    }
    if (!userId || userId <= 0) {
      securityErrors.push("user ID")
    }

    if (securityErrors.length > 0) {
      const missingItems = securityErrors.join(", ")
      console.error(`SECURITY ERROR: Missing ${missingItems} when adding income`)
      setNotification({
        type: "error",
        message: `Cannot add income: Missing ${missingItems}`,
      })
      return
    }

    setIsAddingIncome(true)

    try {
      // Add the category if it doesn't exist
      let categoryId = null
      if (incomeCategory && !categories.some((c) => c.name.toLowerCase() === incomeCategory.toLowerCase())) {
        try {
          const result = await addExpenseCategory({
            name: incomeCategory,
            company_id: companyId,
            device_id: deviceId,
            created_by: userId,
          })

          if (result.success && result.data) {
            setCategories([...categories, result.data])
            categoryId = result.data.id
          }
        } catch (error) {
          console.error("Error adding category:", error)
          setNotification({
            type: "warning",
            message: "Could not add new category, but will continue with the transaction",
          })
        }
      }

      console.log(`SECURITY: Adding income for Company ID: ${companyId}, Device ID: ${deviceId}, User ID: ${userId}`)

      const result = await addFinancialTransaction(
        {
          amount: incomeAmount,
          transaction_date: incomeDate.toISOString(),
          description: incomeDescription,
          transaction_type: "income",
          company_id: companyId,
          device_id: deviceId,
          created_by: userId,
          transaction_name: incomeCategory || "General",
          category_name: incomeCategory || "General",
          source: "manual",
        },
        deviceId,
      )

      if (result.success) {
        setNotification({
          type: "success",
          message: "Income added successfully",
        })

        const processedData = {
          ...result.data,
          category_name: result.data.category_name || incomeCategory || "General",
          source: "manual",
        }

        setTransactions([processedData, ...transactions])
        resetIncomeForm()
        setIsAddIncomeOpen(false)

        if (isIncomeRecurring) {
          setNotification({
            type: "success",
            message: `Recurring income set to repeat ${incomeRecurringFrequency}`,
          })
        }
      } else {
        setNotification({
          type: "error",
          message: result.message || "Failed to add income",
        })
      }
    } catch (error) {
      console.error("Add income error:", error)
      setNotification({
        type: "error",
        message: "An unexpected error occurred",
      })
    } finally {
      setIsAddingIncome(false)
    }
  }

  // Handle adding a new budget
  const handleAddBudget = async () => {
    if (!budgetCategory || !budgetAmount) {
      setNotification({
        type: "error",
        message: "Please fill in all required fields",
      })
      return
    }

    // Security checks...
    const securityErrors = []
    if (!companyId || companyId <= 0) {
      securityErrors.push("company ID")
    }
    if (!deviceId || deviceId <= 0) {
      securityErrors.push("device ID")
    }
    if (!userId || userId <= 0) {
      securityErrors.push("user ID")
    }

    if (securityErrors.length > 0) {
      const missingItems = securityErrors.join(", ")
      console.error(`SECURITY ERROR: Missing ${missingItems} when adding budget`)
      setNotification({
        type: "error",
        message: `Cannot add budget: Missing ${missingItems}`,
      })
      return
    }

    setIsAddingBudget(true)

    try {
      const categoryObj = categories.find((c) => c.name.toLowerCase() === budgetCategory.toLowerCase())
      const categoryId = categoryObj ? categoryObj.id : null

      console.log(`SECURITY: Adding budget for Company ID: ${companyId}, Device ID: ${deviceId}, User ID: ${userId}`)

      const result = await addBudget({
        category_id: categoryId,
        category_name: budgetCategory,
        amount: Number(budgetAmount),
        period: budgetPeriod,
        company_id: companyId,
        device_id: deviceId,
        created_by: userId,
      })

      if (result.success) {
        setNotification({
          type: "success",
          message: result.message || "Budget added successfully",
        })

        const budgetsResult = await getBudgets(companyId, deviceId)
        if (budgetsResult.success) {
          setBudgets(budgetsResult.data || [])
        }

        setIsBudgetDialogOpen(false)
        setBudgetCategory("")
        setBudgetAmount("")
        setBudgetPeriod("monthly")
      } else {
        setNotification({
          type: "error",
          message: result.message || "Failed to add budget",
        })
      }
    } catch (error) {
      console.error("Add budget error:", error)
      setNotification({
        type: "error",
        message: "An unexpected error occurred",
      })
    } finally {
      setIsAddingBudget(false)
    }
  }

  // Handle deleting a transaction
  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return

    try {
      // Only manual transactions can be deleted
      if (transactionSourceToDelete !== "manual") {
        toast({
          title: "Cannot Delete",
          description: `This ${
            transactionSourceToDelete === "sale" ? "sale" : "purchase"
          } transaction cannot be deleted directly. Please delete it from the ${
            transactionSourceToDelete === "sale" ? "Sales" : "Purchases"
          } tab.`,
          variant: "destructive",
        })
        setIsDeleteDialogOpen(false)
        setTransactionToDelete(null)
        setTransactionSourceToDelete(null)
        return
      }

      const result = await deleteFinancialTransaction(transactionToDelete)

      if (result.success) {
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
        })
        setTransactions(transactions.filter((t) => t.id !== transactionToDelete))
        setIsDeleteDialogOpen(false)
        setTransactionToDelete(null)
        setTransactionSourceToDelete(null)

        // Refresh budgets to reflect the deleted transaction
        try {
          const budgetsResult = await getBudgets(companyId || 1, deviceId)
          if (budgetsResult.success) {
            setBudgets(budgetsResult.data || [])
          }
        } catch (error) {
          console.error("Error refreshing budgets:", error)
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete transaction",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete transaction error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Handle deleting a budget
  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return

    try {
      const result = await deleteBudget(budgetToDelete)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Budget deleted successfully",
        })
        setBudgets(budgets.filter((b) => b.id !== budgetToDelete))
        setIsDeleteBudgetDialogOpen(false)
        setBudgetToDelete(null)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete budget",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete budget error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  // Handle exporting financial data
  const handleExportData = () => {
    // Filter transactions based on date range
    const dataToExport = [...filteredTransactions]

    // Generate filename with date
    const dateStr = format(new Date(), "yyyy-MM-dd")
    const filename = `financial_transactions_${dateStr}`

    // Export based on selected format
    try {
      exportTransactionsAsPDF(filteredTransactions, `${filename}.pdf`)

      toast({
        title: "Export Complete",
        description: "Your financial data has been exported successfully.",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Error",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      })
    }
  }

  // Reset expense form
  const resetExpenseForm = () => {
    setExpenseDate(new Date())
    setExpenseAmount("")
    setExpenseCategory("")
    setExpenseDescription("")
    setIsRecurring(false)
    setRecurringFrequency("monthly")
  }

  // Reset income form
  const resetIncomeForm = () => {
    setIncomeDate(new Date())
    setIncomeAmount("")
    setIncomeCategory("")
    setIncomeDescription("")
    setIsIncomeRecurring(false)
    setIncomeRecurringFrequency("monthly")
  }

  // Calculate total income and expenses
  const totalIncome = transactions
    .filter((t) => t.transaction_type === "income" && t.source === "manual")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

  const totalExpenses = transactions
    .filter((t) => t.transaction_type === "expense" && t.source === "manual")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

  // Calculate total sales and purchases
  const totalSales = transactions
    .filter((t) => t.source === "sale")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

  const totalPurchases = transactions
    .filter((t) => t.source === "purchase")
    .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

  // Calculate monthly values
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyIncome = transactions
    .filter((t) => {
      if (!t.transaction_date) return false
      const date = new Date(t.transaction_date)
      return (
        t.transaction_type === "income" &&
        t.source === "manual" &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      )
    })
    .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

  const monthlyExpenses = transactions
    .filter((t) => {
      if (!t.transaction_date) return false
      const date = new Date(t.transaction_date)
      return (
        t.transaction_type === "expense" &&
        t.source === "manual" &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      )
    })
    .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

  const monthlySales = transactions
    .filter((t) => {
      if (!t.transaction_date) return false
      const date = new Date(t.transaction_date)
      return t.source === "sale" && date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

  const monthlyPurchases = transactions
    .filter((t) => {
      if (!t.transaction_date) return false
      const date = new Date(t.transaction_date)
      return t.source === "purchase" && date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

  // Calculate expenses by category for the current month
  const expensesByCategory = useMemo(() => {
    const categoryMap = new Map()

    transactions
      .filter((t) => {
        if (!t.transaction_date) return false
        const date = new Date(t.transaction_date)
        return (
          t.transaction_type === "expense" && date.getMonth() === currentMonth && date.getFullYear() === currentYear
        )
      })
      .forEach((t) => {
        const categoryName = t.category_name || t.transaction_name || "Uncategorized"
        const amount = Number.parseFloat(t.amount || "0")

        if (categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, categoryMap.get(categoryName) + amount)
        } else {
          categoryMap.set(categoryName, amount)
        }
      })

    return Array.from(categoryMap.entries()).map(([name, amount]) => ({ name, amount }))
  }, [transactions, currentMonth, currentYear])

  // Prepare chart data
  const monthlyIncomeChartData = useMemo(() => {
    // Get last 6 months
    const months = []
    const values = []

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthName = format(date, "MMM")
      const monthNum = date.getMonth()
      const year = date.getFullYear()

      months.push(monthName)

      // Calculate income for this month (manual income only)
      const income = transactions
        .filter((t) => {
          if (!t.transaction_date) return false
          const tDate = new Date(t.transaction_date)
          return (
            t.transaction_type === "income" &&
            t.source === "manual" &&
            tDate.getMonth() === monthNum &&
            tDate.getFullYear() === year
          )
        })
        .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

      values.push(income)
    }

    return { labels: months, values }
  }, [transactions])

  // Monthly expenses chart data
  const monthlyExpensesChartData = useMemo(() => {
    // Get last 6 months
    const months = []
    const values = []

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthName = format(date, "MMM")
      const monthNum = date.getMonth()
      const year = date.getFullYear()

      months.push(monthName)

      // Calculate expenses for this month (manual expenses only)
      const expenses = transactions
        .filter((t) => {
          if (!t.transaction_date) return false
          const tDate = new Date(t.transaction_date)
          return (
            t.transaction_type === "expense" &&
            t.source === "manual" &&
            tDate.getMonth() === monthNum &&
            tDate.getFullYear() === year
          )
        })
        .reduce((sum, t) => sum + Number.parseFloat(t.amount || "0"), 0)

      values.push(expenses)
    }

    return { labels: months, values }
  }, [transactions])

  // Expenses by category chart data
  const expensesByCategoryChartData = useMemo(() => {
    const labels = expensesByCategory.map((c) => c.name)
    const values = expensesByCategory.map((c) => c.amount)

    return { labels, values }
  }, [expensesByCategory])

  // Get source icon and color
  const getSourceInfo = (source: string) => {
    switch (source) {
      case "sale":
        return { icon: <CreditCard className="h-3 w-3" />, color: "bg-green-100 text-green-800", label: "Sale" }
      case "purchase":
        return { icon: <ShoppingCart className="h-3 w-3" />, color: "bg-blue-100 text-blue-800", label: "Purchase" }
      default:
        return { icon: null, color: "bg-gray-100 text-gray-800", label: "Manual" }
    }
  }

  return (
    <div className="space-y-6">
      {/* Security Status Display */}
      {(!companyId || !deviceId || !userId) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <Info className="h-5 w-5" />
              <span className="font-medium">Security Warning:</span>
              <span>Missing required authentication parameters. Data access restricted.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DetailedSummaryCard
          title="Total Income"
          value={formatCurrency(filteredSummary.totalSales + filteredSummary.totalIncome)}
          icon={<ArrowUpRight className="h-6 w-6 text-green-500" />}
          details={[
            { label: "Sales", value: formatCurrency(filteredSummary.totalSales) },
            { label: "Manual Income", value: formatCurrency(filteredSummary.totalIncome) },
          ]}
        />
        <DetailedSummaryCard
          title="Total Expenses"
          value={formatCurrency(filteredSummary.totalPurchases + filteredSummary.totalExpenses)}
          icon={<ArrowDownRight className="h-6 w-6 text-red-500" />}
          details={[
            { label: "Purchases", value: formatCurrency(filteredSummary.totalPurchases) },
            { label: "Manual Expenses", value: formatCurrency(filteredSummary.totalExpenses) },
          ]}
        />
        <SummaryCard
          title="COGS"
          value={formatCurrency(cogs)}
          icon={<Package className="h-6 w-6 text-orange-500" />}
          subtitle="Cost of Goods Sold"
        />
        <SummaryCard
          title="Net Profit"
          value={formatCurrency(
            filteredSummary.totalSales -
              cogs +
              filteredSummary.totalIncome -
              (filteredSummary.totalPurchases + filteredSummary.totalExpenses),
          )}
          icon={<TrendingUp className="h-6 w-6 text-purple-500" />}
          subtitle="(Sales - COGS) + Manual Income - Total Expenses"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setIsAddIncomeOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-1 h-4 w-4" /> Add Income
        </Button>
        <Button onClick={() => setIsAddExpenseOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-1 h-4 w-4" /> Add Expense
        </Button>
        <Button onClick={() => setIsBudgetDialogOpen(true)} variant="outline">
          <Wallet className="mr-1 h-4 w-4" /> Manage Budgets
        </Button>
        <Button onClick={() => setShowReports(!showReports)} variant="outline">
          <BarChart4 className="mr-1 h-4 w-4" /> {showReports ? "Hide Reports" : "Show Reports"}
        </Button>
      </div>

      {/* Financial Reports */}
      {showReports && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Reports</CardTitle>
            <CardDescription>Overview of your financial performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="monthly">
              <TabsList className="mb-4">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="category">By Category</TabsTrigger>
                <TabsTrigger value="budgets">Budgets</TabsTrigger>
              </TabsList>

              <TabsContent value="monthly" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Monthly Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-green-600">{formatCurrency(monthlyIncome)}</div>
                      <div className="h-40 mt-4">
                        <FinanceChart data={monthlyIncomeChartData} type="bar" height={160} currency={currency} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Monthly Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-red-600">{formatCurrency(monthlyExpenses)}</div>
                      <div className="h-40 mt-4">
                        <FinanceChart data={monthlyExpensesChartData} type="bar" height={160} currency={currency} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="category" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Expenses by Category (This Month)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expensesByCategory.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground">No expense data for this month</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Further reduced height for pie chart to prevent overflow */}
                        <div className="h-[120px] w-full overflow-hidden">
                          <FinanceChart
                            data={expensesByCategoryChartData}
                            type="pie"
                            height={120}
                            currency={currency}
                          />
                        </div>
                        <div className="space-y-2 mt-4">
                          {expensesByCategory.map((category, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full bg-blue-${((index % 5) + 1) * 100 + 300}`}></div>
                                <span>{category.name}</span>
                              </div>
                              <span className="font-medium">{formatCurrency(category.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="budgets" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {budgets.map((budget) => {
                    const percentage = (budget.spent / budget.amount) * 100
                    return (
                      <Card key={budget.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-sm">{budget.category_name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={percentage > 90 ? "destructive" : percentage > 75 ? "outline" : "secondary"}
                              >
                                {budget.period}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setBudgetToDelete(budget.id)
                                  setIsDeleteBudgetDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">{formatCurrency(budget.spent)}</span>
                            <span className="text-sm">{formatCurrency(budget.amount)}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                percentage > 90 ? "bg-red-600" : percentage > 75 ? "bg-yellow-500" : "bg-green-600"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {percentage > 100
                              ? `Over budget by ${formatCurrency(budget.spent - budget.amount)}`
                              : `${formatCurrency(budget.amount - budget.spent)} remaining`}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Transactions</CardTitle>
              <CardDescription>Manage your income and expenses</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="sale">Sales</SelectItem>
                    <SelectItem value="purchase">Purchases</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name.toLowerCase()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                value={dateFilter}
                onValueChange={(value) => {
                  setDateFilter(value)
                  if (value === "custom") {
                    setShowCustomDatePicker(true)
                  } else {
                    setShowCustomDatePicker(false)
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="last3Months">Last 3 Months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setDateFilter("all")
                  setCategoryFilter("all")
                  setSourceFilter("all")
                  setCustomDateFrom(undefined)
                  setCustomDateTo(undefined)
                  setShowCustomDatePicker(false)
                }}
              >
                Clear Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Simple PDF export without dialog
                  const printWindow = window.open("", "_blank")
                  if (printWindow) {
                    const htmlContent = `
                      <html>
                        <head>
                          <title>Financial Transactions Report</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            h1 { color: #333; margin-bottom: 20px; }
                            .summary { margin-bottom: 30px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                            .summary-title { font-weight: bold; margin-bottom: 5px; }
                            .summary-value { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                            .summary-details { font-size: 14px; color: #666; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th { background-color: #f2f2f2; text-align: left; padding: 12px; border: 1px solid #ddd; }
                            td { padding: 12px; border: 1px solid #ddd; }
                            tr:nth-child(even) { background-color: #f9f9f9; }
                            .income { color: #16a34a; }
                            .expense { color: #dc2626; }
                            @media print { button { display: none; } }
                          </style>
                        </head>
                        <body>
                          <h1>Financial Transactions Report</h1>
                          <p>Generated on: ${format(new Date(), "PPP")}</p>
                          
                          <div class="summary">
                            <div class="summary-card">
                              <div class="summary-title">Total Income</div>
                              <div class="summary-value">${formatCurrency(filteredSummary.totalSales + filteredSummary.totalIncome)}</div>
                              <div class="summary-details">
                                Sales: ${formatCurrency(filteredSummary.totalSales)}<br>
                                Manual Income: ${formatCurrency(filteredSummary.totalIncome)}
                              </div>
                            </div>
                            <div class="summary-card">
                              <div class="summary-title">Total Expenses</div>
                              <div class="summary-value">${formatCurrency(filteredSummary.totalPurchases + filteredSummary.totalExpenses)}</div>
                              <div class="summary-details">
                                Purchases: ${formatCurrency(filteredSummary.totalPurchases)}<br>
                                Manual Expenses: ${formatCurrency(filteredSummary.totalExpenses)}
                              </div>
                            </div>
                            <div class="summary-card">
                              <div class="summary-title">COGS</div>
                              <div class="summary-value">${formatCurrency(cogs)}</div>
                              <div class="summary-details">Cost of Goods Sold</div>
                            </div>
                            <div class="summary-card">
                              <div class="summary-title">Net Profit</div>
                              <div class="summary-value">${formatCurrency(filteredSummary.totalSales - cogs + filteredSummary.totalIncome - (filteredSummary.totalPurchases + filteredSummary.totalExpenses))}</div>
                              <div class="summary-details">(Sales - COGS) + Manual Income - Total Expenses</div>
                            </div>
                          </div>

                          <table>
                            <tr>
                              <th>Date</th>
                              <th>Type</th>
                              <th>Category</th>
                              <th>Description</th>
                              <th>Amount</th>
                              <th>Source</th>
                            </tr>
                            ${filteredTransactions
                              .map(
                                (transaction) => `
                              <tr>
                                <td>${transaction.transaction_date ? format(new Date(transaction.transaction_date), "MMM d, yyyy") : "N/A"}</td>
                                <td class="${transaction.transaction_type}">${transaction.transaction_type === "income" ? "Income" : "Expense"}</td>
                                <td>${transaction.category_name || transaction.transaction_name || "General"}</td>
                                <td>${transaction.description || "No description"}</td>
                                <td class="${transaction.transaction_type}">
                                  ${transaction.transaction_type === "income" ? "+" : "-"} ${formatCurrency(Number.parseFloat(transaction.amount || "0"))}
                                </td>
                                <td>${transaction.source === "manual" ? "Manual" : transaction.source === "sale" ? "Sale" : "Purchase"}</td>
                              </tr>
                            `,
                              )
                              .join("")}
                          </table>
                          
                          <button onclick="window.print(); window.close();" style="margin-top: 20px; padding: 10px 15px; background-color: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Print Report
                          </button>
                        </body>
                      </html>
                    `
                    printWindow.document.write(htmlContent)
                    printWindow.document.close()
                  }
                }}
              >
                <Download className="mr-1 h-4 w-4" /> Export to PDF
              </Button>
            </div>
          </div>

          {showCustomDatePicker && (
            <div className="flex items-center gap-2 p-2 border rounded-md bg-background">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[120px] justify-start text-left font-normal text-xs",
                        !customDateFrom && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {customDateFrom ? format(customDateFrom, "MMM d") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[120px] justify-start text-left font-normal text-xs",
                        !customDateTo && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {customDateTo ? format(customDateTo, "MMM d") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expense">Expense</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-4">Loading transactions...</div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">{error}</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No transactions found</div>
              ) : (
                <div className="border rounded-md">
                  <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-3">Description</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-1"></div>
                  </div>

                  {filteredTransactions.map((transaction) => {
                    const sourceInfo = getSourceInfo(transaction.source)
                    return (
                      <div
                        key={`${transaction.id}-${transaction.source}`}
                        className="grid grid-cols-12 gap-2 p-3 border-t"
                      >
                        <div className="col-span-2">
                          {transaction.transaction_date
                            ? format(new Date(transaction.transaction_date), "MMM d, yyyy")
                            : "N/A"}
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                transaction.transaction_type === "income"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {transaction.transaction_type === "income" ? "Income" : "Expense"}
                            </span>
                            {transaction.source !== "manual" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${sourceInfo.color}`}
                                    >
                                      {sourceInfo.icon}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>From {sourceInfo.label}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                        <div className="col-span-2">
                          {transaction.category_name || transaction.transaction_name || "General"}
                        </div>
                        <div className="col-span-3">{transaction.description || "No description"}</div>
                        <div
                          className={`col-span-2 font-medium ${
                            transaction.transaction_type === "income" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {transaction.transaction_type === "income" ? "+" : "-"}{" "}
                          {formatCurrency(Number.parseFloat(transaction.amount || "0"))}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {transaction.source === "manual" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setTransactionToDelete(transaction.id)
                                setTransactionSourceToDelete(transaction.source)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Info className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    This transaction is from a {transaction.source}. To delete it, go to the{" "}
                                    {transaction.source === "sale" ? "Sales" : "Purchases"} tab.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="income" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-4">Loading transactions...</div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">{error}</div>
              ) : filteredTransactions.filter((t) => t.transaction_type === "income").length === 0 ? (
                <div className="text-center py-4 text-gray-500">No income transactions found</div>
              ) : (
                <div className="border rounded-md">
                  <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Source</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-3">Description</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-1"></div>
                  </div>

                  {filteredTransactions
                    .filter((t) => t.transaction_type === "income")
                    .map((transaction) => {
                      const sourceInfo = getSourceInfo(transaction.source)
                      return (
                        <div
                          key={`${transaction.id}-${transaction.source}`}
                          className="grid grid-cols-12 gap-2 p-3 border-t"
                        >
                          <div className="col-span-2">
                            {transaction.transaction_date
                              ? format(new Date(transaction.transaction_date), "MMM d, yyyy")
                              : "N/A"}
                          </div>
                          <div className="col-span-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sourceInfo.color}`}
                            >
                              {sourceInfo.icon && <span className="mr-1">{sourceInfo.icon}</span>}
                              {sourceInfo.label}
                            </span>
                          </div>
                          <div className="col-span-2">
                            {transaction.category_name || transaction.transaction_name || "General"}
                          </div>
                          <div className="col-span-3">{transaction.description || "No description"}</div>
                          <div className="col-span-2 font-medium text-green-600">
                            + {formatCurrency(Number.parseFloat(transaction.amount || "0"))}
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {transaction.source === "manual" ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setTransactionToDelete(transaction.id)
                                  setTransactionSourceToDelete(transaction.source)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Info className="h-4 w-4 text-gray-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      This transaction is from a {transaction.source}. To delete it, go to the{" "}
                                      {transaction.source === "sale" ? "Sales" : "Purchases"} tab.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="expense" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-4">Loading transactions...</div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">{error}</div>
              ) : filteredTransactions.filter((t) => t.transaction_type === "expense").length === 0 ? (
                <div className="text-center py-4 text-gray-500">No expense transactions found</div>
              ) : (
                <div className="border rounded-md">
                  <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Source</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-3">Description</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-1"></div>
                  </div>

                  {filteredTransactions
                    .filter((t) => t.transaction_type === "expense")
                    .map((transaction) => {
                      const sourceInfo = getSourceInfo(transaction.source)
                      return (
                        <div
                          key={`${transaction.id}-${transaction.source}`}
                          className="grid grid-cols-12 gap-2 p-3 border-t"
                        >
                          <div className="col-span-2">
                            {transaction.transaction_date
                              ? format(new Date(transaction.transaction_date), "MMM d, yyyy")
                              : "N/A"}
                          </div>
                          <div className="col-span-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sourceInfo.color}`}
                            >
                              {sourceInfo.icon && <span className="mr-1">{sourceInfo.icon}</span>}
                              {sourceInfo.label}
                            </span>
                          </div>
                          <div className="col-span-2">
                            {transaction.category_name || transaction.transaction_name || "General"}
                          </div>
                          <div className="col-span-3">{transaction.description || "No description"}</div>
                          <div className="col-span-2 font-medium text-red-600">
                            - {formatCurrency(Number.parseFloat(transaction.amount || "0"))}
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {transaction.source === "manual" ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setTransactionToDelete(transaction.id)
                                  setTransactionSourceToDelete(transaction.source)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Info className="h-4 w-4 text-gray-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      This transaction is from a {transaction.source}. To delete it, go to the{" "}
                                      {transaction.source === "sale" ? "Sales" : "Purchases"} tab.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </CardFooter>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={(open) => !open && setIsAddExpenseOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="expense-date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="expense-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expenseDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expenseDate ? format(expenseDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expenseDate}
                    onSelect={(date) => date && setExpenseDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-category">Category</Label>
              <CategoryAutocomplete
                value={expenseCategory}
                onChange={setExpenseCategory}
                categories={categories}
                placeholder="Enter category"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-amount">Amount ({currency})</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expense-description">Description</Label>
              <Textarea
                id="expense-description"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recurring-expense"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="recurring-expense" className="text-sm font-normal">
                This is a recurring expense
              </Label>
            </div>

            {isRecurring && (
              <div className="grid gap-2">
                <Label htmlFor="recurring-frequency">Frequency</Label>
                <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
                  <SelectTrigger id="recurring-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)} disabled={isAddingExpense}>
              Cancel
            </Button>
            <Button onClick={handleAddExpense} disabled={isAddingExpense}>
              {isAddingExpense ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Expense"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Income Dialog */}
      <Dialog open={isAddIncomeOpen} onOpenChange={(open) => !open && setIsAddIncomeOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="income-date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="income-date"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !incomeDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {incomeDate ? format(incomeDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={incomeDate}
                    onSelect={(date) => date && setIncomeDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="income-category">Category</Label>
              <CategoryAutocomplete
                value={incomeCategory}
                onChange={setIncomeCategory}
                categories={categories}
                placeholder="Enter category"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="income-amount">Amount ({currency})</Label>
              <Input
                id="income-amount"
                type="number"
                step="0.01"
                min="0"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="income-description">Description</Label>
              <Textarea
                id="income-description"
                value={incomeDescription}
                onChange={(e) => setIncomeDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recurring-income"
                checked={isIncomeRecurring}
                onChange={(e) => setIsIncomeRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="recurring-income" className="text-sm font-normal">
                This is a recurring income
              </Label>
            </div>

            {isIncomeRecurring && (
              <div className="grid gap-2">
                <Label htmlFor="income-recurring-frequency">Frequency</Label>
                <Select value={incomeRecurringFrequency} onValueChange={setIncomeRecurringFrequency}>
                  <SelectTrigger id="income-recurring-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddIncomeOpen(false)} disabled={isAddingIncome}>
              Cancel
            </Button>
            <Button onClick={handleAddIncome} className="bg-green-600 hover:bg-green-700" disabled={isAddingIncome}>
              {isAddingIncome ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Income"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Dialog */}
      <Dialog open={isBudgetDialogOpen} onOpenChange={(open) => !open && setIsBudgetDialogOpen(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Budgets</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Tabs defaultValue="view">
              <TabsList className="mb-4">
                <TabsTrigger value="view">View Budgets</TabsTrigger>
                <TabsTrigger value="add">Add Budget</TabsTrigger>
              </TabsList>

              <TabsContent value="view">
                {budgets.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No budgets found. Create your first budget to start tracking expenses.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {budgets.map((budget) => {
                      const percentage = (budget.spent / budget.amount) * 100
                      return (
                        <div key={budget.id} className="flex items-center justify-between border-b pb-3">
                          <div>
                            <div className="font-medium">{budget.category_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 mt-1 max-w-[200px]">
                              <div
                                className={`h-1.5 rounded-full ${
                                  percentage > 90 ? "bg-red-600" : percentage > 75 ? "bg-yellow-500" : "bg-green-600"
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{budget.period}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setBudgetToDelete(budget.id)
                                setIsDeleteBudgetDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="add">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="budget-category">Category</Label>
                    <CategoryAutocomplete
                      value={budgetCategory}
                      onChange={setBudgetCategory}
                      categories={categories}
                      placeholder="Enter category"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="budget-amount">Budget Amount ({currency})</Label>
                    <Input
                      id="budget-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="budget-period">Budget Period</Label>
                    <Select value={budgetPeriod} onValueChange={setBudgetPeriod}>
                      <SelectTrigger id="budget-period">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleAddBudget} className="mt-2" disabled={isAddingBudget}>
                    {isAddingBudget ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Budget"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Transaction Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !open && setIsDeleteDialogOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {transactionSourceToDelete === "manual" ? (
              <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>
            ) : (
              <p>
                This transaction is from a {transactionSourceToDelete === "sale" ? "sale" : "purchase"} and cannot be
                deleted directly. Please go to the {transactionSourceToDelete === "sale" ? "Sales" : "Purchases"} tab to
                delete it.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            {transactionSourceToDelete === "manual" && (
              <Button variant="destructive" onClick={handleDeleteTransaction}>
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Budget Confirmation Dialog */}
      <Dialog open={isDeleteBudgetDialogOpen} onOpenChange={(open) => !open && setIsDeleteBudgetDialogOpen(false)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Budget Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this budget? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteBudgetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBudget}>
              Delete Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div
            className={cn(
              "flex items-center gap-2 p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-5",
              notification.type === "success" && "bg-green-600 text-white",
              notification.type === "error" && "bg-red-600 text-white",
              notification.type === "warning" && "bg-yellow-500 text-white",
            )}
          >
            {notification.type === "success" && <CheckCircle className="h-5 w-5" />}
            {notification.type === "error" && <AlertCircle className="h-5 w-5" />}
            {notification.type === "warning" && <AlertCircle className="h-5 w-5" />}
            <p className="text-sm flex-1">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
