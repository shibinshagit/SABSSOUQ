import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { RootState } from "../store"

interface Transaction {
  id: number
  date: string
  description: string
  type: string
  status: string
  amount: number
  received: number
  cost: number
  debit: number
  credit: number
  paymentMethod: string
  account: string
  reference?: string
}

interface Receivable {
  id: number
  customer_name: string
  amount: number
  total_amount: number
  received_amount: number
  due_date: string
  days_overdue: number
  status: string
}

interface Payable {
  id: number
  supplier_name: string
  amount: number
  total_amount: number
  received_amount: number
  due_date: string
  days_overdue: number
  status: string
}

export interface FinancialData {
  totalIncome: number
  totalCogs: number
  totalProfit: number
  totalExpenses: number
  netProfit: number
  accountsReceivable: number
  accountsPayable: number
  outstandingReceivables: number
  transactions: Transaction[]
  receivables: Receivable[]
  payables: Payable[]
}

interface BalanceData {
  openingBalance: number
  closingBalance: number
  openingCredits: number
  openingDebits: number
  closingCredits: number
  closingDebits: number
}

interface AccountingState {
  financialData: FinancialData | null
  balances: BalanceData | null
  lastUpdated: string | null
  dateFrom: string | null
  dateTo: string | null
  isLoading: boolean
  isBackgroundLoading: boolean
}

const initialState: AccountingState = {
  financialData: null,
  balances: null,
  lastUpdated: null,
  dateFrom: null,
  dateTo: null,
  isLoading: true,
  isBackgroundLoading: false,
}

export const accountingSlice = createSlice({
  name: "accounting",
  initialState,
  reducers: {
    setFinancialData: (state, action: PayloadAction<FinancialData>) => {
      state.financialData = action.payload
      state.lastUpdated = new Date().toISOString()
      state.isLoading = false
      state.isBackgroundLoading = false
    },
    setBalances: (state, action: PayloadAction<BalanceData>) => {
      state.balances = action.payload
    },
    setDateRange: (state, action: PayloadAction<{ dateFrom: string; dateTo: string }>) => {
      state.dateFrom = action.payload.dateFrom
      state.dateTo = action.payload.dateTo
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setBackgroundLoading: (state, action: PayloadAction<boolean>) => {
      state.isBackgroundLoading = action.payload
    },
    clearFinancialData: (state) => {
      state.financialData = null
      state.balances = null
      state.lastUpdated = null
      state.isLoading = true
    },
  },
})

export const { setFinancialData, setBalances, setDateRange, setLoading, setBackgroundLoading, clearFinancialData } =
  accountingSlice.actions

// Selectors
export const selectFinancialData = (state: RootState) => state.accounting.financialData
export const selectBalances = (state: RootState) => state.accounting.balances
export const selectLastUpdated = (state: RootState) => state.accounting.lastUpdated
export const selectDateRange = (state: RootState) => ({
  dateFrom: state.accounting.dateFrom,
  dateTo: state.accounting.dateTo,
})
export const selectIsLoading = (state: RootState) => state.accounting.isLoading
export const selectIsBackgroundLoading = (state: RootState) => state.accounting.isBackgroundLoading

export default accountingSlice.reducer
