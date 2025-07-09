import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface Customer {
  id: number
  name: string
  phone: string
  email: string
  address: string
  order_count: number
}

interface CustomerState {
  customers: Customer[]
  searchTerm: string
  isLoading: boolean
  lastUpdated: number | null
  showingLimited: boolean
}

const initialState: CustomerState = {
  customers: [],
  searchTerm: "",
  isLoading: true,
  lastUpdated: null,
  showingLimited: true,
}

export const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    setCustomers: (state, action: PayloadAction<Customer[]>) => {
      state.customers = action.payload
      state.isLoading = false
      state.lastUpdated = Date.now()
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setShowingLimited: (state, action: PayloadAction<boolean>) => {
      state.showingLimited = action.payload
    },
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers = [action.payload, ...state.customers]
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex((customer) => customer.id === action.payload.id)
      if (index !== -1) {
        state.customers[index] = action.payload
      }
    },
    deleteCustomer: (state, action: PayloadAction<number>) => {
      state.customers = state.customers.filter((customer) => customer.id !== action.payload)
    },
  },
})

export const {
  setCustomers,
  setSearchTerm,
  setIsLoading,
  setShowingLimited,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} = customerSlice.actions

export default customerSlice.reducer
