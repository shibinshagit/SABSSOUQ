"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown, Plus, Loader2, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProducts } from "@/app/actions/product-actions"

interface ProductSelectProps {
  id?: string
  value: number | null
  onChange: (value: number, name: string, price: number, wholesalePrice?: number) => void
  onAddNew: () => void
  userId?: number
  refreshTrigger?: boolean
  onRefreshComplete?: () => void
}

export default function ProductSelect({
  id,
  value,
  onChange,
  onAddNew,
  userId = 1,
  refreshTrigger = false,
  onRefreshComplete,
}: ProductSelectProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch products when component mounts or userId changes
  useEffect(() => {
    fetchProducts()
  }, [userId])

  // Refresh products when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchProducts().then(() => {
        if (onRefreshComplete) {
          onRefreshComplete()
        }
      })
    }
  }, [refreshTrigger, onRefreshComplete])

  const fetchProducts = async () => {
    if (loading) return

    try {
      setLoading(true)
      const result = await getProducts(userId)
      if (result.success) {
        setProducts(result.data)
      } else {
        console.error("Failed to load products:", result.message)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  // Find the selected product
  const selectedProduct = products.find((product) => product.id === value)

  // Filter products based on search term
  const filteredProducts =
    searchTerm.trim() === ""
      ? products
      : products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase())),
        )

  // Handle product selection
  const handleProductSelect = (productId: number, productName: string, price: number, wholesalePrice?: number) => {
    onChange(productId, productName, price, wholesalePrice)
    setOpen(false)
    setSearchTerm("")
  }

  return (
    <div className="relative w-full">
      <Button
        id={id}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        type="button"
        onClick={() => setOpen(true)}
      >
        {value && selectedProduct ? selectedProduct.name : "Select product..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Select Product</h2>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-4 text-center">
                <p className="py-3 text-sm">No products found.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setOpen(false)
                    onAddNew()
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
              </div>
            ) : (
              <div className="p-1">
                <div className="text-xs font-medium text-gray-500 px-3 py-2">Products</div>
                <div>
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-100 text-left text-gray-900 font-normal"
                      onClick={() =>
                        handleProductSelect(product.id, product.name, product.price, product.wholesale_price)
                      }
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === product.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col">
                        <span className="text-gray-900">{product.name}</span>
                        <span className="text-xs text-gray-500">
                          Price: {product.price}{" "}
                          {product.wholesale_price > 0 && `• Wholesale: ${product.wholesale_price}`}
                          {product.barcode && ` • Barcode: ${product.barcode}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setOpen(false)
                onAddNew()
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
