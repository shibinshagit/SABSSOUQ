"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown, Plus, Loader2, Search, X, Package, Wrench, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProducts } from "@/app/actions/product-actions"
import { getDeviceServices } from "@/app/actions/service-actions"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useSelector, useDispatch } from "react-redux"
import { selectDeviceId } from "@/store/slices/deviceSlice"
import { setProducts, clearProducts, setLoading as setProductLoading } from "@/store/slices/productSlice"

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
  allowServices?: boolean // New prop to control services availability
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
  allowServices = true, // Default to true for backward compatibility
}: ProductSelectSimpleProps) {
  const deviceId = useSelector(selectDeviceId)
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  const [isServiceMode, setIsServiceMode] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  // Get products from Redux store
  const reduxProducts = useSelector((state: any) => state.product.products)
  const reduxLoading = useSelector((state: any) => state.product.loading)

  // Fetch items when component mounts or userId changes
  useEffect(() => {
    if (reduxProducts.length === 0 && !reduxLoading) {
      fetchProducts()
    }
    if (allowServices && services.length === 0) {
      fetchServices()
    }
  }, [userId, reduxProducts.length, reduxLoading, allowServices])

  // Refresh items when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchProducts().then(() => {
        if (allowServices) {
          fetchServices()
        }
        if (onRefreshComplete) {
          onRefreshComplete()
        }
      })
    }
  }, [refreshTrigger, onRefreshComplete, allowServices])

  const fetchProducts = async () => {
    if (loading || reduxLoading) return

    try {
      setLoading(true)
      dispatch(setProductLoading(true))
      const result = await getProducts(userId)
      if (result.success) {
        // Update Redux store with products
        dispatch(setProducts(result.data))
      } else {
        console.error("Failed to load products:", result.message)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
      dispatch(setProductLoading(false))
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

  // Handle reload - clear Redux and refetch
  const handleReload = async () => {
    try {
      setIsReloading(true)
      // Clear Redux products
      dispatch(clearProducts())
      // Clear local search
      setLocalSearchTerm("")
      // Refetch products
      await fetchProducts()
      if (allowServices) {
        await fetchServices()
      }
    } catch (error) {
      console.error("Error reloading products:", error)
    } finally {
      setIsReloading(false)
    }
  }

  // Get items based on mode
  const items = isServiceMode ? services : reduxProducts

  // Find the selected item
  const selectedItem = items.find((item) => item.id === value)

  // Filter items based on local search term - search works on Redux data
  const filteredItems =
    localSearchTerm.trim() === ""
      ? items
      : items.filter(
          (item) =>
            item.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
            (item.barcode && item.barcode.toLowerCase().includes(localSearchTerm.toLowerCase())),
        )

  // Handle item selection
  const handleItemSelect = (
    itemId: number,
    itemName: string,
    price: number,
    wholesalePrice?: number,
    stock?: number,
  ) => {
    if (isServiceMode) {
      // For services, set stock to 999 (unlimited)
      onChange(itemId, itemName, price, 0, 999)
    } else {
      // For products, use actual stock and price based on type
      const finalPrice = usePriceType === "wholesale" && wholesalePrice ? wholesalePrice : price
      onChange(itemId, itemName, finalPrice, wholesalePrice, stock)
    }
    setOpen(false)
    setLocalSearchTerm("")
  }

  // Handle dialog opening - use Redux data
  const handleDialogOpen = async () => {
    setOpen(true)
    // If no products in Redux, fetch them
    if (reduxProducts.length === 0) {
      await fetchProducts()
    }
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
          {selectedItem ? (
            <>
              {isServiceMode || (selectedItem && "category" in selectedItem) ? (
                <Wrench className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <Package className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
              <span className="truncate">{selectedItem.name}</span>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Select {isServiceMode ? "Service" : "Product"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReload}
              disabled={isReloading}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
            >
              <RefreshCw className={`h-4 w-4 ${isReloading ? "animate-spin" : ""}`} />
              Reload
            </Button>
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
                    onCheckedChange={(checked) => {
                      setIsServiceMode(checked)
                      setLocalSearchTerm("")
                    }}
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
            {loading || reduxLoading || isReloading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {isReloading ? "Reloading" : "Loading"} {isServiceMode ? "services" : "products"}...
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
                  {isServiceMode ? "Services" : "Products"} ({filteredItems.length})
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
                          <span className="text-gray-900 dark:text-gray-100 truncate">{item.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
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
