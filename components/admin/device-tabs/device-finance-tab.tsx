"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getDeviceFinanceData } from "@/app/actions/admin-actions"

interface DeviceFinanceTabProps {
  deviceId: number
}

export default function DeviceFinanceTab({ deviceId }: DeviceFinanceTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [financeData, setFinanceData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    incomeByCategory: [],
    expensesByCategory: [],
    recentTransactions: [],
  })
  const [timeframe, setTimeframe] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchFinanceData()
  }, [deviceId, timeframe])

  const fetchFinanceData = async () => {
    setIsLoading(true)
    try {
      const result = await getDeviceFinanceData(deviceId, timeframe)
      if (result.success) {
        setFinanceData(result.data)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load finance data",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h3 className="font-orbitron text-lg font-medium text-white">FINANCIAL OVERVIEW</h3>
        <Tabs value={timeframe} onValueChange={setTimeframe} className="w-auto">
          <TabsList className="bg-[#1E293B]">
            <TabsTrigger value="week" className="data-[state=active]:bg-[#334155]">
              WEEK
            </TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-[#334155]">
              MONTH
            </TabsTrigger>
            <TabsTrigger value="year" className="data-[state=active]:bg-[#334155]">
              YEAR
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-[#334155]">
              ALL TIME
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Total Income</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(financeData.totalIncome)}</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-green-500">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Total Expenses</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(financeData.totalExpenses)}</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-red-500">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Net Profit</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(financeData.netProfit)}</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-[#6366F1]">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardHeader>
            <CardTitle className="font-orbitron text-white">INCOME BY CATEGORY</CardTitle>
            <CardDescription className="text-[#94A3B8]">Breakdown of income sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(financeData.incomeByCategory) && financeData.incomeByCategory.length > 0 ? (
                financeData.incomeByCategory.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between border-b border-[#334155] pb-2">
                    <div className="font-medium text-white">{item.category || "Uncategorized"}</div>
                    <div className="font-medium text-green-400">{formatCurrency(Number(item.amount))}</div>
                  </div>
                ))
              ) : (
                <p className="text-center text-[#94A3B8]">No income data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardHeader>
            <CardTitle className="font-orbitron text-white">EXPENSES BY CATEGORY</CardTitle>
            <CardDescription className="text-[#94A3B8]">Breakdown of expense categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(financeData.expensesByCategory) && financeData.expensesByCategory.length > 0 ? (
                financeData.expensesByCategory.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between border-b border-[#334155] pb-2">
                    <div className="font-medium text-white">{item.category || "Uncategorized"}</div>
                    <div className="font-medium text-red-400">{formatCurrency(Number(item.amount))}</div>
                  </div>
                ))
              ) : (
                <p className="text-center text-[#94A3B8]">No expense data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#334155] bg-[#1E293B]">
        <CardHeader>
          <CardTitle className="font-orbitron text-white">RECENT TRANSACTIONS</CardTitle>
          <CardDescription className="text-[#94A3B8]">Latest financial activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.isArray(financeData.recentTransactions) && financeData.recentTransactions.length > 0 ? (
              financeData.recentTransactions.map((transaction: any, index: number) => (
                <div key={index} className="flex items-center justify-between border-b border-[#334155] pb-2">
                  <div>
                    <p className="font-medium text-white">{transaction.category || "Uncategorized"}</p>
                    <p className="text-sm text-[#94A3B8]">{transaction.description}</p>
                  </div>
                  <div className={`font-medium ${transaction.type === "INCOME" ? "text-green-400" : "text-red-400"}`}>
                    {transaction.type === "INCOME" ? "+" : "-"}
                    {formatCurrency(Number(transaction.amount))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[#94A3B8]">No recent transactions found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
