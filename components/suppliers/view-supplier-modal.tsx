"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Phone, Mail, MapPin, ShoppingCart, Calendar, Package, User, CreditCard } from "lucide-react"
import { getSupplierWithPurchases } from "@/app/actions/supplier-actions"
import { useSelector } from "react-redux"
import type { RootState } from "@/store/store"

interface ViewSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  supplierId: number
  userId: number
}

interface SupplierData {
  supplier: {
    id: number
    name: string
    phone: string
    email?: string
    address?: string
    total_purchases: number
    total_amount: number
    paid_amount: number
    balance_amount: number
    outstanding_balance: number
    created_at?: string
  }
  purchases: any[]
}

function ViewSupplierModal({ isOpen, onClose, supplierId, userId }: ViewSupplierModalProps) {
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currency = useSelector((state: RootState) => state.device.currency) || "AED"

  useEffect(() => {
    if (isOpen && supplierId) {
      loadSupplierData()
    }
  }, [isOpen, supplierId])

  const loadSupplierData = () => {
    setIsLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        const response = await getSupplierWithPurchases(supplierId, userId)
        if (response.success) {
          setSupplierData(response.data)
        } else {
          setError(response.message || "Failed to load supplier details")
        }
      } catch (err) {
        console.error("Load supplier error:", err)
        setError("An unexpected error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }

  const formatCurrency = (value: any): string => {
    try {
      const num = Number(value) || 0
      return `${currency} ${num.toFixed(2)}`
    } catch {
      return `${currency} 0.00`
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "N/A"
    }
  }

  const formatDateTime = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "N/A"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <DialogHeader className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <User className="h-6 w-6 mr-2 text-blue-600" />
            Supplier Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading supplier details...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-red-500 mb-4 text-lg">{error}</div>
            <Button onClick={loadSupplierData} variant="outline" className="bg-blue-50 hover:bg-blue-100">
              Try Again
            </Button>
          </div>
        ) : supplierData ? (
          <div className="space-y-6">
            {/* Supplier Information Card */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      {supplierData.supplier.name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <Phone className="h-5 w-5 mr-3 text-green-600" />
                          <span className="font-medium">{supplierData.supplier.phone}</span>
                        </div>
                        {supplierData.supplier.email && (
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <Mail className="h-5 w-5 mr-3 text-blue-600" />
                            <span className="font-medium">{supplierData.supplier.email}</span>
                          </div>
                        )}
                        {supplierData.supplier.address && (
                          <div className="flex items-center text-gray-700 dark:text-gray-300">
                            <MapPin className="h-5 w-5 mr-3 text-red-600" />
                            <span className="font-medium">{supplierData.supplier.address}</span>
                          </div>
                        )}
                      </div>
                      {supplierData.supplier.created_at && (
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">Supplier Since</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-end">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            {formatDate(supplierData.supplier.created_at)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30">
                    <div className="flex items-center justify-center mb-3">
                      <ShoppingCart className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {supplierData.supplier.total_purchases}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Purchases</div>
                  </div>
                  <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800/30">
                    <div className="flex items-center justify-center mb-3">
                      <CreditCard className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {formatCurrency(supplierData.supplier.total_amount)}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</div>
                  </div>
                  <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex items-center justify-center mb-3">
                      <CreditCard className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                      {formatCurrency(supplierData.supplier.paid_amount)}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</div>
                  </div>
                  <div className="text-center bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800/30">
                    <div className="flex items-center justify-center mb-3">
                      <CreditCard className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 mb-1">
                      {formatCurrency(supplierData.supplier.balance_amount)}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Credit</div>
                  </div>
                  <div className="text-center bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800/30">
                    <div className="flex items-center justify-center mb-3">
                      <CreditCard className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-700 dark:text-red-300 mb-1">
                      {formatCurrency(supplierData.supplier.outstanding_balance)}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase History */}
            <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl border border-gray-200 dark:border-gray-700">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                    <Package className="h-6 w-6 mr-3 text-purple-600" />
                    Purchase History
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 border border-purple-200 dark:border-purple-700"
                  >
                    {supplierData.purchases.length} Purchases
                  </Badge>
                </div>

                {supplierData.purchases.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <div className="text-xl text-gray-500 dark:text-gray-400 mb-2">No purchases found</div>
                    <div className="text-gray-400 dark:text-gray-500">This supplier has no purchase history yet.</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supplierData.purchases.slice(0, 10).map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              Purchase #{purchase.id}
                            </span>
                            <Badge
                              variant={purchase.status === "Paid" ? "default" : "secondary"}
                              className={
                                purchase.status === "Paid"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-orange-100 text-orange-800 border-orange-200"
                              }
                            >
                              {purchase.status}
                            </Badge>
                            {purchase.status === "Credit" && purchase.received_amount > 0 && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Partial Payment
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-400 space-x-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span className="font-medium">{formatDate(purchase.purchase_date)}</span>
                            </div>
                            {purchase.items_count && (
                              <div className="flex items-center">
                                <Package className="h-4 w-4 mr-2" />
                                <span className="font-medium">{purchase.items_count} items</span>
                              </div>
                            )}
                          </div>
                          {purchase.status === "Credit" && (
                            <div className="mt-2 text-sm">
                              <div className="text-gray-600 dark:text-gray-400">
                                Paid:{" "}
                                <span className="font-semibold text-green-600 dark:text-green-300">
                                  {formatCurrency(purchase.received_amount || 0)}
                                </span>
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">
                                Balance:{" "}
                                <span className="font-semibold text-red-600 dark:text-red-300">
                                  {formatCurrency((purchase.total_amount || 0) - (purchase.received_amount || 0))}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {formatCurrency(purchase.total_amount)}
                          </div>
                          {purchase.status === "Paid" && (
                            <div className="text-sm text-green-600 dark:text-green-300 font-medium">Fully Paid</div>
                          )}
                          {purchase.notes && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 max-w-32 truncate">
                              {purchase.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {supplierData.purchases.length > 10 && (
                      <div className="text-center text-gray-500 dark:text-gray-400 pt-4 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <div className="text-lg font-medium">
                          Showing 10 of {supplierData.purchases.length} purchases
                        </div>
                        <div className="text-sm">View all purchases in the purchases tab</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="flex justify-end pt-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-8 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ViewSupplierModal
