"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BarChart2, Search, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getStockByDevice } from "@/app/actions/admin-actions"

interface DeviceStockTabProps {
  deviceId: number
}

export default function DeviceStockTab({ deviceId }: DeviceStockTabProps) {
  const [stockItems, setStockItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchStock()
  }, [deviceId])

  const fetchStock = async () => {
    setIsLoading(true)
    try {
      const result = await getStockByDevice(deviceId)
      if (result.success) {
        setStockItems(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load stock information",
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

  const filteredStockItems = stockItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Helper function to safely convert price to number
  const getNumericPrice = (price: number | string): number => {
    if (typeof price === "number") return price
    const numPrice = Number(price)
    return isNaN(numPrice) ? 0 : numPrice
  }

  // Calculate stock value
  const totalStockValue = filteredStockItems.reduce(
    (total, item) => total + item.stock * getNumericPrice(item.price),
    0,
  )

  const lowStockItems = filteredStockItems.filter((item) => item.stock < 10).length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium text-white">Total Products</h3>
              <p className="mt-2 text-3xl font-bold text-white">{filteredStockItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium text-white">Stock Value</h3>
              <p className="mt-2 text-3xl font-bold text-white">${totalStockValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#334155] bg-[#1E293B]">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium text-white">Low Stock Items</h3>
              <p className="mt-2 text-3xl font-bold text-white">{lowStockItems}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#334155] bg-[#1E293B]">
        <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <CardTitle className="flex items-center font-orbitron text-white">
            <BarChart2 className="mr-2 h-5 w-5" />
            STOCK INVENTORY
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 border-[#334155] bg-[#0F172A] text-white focus:border-[#6366F1]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
            </div>
          ) : filteredStockItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#334155] text-left text-sm font-medium text-[#94A3B8]">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStockItems.map((item) => {
                    const numericPrice = getNumericPrice(item.price)
                    return (
                      <tr key={item.id} className="border-b border-[#334155] hover:bg-[#0F172A]/50">
                        <td className="px-4 py-3 text-white">{item.name}</td>
                        <td className="px-4 py-3 text-white">{item.category || "N/A"}</td>
                        <td className="px-4 py-3 text-white">{item.stock}</td>
                        <td className="px-4 py-3 text-white">${numericPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-white">${(item.stock * numericPrice).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              item.stock === 0
                                ? "bg-red-900/20 text-red-400"
                                : item.stock < 10
                                  ? "bg-yellow-900/20 text-yellow-400"
                                  : "bg-green-900/20 text-green-400"
                            }`}
                          >
                            {item.stock === 0 ? "Out of Stock" : item.stock < 10 ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <BarChart2 className="mb-2 h-10 w-10 text-[#334155]" />
              <h3 className="text-lg font-medium text-white">No stock items found</h3>
              <p className="text-[#94A3B8]">
                {searchTerm
                  ? "No products match your search criteria"
                  : "This device doesn't have any products in stock yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
