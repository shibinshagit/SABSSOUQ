"use client"

import { useState, useEffect } from "react"
import { BarChart2, Search, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getStockByCompany } from "@/app/actions/admin-actions"

interface StockTabProps {
  companyId: number
}

type StockItem = {
  id: number
  name: string
  category?: string
  stock: number
  price: number | string
}

export default function StockTab({ companyId }: StockTabProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchStock()
  }, [companyId])

  const fetchStock = async () => {
    setIsLoading(true)
    try {
      const result = await getStockByCompany(companyId)
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
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium">Total Products</h3>
              <p className="mt-2 text-3xl font-bold">{filteredStockItems.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium">Stock Value</h3>
              <p className="mt-2 text-3xl font-bold">${totalStockValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-medium">Low Stock Items</h3>
              <p className="mt-2 text-3xl font-bold">{lowStockItems}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <CardTitle className="flex items-center">
            <BarChart2 className="mr-2 h-5 w-5" />
            Stock Inventory
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredStockItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-gray-500">
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
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">{item.category || "N/A"}</td>
                        <td className="px-4 py-3">{item.stock}</td>
                        <td className="px-4 py-3">${numericPrice.toFixed(2)}</td>
                        <td className="px-4 py-3">${(item.stock * numericPrice).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              item.stock === 0
                                ? "bg-red-100 text-red-800"
                                : item.stock < 10
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
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
              <BarChart2 className="mb-2 h-10 w-10 text-gray-400" />
              <h3 className="text-lg font-medium">No stock items found</h3>
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? "No products match your search criteria"
                  : "This company doesn't have any products in stock yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
