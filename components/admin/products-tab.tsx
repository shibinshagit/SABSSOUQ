"use client"

import { useState, useEffect } from "react"
import { Package, Plus, Search, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getProductsByCompany } from "@/app/actions/admin-actions"

interface ProductsTabProps {
  companyId: number
}

type Product = {
  id: number
  name: string
  category?: string
  price: number
  stock: number
  barcode?: string
}

export default function ProductsTab({ companyId }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [companyId])

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const result = await getProductsByCompany(companyId)
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
    <Card>
      <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <CardTitle className="flex items-center">
          <Package className="mr-2 h-5 w-5" />
          Products
        </CardTitle>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
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
          <Button size="sm" className="shrink-0">
            <Plus className="mr-1 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-gray-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Barcode</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3">{product.category || "N/A"}</td>
                    <td className="px-4 py-3">
                      $
                      {typeof product.price === "number"
                        ? product.price.toFixed(2)
                        : Number.parseFloat(product.price).toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3">{product.stock}</td>
                    <td className="px-4 py-3">{product.barcode || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <Package className="mb-2 h-10 w-10 text-gray-400" />
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? "No products match your search criteria" : "This company doesn't have any products yet"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
