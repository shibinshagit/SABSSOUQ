"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import {
  Search,
  Loader2,
  Plus,
  Filter,
  RefreshCw,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  CheckCircle,
  Clock,
  XCircle,
  Banknote,
  CreditCard,
  Building,
  DollarSign,
  AlertCircle,
  X,
  Printer,
} from "lucide-react"
import { getUserSales, deleteSale } from "@/app/actions/sale-actions"
import { useToast } from "@/components/ui/use-toast"
import NewSaleModal from "@/components/sales/new-sale-modal"
import EditSaleModal from "@/components/sales/edit-sale-modal"
import ViewSaleModal from "@/components/sales/view-sale-modal"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { selectDeviceId, selectDeviceCurrency } from "@/store/slices/deviceSlice"
import {
  selectSales,
  selectFilteredSales,
  selectSalesLoading,
  selectSalesRefreshing,
  selectSalesSilentRefreshing,
  selectSalesLastUpdated,
  selectSalesFetchedTime,
  selectSalesNeedsRefresh,
  selectSalesError,
  selectSalesSearchTerm,
  selectSalesStatusFilter,
  selectSalesPaymentMethodFilter,
  selectSalesDateFromFilter,
  selectSalesDateToFilter,
  selectSalesMinAmountFilter,
  selectSalesMaxAmountFilter,
  selectSalesShowFilters,
  selectSalesCurrency,
  setSales,
  updateSalesData,
  setFilteredSales,
  setLoading,
  setSilentRefreshing,
  setNeedsRefresh,
  forceClearSales,
  setError,
  setSearchTerm,
  setStatusFilter,
  setPaymentMethodFilter,
  setDateFromFilter,
  setDateToFilter,
  setMinAmountFilter,
  setMaxAmountFilter,
  setCurrency,
  clearFilters,
  removeSale,
  resetSalesState,
} from "@/store/slices/salesSlice"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SaleTabProps {
  userId: number
  isAddModalOpen?: boolean
  onModalClose?: () => void
}

const STALE_TIME = 5 * 60 * 1000 // 5 minutes in milliseconds

export default function SaleTab({ userId, isAddModalOpen = false, onModalClose }: SaleTabProps) {
  // Redux state
  const dispatch = useDispatch()
  const deviceId = useSelector(selectDeviceId)
  const deviceCurrency = useSelector(selectDeviceCurrency)

  // Sales data from Redux
  const sales = useSelector(selectSales)
  const filteredSales = useSelector(selectFilteredSales)
  const isLoading = useSelector(selectSalesLoading)
  const isRefreshing = useSelector(selectSalesRefreshing)
  const isSilentRefreshing = useSelector(selectSalesSilentRefreshing)
  const lastUpdated = useSelector(selectSalesLastUpdated)
  const fetchedTime = useSelector(selectSalesFetchedTime)
  const needsRefresh = useSelector(selectSalesNeedsRefresh)
  const error = useSelector(selectSalesError)

  // Filter states from Redux
  const searchTerm = useSelector(selectSalesSearchTerm)
  const statusFilter = useSelector(selectSalesStatusFilter)
  const paymentMethodFilter = useSelector(selectSalesPaymentMethodFilter)
  const dateFromFilter = useSelector(selectSalesDateFromFilter)
  const dateToFilter = useSelector(selectSalesDateToFilter)
  const minAmountFilter = useSelector(selectSalesMinAmountFilter)
  const maxAmountFilter = useSelector(selectSalesMaxAmountFilter)
  const showFilters = useSelector(selectSalesShowFilters)
  const currency = useSelector(selectSalesCurrency)

  // Local state
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(isAddModalOpen)
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false)
  const [isViewSaleModalOpen, setIsViewSaleModalOpen] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [currentDeviceId, setCurrentDeviceId] = useState<number | null>(null)

  // Date filter modal state
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false)
  const [tempDateFrom, setTempDateFrom] = useState("")
  const [tempDateTo, setTempDateTo] = useState("")

  // Amount filter modal state
  const [isAmountFilterModalOpen, setIsAmountFilterModalOpen] = useState(false)
  const [tempMinAmount, setTempMinAmount] = useState(minAmountFilter)
  const [tempMaxAmount, setTempMaxAmount] = useState(maxAmountFilter)

  const { toast } = useToast()
  const router = useRouter()

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Reset Redux state when device changes
  useEffect(() => {
    if (deviceId && deviceId !== currentDeviceId) {
      console.log("Device changed, resetting sales state...")
      dispatch(resetSalesState())
      setCurrentDeviceId(deviceId)
    }
  }, [deviceId, currentDeviceId, dispatch])

  // Update currency when device currency changes
  useEffect(() => {
    if (deviceCurrency && deviceCurrency !== currency) {
      dispatch(setCurrency(deviceCurrency))
    }
  }, [deviceCurrency, currency, dispatch])

  // Check if data is stale
  const isDataStale = useMemo(() => {
    if (!fetchedTime) return true
    return Date.now() - fetchedTime > STALE_TIME
  }, [fetchedTime])

  // Update needsRefresh when data becomes stale
  useEffect(() => {
    if (fetchedTime && isDataStale && !needsRefresh) {
      dispatch(setNeedsRefresh(true))
    }
  }, [fetchedTime, isDataStale, needsRefresh, dispatch])

  // Format currency with the device's currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "AED",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Fetch sales data from API
  const fetchSalesFromAPI = useCallback(
    async (silent = false) => {
      if (!deviceId) {
        dispatch(setError("Device ID not found"))
        return
      }

      try {
        if (!silent) {
          dispatch(setLoading(true))
        } else {
          dispatch(setSilentRefreshing(true))
        }

        dispatch(setError(null))

        const result = await getUserSales(deviceId)

        if (result.success) {
          if (silent) {
            dispatch(updateSalesData(result.data))
          } else {
            dispatch(setSales(result.data))
          }
        } else {
          dispatch(setError(result.message || "Failed to load sales"))
        }
      } catch (error) {
        console.error("Error fetching sales:", error)
        dispatch(setError("An error occurred while loading sales"))
      } finally {
        dispatch(setLoading(false))
        dispatch(setSilentRefreshing(false))
      }
    },
    [deviceId, dispatch],
  )

  // Initial load or when no data exists
  useEffect(() => {
    if (deviceId && sales.length === 0 && !isLoading) {
      console.log("Initial load: fetching sales data...")
      fetchSalesFromAPI(false)
    }
  }, [deviceId, sales.length, isLoading, fetchSalesFromAPI])

  // Silent refresh for stale data
  useEffect(() => {
    if (deviceId && sales.length > 0 && isDataStale && !isSilentRefreshing && !isLoading) {
      console.log("Data is stale, performing silent refresh...")
      fetchSalesFromAPI(true)
    }
  }, [deviceId, sales.length, isDataStale, isSilentRefreshing, isLoading, fetchSalesFromAPI])

  // Client-side filtering function - FIXED DATE FILTERING LOGIC
  const applyClientSideFilters = useCallback(() => {
    if (!sales || sales.length === 0) {
      dispatch(setFilteredSales([]))
      return
    }

    let filtered = [...sales]

    // Search filter
    if (searchTerm && searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (sale) =>
          (sale.customer_name?.toLowerCase() || "").includes(searchLower) ||
          sale.id.toString().includes(searchLower) ||
          (sale.status?.toLowerCase() || "").includes(searchLower) ||
          sale.total_amount.toString().includes(searchLower),
      )
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((sale) => (sale.status?.toLowerCase() || "") === statusFilter.toLowerCase())
    }

    // Payment method filter
    if (paymentMethodFilter && paymentMethodFilter !== "all") {
      filtered = filtered.filter((sale) => {
        const paymentMethod = sale.payment_method || "cash"
        return paymentMethod.toLowerCase() === paymentMethodFilter.toLowerCase()
      })
    }

    // Date range filter - FIXED LOGIC
    if (dateFromFilter) {
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.sale_date)
        const fromDate = new Date(dateFromFilter)

        // Set both dates to start of day for accurate comparison
        saleDate.setHours(0, 0, 0, 0)
        fromDate.setHours(0, 0, 0, 0)

        return saleDate >= fromDate
      })
    }

    if (dateToFilter) {
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.sale_date)
        const toDate = new Date(dateToFilter)

        // Set sale date to start of day, to date to end of day for inclusive comparison
        saleDate.setHours(0, 0, 0, 0)
        toDate.setHours(23, 59, 59, 999)

        return saleDate <= toDate
      })
    }

    // Amount range filter
    if (minAmountFilter) {
      const minAmount = Number(minAmountFilter)
      if (!isNaN(minAmount)) {
        filtered = filtered.filter((sale) => Number(sale.total_amount) >= minAmount)
      }
    }

    if (maxAmountFilter) {
      const maxAmount = Number(maxAmountFilter)
      if (!isNaN(maxAmount)) {
        filtered = filtered.filter((sale) => Number(sale.total_amount) <= maxAmount)
      }
    }

    dispatch(setFilteredSales(filtered))
  }, [
    sales,
    searchTerm,
    statusFilter,
    paymentMethodFilter,
    dateFromFilter,
    dateToFilter,
    minAmountFilter,
    maxAmountFilter,
    dispatch,
  ])

  // Apply filters whenever sales data or filter criteria change
  useEffect(() => {
    applyClientSideFilters()
  }, [applyClientSideFilters])

  // Handle modal state from parent
  useEffect(() => {
    setIsNewSaleModalOpen(isAddModalOpen)
  }, [isAddModalOpen])

  // Handle new sale modal close
  const handleNewSaleModalClose = () => {
    setIsNewSaleModalOpen(false)
    if (onModalClose) {
      onModalClose()
    }
    // Force refresh after adding new sale
    handleForcedRefresh()
  }

  // Handle view sale - now called when clicking on a sale row
  const handleViewSale = (sale: any) => {
    setSelectedSaleId(sale.id)
    setIsViewSaleModalOpen(true)
  }

  // Handle edit sale from view modal
  const handleEditSaleFromView = (saleData: any) => {
    setSelectedSaleId(saleData.id)
    // Close view modal first
    setIsViewSaleModalOpen(false)
    // Then open edit modal with a small delay to ensure proper rendering
    setTimeout(() => {
      setIsEditSaleModalOpen(true)
    }, 100)
  }

  // Handle print invoice from view modal
  const handlePrintInvoiceFromView = (saleId: number) => {
    router.push(`/invoice/sale/${saleId}`)
  }

  // Handle delete sale from view modal
  const handleDeleteSaleFromView = async (saleId: number) => {
    if (!deviceId) {
      toast({
        title: "Error",
        description: "Device ID not found",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)
      const result = await deleteSale(saleId, deviceId)

      if (result.success) {
        dispatch(removeSale(saleId))
        toast({
          title: "Success",
          description: "Sale deleted successfully",
        })
        // Force refresh after deletion
        handleForcedRefresh()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete sale",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Delete sale error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Get payment method display value
  const getPaymentMethodDisplay = (sale: any) => {
    if (sale.payment_method === undefined || sale.payment_method === null) {
      return "Cash"
    }
    return sale.payment_method || "Cash"
  }

  // Calculate remaining amount for credit sales
  const getRemainingAmount = (sale: any) => {
    if (sale.status === "Credit") {
      const total = Number(sale.total_amount) || 0
      const received = Number(sale.received_amount) || 0
      return Math.max(0, total - received)
    }
    return 0
  }

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    paymentMethodFilter !== "all" ||
    dateFromFilter ||
    dateToFilter ||
    minAmountFilter ||
    maxAmountFilter

  // Handle forced refresh - clears Redux and fetches fresh data
  const handleForcedRefresh = () => {
    console.log("Forced refresh initiated...")

    // Clear all data and filters
    dispatch(forceClearSales())
    dispatch(clearFilters())

    // Reset local state
    setExpandedCards(new Set())

    // Force fetch new data
    fetchSalesFromAPI(false)

    toast({
      title: "Refreshed",
      description: "Sales data has been refreshed and filters cleared",
    })
  }

  // Handle clear all filters
  const handleClearAllFilters = () => {
    dispatch(clearFilters())
    toast({
      title: "Filters Cleared",
      description: "All filters have been removed",
    })
  }

  // Handle Today filter
  const handleTodayFilter = () => {
    const today = new Date()
    const formattedDate = format(today, "yyyy-MM-dd")

    dispatch(setDateFromFilter(formattedDate))
    dispatch(setDateToFilter(formattedDate))

    toast({
      title: "Today's Sales",
      description: `Showing sales for ${format(today, "MMMM d, yyyy")}`,
    })
  }

  // Handle This Week filter
  const handleThisWeekFilter = () => {
    const today = new Date()
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))

    dispatch(setDateFromFilter(format(startOfWeek, "yyyy-MM-dd")))
    dispatch(setDateToFilter(format(endOfWeek, "yyyy-MM-dd")))

    toast({
      title: "This Week's Sales",
      description: `Showing sales for this week`,
    })
  }

  // Handle This Month filter
  const handleThisMonthFilter = () => {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    dispatch(setDateFromFilter(format(startOfMonth, "yyyy-MM-dd")))
    dispatch(setDateToFilter(format(endOfMonth, "yyyy-MM-dd")))

    toast({
      title: "This Month's Sales",
      description: `Showing sales for ${format(startOfMonth, "MMMM yyyy")}`,
    })
  }

  // Handle date filter apply
  const handleDateFilterApply = () => {
    if (tempDateFrom) dispatch(setDateFromFilter(tempDateFrom))
    if (tempDateTo) dispatch(setDateToFilter(tempDateTo))
    setIsDateFilterModalOpen(false)

    if (tempDateFrom || tempDateTo) {
      toast({
        title: "Date Filter Applied",
        description: `Showing sales from ${tempDateFrom || "start"} to ${tempDateTo || "end"}`,
      })
    }
  }

  // Clear date filter
  const handleClearDateFilter = () => {
    dispatch(setDateFromFilter(""))
    dispatch(setDateToFilter(""))
    setTempDateFrom("")
    setTempDateTo("")
    setIsDateFilterModalOpen(false)
  }

  // Open date filter modal with current values
  const openDateFilterModal = () => {
    setTempDateFrom(dateFromFilter)
    setTempDateTo(dateToFilter)
    setIsDateFilterModalOpen(true)
  }

  // Handle amount filter apply
  const handleAmountFilterApply = () => {
    if (tempMinAmount) dispatch(setMinAmountFilter(tempMinAmount))
    if (tempMaxAmount) dispatch(setMaxAmountFilter(tempMaxAmount))
    setIsAmountFilterModalOpen(false)

    if (tempMinAmount || tempMaxAmount) {
      toast({
        title: "Amount Filter Applied",
        description: `Showing sales from ${tempMinAmount || "0"} to ${tempMaxAmount || "unlimited"}`,
      })
    }
  }

  // Clear amount filter
  const handleClearAmountFilter = () => {
    dispatch(setMinAmountFilter(""))
    dispatch(setMaxAmountFilter(""))
    setTempMinAmount("")
    setTempMaxAmount("")
    setIsAmountFilterModalOpen(false)
  }

  // Toggle card expansion
  const toggleCardExpansion = (saleId: number) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(saleId)) {
      newExpanded.delete(saleId)
    } else {
      newExpanded.add(saleId)
    }
    setExpandedCards(newExpanded)
  }

  // Get status display text
  const getStatusDisplayText = () => {
    switch (statusFilter) {
      case "completed":
        return "Completed"
      case "credit":
        return "Credit"
      case "cancelled":
        return "Cancelled"
      default:
        return "All Status"
    }
  }

  // Get payment method display text
  const getPaymentMethodDisplayText = () => {
    switch (paymentMethodFilter) {
      case "cash":
        return "Cash"
      case "card":
        return "Card"
      case "bank_transfer":
        return "Online"
      default:
        return "All Payment"
    }
  }

  // Handle print sales report
  const handlePrintSalesReport = () => {
    if (filteredSales.length === 0) {
      toast({
        title: "No Data",
        description: "No sales data to print",
        variant: "destructive",
      })
      return
    }

    // Calculate summary statistics
    const totalSales = filteredSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
    const totalReceived = filteredSales.reduce((sum, sale) => {
      if (sale.status === "Credit") {
        return sum + Number(sale.received_amount || 0)
      } else if (sale.status === "Completed") {
        return sum + Number(sale.total_amount)
      }
      return sum
    }, 0)
    const totalOutstanding = filteredSales.reduce((sum, sale) => {
      if (sale.status === "Credit") {
        return sum + getRemainingAmount(sale)
      }
      return sum
    }, 0)

    // Create print window
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive",
      })
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 5px;
            }
            .report-title { 
              font-size: 18px; 
              color: #666;
            }
            .summary { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 20px; 
              margin-bottom: 30px;
            }
            .summary-card { 
              text-align: center; 
              padding: 15px; 
              border: 1px solid #ddd; 
              border-radius: 8px;
            }
            .summary-value { 
              font-size: 20px; 
              font-weight: bold; 
              color: #2563eb;
            }
            .summary-label { 
              font-size: 12px; 
              color: #666; 
              margin-top: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
              font-size: 12px;
            }
            th { 
              background-color: #f5f5f5; 
              font-weight: bold;
            }
            .status-completed { color: #16a34a; }
            .status-credit { color: #ea580c; }
            .status-cancelled { color: #dc2626; }
            .amount { text-align: right; }
            .print-date { 
              text-align: center; 
              margin-top: 30px; 
              font-size: 12px; 
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .summary { grid-template-columns: repeat(2, 1fr); }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Sales Report</div>
            <div class="report-title">Generated on ${format(new Date(), "MMMM d, yyyy 'at' HH:mm")}</div>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <div class="summary-value">${filteredSales.length}</div>
              <div class="summary-label">Total Sales</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${formatCurrency(totalSales)}</div>
              <div class="summary-label">Total Amount</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${formatCurrency(totalReceived)}</div>
              <div class="summary-label">Total Received</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${formatCurrency(totalOutstanding)}</div>
              <div class="summary-label">Outstanding</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Sale ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Received</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales
                .map(
                  (sale) => `
                <tr>
                  <td>#${sale.id}</td>
                  <td>${format(new Date(sale.sale_date), "MMM d, yyyy")}</td>
                  <td>${sale.customer_name || "Walk-in Customer"}</td>
                  <td class="status-${sale.status?.toLowerCase()}">${sale.status}</td>
                  <td>${getPaymentMethodDisplay(sale)}</td>
                  <td class="amount">${formatCurrency(Number(sale.total_amount))}</td>
                  <td class="amount">${
                    sale.status === "Credit"
                      ? formatCurrency(Number(sale.received_amount || 0))
                      : sale.status === "Completed"
                        ? formatCurrency(Number(sale.total_amount))
                        : "0"
                  }</td>
                  <td class="amount">${
                    sale.status === "Credit" && getRemainingAmount(sale) > 0
                      ? formatCurrency(getRemainingAmount(sale))
                      : "0"
                  }</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="print-date">
            Report generated on ${format(new Date(), "EEEE, MMMM d, yyyy 'at' HH:mm:ss")}
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  // Auto-refresh effect
  useEffect(() => {
    if (!deviceId || isLoading) return

    const interval = setInterval(() => {
      if (needsRefresh && !isRefreshing && !isSilentRefreshing) {
        console.log("Auto-refreshing sales data...")
        fetchSalesFromAPI(true)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [deviceId, needsRefresh, isLoading, isRefreshing, isSilentRefreshing, fetchSalesFromAPI])

  // Skeleton loading component
  const SalesTableSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )

  // Mobile Card Component
  const SaleCard = ({ sale, index }: { sale: any; index: number }) => {
    const isExpanded = expandedCards.has(sale.id)
    const remainingAmount = getRemainingAmount(sale)

    return (
      <Card
        className="mb-4 overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 cursor-pointer"
        onClick={() => handleViewSale(sale)}
      >
        <CardContent className="p-0">
          {/* Main card content */}
          <div className="p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">#{sale.id}</span>
                <Badge
                  variant="outline"
                  className={
                    sale.sale_type === "service"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : "bg-blue-100 text-blue-800 border-blue-300"
                  }
                >
                  {sale.sale_type === "service" ? "Service" : "Product"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    sale.status === "Completed"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : sale.status === "Credit"
                        ? "bg-orange-100 text-orange-800 border-orange-300"
                        : sale.status === "Cancelled"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : "bg-yellow-100 text-yellow-800 border-yellow-300"
                  }
                >
                  {sale.status}
                </Badge>
              </div>
            </div>

            {/* Type and customer - Type first, customer underneath */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col gap-1">
                <Badge
                  variant="outline"
                  className={
                    sale.sale_type === "service"
                      ? "bg-green-100 text-green-800 border-green-300 w-fit"
                      : "bg-blue-100 text-blue-800 border-blue-300 w-fit"
                  }
                >
                  {sale.sale_type === "service" ? "Service" : "Product"}
                </Badge>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {sale.customer_name || "Walk-in Customer"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                {format(new Date(sale.sale_date), "MMM d")}
              </div>
            </div>

            {/* Amount and payment */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(Number(sale.total_amount))}
                </div>
                {sale.status === "Credit" && remainingAmount > 0 && (
                  <div className="text-sm text-red-600">Remaining: {formatCurrency(remainingAmount)}</div>
                )}
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-gray-100 text-gray-800 mb-1">
                  {getPaymentMethodDisplay(sale)}
                </Badge>
                {sale.staff_name && <div className="text-xs text-gray-500 dark:text-gray-400">{sale.staff_name}</div>}
              </div>
            </div>

            {/* Expand/Collapse button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                toggleCardExpansion(sale.id)
              }}
              className="w-full justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Less Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  More Details
                </>
              )}
            </Button>
          </div>

          {/* Expanded details */}
          {isExpanded && (
            <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Received:</span>
                  <div className="font-medium text-green-600">
                    {sale.status === "Credit"
                      ? formatCurrency(Number(sale.received_amount || 0))
                      : sale.status === "Completed"
                        ? formatCurrency(Number(sale.total_amount))
                        : "0"}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Discount:</span>
                  <div className="font-medium text-purple-600">{formatCurrency(Number(sale.discount || 0))}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Cost:</span>
                  <div className="font-medium text-orange-600">{formatCurrency(Number(sale.total_cost || 0))}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Profit:</span>
                  <div
                    className={`font-medium ${
                      Number(sale.total_amount) - Number(sale.total_cost || 0) > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(Number(sale.total_amount) - Number(sale.total_cost || 0))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards - Made sticky with increased top margin */}
      <div className="sticky top-6 z-10 bg-gray-50 dark:bg-gray-900 pb-4 mb-4 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold">
                  {formatCurrency(filteredSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0))}
                </div>
                <div className="text-xs md:text-sm text-blue-100">Total Sales</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold">
                  {formatCurrency(
                    filteredSales.reduce((sum, sale) => {
                      if (sale.status === "Credit") {
                        return sum + Number(sale.received_amount || 0)
                      } else if (sale.status === "Completed") {
                        return sum + Number(sale.total_amount)
                      }
                      return sum
                    }, 0),
                  )}
                </div>
                <div className="text-xs md:text-sm text-green-100">Received</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold">
                  {formatCurrency(
                    filteredSales.reduce((sum, sale) => {
                      if (sale.status === "Credit") {
                        return sum + getRemainingAmount(sale)
                      }
                      return sum
                    }, 0),
                  )}
                </div>
                <div className="text-xs md:text-sm text-orange-100">Remaining</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold">
                  {formatCurrency(filteredSales.reduce((sum, sale) => sum + Number(sale.total_cost || 0), 0))}
                </div>
                <div className="text-xs md:text-sm text-red-100">Total Cost</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-3 md:p-4">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold">
                  {formatCurrency(
                    filteredSales.reduce((sum, sale) => {
                      const cost = Number(sale.total_cost || 0)
                      const revenue = Number(sale.total_amount)
                      return sum + (revenue - cost)
                    }, 0),
                  )}
                </div>
                <div className="text-xs md:text-sm text-purple-100">Profit</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Header with controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {filteredSales.length} {filteredSales.length === 1 ? "Sale" : "Sales"}
            </span>
            {lastUpdated && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Updated: {format(new Date(lastUpdated), "HH:mm")}</span>
                {(isRefreshing || isSilentRefreshing) && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleForcedRefresh}
            variant="outline"
            size="default"
            className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 bg-transparent"
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing || isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={handlePrintSalesReport}
            variant="default"
            size="default"
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>

          <Button
            onClick={() => setIsNewSaleModalOpen(true)}
            size="default"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Add Sale</span>
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4 dark:bg-gray-800">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search sales by customer, ID, status, or amount..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => dispatch(setSearchTerm(e.target.value))}
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Date Filters */}
            <Button
              onClick={handleTodayFilter}
              variant={dateFromFilter === format(new Date(), "yyyy-MM-dd") ? "default" : "outline"}
              size="sm"
              className={`flex items-center gap-2 transition-all duration-200 ${
                dateFromFilter === format(new Date(), "yyyy-MM-dd")
                  ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Today</span>
            </Button>

            <Button
              onClick={handleThisWeekFilter}
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 transition-all duration-200 ${
                // Check if this week filter is active
                dateFromFilter &&
                dateToFilter &&
                new Date(dateFromFilter).getDay() === 0 && // Starts on Sunday
                Math.abs(new Date(dateToFilter).getTime() - new Date(dateFromFilter).getTime()) ===
                  6 * 24 * 60 * 60 * 1000 // 6 days difference
                  ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>This Week</span>
            </Button>

            <Button
              onClick={handleThisMonthFilter}
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 transition-all duration-200 ${
                // Check if this month filter is active
                dateFromFilter &&
                dateToFilter &&
                new Date(dateFromFilter).getDate() === 1 && // Starts on 1st
                new Date(dateToFilter).getMonth() === new Date(dateFromFilter).getMonth() // Same month
                  ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>This Month</span>
            </Button>

            {/* Custom Date Range Button */}
            <Button
              onClick={openDateFilterModal}
              variant={dateFromFilter || dateToFilter ? "default" : "outline"}
              size="sm"
              className={`flex items-center gap-2 transition-all duration-200 ${
                dateFromFilter || dateToFilter
                  ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span>Custom Range</span>
              {(dateFromFilter || dateToFilter) && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {dateFromFilter && dateToFilter
                    ? `${format(new Date(dateFromFilter), "MMM d")} - ${format(new Date(dateToFilter), "MMM d")}`
                    : dateFromFilter
                      ? `From ${format(new Date(dateFromFilter), "MMM d")}`
                      : `To ${format(new Date(dateToFilter), "MMM d")}`}
                </Badge>
              )}
            </Button>

            {/* Amount Filter Button */}
            <Button
              onClick={() => setIsAmountFilterModalOpen(true)}
              variant={minAmountFilter || maxAmountFilter ? "default" : "outline"}
              size="sm"
              className={`flex items-center gap-2 transition-all duration-200 ${
                minAmountFilter || maxAmountFilter
                  ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600"
              }`}
            >
              <DollarSign className="h-4 w-4" />
              <span>Amount</span>
              {(minAmountFilter || maxAmountFilter) && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {minAmountFilter && maxAmountFilter
                    ? `${minAmountFilter} - ${maxAmountFilter}`
                    : minAmountFilter
                      ? `Min: ${minAmountFilter}`
                      : `Max: ${maxAmountFilter}`}
                </Badge>
              )}
            </Button>

            {/* Status Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={statusFilter !== "all" ? "default" : "outline"}
                  size="sm"
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    statusFilter !== "all"
                      ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600"
                  }`}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{getStatusDisplayText()}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <DropdownMenuItem
                  onClick={() => dispatch(setStatusFilter("all"))}
                  className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4" />
                    <span>All Status</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => dispatch(setStatusFilter("completed"))}
                  className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Completed</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => dispatch(setStatusFilter("credit"))}
                  className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span>Credit</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => dispatch(setStatusFilter("cancelled"))}
                  className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
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
                  variant={paymentMethodFilter !== "all" ? "default" : "outline"}
                  size="sm"
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    paymentMethodFilter !== "all"
                      ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                      : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600"
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>{getPaymentMethodDisplayText()}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <DropdownMenuItem
                  onClick={() => dispatch(setPaymentMethodFilter("all"))}
                  className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4" />
                    <span>All Payment</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => dispatch(setPaymentMethodFilter("cash"))}
                  className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-green-600" />
                    <span>Cash</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => dispatch(setPaymentMethodFilter("card"))}
                  className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span>Card</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => dispatch(setPaymentMethodFilter("bank_transfer"))}
                  className="text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-purple-600" />
                    <span>Online</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear All Filters Button */}
            <Button
              onClick={handleClearAllFilters}
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              className={`flex items-center gap-2 transition-all duration-200 ${
                hasActiveFilters
                  ? "bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-white"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="ml-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                >
                  Clear All
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-0 dark:bg-gray-800">
          {isLoading && sales.length === 0 ? (
            <div className="p-6">
              <SalesTableSkeleton />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 p-6">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 p-6">
              {hasActiveFilters ? "No sales found matching your filters" : "No sales found. Create your first sale!"}
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="p-4">
              {filteredSales.map((sale, index) => (
                <SaleCard key={sale.id} sale={sale} index={index} />
              ))}
            </div>
          ) : (
            // Desktop Table View - Updated column order: Discount before Cost
            <div className="overflow-x-auto">
              <Table className="dark:bg-gray-800">
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-200 dark:border-gray-600">
                    <TableHead className="w-12 font-semibold text-gray-700 dark:text-gray-200">No</TableHead>
                    <TableHead className="min-w-[160px] font-semibold text-gray-700 dark:text-gray-200">
                      Sale ID, Date & Staff
                    </TableHead>
                    <TableHead className="min-w-[180px] font-semibold text-gray-700 dark:text-gray-200">
                      Type & Customer
                    </TableHead>
                    <TableHead className="min-w-[140px] font-semibold text-gray-700 dark:text-gray-200">
                      Payment & Status
                    </TableHead>
                    <TableHead className="min-w-[100px] font-semibold text-gray-700 dark:text-gray-200">
                      Amount
                    </TableHead>
                    <TableHead className="min-w-[100px] font-semibold text-gray-700 dark:text-gray-200">
                      Received
                    </TableHead>
                    <TableHead className="min-w-[100px] font-semibold text-gray-700 dark:text-gray-200">
                      Remaining
                    </TableHead>
                    <TableHead className="min-w-[80px] font-semibold text-gray-700 dark:text-gray-200">
                      Discount
                    </TableHead>
                    <TableHead className="min-w-[100px] font-semibold text-gray-700 dark:text-gray-200">Cost</TableHead>
                    <TableHead className="min-w-[100px] font-semibold text-gray-700 dark:text-gray-200">
                      Profit
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale, index) => (
                    <TableRow
                      key={sale.id}
                      className={`cursor-pointer transition-all duration-200 border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 hover:shadow-sm ${
                        index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-700/50"
                      }`}
                      onClick={() => handleViewSale(sale)}
                    >
                      <TableCell className="font-medium text-gray-600 dark:text-gray-300 py-4">{index + 1}</TableCell>

                      {/* Combined Sale ID, Date & Staff */}
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-blue-600 text-sm">#{sale.id}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(sale.sale_date), "MMM d, yyyy")}
                          </div>
                          {sale.staff_name && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {sale.staff_name}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Combined Type & Customer - Type first, customer underneath */}
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${
                              sale.sale_type === "service"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                : "bg-blue-100 text-blue-700 border-blue-300"
                            }`}
                          >
                            {sale.sale_type === "service" ? "Service" : "Product"}
                          </Badge>
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[140px] text-sm">
                            {sale.customer_name || "Walk-in Customer"}
                          </div>
                        </div>
                      </TableCell>

                      {/* Combined Payment & Status */}
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-700 border-slate-300 text-xs font-medium"
                          >
                            {getPaymentMethodDisplay(sale)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${
                              sale.status === "Completed"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : sale.status === "Credit"
                                  ? "bg-orange-100 text-orange-700 border-orange-300"
                                  : sale.status === "Cancelled"
                                    ? "bg-red-100 text-red-700 border-red-300"
                                    : "bg-yellow-100 text-yellow-700 border-yellow-300"
                            }`}
                          >
                            {sale.status}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100 py-4">
                        {formatCurrency(Number(sale.total_amount))}
                      </TableCell>

                      <TableCell className="py-4">
                        {sale.status === "Credit" ? (
                          <span className="text-green-600 font-semibold">
                            {formatCurrency(Number(sale.received_amount || 0))}
                          </span>
                        ) : sale.status === "Completed" ? (
                          <span className="text-green-600 font-semibold">
                            {formatCurrency(Number(sale.total_amount))}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">0</span>
                        )}
                      </TableCell>

                      <TableCell className="py-4">
                        {sale.status === "Credit" ? (
                          getRemainingAmount(sale) > 0 ? (
                            <span className="text-red-600 font-semibold">
                              {formatCurrency(getRemainingAmount(sale))}
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium">0</span>
                          )
                        ) : (
                          <span className="text-gray-400 font-medium">0</span>
                        )}
                      </TableCell>

                      {/* Discount column - moved before Cost */}
                      <TableCell className="py-4 text-purple-600 font-medium">
                        {formatCurrency(Number(sale.discount || 0))}
                      </TableCell>

                      {/* Cost column - moved after Discount */}
                      <TableCell className="py-4">
                        <span className="text-orange-600 font-semibold">
                          {formatCurrency(Number(sale.total_cost || 0))}
                        </span>
                      </TableCell>

                      <TableCell className="py-4">
                        <span
                          className={`font-semibold ${
                            Number(sale.total_amount) - Number(sale.total_cost || 0) > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(Number(sale.total_amount) - Number(sale.total_cost || 0))}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Filter Modal */}
      {isDateFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Date Range</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDateFilterModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
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

                <div className="flex gap-2 pt-4">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter by Amount</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAmountFilterModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
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
                  />
                </div>

                <div className="flex gap-2 pt-4">
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

      {/* Modals */}
      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={handleNewSaleModalClose}
        userId={userId}
        currency={currency || "AED"}
      />

      {selectedSaleId && (
        <EditSaleModal
          isOpen={isEditSaleModalOpen}
          onClose={() => {
            setIsEditSaleModalOpen(false)
            // Force refresh after editing
            handleForcedRefresh()
          }}
          saleId={selectedSaleId}
          userId={userId}
          currency={currency || "AED"}
        />
      )}

      <ViewSaleModal
        isOpen={isViewSaleModalOpen}
        onClose={() => {
          setIsViewSaleModalOpen(false)
          setSelectedSaleId(null)
        }}
        saleId={selectedSaleId}
        currency={currency || "AED"}
        onEdit={handleEditSaleFromView}
        onDelete={handleDeleteSaleFromView}
        onPrintInvoice={handlePrintInvoiceFromView}
      />
    </div>
  )
}
