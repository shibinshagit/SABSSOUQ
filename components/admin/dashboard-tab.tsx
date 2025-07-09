"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users, Building2, Package, ShoppingCart, UserCheck, ShoppingBag } from "lucide-react"
import { getSystemStats } from "@/app/actions/admin-actions"

type SystemStats = {
  userCount: number
  companyCount: number
  productCount: number
  saleCount: number
  purchaseCount: number
  customerCount: number
}

export default function DashboardTab() {
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getSystemStats()
      if (result.success) {
        setStats(result.data)
      } else {
        setError(result.message || "Failed to load system statistics")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
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
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">System overview and statistics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.userCount || 0}</div>
            <p className="text-xs text-muted-foreground">Registered system users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.companyCount || 0}</div>
            <p className="text-xs text-muted-foreground">Registered companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.productCount || 0}</div>
            <p className="text-xs text-muted-foreground">Total products in system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.saleCount || 0}</div>
            <p className="text-xs text-muted-foreground">Total sales transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.customerCount || 0}</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchases</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.purchaseCount || 0}</div>
            <p className="text-xs text-muted-foreground">Total purchase transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current system health and performance metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Database Status</p>
                <p className="text-sm text-green-600">Connected</p>
              </div>
              <div>
                <p className="text-sm font-medium">API Status</p>
                <p className="text-sm text-green-600">Operational</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Last System Update</p>
              <p className="text-sm text-muted-foreground">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
