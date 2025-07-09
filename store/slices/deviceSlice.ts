import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface DeviceState {
  id: number | null
  name: string | null
  currency: string
  company: {
    id: number | null
    name: string | null
    logo_url: string | null
  } | null
  user: {
    id: number | null
    name: string | null
    email: string | null
    token: string | null
  } | null
  isLoading: boolean
  error: string | null
}

const initialState: DeviceState = {
  id: null,
  name: null,
  currency: "AED",
  company: null,
  user: null,
  isLoading: false,
  error: null,
}

// Helper: is browser?
const hasBrowserStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined"

const loadStateFromStorage = (): DeviceState => {
  if (!hasBrowserStorage()) return initialState

  try {
    const serializedState = localStorage.getItem("deviceState")
    if (!serializedState) return initialState
    return JSON.parse(serializedState)
  } catch {
    // corrupted or inaccessible - reset
    if (hasBrowserStorage()) localStorage.removeItem("deviceState")
    return initialState
  }
}

const saveStateToStorage = (state: DeviceState) => {
  if (!hasBrowserStorage()) return
  try {
    localStorage.setItem("deviceState", JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

const deviceSlice = createSlice({
  name: "device",
  initialState: loadStateFromStorage(),
  reducers: {
    setDeviceData: (
      state,
      action: PayloadAction<{
        device: { id: number; name: string; currency: string }
        company: { id: number; name: string; logo_url: string }
        user: { id: number; name: string; email: string; token: string }
      }>,
    ) => {
      console.log("DeviceSlice: Setting device data:", action.payload)
      state.id = action.payload.device.id
      state.name = action.payload.device.name
      state.currency = action.payload.device.currency
      state.company = action.payload.company
      state.user = action.payload.user
      state.error = null
      saveStateToStorage(state)
    },
    clearDeviceData: (state) => {
      console.log("DeviceSlice: Clearing device data")
      state.id = null
      state.name = null
      state.currency = "AED"
      state.company = null
      state.user = null
      state.isLoading = false
      state.error = null

      // Clear from localStorage
      if (hasBrowserStorage()) {
        try {
          localStorage.removeItem("deviceState")
          console.log("DeviceSlice: Cleared localStorage")
        } catch (err) {
          console.error("DeviceSlice: Error clearing localStorage:", err)
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
      saveStateToStorage(state)
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      saveStateToStorage(state)
    },
    // Action to manually load state from storage (for hydration)
    loadFromStorage: (state) => {
      console.log("DeviceSlice: Manual load from storage triggered")
      const storedState = loadStateFromStorage()
      state.id = storedState.id
      state.name = storedState.name
      state.currency = storedState.currency
      state.company = storedState.company
      state.user = storedState.user
      state.isLoading = storedState.isLoading
      state.error = storedState.error
    },
  },
})

export const { setDeviceData, clearDeviceData, setLoading, setError, loadFromStorage } = deviceSlice.actions

// Selectors - All the selectors that are used throughout the application
export const selectDevice = (state: { device: DeviceState }) => state.device
export const selectDeviceId = (state: { device: DeviceState }) => state.device.id
export const selectDeviceName = (state: { device: DeviceState }) => state.device.name
export const selectDeviceCurrency = (state: { device: DeviceState }) => state.device.currency
export const selectCompany = (state: { device: DeviceState }) => state.device.company
export const selectCompanyId = (state: { device: DeviceState }) => state.device.company?.id
export const selectCompanyName = (state: { device: DeviceState }) => state.device.company?.name
export const selectCompanyLogo = (state: { device: DeviceState }) => state.device.company?.logo_url
export const selectUser = (state: { device: DeviceState }) => state.device.user
export const selectUserId = (state: { device: DeviceState }) => state.device.user?.id
export const selectUserEmail = (state: { device: DeviceState }) => state.device.user?.email
export const selectUserName = (state: { device: DeviceState }) => state.device.user?.name
export const selectUserToken = (state: { device: DeviceState }) => state.device.user?.token
export const selectIsLoading = (state: { device: DeviceState }) => state.device.isLoading
export const selectError = (state: { device: DeviceState }) => state.device.error

export default deviceSlice.reducer
