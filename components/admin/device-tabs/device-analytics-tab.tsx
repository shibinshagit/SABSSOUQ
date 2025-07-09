"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, TrendingUp, TrendingDown, ShoppingCart, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getDeviceAnalytics } from "@/app/actions/admin-actions"

interface DeviceAnalyticsTabProps {
  deviceId: number
}

export default function DeviceAnalyticsTab({ deviceId }: DeviceAnalyticsTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    productCount: 0,
    saleCount: 0,
    purchaseCount: 0,
    customerCount: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    topProducts: [],
    recentSales: [],
    stockAlerts: [],
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
  }, [deviceId])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const result = await getDeviceAnalytics(deviceId)
      if (result.success) {
        setAnalytics(result.data)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load analytics",
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94A3B8]">Products</p>
                <p className="text-2xl font-bold text-white">{analytics.productCount}</p>
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
                <p className="text-sm text-[#94A3B8]">Sales</p>
                <p className="text-2xl font-bold text-white">{analytics.saleCount}</p>
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
                <p className="text-sm text-[#94A3B8]">Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics.totalRevenue)}</p>
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
                <p className="text-sm text-[#94A3B8]">Expenses</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(analytics.totalExpenses)}</p>
              </div>
              <div className="rounded-full bg-[#334155] p-3 text-red-500">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardHeader>
            <CardTitle className="font-orbitron text-white">PERFORMANCE ANALYSIS</CardTitle>
            <CardDescription className="text-[#94A3B8]">Device activity and performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-[#0F172A] p-4">
              <div className="mb-4">
                <h4 className="mb-2 font-medium text-white">INTELLIGENT INSIGHTS</h4>
                <p className="text-[#94A3B8]">
                  This device has processed {analytics.saleCount} sales and manages {analytics.productCount} products.
                  {analytics.totalRevenue > analytics.totalExpenses
                    ? " It is currently profitable with a positive margin."
                    : " It currently shows expenses exceeding revenue."}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="mb-2 font-medium text-white">RECOMMENDATIONS</h4>
                <ul className="list-inside list-disc space-y-1 text-[#94A3B8]">
                  {analytics.productCount < 20 && <li>Consider adding more products to increase sales potential</li>}
                  {analytics.saleCount < 10 && <li>Sales activity is low, consider promotional strategies</li>}
                  {analytics.stockAlerts.length > 0 && <li>Address low stock items to prevent lost sales</li>}
                  {analytics.totalExpenses > analytics.totalRevenue && (
                    <li>Review expenses to improve profitability</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#334155] bg-[#1E293B]">
          <CardHeader>
            <CardTitle className="font-orbitron text-white">ACTIVITY SUMMARY</CardTitle>
            <CardDescription className="text-[#94A3B8]">Recent transactions and inventory changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-[#0F172A] p-4">
              <div className="mb-4">
                <h4 className="mb-2 font-medium text-white">RECENT SALES</h4>
                {analytics.recentSales && analytics.recentSales.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.recentSales.slice(0, 3).map((sale: any, index: number) => (
                      <div key={index} className="flex items-center justify-between border-b border-[#334155] pb-2">
                        <div className="flex items-center">
                          <ShoppingCart className="mr-2 h-4 w-4 text-[#6366F1]" />
                          <span className="text-[#94A3B8]">Sale #{sale.id}</span>
                        </div>
                        <span className="text-white">{formatCurrency(sale.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#94A3B8]">No recent sales data available</p>
                )}
              </div>

              <div>
                <h4 className="mb-2 font-medium text-white">STOCK ALERTS</h4>
                {analytics.stockAlerts && analytics.stockAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.stockAlerts.slice(0, 3).map((alert: any, index: number) => (
                      <div key={index} className="flex items-center justify-between border-b border-[#334155] pb-2">
                        <div className="flex items-center">
                          <Package className="mr-2 h-4 w-4 text-red-500" />
                          <span className="text-[#94A3B8]">{alert.name}</span>
                        </div>
                        <span className="text-red-400">Stock: {alert.stock}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#94A3B8]">No stock alerts at this time</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#334155] bg-[#1E293B]">
        <CardHeader>
          <CardTitle className="font-orbitron text-white">PERFORMANCE METRICS</CardTitle>
          <CardDescription className="text-[#94A3B8]">Key performance indicators for this device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-[#0F172A] p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h4 className="mb-2 font-medium text-white">SALES PERFORMANCE</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Average Sale Value</span>
                    <span className="text-white">
                      {analytics.saleCount > 0
                        ? formatCurrency(analytics.totalRevenue / analytics.saleCount)
                        : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Total Revenue</span>
                    <span className="text-white">{formatCurrency(analytics.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Profit Margin</span>
                    <span
                      className={analytics.totalRevenue > analytics.totalExpenses ? "text-green-400" : "text-red-400"}
                    >
                      {analytics.totalRevenue > 0
                        ? (((analytics.totalRevenue - analytics.totalExpenses) / analytics.totalRevenue) * 100).toFixed(
                            1,
                          ) + "%"
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-white">INVENTORY HEALTH</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Total Products</span>
                    <span className="text-white">{analytics.productCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Low Stock Items</span>
                    <span className="text-white">{analytics.stockAlerts?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Inventory Value</span>
                    <span className="text-white">{formatCurrency(analytics.inventoryValue || 0)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium text-white">CUSTOMER METRICS</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Total Customers</span>
                    <span className="text-white">{analytics.customerCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Repeat Customers</span>
                    <span className="text-white">{analytics.repeatCustomers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Customer Retention</span>
                    <span className="text-white">
                      {analytics.customerCount > 0
                        ? ((analytics.repeatCustomers || 0) / analytics.customerCount) * 100 + "%"
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
