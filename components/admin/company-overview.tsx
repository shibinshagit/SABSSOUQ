"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Monitor, Package, ShoppingCart, Receipt, Users, DollarSign, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getDevicesByCompany, getCompanyStats } from "@/app/actions/admin-actions"

interface CompanyOverviewProps {
  companyId: number
}

export default function CompanyOverview({ companyId }: CompanyOverviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    deviceCount: 0,
    totalProducts: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    activeDevices: 0,
  })
  const [timeframe, setTimeframe] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchCompanyStats()
  }, [companyId, timeframe])

  const fetchCompanyStats = async () => {
    setIsLoading(true)
    try {
      // Get devices count
      const devicesResult = await getDevicesByCompany(companyId)
      const deviceCount = devicesResult.success ? devicesResult.data.length : 0

      // Get company stats
      const statsResult = await getCompanyStats(companyId, timeframe)
      if (statsResult.success) {
        setStats({
          deviceCount,
          totalProducts: statsResult.data.totalProducts || 0,
          totalSales: statsResult.data.totalSales || 0,
          totalPurchases: statsResult.data.totalPurchases || 0,
          totalCustomers: statsResult.data.totalCustomers || 0,
          totalRevenue: statsResult.data.totalRevenue || 0,
          totalExpenses: statsResult.data.totalExpenses || 0,
          activeDevices: statsResult.data.activeDevices || 0,
        })
      } else {
        toast({
          title: "Error",
          description: statsResult.message || "Failed to load company statistics",
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
        <h3 className="font-orbitron text-lg font-medium text-white">BUSINESS ANALYTICS</h3>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Devices</p>
                <p className="text-2xl font-bold text-white">{stats.deviceCount}</p>
                <p className="text-xs text-[#94A3B8]">{stats.activeDevices} active</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-[#6366F1]">
                <Monitor className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Total Products</p>
                <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
                <p className="text-xs text-[#94A3B8]">Across all devices</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-[#6366F1]">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Total Sales</p>
                <p className="text-2xl font-bold text-white">{stats.totalSales}</p>
                <p className="text-xs text-[#94A3B8]">Transactions</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-[#6366F1]">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Total Purchases</p>
                <p className="text-2xl font-bold text-white">{stats.totalPurchases}</p>
                <p className="text-xs text-[#94A3B8]">Transactions</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-[#6366F1]">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Total Customers</p>
                <p className="text-2xl font-bold text-white">{stats.totalCustomers}</p>
                <p className="text-xs text-[#94A3B8]">Registered</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-[#6366F1]">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-[#94A3B8]">From sales</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-green-500">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Total Expenses</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalExpenses)}</p>
                <p className="text-xs text-[#94A3B8]">From purchases</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-red-500">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Net Profit</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(stats.totalRevenue - stats.totalExpenses)}
                </p>
                <p className="text-xs text-[#94A3B8]">Revenue - Expenses</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-[#6366F1]">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#334155] bg-[#1E293B]">
        <CardHeader>
          <CardTitle className="font-orbitron text-white">BUSINESS POTENTIAL</CardTitle>
          <CardDescription className="text-[#94A3B8]">
            Analysis of business growth and potential opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 rounded-lg bg-[#0F172A] p-6">
            <div className="mb-4">
              <h4 className="mb-2 font-orbitron text-lg font-medium text-white">BUSINESS INSIGHTS</h4>
              <p className="text-[#94A3B8]">
                Based on the data collected from {stats.deviceCount} devices, this company shows{" "}
                {stats.totalSales > 100 ? "strong" : stats.totalSales > 50 ? "moderate" : "emerging"} sales activity
                with {stats.totalSales} total transactions.
              </p>
            </div>

            <div className="mb-4">
              <h4 className="mb-2 font-orbitron text-lg font-medium text-white">GROWTH OPPORTUNITIES</h4>
              <ul className="list-inside list-disc space-y-2 text-[#94A3B8]">
                <li>
                  {stats.deviceCount < 3
                    ? "Potential for additional device deployment to expand business reach"
                    : "Good device coverage, focus on optimizing existing operations"}
                </li>
                <li>
                  {stats.totalProducts < 50
                    ? "Opportunity to expand product catalog for increased sales potential"
                    : "Strong product diversity, consider inventory optimization"}
                </li>
                <li>
                  {stats.totalCustomers < 100
                    ? "Customer base can be expanded through targeted marketing"
                    : "Solid customer base, focus on retention and loyalty programs"}
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-2 font-orbitron text-lg font-medium text-white">FINANCIAL HEALTH</h4>
              <p className="text-[#94A3B8]">
                {stats.totalRevenue > stats.totalExpenses
                  ? `Positive profit margin of ${formatCurrency(
                      stats.totalRevenue - stats.totalExpenses,
                    )} indicates healthy financial status.`
                  : `Negative profit margin of ${formatCurrency(
                      stats.totalRevenue - stats.totalExpenses,
                    )} suggests need for financial optimization.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
