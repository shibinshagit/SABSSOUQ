"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon, Plus, Loader2, TrendingUp, TrendingDown, Wallet, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  getFinancialDataByCompany,
  getFinancialTransactions,
  getPettyCashTransactions,
  getExpenseCategories,
  getIncomeCategories,
  addFinancialTransaction,
  addPettyCashTransaction,
} from "@/app/actions/finance-actions"

interface FinanceTabProps {
  companyId: number
  deviceId?: number | null
}

export default function FinanceTab({ companyId, deviceId }: FinanceTabProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [financialData, setFinancialData] = useState<any>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    pettyCashBalance: 0,
    incomeByCategory: [],
    expensesByCategory: [],
  })
  const [transactions, setTransactions] = useState<any[]>([])
  const [pettyCashTransactions, setPettyCashTransactions] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])
  const [incomeCategories, setIncomeCategories] = useState<any[]>([])

  // Dialog states
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isAddPettyCashOpen, setIsAddPettyCashOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states
  const [transactionDate, setTransactionDate] = useState<Date>(new Date())
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [operationType, setOperationType] = useState("ADD")

  const { toast } = useToast()

  // Update the useEffect to properly handle data and error states
  useEffect(() => {
    if (companyId) {
      fetchData()
    }
  }, [companyId, activeTab, deviceId])

  const fetchData = async () => {
    if (!companyId) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch financial data
      const financialResult = await getFinancialDataByCompany(companyId)
      if (financialResult.success) {
        // Ensure arrays are always initialized
        setFinancialData({
          ...financialResult.data,
          incomeByCategory: Array.isArray(financialResult.data.incomeByCategory)
            ? financialResult.data.incomeByCategory
            : [],
          expensesByCategory: Array.isArray(financialResult.data.expensesByCategory)
            ? financialResult.data.expensesByCategory
            : [],
        })

        // Log success to help with debugging
        console.log("Financial data loaded successfully:", financialResult.data)
      } else {
        console.error("Failed to fetch financial data:", financialResult.message)
        setError(financialResult.message || "Failed to fetch financial data")

        // Set default data to prevent UI errors
        setFinancialData({
          totalIncome: 0,
          totalExpenses: 0,
          netProfit: 0,
          pettyCashBalance: 0,
          incomeByCategory: [],
          expensesByCategory: [],
        })
      }

      // Fetch transactions if on transactions tab
      if (activeTab === "transactions") {
        // Convert deviceId to a number if it's a string or undefined/null
        const deviceIdNumber = deviceId ? Number(deviceId) : null

        const transactionsResult = await getFinancialTransactions(companyId, deviceIdNumber)
        if (transactionsResult.success) {
          setTransactions(Array.isArray(transactionsResult.data) ? transactionsResult.data : [])
          console.log("Transactions loaded successfully:", transactionsResult.data.length, "transactions")
        } else {
          console.error("Failed to fetch transactions:", transactionsResult.message)
        }
      }

      // Fetch petty cash transactions if on petty cash tab
      if (activeTab === "pettycash") {
        const pettyCashResult = await getPettyCashTransactions(companyId)
        if (pettyCashResult.success) {
          setPettyCashTransactions(Array.isArray(pettyCashResult.data) ? pettyCashResult.data : [])
          console.log("Petty cash transactions loaded successfully:", pettyCashResult.data.length, "transactions")
        } else {
          console.error("Failed to fetch petty cash transactions:", pettyCashResult.message)
        }
      }

      // Fetch categories for forms
      const expenseCategoriesResult = await getExpenseCategories(companyId)
      if (expenseCategoriesResult.success) {
        setExpenseCategories(Array.isArray(expenseCategoriesResult.data) ? expenseCategoriesResult.data : [])
        console.log("Expense categories loaded successfully:", expenseCategoriesResult.data.length, "categories")
      } else {
        console.error("Failed to fetch expense categories:", expenseCategoriesResult.message)
      }

      const incomeCategoriesResult = await getIncomeCategories(companyId)
      if (incomeCategoriesResult.success) {
        setIncomeCategories(Array.isArray(incomeCategoriesResult.data) ? incomeCategoriesResult.data : [])
        console.log("Income categories loaded successfully:", incomeCategoriesResult.data.length, "categories")
      } else {
        console.error("Failed to fetch income categories:", incomeCategoriesResult.message)
      }
    } catch (error) {
      console.error("Error fetching finance data:", error)
      setError("An error occurred while fetching finance data")

      // Set default empty data to prevent UI errors
      setFinancialData({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        pettyCashBalance: 0,
        incomeByCategory: [],
        expensesByCategory: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("company_id", companyId.toString())
      formData.append("transaction_date", transactionDate.toISOString())
      formData.append("amount", amount)
      formData.append("transaction_type", "INCOME")
      formData.append("category", category)
      formData.append("description", description)
      formData.append("created_by", "1") // Admin user ID

      // Convert deviceId to a number if it's a string or undefined/null
      const deviceIdNumber = deviceId ? Number(deviceId) : null

      const result = await addFinancialTransaction(formData, deviceIdNumber)

      if (result.success) {
        toast({
          title: "Success",
          description: "Income added successfully",
        })
        setIsAddIncomeOpen(false)
        resetForm()
        fetchData()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add income",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding income:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("company_id", companyId.toString())
      formData.append("transaction_date", transactionDate.toISOString())
      formData.append("amount", amount)
      formData.append("transaction_type", "EXPENSE")
      formData.append("category", category)
      formData.append("description", description)
      formData.append("created_by", "1") // Admin user ID

      // Convert deviceId to a number if it's a string or undefined/null
      const deviceIdNumber = deviceId ? Number(deviceId) : null

      const result = await addFinancialTransaction(formData, deviceIdNumber)

      if (result.success) {
        toast({
          title: "Success",
          description: "Expense added successfully",
        })
        setIsAddExpenseOpen(false)
        resetForm()
        fetchData()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add expense",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddPettyCash = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append("company_id", companyId.toString())
      formData.append("transaction_date", transactionDate.toISOString())
      formData.append("amount", amount)
      formData.append("operation_type", operationType)
      formData.append("description", description)
      formData.append("created_by", "1") // Admin user ID

      const result = await addPettyCashTransaction(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Petty cash transaction added successfully",
        })
        setIsAddPettyCashOpen(false)
        resetForm()
        fetchData()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add petty cash transaction",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding petty cash transaction:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTransactionDate(new Date())
    setAmount("")
    setCategory("")
    setDescription("")
    setOperationType("ADD")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-QA", {
      style: "currency",
      currency: "QAR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP")
    } catch (error) {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Financial Management</h2>
        <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
          <Button
            onClick={() => setIsAddIncomeOpen(true)}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" /> Add Income
          </Button>
          <Button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
          <Button onClick={() => setIsAddPettyCashOpen(true)} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Petty Cash
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="pettycash">Petty Cash</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(financialData.totalIncome)}</div>
                  <div className="rounded-full bg-green-100 p-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(financialData.totalExpenses)}</div>
                  <div className="rounded-full bg-red-100 p-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Petty Cash Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{formatCurrency(financialData.pettyCashBalance)}</div>
                  <div className="rounded-full bg-blue-100 p-2">
                    <Wallet className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Net Profit</CardTitle>
              <CardDescription>Total income minus total expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <span className={financialData.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(financialData.netProfit)}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Income by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(financialData.incomeByCategory) && financialData.incomeByCategory.length > 0 ? (
                    financialData.incomeByCategory.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div className="font-medium">{item.category || "Uncategorized"}</div>
                        <div className="font-medium text-green-600">{formatCurrency(Number(item.amount))}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">No income data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(financialData.expensesByCategory) && financialData.expensesByCategory.length > 0 ? (
                    financialData.expensesByCategory.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2">
                        <div className="font-medium">{item.category || "Uncategorized"}</div>
                        <div className="font-medium text-red-600">{formatCurrency(Number(item.amount))}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">No expense data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(transactions) && transactions.length > 0 ? (
                  transactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{transaction.category || "Uncategorized"}</p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.transaction_date)}</p>
                        <p className="text-sm text-gray-500">{transaction.description}</p>
                      </div>
                      <div
                        className={`font-medium ${
                          transaction.transaction_type === "INCOME"
                            ? "text-green-600"
                            : transaction.transaction_type === "EXPENSE"
                              ? "text-red-600"
                              : "text-blue-600"
                        }`}
                      >
                        {transaction.transaction_type === "INCOME" ? "+" : "-"}
                        {formatCurrency(Number(transaction.amount))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No transactions found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pettycash" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Petty Cash</CardTitle>
                <CardDescription>Current Balance: {formatCurrency(financialData.pettyCashBalance)}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(pettyCashTransactions) && pettyCashTransactions.length > 0 ? (
                  pettyCashTransactions.map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">
                          {transaction.operation_type === "ADD" ? "Cash Added" : "Cash Withdrawn"}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.transaction_date)}</p>
                        <p className="text-sm text-gray-500">{transaction.description}</p>
                      </div>
                      <div
                        className={`font-medium ${
                          transaction.operation_type === "ADD" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {transaction.operation_type === "ADD" ? "+" : "-"}
                        {formatCurrency(Number(transaction.amount))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">No petty cash transactions found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Income Dialog */}
      <Dialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddIncome} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !transactionDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {transactionDate ? format(transactionDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={transactionDate}
                    onSelect={(date) => date && setTransactionDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (QAR)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {incomeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddIncomeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Income
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !transactionDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {transactionDate ? format(transactionDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={transactionDate}
                    onSelect={(date) => date && setTransactionDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (QAR)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Petty Cash Dialog */}
      <Dialog open={isAddPettyCashOpen} onOpenChange={setIsAddPettyCashOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Petty Cash Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPettyCash} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !transactionDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {transactionDate ? format(transactionDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={transactionDate}
                    onSelect={(date) => date && setTransactionDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operationType">Operation Type</Label>
              <Select value={operationType} onValueChange={setOperationType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select operation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADD">Add Cash</SelectItem>
                  <SelectItem value="WITHDRAW">Withdraw Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (QAR)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddPettyCashOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
