"use client"

import type React from "react"

import { Provider } from "react-redux"
import { store } from "@/store/store"
import { useEffect } from "react"
import { useAppDispatch } from "@/store/hooks"
import { loadFromStorage } from "@/store/slices/deviceSlice"

function StoreHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Load persisted state from localStorage
    dispatch(loadFromStorage())
  }, [dispatch])

  return <>{children}</>
}

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <StoreHydrator>{children}</StoreHydrator>
    </Provider>
  )
}
