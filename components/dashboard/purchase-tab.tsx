"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CreditCard, BanknoteIcon, Globe, Search, Plus, RefreshCw, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { deletePurchase } from "@/app/actions/purchase-actions"
import NewPurchaseModal from "../purchases/new-purchase-modal"
import ViewPurchaseModal from "../purchases/view-purchase-modal"
import EditPurchaseModal from "../purchases/edit-purchase-modal"
import { Input } from "@/components/ui/input"
import { PdfExportButton } from "@/components/ui/pdf-export-button"
import { useSelector, useDispatch } from "react-redux"
import { selectDeviceId } from "@/store/slices/deviceSlice"
import { Skeleton } from "@/components/ui/skeleton"
import type { AppDispatch } from "@/store/store"
import {
  fetchPurchases,
  fetchSuppliers,
  fetchCurrency,
  setFilters,
  clearAllFilters,
  clearCache,
  applyFilters,
  deletePurchase as deletePurchaseFromStore,
  selectPurchases,
  selectFilteredPurchases,
  selectSuppliers,
  selectCurrency,
  selectFilters,
  selectIsLoading,
  selectIsBackgroundRefreshing,
  selectError,
  selectLastUpdated,
} from "@/store/slices/purchaseSlice"

import { format } from "date-fns"
import {
  CalendarDays,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  ChevronDown,
  Truck,
  FileText,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PurchaseTabProps {
  userId: number
  isAddModalOpen?: boolean
  onModalClose?: () => void
  mockMode?: boolean
}

// Constants for performance optimization
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const DEBOUNCE_DELAY = 500 // 500ms for search debouncing

export default function PurchaseTab({
  userId,
  isAddModalOpen = false,
  onModalClose,
  mockMode = false,
}: PurchaseTabProps) {
  const dispatch = useDispatch<AppDispatch>()
  const deviceId = useSelector(selectDeviceId)

  // Redux selectors
  const purchases = useSelector(selectPurchases)
  const filteredPurchases = useSelector(selectFilteredPurchases)
  const suppliers = useSelector(selectSuppliers)
  const currency = useSelector(selectCurrency)
  const filters = useSelector(selectFilters)
  const isLoading = useSelector(selectIsLoading)
  const isBackgroundRefreshing = useSelector(selectIsBackgroundRefreshing)
  const error = useSelector(selectError)
  const lastUpdated = useSelector(selectLastUpdated)

  const { toast } = useToast()
  const [showAddModal, setShowAddModal] = useState(isAddModalOpen)

  // Modal states
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Filter modal states
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false)
  const [tempDateFrom, setTempDateFrom] = useState("")
  const [tempDateTo, setTempDateTo] = useState("")
  const [isAmountFilterModalOpen, setIsAmountFilterModalOpen] = useState(false)
  const [tempMinAmount, setTempMinAmount] = useState("")
  const [tempMaxAmount, setTempMaxAmount] = useState("")
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("")

  // Search debouncing
  const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Use refs to track initialization and prevent duplicate requests
  const isInitializedRef = useRef(false)
  const isLoadingRef = useRef(false)
  const lastFetchRef = useRef<number>(0)

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (localSearchTerm !== filters.searchTerm) {
        dispatch(setFilters({ searchTerm: localSearchTerm }))
      }
    }, DEBOUNCE_DELAY)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [localSearchTerm, dispatch, filters.searchTerm])

  // Stable callbacks that don't change on every render
  const needsRefresh = useCallback(() => {
    if (!lastUpdated) return true
    return Date.now() - lastUpdated > CACHE_DURATION
  }, [lastUpdated])

  const formatCurrency = useCallback((amount: number | string | null | undefined) => {
    const numAmount = typeof amount === "number" ? amount : Number.parseFloat(String(amount || 0))
    const validAmount = isNaN(numAmount) ? 0 : numAmount
    return `${currency} ${validAmount.toFixed(2)}`
  }, [currency])

  // Memoized computed values
  const hasActiveFilters = useMemo(() => {
    return (
      filters.statusFilter !== "all" ||
      filters.supplierFilter !== "all" ||
      filters.paymentMethodFilter !== "all" ||
      filters.deliveryStatusFilter !== "all" ||
      filters.dateRangeFilter !== "all" ||
      filters.dateFromFilter ||
      filters.dateToFilter ||
      filters.minAmountFilter ||
      filters.maxAmountFilter ||
      filters.searchTerm.trim()
    )
  }, [filters])

  const getLastUpdatedText = useMemo(() => {
    if (!lastUpdated) return ""
    const now = Date.now()
    const diff = now - lastUpdated
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Just updated"
    if (minutes === 1) return "1 minute ago"
    if (minutes < 60) return `${minutes} minutes ago`

    const hours = Math.floor(minutes / 60)
    if (hours === 1) return "1 hour ago"
    if (hours < 24) return `${hours} hours ago`

    return "More than a day ago"
  }, [lastUpdated])

  // Memoized filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) =>
      supplier.toLowerCase().includes(supplierSearchTerm.toLowerCase())
    )
  }, [suppliers, supplierSearchTerm])

  // Modal state synchronization - only update if different
  useEffect(() => {
    if (isAddModalOpen !== showAddModal) {
      setShowAddModal(isAddModalOpen)
    }
  }, [isAddModalOpen])

  // Optimized initial data loading with better error handling and request deduplication
  useEffect(() => {
    if (!deviceId || mockMode || isInitializedRef.current || isLoadingRef.current) {
      return
    }

    const loadInitialData = async () => {
      const now = Date.now()
      
      // Prevent duplicate requests within 1 second
      if (now - lastFetchRef.current < 1000) {
        console.log('Skipping duplicate fetch request')
        return
      }

      lastFetchRef.current = now
      isLoadingRef.current = true
      
      try {
        console.log('Loading initial purchase data...')
        
        // Fetch currency and suppliers in parallel - these are lightweight
        const [currencyResult, suppliersResult] = await Promise.allSettled([
          dispatch(fetchCurrency(userId)).unwrap(),
          dispatch(fetchSuppliers()).unwrap()
        ])

        // Log results for debugging
        if (currencyResult.status === 'rejected') {
          console.error('Failed to fetch currency:', currencyResult.reason)
        }
        if (suppliersResult.status === 'rejected') {
          console.error('Failed to fetch suppliers:', suppliersResult.reason)
        }

        // Handle purchases based on cache status
        if (needsRefresh()) {
          console.log('Cache expired, forcing refresh')
          dispatch(clearCache())
          await dispatch(fetchPurchases({ deviceId, forceRefresh: true })).unwrap()
        } else if (purchases.length === 0) {
          console.log('No purchases in cache, fetching...')
          await dispatch(fetchPurchases({ deviceId })).unwrap()
        } else {
          console.log('Using cached purchases data')
        }

        isInitializedRef.current = true
        console.log('Initial data loading completed')
      } catch (error) {
        console.error('Error loading initial data:', error)
        toast({
          title: "Loading Error",
          description: "Failed to load purchase data. Please try refreshing.",
          variant: "destructive",
        })
      } finally {
        isLoadingRef.current = false
      }
    }

    loadInitialData()
  }, [deviceId, userId, mockMode, dispatch, needsRefresh, purchases.length, toast])

  // Optimized filter application with throttling
  useEffect(() => {
    if (isInitializedRef.current && purchases.length > 0) {
      // Use requestAnimationFrame to avoid blocking the UI
      const timeoutId = setTimeout(() => {
        dispatch(applyFilters())
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [filters, dispatch, purchases.length])

  // Optimized delete handler with better error handling
  const handleDelete = useCallback(async (id: number) => {
    if (!deviceId) {
      toast({
        title: "Error",
        description: "Device ID not found",
        variant: "destructive",
      })
      return
    }

    if (!window.confirm("Are you sure you want to delete this purchase?")) {
      return
    }

    try {
      console.log(`Deleting purchase ${id}...`)
      const response = await deletePurchase(id, deviceId)
      
      if (response.success) {
        dispatch(deletePurchaseFromStore(id))
        toast({
          title: "Success",
          description: response.message || "Purchase deleted successfully",
        })
        console.log(`Purchase ${id} deleted successfully`)
      } else {
        throw new Error(response.message || "Failed to delete purchase")
      }
    } catch (error) {
      console.error("Error deleting purchase:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      })
    }
  }, [deviceId, dispatch, toast])

  const handleView = useCallback((id: number) => {
    setSelectedPurchaseId(id)
    setIsViewModalOpen(true)
  }, [])

  const handleEdit = useCallback((id: number) => {
    setSelectedPurchaseId(id)
    setIsEditModalOpen(true)
  }, [])

  // Optimized refresh handler with request throttling
  const handleRefresh = useCallback(() => {
    if (!deviceId || isLoadingRef.current) {
      return
    }

    const now = Date.now()
    
    // Prevent too frequent refresh requests
    if (now - lastFetchRef.current < 2000) {
      toast({
        title: "Please wait",
        description: "Please wait a moment before refreshing again.",
      })
      return
    }

    lastFetchRef.current = now
    console.log('Manual refresh triggered')
    
    dispatch(clearCache())
    dispatch(fetchPurchases({ deviceId, forceRefresh: true }))
      .unwrap()
      .then(() => {
        toast({
          title: "Refreshed",
          description: "Purchase data has been updated.",
        })
      })
      .catch((error) => {
        console.error("Refresh error:", error)
        toast({
          title: "Refresh Failed",
          description: "Failed to refresh data. Please try again.",
          variant: "destructive",
        })
      })
  }, [deviceId, dispatch, toast])

  // Stable status badge functions
  const getStatusBadge = useCallback((status: string) => {
    const normalizedStatus = status?.toLowerCase() || ""
    
    switch (normalizedStatus) {
      case "paid":
      case "completed":
      case "received":
        return <Badge className="bg-green-500 text-white">Paid</Badge>
      case "credit":
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Credit</Badge>
      case "cancelled":
      case "partial":
        return <Badge className="bg-red-500 text-white">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>
    }
  }, [])

  const getPurchaseStatusBadge = useCallback((status: string) => {
    if (!status) return <Badge variant="outline">Delivered</Badge>

    const normalizedStatus = status.toLowerCase()
    
    switch (normalizedStatus) {
      case "delivered":
        return <Badge className="bg-green-500 text-white">Delivered</Badge>
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }, [])

  const getPaymentMethodIcon = useCallback((method: string) => {
    if (!method) return null

    const normalizedMethod = method.toLowerCase()
    
    switch (normalizedMethod) {
      case "card":
        return <CreditCard className="h-4 w-4 text-blue-600" />
      case "cash":
        return <BanknoteIcon className="h-4 w-4 text-green-600" />
      case "online":
        return <Globe className="h-4 w-4 text-purple-600" />
      default:
        return null
    }
  }, [])

  // Date filter handlers with stable callbacks
  const handleTodayFilter = useCallback(() => {
    const today = new Date()
    const formattedDate = format(today, "yyyy-MM-dd")

    dispatch(
      setFilters({
        dateRangeFilter: "today",
        dateFromFilter: formattedDate,
        dateToFilter: formattedDate,
      }),
    )
  }, [dispatch])

  const handleThisWeekFilter = useCallback(() => {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))

    dispatch(
      setFilters({
        dateRangeFilter: "thisweek",
        dateFromFilter: format(startOfWeek, "yyyy-MM-dd"),
        dateToFilter: format(endOfWeek, "yyyy-MM-dd"),
      }),
    )
  }, [dispatch])

  const handleThisMonthFilter = useCallback(() => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    dispatch(
      setFilters({
        dateRangeFilter: "thismonth",
        dateFromFilter: format(startOfMonth, "yyyy-MM-dd"),
        dateToFilter: format(endOfMonth, "yyyy-MM-dd"),
      }),
    )
  }, [dispatch])

  // Modal handlers with stable callbacks
  const openDateFilterModal = useCallback(() => {
    setTempDateFrom(filters.dateFromFilter || "")
    setTempDateTo(filters.dateToFilter || "")
    setIsDateFilterModalOpen(true)
  }, [filters.dateFromFilter, filters.dateToFilter])

  const handleDateFilterApply = useCallback(() => {
    dispatch(
      setFilters({
        dateFromFilter: tempDateFrom,
        dateToFilter: tempDateTo,
        dateRangeFilter: "custom",
      }),
    )
    setIsDateFilterModalOpen(false)
  }, [dispatch, tempDateFrom, tempDateTo])

  const handleClearDateFilter = useCallback(() => {
    dispatch(
      setFilters({
        dateFromFilter: "",
        dateToFilter: "",
        dateRangeFilter: "all",
      }),
    )
    setTempDateFrom("")
    setTempDateTo("")
    setIsDateFilterModalOpen(false)
  }, [dispatch])

  const openAmountFilterModal = useCallback(() => {
    setTempMinAmount(filters.minAmountFilter || "")
    setTempMaxAmount(filters.maxAmountFilter || "")
    setIsAmountFilterModalOpen(true)
  }, [filters.minAmountFilter, filters.maxAmountFilter])

  const handleAmountFilterApply = useCallback(() => {
    dispatch(
      setFilters({
        minAmountFilter: tempMinAmount,
        maxAmountFilter: tempMaxAmount,
      }),
    )
    setIsAmountFilterModalOpen(false)
  }, [dispatch, tempMinAmount, tempMaxAmount])

  const handleClearAmountFilter = useCallback(() => {
    dispatch(
      setFilters({
        minAmountFilter: "",
        maxAmountFilter: "",
      }),
    )
    setTempMinAmount("")
    setTempMaxAmount("")
    setIsAmountFilterModalOpen(false)
  }, [dispatch])

  // Display text functions - moved to useMemo for stability
  const getStatusDisplayText = useMemo(() => {
    switch (filters.statusFilter) {
      case "paid": return "Paid"
      case "credit": return "Credit"
      case "cancelled": return "Cancelled"
      default: return "All Status"
    }
  }, [filters.statusFilter])

  const getPaymentMethodDisplayText = useMemo(() => {
    switch (filters.paymentMethodFilter) {
      case "cash": return "Cash"
      case "card": return "Card"
      case "online": return "Online"
      default: return "All Payment"
    }
  }, [filters.paymentMethodFilter])

  const getDeliveryStatusDisplayText = useMemo(() => {
    switch (filters.deliveryStatusFilter) {
      case "delivered": return "Delivered"
      case "pending": return "Pending"
      default: return "All Delivery"
    }
  }, [filters.deliveryStatusFilter])

  // Optimized modal close handlers
  const handleAddModalClose = useCallback(() => {
    setShowAddModal(false)
    if (onModalClose) onModalClose()
  }, [onModalClose])

  const handleEditModalClose = useCallback(() => {
    setIsEditModalOpen(false)
  }, [])

  // Optimized data refresh handlers
  const handlePurchaseAdded = useCallback(() => {
    if (deviceId && !mockMode && !isLoadingRef.current) {
      console.log('Purchase added, refreshing data...')
      dispatch(fetchPurchases({ deviceId }))
    }
  }, [deviceId, mockMode, dispatch])

  const handlePurchaseUpdated = useCallback(() => {
    if (deviceId && !mockMode && !isLoadingRef.current) {
      console.log('Purchase updated, refreshing data...')
      dispatch(fetchPurchases({ deviceId }))
    }
  }, [deviceId, mockMode, dispatch])

  // Optimized print handler with better error handling
  const handlePrint = useCallback(() => {
    if (filteredPurchases.length === 0) {
      toast({
        title: "No Data",
        description: "No purchases to print",
        variant: "destructive",
      })
      return
    }

    try {
      const printWindow = window.open("", "_blank", "width=800,height=900,scrollbars=yes")
      if (!printWindow) {
        toast({
          title: "Print Blocked",
          description: "Please allow pop-ups to print reports",
          variant: "destructive",
        })
        return
      }

      const currentDate = new Date().toLocaleDateString("en-GB")
      const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })

      // Calculate summary data with error handling
      const totalAmount = filteredPurchases.reduce((sum, p) => {
        const amount = Number(p.total_amount)
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
      
      const paidAmount = filteredPurchases.reduce((sum, p) => {
        const amount = Number(p.received_amount)
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
      
      const outstandingAmount = filteredPurchases.reduce((sum, p) => {
        const total = Number(p.total_amount) || 0
        const paid = Number(p.received_amount) || 0
        return sum + Math.max(0, total - paid)
      }, 0)

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Purchase Report - SABS SOUQ</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            @media print {
              @page { size: A4; margin: 0.5cm; }
              .no-print { display: none !important; }
            }
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
              font-family: 'Inter', sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #1f2937;
            }
            
            .header {
              text-align: center;
              margin-bottom: 1rem;
              padding: 1rem;
              border-bottom: 2px solid #000;
            }
            
            .company-name {
              font-size: 1.5rem;
              font-weight: 700;
              margin-bottom: 0.25rem;
            }
            
            .report-title {
              font-size: 1.1rem;
              font-weight: 600;
              margin: 0.5rem 0;
              color: #dc2626;
            }
            
            .report-info {
              font-size: 0.8rem;
              color: #6b7280;
            }
            
            .summary {
              display: flex;
              justify-content: space-around;
              margin: 1rem 0;
              padding: 0.75rem;
              background: #f9fafb;
              border: 1px solid #e5e7eb;
            }
            
            .summary-item {
              text-align: center;
            }
            
            .summary-label {
              font-size: 0.7rem;
              color: #6b7280;
              text-transform: uppercase;
            }
            
            .summary-value {
              font-size: 0.9rem;
              font-weight: 600;
              color: #111827;
            }
            
            .table-container {
              margin: 1rem 0;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.75rem;
            }
            
            th, td {
              padding: 0.4rem 0.3rem;
              text-align: left;
              border: 1px solid #d1d5db;
            }
            
            th {
              background: #f3f4f6;
              font-weight: 600;
              color: #374151;
              text-transform: uppercase;
              font-size: 0.65rem;
            }
            
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .status-paid { color: #10b981; font-weight: 500; }
            .status-credit { color: #f59e0b; font-weight: 500; }
            .status-cancelled { color: #ef4444; font-weight: 500; }
            
            .print-buttons {
              text-align: center;
              margin: 1rem 0;
            }
            
            .print-button {
              padding: 0.5rem 1rem;
              margin: 0 0.5rem;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 0.25rem;
              cursor: pointer;
              font-family: inherit;
            }
            
            .print-button:hover { background: #1d4ed8; }
            .print-button.secondary { background: #6b7280; }
            .print-button.secondary:hover { background: #4b5563; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">SABS SOUQ</div>
            <div style="font-size: 0.7rem; color: #6b7280;">Karama, opp. Al Rayan Hotel, Ajman - UAE | +971 566770889</div>
            <div class="report-title">Purchase Report</div>
            <div class="report-info">Generated on ${currentDate} at ${currentTime}</div>
          </div>
          
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Purchases</div>
              <div class="summary-value">${filteredPurchases.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Amount</div>
              <div class="summary-value">${formatCurrency(totalAmount)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Paid Amount</div>
              <div class="summary-value">${formatCurrency(paidAmount)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Outstanding</div>
              <div class="summary-value">${formatCurrency(outstandingAmount)}</div>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th style="width: 5%;">#</th>
                  <th style="width: 8%;">ID</th>
                  <th style="width: 20%;">Supplier</th>
                  <th style="width: 12%;">Date</th>
                  <th style="width: 12%;">Amount</th>
                  <th style="width: 12%;">Paid</th>
                  <th style="width: 12%;">Remaining</th>
                  <th style="width: 10%;">Status</th>
                  <th style="width: 9%;">Delivery</th>
                </tr>
              </thead>
              <tbody>
                ${filteredPurchases
                  .map((purchase, index) => {
                    const totalAmount = Number(purchase.total_amount || 0)
                    const paidAmount = Number(purchase.received_amount || 0)
                    const remainingAmount = Math.max(0, totalAmount - paidAmount)

                    return `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td class="text-center">#${purchase.id}</td>
                      <td>${purchase.supplier || "N/A"}</td>
                      <td>${new Date(purchase.purchase_date).toLocaleDateString("en-GB")}</td>
                      <td class="text-right">${formatCurrency(totalAmount)}</td>
                      <td class="text-right">${formatCurrency(paidAmount)}</td>
                      <td class="text-right">${formatCurrency(remainingAmount)}</td>
                      <td class="status-${purchase.status?.toLowerCase() || "pending"}">${purchase.status || "Pending"}</td>
                      <td>${purchase.purchase_status || "Pending"}</td>
                    </tr>
                  `
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <div class="print-buttons no-print">
            <button class="print-button" onclick="window.print()">Print Report</button>
            <button class="print-button secondary" onclick="window.close()">Close</button>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `)

      printWindow.document.close()
      console.log('Print report generated successfully')
    } catch (error) {
      console.error('Print error:', error)
      toast({
        title: "Print Error",
        description: "Failed to generate print report. Please try again.",
        variant: "destructive",
      })
    }
  }, [filteredPurchases, formatCurrency, toast])

  return (
    <div className="space-y-4 dark:bg-gray-900">
      <Card className="overflow-hidden rounded-xl shadow-md border-0 dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0">
          {/* Search and Filter Section */}
          <div className="p-4 space-y-4">
            {/* Search Bar and Action Buttons Row - Mobile Responsive */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
              {/* Search Bar - Full width on mobile, half width on desktop */}
              <div className="relative flex-1 lg:max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search purchases by supplier, ID, status, or amount..."
                  className="pl-8 dark:text-white dark:placeholder-gray-400"
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                />
              </div>

              {/* Action Buttons - Responsive grid */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* Last Updated Status */}
                {lastUpdated && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent text-xs sm:text-sm whitespace-nowrap"
                    disabled
                  >
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{getLastUpdatedText}</span>
                    <span className="sm:hidden">Updated</span>
                    {isBackgroundRefreshing && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent text-xs sm:text-sm whitespace-nowrap"
                >
                  <RefreshCw className={`h-4 w-4 flex-shrink-0 ${isLoading ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs sm:text-sm whitespace-nowrap"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Print</span>
                </Button>

                <Button
                  onClick={() => setShowAddModal(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs sm:text-sm whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Add Purchase</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </div>

            {/* Filter Buttons - Mobile Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap gap-2 mb-4">
              {/* Date Filters */}
              <Button
                onClick={handleTodayFilter}
                variant={filters.dateRangeFilter === "today" ? "default" : "outline"}
                size="sm"
                className="flex items-center justify-center gap-1 sm:gap-2 dark:text-blue-400 text-xs sm:text-sm min-w-0"
              >
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Today</span>
              </Button>

              <Button
                onClick={handleThisWeekFilter}
                variant={filters.dateRangeFilter === "thisweek" ? "default" : "outline"}
                size="sm"
                className="flex items-center justify-center gap-1 sm:gap-2 dark:text-blue-400 text-xs sm:text-sm min-w-0"
              >
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">This Week</span>
              </Button>

              <Button
                onClick={handleThisMonthFilter}
                variant={filters.dateRangeFilter === "thismonth" ? "default" : "outline"}
                size="sm"
                className="flex items-center justify-center gap-1 sm:gap-2 dark:text-blue-400 text-xs sm:text-sm min-w-0"
              >
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">This Month</span>
              </Button>

              {/* Custom Date Range Button */}
              <Button
                onClick={openDateFilterModal}
                variant={filters.dateFromFilter || filters.dateToFilter ? "default" : "outline"}
                size="sm"
                className="flex items-center justify-center gap-1 sm:gap-2 dark:text-blue-400 text-xs sm:text-sm min-w-0 col-span-2 sm:col-span-1"
              >
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Custom Range</span>
                {(filters.dateFromFilter || filters.dateToFilter) && (
                  <Badge variant="secondary" className="ml-1 text-xs hidden sm:inline-block">
                    {filters.dateFromFilter && filters.dateToFilter
                      ? `${format(new Date(filters.dateFromFilter), "MMM d")} - ${format(new Date(filters.dateToFilter), "MMM d")}`
                      : filters.dateFromFilter
                        ? `From ${format(new Date(filters.dateFromFilter), "MMM d")}`
                        : `To ${format(new Date(filters.dateToFilter), "MMM d")}`}
                  </Badge>
                )}
              </Button>

              {/* Amount Filter Button */}
              <Button
                onClick={openAmountFilterModal}
                variant={filters.minAmountFilter || filters.maxAmountFilter ? "default" : "outline"}
                size="sm"
                className="flex items-center justify-center gap-1 sm:gap-2 dark:text-blue-400 text-xs sm:text-sm min-w-0"
              >
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Amount</span>
                {(filters.minAmountFilter || filters.maxAmountFilter) && (
                  <Badge variant="secondary" className="ml-1 text-xs hidden lg:inline-block">
                    {filters.minAmountFilter && filters.maxAmountFilter
                      ? `${filters.minAmountFilter} - ${filters.maxAmountFilter}`
                      : filters.minAmountFilter
                        ? `Min: ${filters.minAmountFilter}`
                        : `Max: ${filters.maxAmountFilter}`}
                  </Badge>
                )}
              </Button>

              {/* Status Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={filters.statusFilter !== "all" ? "default" : "outline"}
                    size="sm"
                    className="flex items-center justify-center gap-1 sm:gap-2 dark:text-blue-400 text-xs sm:text-sm min-w-0"
                  >
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{getStatusDisplayText}</span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => dispatch(setFilters({ statusFilter: "all" }))}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4" />
                      <span>All Status</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => dispatch(setFilters({ statusFilter: "paid" }))}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Paid</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => dispatch(setFilters({ statusFilter: "credit" }))}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span>Credit</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => dispatch(setFilters({ statusFilter: "cancelled" }))}>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Cancelled</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Payment Method Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={filters.paymentMethodFilter !== "all" ? "default" : "outline"}
                    size="sm"
                    className="flex items-center justify-center gap-1 sm:gap-2 dark:text-blue-400 text-xs sm:text-sm min-w-0"
                  >
                    <CreditCard className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{getPaymentMethodDisplayText}</span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => dispatch(setFilters({ paymentMethodFilter: "all" }))}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4" />
                      <span>All Payment</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => dispatch(setFilters({ paymentMethodFilter: "cash" }))}>
                    <div className="flex items-center gap-2">
                      <BanknoteIcon className="h-4 w-4 text-green-600" />
                      <span>Cash</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => dispatch(setFilters({ paymentMethodFilter: "card" }))}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span>Card</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => dispatch(setFilters({ paymentMethodFilter: "online" }))}>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-purple-600" />
                      <span>Online</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Delivery Status Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={filters.deliveryStatusFilter !== "all" ? "default" : "outline"}
                    size="sm"
                    className="flex items-center justify-center gap-1 sm:gap-2 dark:text-blue-400 text-xs sm:text-sm min-w-0"
                  >
                    <Truck className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{getDeliveryStatusDisplayText}</span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => dispatch(setFilters({ deliveryStatusFilter: "all" }))}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4" />
                      <span>All Delivery</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => dispatch(setFilters({ deliveryStatusFilter: "delivered" }))}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Delivered</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => dispatch(setFilters({ deliveryStatusFilter: "pending" }))}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span>Pending</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Supplier Filter Dropdown with Search */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={filters.supplierFilter !== "all" ? "default" : "outline"}
                    size="sm"
                    className="flex items-center justify-center gap-1 sm:gap-2 dark:text-blue-400 text-xs sm:text-sm min-w-0 col-span-2 sm:col-span-1"
                  >
                    <Building className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{filters.supplierFilter === "all" ? "All Suppliers" : filters.supplierFilter}</span>
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {/* Search input for suppliers */}
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search suppliers..."
                        value={supplierSearchTerm}
                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                        className="pl-8 h-8"
                      />
                    </div>
                  </div>
                  {/* Scrollable supplier list */}
                  <div className="max-h-48 overflow-y-auto">
                    <DropdownMenuItem onClick={() => dispatch(setFilters({ supplierFilter: "all" }))}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4" />
                        <span>All Suppliers</span>
                      </div>
                    </DropdownMenuItem>
                    {filteredSuppliers.length === 0 && supplierSearchTerm ? (
                      <div className="px-2 py-1 text-sm text-gray-500">No suppliers found</div>
                    ) : (
                      filteredSuppliers.map((supplier) => (
                        <DropdownMenuItem
                          key={supplier}
                          onClick={() => dispatch(setFilters({ supplierFilter: supplier }))}
                        >
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-600" />
                            <span>{supplier}</span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear All Filters Button */}
              {hasActiveFilters && (
                <Button
                  onClick={() => dispatch(clearAllFilters())}
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-1 sm:gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 text-xs sm:text-sm min-w-0 col-span-2 sm:col-span-1"
                >
                  <X className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Clear All</span>
                </Button>
              )}
            </div>
          </div>

          {/* Table Content - Mobile Responsive */}
          {isLoading && purchases.length === 0 ? (
            <div className="p-4">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <div className="text-red-500 dark:text-red-400 mb-2">{error}</div>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="p-8 text-center">
              <p className="mb-4 text-gray-500 dark:text-gray-400">
                {hasActiveFilters ? "No purchases match your filters" : "No purchases found"}
              </p>
              {hasActiveFilters && (
                <Button onClick={() => dispatch(clearAllFilters())} variant="outline" size="sm">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 dark:border-gray-600">
                    <th className="px-3 sm:px-6 py-3 dark:text-gray-300">No</th>
                    <th className="px-3 sm:px-6 py-3 dark:text-gray-300">Purchase ID</th>
                    <th className="px-3 sm:px-6 py-3 dark:text-gray-300">Supplier</th>
                    <th className="px-3 sm:px-6 py-3 dark:text-gray-300">Date</th>
                    <th className="px-3 sm:px-6 py-3 dark:text-gray-300">Amount</th>
                    <th className="px-3 sm:px-6 py-3 dark:text-gray-300">Paid</th>
                    <th className="px-3 sm:px-6 py-3 dark:text-gray-300">Remaining</th>
                    <th className="px-3 sm:px-6 py-3 dark:text-gray-300">Payment</th>
                    <th className="px-3 sm:px-6 py-3 dark:text-gray-300">Status</th>
                    <th className="px-3 sm:px-6 py-3 dark:text-gray-300">Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-800">
                  {filteredPurchases.map((purchase, index) => {
                    const receivedAmount = Number.parseFloat(purchase.received_amount || "0")
                    const totalAmount = Number.parseFloat(purchase.total_amount || "0")
                    const remainingAmount = Math.max(0, totalAmount - receivedAmount)

                    return (
                      <tr
                        key={purchase.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => handleView(purchase.id)}
                      >
                        <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {index + 1}
                        </td>
                        <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                          #{purchase.id}
                        </td>
                        <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          <span className="block sm:hidden text-xs text-gray-400 uppercase">Supplier:</span>
                          {purchase.supplier || "N/A"}
                        </td>
                        <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="block sm:hidden text-xs text-gray-400 uppercase">Date:</span>
                          {new Date(purchase.purchase_date).toLocaleDateString("en-GB")}
                        </td>
                        <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm font-medium">
                          <span className="block sm:hidden text-xs text-gray-400 uppercase">Amount:</span>
                          {formatCurrency(totalAmount)}
                        </td>
                        <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm">
                          <span className="block sm:hidden text-xs text-gray-400 uppercase">Paid:</span>
                          {purchase.status?.toLowerCase() === "cancelled" ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <span className="text-green-600 font-medium">{formatCurrency(receivedAmount)}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm">
                          <span className="block sm:hidden text-xs text-gray-400 uppercase">Remaining:</span>
                          {purchase.status?.toLowerCase() === "cancelled" ||
                          purchase.status?.toLowerCase() === "paid" ? (
                            <span className="text-gray-400">0</span>
                          ) : remainingAmount === 0 ? (
                            <span className="text-gray-400">0</span>
                          ) : (
                            <span className="text-red-600 font-medium">{formatCurrency(remainingAmount)}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="block sm:hidden text-xs text-gray-400 uppercase">Payment:</span>
                          {getStatusBadge(purchase.status || "pending")}
                        </td>
                        <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="block sm:hidden text-xs text-gray-400 uppercase">Status:</span>
                          {purchase.status?.toLowerCase() === "paid" ? (
                            <div className="flex items-center">
                              {getPaymentMethodIcon(purchase.payment_method)}
                              <span className="ml-1 text-xs">{purchase.payment_method || "Cash"}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="block sm:hidden text-xs text-gray-400 uppercase">Delivery:</span>
                          {getPurchaseStatusBadge(purchase.purchase_status || "delivered")}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden PDF Export Button for programmatic access */}
      <div className="hidden">
        <PdfExportButton
          data={filteredPurchases}
          type="purchases"
          currency={currency}
          className="hidden"
          data-pdf-export
        />
      </div>

      {/* Modals */}
      <NewPurchaseModal
        isOpen={showAddModal}
        onClose={handleAddModalClose}
        userId={userId}
        deviceId={deviceId}
        currency={currency}
        onPurchaseAdded={handlePurchaseAdded}
      />

      {/* View Purchase Modal */}
      {selectedPurchaseId && (
        <ViewPurchaseModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          purchaseId={selectedPurchaseId}
          currency={currency}
          onEdit={(id) => {
            setIsViewModalOpen(false)
            handleEdit(id)
          }}
          onDelete={handleDelete}
        />
      )}

      {/* Edit Purchase Modal */}
      {selectedPurchaseId && (
        <EditPurchaseModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          purchaseId={selectedPurchaseId}
          userId={userId}
          deviceId={deviceId}
          currency={currency}
          onPurchaseUpdated={handlePurchaseUpdated}
        />
      )}

      {/* Date Filter Modal */}
      {isDateFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Select Date Range</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDateFilterModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={tempDateFrom}
                    onChange={(e) => setTempDateFrom(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">End Date</label>
                  <Input
                    type="date"
                    value={tempDateTo}
                    onChange={(e) => setTempDateTo(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button onClick={handleDateFilterApply} className="flex-1">
                    Apply Filter
                  </Button>
                  <Button onClick={handleClearDateFilter} variant="outline" className="flex-1 bg-transparent">
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Amount Filter Modal */}
      {isAmountFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Filter by Amount</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAmountFilterModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Minimum Amount ({currency})
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={tempMinAmount}
                    onChange={(e) => setTempMinAmount(e.target.value)}
                    className="w-full"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Maximum Amount ({currency})
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={tempMaxAmount}
                    onChange={(e) => setTempMaxAmount(e.target.value)}
                    className="w-full"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button onClick={handleAmountFilterApply} className="flex-1">
                    Apply Filter
                  </Button>
                  <Button onClick={handleClearAmountFilter} variant="outline" className="flex-1 bg-transparent">
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>  
      )}
    </div>
  )
}

