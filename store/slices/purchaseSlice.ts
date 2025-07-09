import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

interface Purchase {
  id: number
  supplier: string
  purchase_date: string
  total_amount: number
  received_amount: number
  status: string
  payment_method: string
  purchase_status: string
  created_at: string
  updated_at: string
}

interface PurchaseFilters {
  searchTerm: string
  statusFilter: string
  supplierFilter: string
  paymentMethodFilter: string
  deliveryStatusFilter: string
  dateRangeFilter: string
  dateFromFilter: Date | undefined
  dateToFilter: Date | undefined
  minAmountFilter: string
  maxAmountFilter: string
}

interface PurchaseState {
  purchases: Purchase[]
  filteredPurchases: Purchase[]
  suppliers: string[]
  currency: string
  filters: PurchaseFilters
  isLoading: boolean
  isBackgroundRefreshing: boolean
  error: string | null
  lastUpdated: number | null
  showFilters: boolean
}

const initialFilters: PurchaseFilters = {
  searchTerm: "",
  statusFilter: "all",
  supplierFilter: "all",
  paymentMethodFilter: "all",
  deliveryStatusFilter: "all",
  dateRangeFilter: "all",
  dateFromFilter: undefined,
  dateToFilter: undefined,
  minAmountFilter: "",
  maxAmountFilter: "",
}

const initialState: PurchaseState = {
  purchases: [],
  filteredPurchases: [],
  suppliers: [],
  currency: "INR",
  filters: initialFilters,
  isLoading: false,
  isBackgroundRefreshing: false,
  error: null,
  lastUpdated: null,
  showFilters: false,
}

// Async thunk for fetching purchases
export const fetchPurchases = createAsyncThunk(
  "purchase/fetchPurchases",
  async ({
    deviceId,
    searchTerm,
    isBackground = false,
    forceRefresh = false,
  }: { deviceId: number; searchTerm?: string; isBackground?: boolean; forceRefresh?: boolean }) => {
    const { getUserPurchases } = await import("@/app/actions/purchase-actions")
    const response = await getUserPurchases(deviceId, undefined, searchTerm)

    if (!response.success) {
      throw new Error(response.message || "Failed to fetch purchases")
    }

    return { purchases: response.data, isBackground, forceRefresh }
  },
)

// Async thunk for fetching suppliers
export const fetchSuppliers = createAsyncThunk("purchase/fetchSuppliers", async () => {
  const { getSuppliers } = await import("@/app/actions/purchase-actions")
  const response = await getSuppliers()

  if (!response.success) {
    throw new Error(response.message || "Failed to fetch suppliers")
  }

  return response.data
})

// Async thunk for fetching currency
export const fetchCurrency = createAsyncThunk("purchase/fetchCurrency", async (userId: number) => {
  const { getDeviceCurrency } = await import("@/app/actions/dashboard-actions")
  return await getDeviceCurrency(userId)
})

const purchaseSlice = createSlice({
  name: "purchase",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<PurchaseFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setShowFilters: (state, action: PayloadAction<boolean>) => {
      state.showFilters = action.payload
    },
    clearAllFilters: (state) => {
      state.filters = initialFilters
    },
    applyFilters: (state) => {
      let filtered = [...state.purchases]
      const { filters } = state

      // Search filter
      if (filters.searchTerm.trim()) {
        const searchLower = filters.searchTerm.toLowerCase()
        filtered = filtered.filter(
          (purchase) =>
            purchase.supplier?.toLowerCase().includes(searchLower) ||
            purchase.id?.toString().includes(searchLower) ||
            purchase.status?.toLowerCase().includes(searchLower) ||
            purchase.payment_method?.toLowerCase().includes(searchLower),
        )
      }

      // Status filter
      if (filters.statusFilter !== "all") {
        filtered = filtered.filter((purchase) => purchase.status?.toLowerCase() === filters.statusFilter.toLowerCase())
      }

      // Supplier filter
      if (filters.supplierFilter !== "all") {
        filtered = filtered.filter((purchase) => purchase.supplier === filters.supplierFilter)
      }

      // Payment method filter
      if (filters.paymentMethodFilter !== "all") {
        filtered = filtered.filter(
          (purchase) => purchase.payment_method?.toLowerCase() === filters.paymentMethodFilter.toLowerCase(),
        )
      }

      // Delivery status filter
      if (filters.deliveryStatusFilter !== "all") {
        filtered = filtered.filter(
          (purchase) => purchase.purchase_status?.toLowerCase() === filters.deliveryStatusFilter.toLowerCase(),
        )
      }

      // Date filtering - improved logic
      if (filters.dateFromFilter || filters.dateToFilter) {
        filtered = filtered.filter((purchase) => {
          const purchaseDate = new Date(purchase.purchase_date)
          const purchaseDateOnly = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth(), purchaseDate.getDate())

          let matchesDateFilter = true

          if (filters.dateFromFilter) {
            const fromDate = new Date(filters.dateFromFilter)
            const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
            matchesDateFilter = matchesDateFilter && purchaseDateOnly >= fromDateOnly
          }

          if (filters.dateToFilter) {
            const toDate = new Date(filters.dateToFilter)
            const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
            matchesDateFilter = matchesDateFilter && purchaseDateOnly <= toDateOnly
          }

          return matchesDateFilter
        })
      }

      // Amount range filter
      if (filters.minAmountFilter) {
        const minAmount = Number.parseFloat(filters.minAmountFilter)
        if (!isNaN(minAmount)) {
          filtered = filtered.filter((purchase) => purchase.total_amount >= minAmount)
        }
      }
      if (filters.maxAmountFilter) {
        const maxAmount = Number.parseFloat(filters.maxAmountFilter)
        if (!isNaN(maxAmount)) {
          filtered = filtered.filter((purchase) => purchase.total_amount <= maxAmount)
        }
      }

      state.filteredPurchases = filtered
    },
    addPurchase: (state, action: PayloadAction<Purchase>) => {
      state.purchases.unshift(action.payload)
      // Re-apply filters to include the new purchase if it matches
      purchaseSlice.caseReducers.applyFilters(state)
    },
    updatePurchase: (state, action: PayloadAction<Purchase>) => {
      const index = state.purchases.findIndex((p) => p.id === action.payload.id)
      if (index !== -1) {
        state.purchases[index] = action.payload
        // Re-apply filters
        purchaseSlice.caseReducers.applyFilters(state)
      }
    },
    deletePurchase: (state, action: PayloadAction<number>) => {
      state.purchases = state.purchases.filter((p) => p.id !== action.payload)
      state.filteredPurchases = state.filteredPurchases.filter((p) => p.id !== action.payload)
    },
    clearError: (state) => {
      state.error = null
    },
    clearCache: (state) => {
      state.purchases = []
      state.filteredPurchases = []
      state.lastUpdated = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch purchases
      .addCase(fetchPurchases.pending, (state, action) => {
        if (action.meta.arg.isBackground) {
          state.isBackgroundRefreshing = true
        } else {
          state.isLoading = true
        }
        state.error = null
      })
      .addCase(fetchPurchases.fulfilled, (state, action) => {
        state.isLoading = false
        state.isBackgroundRefreshing = false

        // If force refresh, clear existing data first
        if (action.payload.forceRefresh) {
          state.purchases = []
        }

        state.purchases = action.payload.purchases
        state.lastUpdated = Date.now()
        state.error = null
        // Apply current filters to new data
        purchaseSlice.caseReducers.applyFilters(state)
      })
      .addCase(fetchPurchases.rejected, (state, action) => {
        state.isLoading = false
        state.isBackgroundRefreshing = false
        state.error = action.error.message || "Failed to fetch purchases"
      })
      // Fetch suppliers
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.suppliers = action.payload
      })
      // Fetch currency
      .addCase(fetchCurrency.fulfilled, (state, action) => {
        state.currency = action.payload
      })
  },
})

export const {
  setFilters,
  setShowFilters,
  clearAllFilters,
  applyFilters,
  addPurchase,
  updatePurchase,
  deletePurchase,
  clearError,
  clearCache,
} = purchaseSlice.actions

export default purchaseSlice.reducer

// Selectors
export const selectPurchases = (state: { purchase: PurchaseState }) => state.purchase.purchases
export const selectFilteredPurchases = (state: { purchase: PurchaseState }) => state.purchase.filteredPurchases
export const selectSuppliers = (state: { purchase: PurchaseState }) => state.purchase.suppliers
export const selectCurrency = (state: { purchase: PurchaseState }) => state.purchase.currency
export const selectFilters = (state: { purchase: PurchaseState }) => state.purchase.filters
export const selectIsLoading = (state: { purchase: PurchaseState }) => state.purchase.isLoading
export const selectIsBackgroundRefreshing = (state: { purchase: PurchaseState }) =>
  state.purchase.isBackgroundRefreshing
export const selectError = (state: { purchase: PurchaseState }) => state.purchase.error
export const selectLastUpdated = (state: { purchase: PurchaseState }) => state.purchase.lastUpdated
export const selectShowFilters = (state: { purchase: PurchaseState }) => state.purchase.showFilters
