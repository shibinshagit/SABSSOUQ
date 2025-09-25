"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown, Plus, Loader2, Search, X, Package, Wrench, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProducts } from "@/app/actions/product-actions"
import { getDeviceServices } from "@/app/actions/service-actions"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useSelector } from "react-redux"
import { selectDeviceId } from "@/store/slices/deviceSlice"

interface ProductSelectSimpleProps {
  id?: string
  value: number | null
  onChange: (value: number, name: string, price: number, wholesalePrice?: number, stock?: number) => void
  onAddNew: () => void
  onAddNewService?: () => void
  userId?: number
  refreshTrigger?: boolean
  onRefreshComplete?: () => void
  usePriceType?: "retail" | "wholesale"
  allowServices?: boolean
  searchBufferSize?: number // New prop to control search buffer size
}

// Helper function to truncate names over 20 characters
const truncateName = (name: string) => {
  if (name.length > 20) {
    return name.substring(0, 17) + "..."
  }
  return name
}

// Debounce hook for search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function ProductSelectSimple({
  id,
  value,
  onChange,
  onAddNew,
  onAddNewService,
  userId = 1,
  refreshTrigger = false,
  onRefreshComplete,
  usePriceType = "retail",
  allowServices = true,
  searchBufferSize = 50, // Default buffer size
}: ProductSelectSimpleProps) {
  const deviceId = useSelector(selectDeviceId)
  const [open, setOpen] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  const [isServiceMode, setIsServiceMode] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300)

  // Fetch services when component mounts (if allowed)
  useEffect(() => {
    if (allowServices && services.length === 0) {
      fetchServices()
    }
  }, [allowServices])

  // Search products when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm.trim() !== "" && !isServiceMode && open) {
      searchProducts(debouncedSearchTerm)
      setHasSearched(true)
    } else if (debouncedSearchTerm.trim() === "" && !isServiceMode) {
      setProducts([])
      setHasSearched(false)
    }
  }, [debouncedSearchTerm, isServiceMode, open, userId])

  // Handle refresh trigger
  useEffect(() => {
    if (refreshTrigger) {
      if (allowServices) {
        fetchServices()
      }
      // Clear current products and force re-search if there's a search term
      if (debouncedSearchTerm.trim() !== "" && !isServiceMode) {
        searchProducts(debouncedSearchTerm)
      }
      if (onRefreshComplete) {
        onRefreshComplete()
      }
    }
  }, [refreshTrigger, onRefreshComplete, allowServices, debouncedSearchTerm, isServiceMode])

  // Find selected item when value or products change
  useEffect(() => {
    if (value && !selectedProduct) {
      if (isServiceMode) {
        const service = services.find(s => s.id === value)
        setSelectedProduct(service || null)
      } else {
        const product = products.find(p => p.id === value)
        if (product) {
          setSelectedProduct(product)
        } else if (!hasSearched) {
          // If we haven't searched yet and have a value, fetch that specific product
          fetchSelectedProduct(value)
        }
      }
    } else {
      setSelectedProduct(null)
    }
  }, [value, products, services, isServiceMode, hasSearched])

  // Simplified search function - NO addSimpleSpaces needed!
const searchProducts = async (searchTerm: string) => {
  if (loading) return;
  try {
    setLoading(true);
    
    // Convert search term to lowercase for comparison
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    // Try original search first (backend API call)
    let result = await getProducts(userId, searchBufferSize, searchTerm);
    
    // If no results from backend, get broader set and filter client-side
    if (!result.success || result.data.length === 0) {
      // Get more products for client-side filtering
      const broadResult = await getProducts(userId, searchBufferSize * 2, '');
      
      if (broadResult.success && broadResult.data.length > 0) {
        // Filter products client-side with lowercase comparison
        const filteredProducts = broadResult.data.filter(product => {
          const productName = product.name.toLowerCase().replace(/\s+/g, '');
          const companyName = (product.company_name || '').toLowerCase().replace(/\s+/g, '');
          const searchNoSpaces = lowerSearchTerm.replace(/\s+/g, '');
          
          return (
            productName.includes(searchNoSpaces) ||
            companyName.includes(searchNoSpaces) ||
            (product.barcode && product.barcode.toLowerCase().includes(lowerSearchTerm)) ||
            // Also try with original spacing preserved
            product.name.toLowerCase().includes(lowerSearchTerm) ||
            (product.company_name && product.company_name.toLowerCase().includes(lowerSearchTerm))
          );
        });
        
        result = {
          success: true,
          data: filteredProducts.slice(0, searchBufferSize)
        };
      }
    }
    
    if (result.success) {
      setProducts(result.data);
    } else {
      console.error("Failed to search products:", result.message);
      setProducts([]);
    }
  } catch (error) {
    console.error("Error searching products:", error);
    setProducts([]);
  } finally {
    setLoading(false);
  }
};

// NO addSimpleSpaces function needed!


  const fetchSelectedProduct = async (productId: number) => {
    try {
      // Search by ID to get the selected product details
      const result = await getProducts(userId, 1, productId.toString())
      if (result.success && result.data.length > 0) {
        setSelectedProduct(result.data[0])
      }
    } catch (error) {
      console.error("Error fetching selected product:", error)
    }
  }

  const fetchServices = async () => {
    if (!deviceId || !allowServices) return
    try {
      const result = await getDeviceServices(deviceId)
      if (result.success) {
        setServices(result.data)
      } else {
        console.error("Failed to load services:", result.message)
      }
    } catch (error) {
      console.error("Error fetching services:", error)
    }
  }

  // Get items based on mode
  const items = isServiceMode ? services : products

  // Filter services based on local search term (only for services, products are already filtered by API)
  const filteredItems = isServiceMode && localSearchTerm.trim() !== ""
    ? services.filter(
        (item) =>
          item.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
          (item.category && item.category.toLowerCase().includes(localSearchTerm.toLowerCase()))
      )
    : items

  // Handle item selection
  const handleItemSelect = (
  itemId: number,
  itemName: string,
  price: number,
  wholesalePrice?: number,
  stock?: number,
) => {
  // ✅ lock correct name immediately
  setSelectedProduct({
    id: itemId,
    name: itemName,
    price,
    wholesale_price: wholesalePrice,
    stock,
  })

  if (isServiceMode) {
    onChange(itemId, itemName, price, 0, 999)
  } else {
    const finalPrice =
      usePriceType === "wholesale" && wholesalePrice ? wholesalePrice : price
    onChange(itemId, itemName, finalPrice, wholesalePrice, stock)
  }

  setOpen(false)
  setLocalSearchTerm("")
}

  // Handle dialog opening
  const handleDialogOpen = () => {
    setOpen(true)
  }

  // Handle dialog closing
  const handleDialogClose = () => {
    setOpen(false)
    setLocalSearchTerm("")
    setProducts([])
    setHasSearched(false)
  }

  // Handle add new based on current mode
  const handleAddNew = () => {
    setOpen(false)
    if (isServiceMode && onAddNewService) {
      onAddNewService()
    } else {
      onAddNew()
    }
  }

  // Handle mode switch
  const handleModeSwitch = (checked: boolean) => {
    setIsServiceMode(checked)
    setLocalSearchTerm("")
    setProducts([])
    setHasSearched(false)
  }

  return (
    <div className="relative w-full">
      <Button
        id={id}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between h-9 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        type="button"
        onClick={handleDialogOpen}
      >
        <div className="flex items-center">
          {selectedProduct ? (
            <>
              {isServiceMode || (selectedProduct && "category" in selectedProduct) ? (
                <Wrench className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Package className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
              <span className="truncate">{truncateName(selectedProduct.name)}</span>
            </>
          ) : (
            <>
              {isServiceMode ? (
                <Wrench className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Package className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
              <span>Select {isServiceMode ? "service" : "product"}...</span>
            </>
          )}
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md p-0 gap-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select {isServiceMode ? "Service" : "Product"}
            </h2>
          </div>

          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder={`Search ${isServiceMode ? "services" : "products"}...`}
                  className="pl-9 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  autoFocus
                />
                {localSearchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setLocalSearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )}
              </div>

              {/* Only show service toggle if services are allowed */}
              {allowServices && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="service-mode"
                    checked={isServiceMode}
                    onCheckedChange={handleModeSwitch}
                  />
                  <Label
                    htmlFor="service-mode"
                    className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                  >
                    {isServiceMode ? (
                      <>
                        <Wrench className="h-4 w-4 text-green-600" />
                        <span>Services</span>
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 text-blue-600" />
                        <span>Products</span>
                      </>
                    )}
                  </Label>
                </div>
              )}
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto bg-white dark:bg-gray-800">
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Searching {isServiceMode ? "services" : "products"}...
                </p>
              </div>
            ) : !hasSearched && !isServiceMode ? (
              <div className="p-4 text-center">
                <Search className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start typing to search products...
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-4 text-center">
                <p className="py-3 text-sm text-gray-500 dark:text-gray-400">
                  No {isServiceMode ? "services" : "products"} found.
                </p>
              </div>
            ) : (
              <div className="p-1">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                  {isServiceMode ? "Services" : "Products"} ({filteredItems.length}{!isServiceMode && filteredItems.length === searchBufferSize ? "+" : ""})
                </div>
                <div>
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-900 dark:text-gray-100 font-normal"
                      onClick={() =>
                        handleItemSelect(
                          item.id,
                          item.name,
                          item.price,
                          isServiceMode ? 0 : item.wholesale_price,
                          isServiceMode ? 999 : item.stock,
                        )
                      }
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === item.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex items-center gap-2 flex-1">
                        {isServiceMode ? (
                          <Wrench className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <Package className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-gray-900 dark:text-gray-100 truncate" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {!isServiceMode && item.wholesale_price > 0 && ` • Company: ${item.company_name} `} 
                            Price: {item.price}
                            {!isServiceMode && item.wholesale_price > 0 && ` • Wholesale: ${item.wholesale_price}`}
                            {!isServiceMode && item.barcode && ` • Barcode: ${item.barcode}`}
                            {!isServiceMode && ` • Stock: ${item.stock || 0}`}
                            {isServiceMode && item.category && ` • Category: ${item.category}`}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700">
            <Button
              variant="outline"
              className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 bg-transparent"
              onClick={handleAddNew}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New {isServiceMode ? "Service" : "Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}