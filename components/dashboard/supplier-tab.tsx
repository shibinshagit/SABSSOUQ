"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  Search,
  Plus,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  DollarSign,
  MapPin,
  RefreshCw,
  CreditCard,
} from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  fetchSuppliers,
  fetchDeviceCurrency,
  deleteSupplier,
  setSearchTerm,
  setSelectedSupplierId,
  clearError,
  checkCacheExpiry,
  selectSuppliers,
  selectSuppliersLoading,
  selectSuppliersRefreshing,
  selectSuppliersError,
  selectSupplierSearchTerm,
  selectSupplierCurrency,
  selectSelectedSupplierId,
  selectFilteredSuppliers,
  selectSuppliersStats,
  selectShouldRefresh,
} from "@/store/slices/supplierSlice"
import { selectDeviceId } from "@/store/slices/deviceSlice"
import SimpleAddModal from "../suppliers/simple-add-modal"
import SimpleViewModal from "../suppliers/simple-view-modal"
import SimpleEditModal from "../suppliers/simple-edit-modal"
import PayCreditModal from "../suppliers/pay-credit-modal"

interface SupplierTabProps {
  userId: number
  isAddModalOpen?: boolean
  onModalClose?: () => void
  mockMode?: boolean
}

export default function SupplierTab({
  userId,
  isAddModalOpen = false,
  onModalClose,
  mockMode = false,
}: SupplierTabProps) {
  const dispatch = useAppDispatch()

  // Redux selectors
  const suppliers = useAppSelector(selectFilteredSuppliers)
  const allSuppliers = useAppSelector(selectSuppliers)
  const isLoading = useAppSelector(selectSuppliersLoading)
  const isRefreshing = useAppSelector(selectSuppliersRefreshing)
  const error = useAppSelector(selectSuppliersError)
  const searchTerm = useAppSelector(selectSupplierSearchTerm)
  const currency = useAppSelector(selectSupplierCurrency)
  const selectedSupplierId = useAppSelector(selectSelectedSupplierId)
  const stats = useAppSelector(selectSuppliersStats)
  const shouldRefresh = useAppSelector(selectShouldRefresh)
  const deviceId = useAppSelector(selectDeviceId)

  // Local state for modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPayCreditModal, setShowPayCreditModal] = useState(false)
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState<{
    id: number
    name: string
    balance_amount: number
  } | null>(null)

  // Load data on mount and check cache
  useEffect(() => {
    if (mockMode) return

    // Check if cache is expired
    dispatch(checkCacheExpiry())

    // Always fetch currency
    dispatch(fetchDeviceCurrency(userId))

    // If we have cached data and it's not stale, show it immediately
    if (allSuppliers.length > 0 && !shouldRefresh) {
      console.log("📦 Using cached supplier data")

      // Still fetch in background to keep data fresh
      setTimeout(() => {
        dispatch(
          fetchSuppliers({
            userId,
            searchTerm: searchTerm || undefined,
            isBackground: true,
          }),
        )
      }, 100)
    } else {
      // No cache or stale data, fetch immediately
      console.log("🔄 Fetching fresh supplier data")
      dispatch(
        fetchSuppliers({
          userId,
          searchTerm: searchTerm || undefined,
          forceRefresh: true,
        }),
      )
    }
  }, [dispatch, userId, mockMode, allSuppliers.length, shouldRefresh, searchTerm])

  // Handle search with debouncing
  const handleSearch = useCallback(
    (term: string) => {
      dispatch(setSearchTerm(term))

      // Debounced search - only search server if term is different from cached search
      const timeoutId = setTimeout(() => {
        if (term.trim() !== searchTerm) {
          dispatch(
            fetchSuppliers({
              userId,
              searchTerm: term.trim() || undefined,
              isBackground: allSuppliers.length > 0, // Background if we have cached data
            }),
          )
        }
      }, 500)

      return () => clearTimeout(timeoutId)
    },
    [dispatch, userId, searchTerm, allSuppliers.length],
  )

  // Handle delete with optimistic updates
  const handleDelete = async (supplierId: number, supplierName: string) => {
    if (!window.confirm(`Delete supplier "${supplierName}"?`)) return

    try {
      await dispatch(deleteSupplier({ supplierId, userId })).unwrap()
    } catch (error) {
      console.error("Delete error:", error)
      alert(typeof error === "string" ? error : "Failed to delete supplier")
    }
  }

  // Modal handlers
  const handleView = (supplierId: number) => {
    dispatch(setSelectedSupplierId(supplierId))
    setShowViewModal(true)
  }

  const handleEdit = (supplierId: number) => {
    dispatch(setSelectedSupplierId(supplierId))
    setShowEditModal(true)
  }

  const handleAdd = () => setShowAddModal(true)

  // Payment modal handlers
  const handlePayCredit = (supplier: { id: number; name: string; balance_amount: number }) => {
    setSelectedSupplierForPayment(supplier)
    setShowPayCreditModal(true)
  }

  const handleModalClose = () => {
    setShowAddModal(false)
    setShowViewModal(false)
    setShowEditModal(false)
    setShowPayCreditModal(false)
    setSelectedSupplierForPayment(null)
    dispatch(setSelectedSupplierId(null))
    if (onModalClose) onModalClose()
  }

  const handleModalSuccess = () => {
    // Refresh supplier data after successful operations
    dispatch(
      fetchSuppliers({
        userId,
        searchTerm: searchTerm || undefined,
        forceRefresh: true,
      }),
    )
    handleModalClose()
  }

  // Manual refresh
  const handleRefresh = () => {
    dispatch(clearError())
    dispatch(
      fetchSuppliers({
        userId,
        searchTerm: searchTerm || undefined,
        forceRefresh: true,
      }),
    )
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    try {
      return `${currency} ${amount.toFixed(2)}`
    } catch {
      return `${currency} 0.00`
    }
  }

  // Handle external add modal
  useEffect(() => {
    if (isAddModalOpen) setShowAddModal(true)
  }, [isAddModalOpen])

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header with stats and controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Suppliers</h1>
                {isRefreshing && <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.total > 0
                  ? `${stats.total} suppliers • ${formatCurrency(stats.totalAmount)} total • ${formatCurrency(stats.totalBalance)} balance`
                  : "No suppliers found"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-64 h-9"
              />
            </div>

            {/* Refresh button */}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="h-9">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>

            {/* Add button */}
            <Button onClick={handleAdd} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-9">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6 dark:bg-gray-900">
        {isLoading && allSuppliers.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-blue-600" />
            <span className="text-gray-600 dark:text-gray-300">Loading suppliers...</span>
          </div>
        ) : error && allSuppliers.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
              <Button onClick={handleRefresh} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : suppliers.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm ? "No suppliers match your search" : "No suppliers found"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm ? "Try adjusting your search terms" : "Get started by adding your first supplier"}
              </p>
              {!searchTerm && (
                <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Supplier
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Suppliers List */}
            <div className="space-y-2">
              {suppliers.map((supplier) => (
                <Card
                  key={supplier.id}
                  className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow dark:border-gray-700"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      {/* Left: Supplier Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
                              {supplier.name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1 text-green-600" />
                                <span className="truncate">{supplier.phone}</span>
                              </div>
                              {supplier.email && (
                                <div className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1 text-blue-600" />
                                  <span className="truncate max-w-32">{supplier.email}</span>
                                </div>
                              )}
                              {supplier.address && (
                                <div className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1 text-gray-500" />
                                  <span className="truncate max-w-32">{supplier.address}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-1 ml-4">
                            {/* Pay Credit Button - Only show if supplier has credit balance */}
                            {(supplier.balance_amount || 0) > 0 && (
                              <Button
                                size="sm"
                                className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs"
                                onClick={() =>
                                  handlePayCredit({
                                    id: supplier.id,
                                    name: supplier.name,
                                    balance_amount: supplier.balance_amount || 0,
                                  })
                                }
                              >
                                <CreditCard className="h-3 w-3 mr-1" />
                                Pay Credit
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50"
                              onClick={() => handleView(supplier.id)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50"
                              onClick={() => handleEdit(supplier.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(supplier.id, supplier.name)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Financial Stats */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center space-x-6 text-sm">
                            <div className="flex items-center">
                              <TrendingUp className="h-3 w-3 text-blue-600 mr-1" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {supplier.total_purchases}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 ml-1">purchases</span>
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 text-green-600 mr-1" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {formatCurrency(supplier.total_amount || 0)}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 ml-1">total</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm">
                            <div className="text-right">
                              <div className="font-medium text-green-600">
                                {formatCurrency(supplier.paid_amount || 0)}
                              </div>
                              <div className="text-xs text-gray-500">Paid</div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`font-medium ${(supplier.balance_amount || 0) > 0 ? "text-orange-600" : "text-green-600"}`}
                              >
                                {formatCurrency(supplier.balance_amount || 0)}
                              </div>
                              <div className="text-xs text-gray-500">Balance</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SimpleAddModal isOpen={showAddModal} onClose={handleModalClose} onSuccess={handleModalSuccess} userId={userId} />

      {selectedSupplierId && (
        <>
          <SimpleViewModal
            isOpen={showViewModal}
            onClose={handleModalClose}
            supplierId={selectedSupplierId}
            userId={userId}
          />
          <SimpleEditModal
            isOpen={showEditModal}
            onClose={handleModalClose}
            onSuccess={handleModalSuccess}
            supplierId={selectedSupplierId}
            userId={userId}
          />
        </>
      )}

      {/* Pay Credit Modal */}
      {selectedSupplierForPayment && (
        <PayCreditModal
          isOpen={showPayCreditModal}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          supplier={selectedSupplierForPayment}
          userId={userId}
          deviceId={deviceId || 0}
        />
      )}
    </div>
  )
}
