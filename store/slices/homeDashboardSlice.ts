import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../store"

interface QuickStat {
  label: string
  value: number
  change: number
  changeType: "increase" | "decrease" | "neutral"
}

interface RecentTransaction {
  id: number
  type: "sale" | "purchase" | "income" | "expense"
  description: string
  amount: number
  date: string
  status: string
  customer?: string
  supplier?: string
}

interface Alert {
  id: string
  type: "warning" | "error" | "info"
  title: string
  message: string
  count?: number
}

interface CashFlowData {
  period: string
  income: number
  expenses: number
  netFlow: number
}

interface AccountBalance {
  account: string
  balance: number
  type: "asset" | "liability" | "equity"
}

export interface HomeDashboardData {
  // Financial Overview
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  grossProfit: number
  profitMargin: number

  // Cash Flow
  cashOnHand: number
  accountsReceivable: number
  accountsPayable: number
  netCashFlow: number

  // Quick Stats with trends
  quickStats: QuickStat[]

  // Recent Activity
  recentTransactions: RecentTransaction[]

  // Alerts & Notifications
  alerts: Alert[]

  // Charts Data
  cashFlowData: CashFlowData[]
  accountBalances: AccountBalance[]

  // Period comparison
  currentPeriod: {
    revenue: number
    expenses: number
    profit: number
  }
  previousPeriod: {
    revenue: number
    expenses: number
    profit: number
  }

  // Operational metrics
  totalCustomers: number
  totalSuppliers: number
  totalProducts: number
  lowStockCount: number
  overdueInvoices: number
  pendingPayments: number
}

interface HomeDashboardState {
  data: HomeDashboardData | null
  isLoading: boolean
  isBackgroundLoading: boolean
  lastUpdated: string | null
  error: string | null
  selectedPeriod: "today" | "week" | "month" | "quarter" | "year"
  dateRange: {
    from: string | null
    to: string | null
  }
}

const initialState: HomeDashboardState = {
  data: null,
  isLoading: true,
  isBackgroundLoading: false,
  lastUpdated: null,
  error: null,
  selectedPeriod: "month",
  dateRange: {
    from: null,
    to: null,
  },
}

export const homeDashboardSlice = createSlice({
  name: "homeDashboard",
  initialState,
  reducers: {
    setDashboardData: (state, action: PayloadAction<HomeDashboardData>) => {
      state.data = action.payload
      state.lastUpdated = new Date().toISOString()
      state.isLoading = false
      state.isBackgroundLoading = false
      state.error = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setBackgroundLoading: (state, action: PayloadAction<boolean>) => {
      state.isBackgroundLoading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
      state.isBackgroundLoading = false
    },
    setPeriod: (state, action: PayloadAction<"today" | "week" | "month" | "quarter" | "year">) => {
      state.selectedPeriod = action.payload
    },
    setDateRange: (state, action: PayloadAction<{ from: string; to: string }>) => {
      state.dateRange = action.payload
    },
    updateQuickStats: (state, action: PayloadAction<QuickStat[]>) => {
      if (state.data) {
        state.data.quickStats = action.payload
      }
    },
    addRecentTransaction: (state, action: PayloadAction<RecentTransaction>) => {
      if (state.data) {
        state.data.recentTransactions.unshift(action.payload)
        // Keep only the latest 10 transactions
        state.data.recentTransactions = state.data.recentTransactions.slice(0, 10)
      }
    },
    updateAlert: (state, action: PayloadAction<Alert>) => {
      if (state.data) {
        const existingIndex = state.data.alerts.findIndex((alert) => alert.id === action.payload.id)
        if (existingIndex >= 0) {
          state.data.alerts[existingIndex] = action.payload
        } else {
          state.data.alerts.push(action.payload)
        }
      }
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      if (state.data) {
        state.data.alerts = state.data.alerts.filter((alert) => alert.id !== action.payload)
      }
    },
    clearDashboardData: (state) => {
      state.data = null
      state.lastUpdated = null
      state.isLoading = true
      state.error = null
    },
  },
})

export const {
  setDashboardData,
  setLoading,
  setBackgroundLoading,
  setError,
  setPeriod,
  setDateRange,
  updateQuickStats,
  addRecentTransaction,
  updateAlert,
  removeAlert,
  clearDashboardData,
} = homeDashboardSlice.actions

// Selectors
export const selectHomeDashboardData = (state: RootState) => state.homeDashboard.data
export const selectHomeDashboardLoading = (state: RootState) => state.homeDashboard.isLoading
export const selectHomeDashboardBackgroundLoading = (state: RootState) => state.homeDashboard.isBackgroundLoading
export const selectHomeDashboardError = (state: RootState) => state.homeDashboard.error
export const selectHomeDashboardLastUpdated = (state: RootState) => state.homeDashboard.lastUpdated
export const selectHomeDashboardPeriod = (state: RootState) => state.homeDashboard.selectedPeriod
export const selectHomeDashboardDateRange = (state: RootState) => state.homeDashboard.dateRange

export default homeDashboardSlice.reducer
