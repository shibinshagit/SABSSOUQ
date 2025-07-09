"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, Plus, Search, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getProductsByDevice } from "@/app/actions/admin-actions"

interface DeviceProductsTabProps {
  deviceId: number
}

export default function DeviceProductsTab({ deviceId }: DeviceProductsTabProps) {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [deviceId])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const result = await getProductsByDevice(deviceId)
      if (result.success) {
        setProducts(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load products",
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

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.barcode && product.barcode.includes(searchTerm)),
  )

  return (
    <Card className="border-[#334155] bg-[#1E293B]">
      <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <CardTitle className="flex items-center font-orbitron text-white">
          <Package className="mr-2 h-5 w-5" />
          PRODUCTS
        </CardTitle>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
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
          <Button
            size="sm"
            className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED]"
          >
            <Plus className="mr-1 h-4 w-4" />
            ADD PRODUCT
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#334155] text-left text-sm font-medium text-[#94A3B8]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Barcode</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-[#334155] hover:bg-[#0F172A]/50">
                    <td className="px-4 py-3 text-white">{product.name}</td>
                    <td className="px-4 py-3 text-white">{product.category || "N/A"}</td>
                    <td className="px-4 py-3 text-white">
                      $
                      {typeof product.price === "number"
                        ? product.price.toFixed(2)
                        : Number.parseFloat(product.price).toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3 text-white">{product.stock}</td>
                    <td className="px-4 py-3 text-white">{product.barcode || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <Package className="mb-2 h-10 w-10 text-[#334155]" />
            <h3 className="text-lg font-medium text-white">No products found</h3>
            <p className="text-[#94A3B8]">
              {searchTerm ? "No products match your search criteria" : "This device doesn't have any products yet"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
