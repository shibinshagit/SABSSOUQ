"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Loader2,
  Truck,
  Calendar,
  CreditCard,
  Package,
  Receipt,
  DollarSign,
  Building,
  Edit,
  Trash2,
  Clock,
  User,
  Printer,
} from "lucide-react"
import { getPurchaseById } from "@/app/actions/purchase-actions"
import { getDeviceCurrency } from "@/app/actions/dashboard-actions"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { printPurchaseReceipt } from "@/lib/receipt-utils"

interface ViewPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseId: number
  currency?: string
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

export default function ViewPurchaseModal({
  isOpen,
  onClose,
  purchaseId,
  currency = "AED",
  onEdit,
  onDelete,
}: ViewPurchaseModalProps) {
  const [purchase, setPurchase] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deviceCurrency, setDeviceCurrency] = useState(currency)
  const { toast } = useToast()

  // Format currency with the device currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
    if (isNaN(numAmount)) return `${deviceCurrency} 0.00`
    return `${deviceCurrency} ${numAmount.toFixed(2)}`
  }

  // Format date safely
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "PPP 'at' p")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Fetch device currency
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const userId = localStorage.getItem("userId")
        if (userId) {
          const fetchedCurrency = await getDeviceCurrency(Number.parseInt(userId))
          setDeviceCurrency(fetchedCurrency)
        }
      } catch (error) {
        console.error("Error fetching currency:", error)
        setDeviceCurrency("AED") // Fallback
      }
    }

    if (isOpen) {
      fetchCurrency()
    }
  }, [isOpen])

  useEffect(() => {
    const fetchPurchase = async () => {
      if (!isOpen || !purchaseId) return

      try {
        setIsLoading(true)
        console.log("Fetching purchase details for ID:", purchaseId)

        const response = await getPurchaseById(purchaseId)
        console.log("Purchase details response:", response)

        if (response.success && response.data) {
          setPurchase(response.data)
        } else {
          console.error("Failed to fetch purchase:", response.message)
          toast({
            title: "Error",
            description: response.message || "Failed to load purchase details",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching purchase:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPurchase()
  }, [isOpen, purchaseId, toast])

  // Calculate totals from items
  const calculateTotals = () => {
    if (!purchase?.items || !Array.isArray(purchase.items)) {
      return { subtotal: 0, total: 0 }
    }

    const subtotal = purchase.items.reduce((sum: number, item: any) => {
      const price = Number.parseFloat(item.price) || 0
      const quantity = Number.parseInt(item.quantity) || 0
      return sum + price * quantity
    }, 0)

    return { subtotal, total: subtotal }
  }

  const { subtotal, total } = purchase ? calculateTotals() : { subtotal: 0, total: 0 }

  // Calculate received and remaining amounts
  const receivedAmount = purchase?.received_amount || 0
  const totalAmount = purchase?.total_amount || total
  const remainingAmount = Math.max(0, totalAmount - receivedAmount)

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <DialogHeader className="bg-white dark:bg-gray-900 p-6 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Receipt className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
              Purchase Details
            </DialogTitle>

            {/* Action Buttons - Moved to top right */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (purchase && purchase.items) {
                    printPurchaseReceipt(purchase, purchase.items, deviceCurrency)
                  }
                }}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEdit(purchaseId)
                    onClose()
                  }}
                  className="flex items-center gap-2 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onDelete(purchaseId)
                    onClose()
                  }}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12 bg-white dark:bg-gray-900 rounded-lg mx-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading purchase details...</p>
            </div>
          </div>
        ) : !purchase ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg mx-6">
            <div className="text-red-500 dark:text-red-400 text-lg font-medium">Purchase not found</div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">The requested purchase could not be loaded.</p>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {/* Purchase Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Purchase Information */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Purchase Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Purchase ID:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">#{purchase.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Date:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {purchase.purchase_date
                        ? (() => {
                            try {
                              return format(new Date(purchase.purchase_date), "PPP")
                            } catch (error) {
                              return "Invalid date"
                            }
                          })()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Payment Status:</span>
                    <Badge
                      variant="outline"
                      className={
                        purchase.status?.toLowerCase() === "paid"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-600"
                          : purchase.status?.toLowerCase() === "credit"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600"
                            : purchase.status?.toLowerCase() === "cancelled" ||
                                purchase.status?.toLowerCase() === "partial"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-600"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                      }
                    >
                      {purchase.status === "Partial" ? "Cancelled" : purchase.status || "Credit"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Payment:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {purchase.payment_method || "Cash"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center">
                      <Truck className="h-4 w-4 mr-1" />
                      Delivery:
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        purchase.purchase_status?.toLowerCase() === "delivered"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-600"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600"
                      }
                    >
                      {purchase.purchase_status || "Delivered"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Information */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <Building className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    Supplier Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">Supplier:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{purchase.supplier}</span>
                  </div>
                  {purchase.supplier_phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Phone:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{purchase.supplier_phone}</span>
                    </div>
                  )}
                  {purchase.supplier_email && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Email:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{purchase.supplier_email}</span>
                    </div>
                  )}
                  {purchase.supplier_address && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Address:</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-right">
                        {purchase.supplier_address}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timestamps Information */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Record Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Created:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-right text-sm">
                      {formatDate(purchase.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center">
                      <Edit className="h-4 w-4 mr-1" />
                      Updated:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-right text-sm">
                      {formatDate(purchase.updated_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Purchase Items */}
            <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                  Purchase Items ({purchase.items?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!purchase.items || purchase.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium">No items found</p>
                    <p className="text-sm">This purchase has no associated items.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {purchase.items.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {index + 1}
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {item.product_name}
                            </td>
                            <td className="px-4 py-4 text-sm text-center text-gray-900 dark:text-gray-100">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.price)}
                            </td>
                            <td className="px-4 py-4 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(
                                (Number.parseFloat(item.price) || 0) * (Number.parseInt(item.quantity) || 0),
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Purchase Summary */}
            <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 dark:bg-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  Purchase Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total Amount:</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                {/* Show received and remaining amounts for Credit purchases */}
                {purchase.status?.toLowerCase() === "credit" && (
                  <>
                    <div className="flex justify-between items-center py-1 border-t border-gray-200 dark:border-gray-600 pt-3">
                      <span className="text-md font-medium text-green-700 dark:text-green-400">Paid Amount:</span>
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(receivedAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-md font-medium text-red-700 dark:text-red-400">Remaining Amount:</span>
                      <span className="text-lg font-semibold text-red-600 dark:text-red-400">
                        {remainingAmount === 0 ? formatCurrency(0) : formatCurrency(remainingAmount)}
                      </span>
                    </div>
                  </>
                )}

                {/* Show full payment for Paid purchases */}
                {purchase.status?.toLowerCase() === "paid" && (
                  <div className="flex justify-between items-center py-1 border-t border-gray-200 dark:border-gray-600 pt-3">
                    <span className="text-md font-medium text-green-700 dark:text-green-400">Paid Amount:</span>
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {purchase.notes && (
              <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {purchase.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Footer with Close Button */}
        <div className="flex justify-end p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
