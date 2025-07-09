"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Dashboard from "@/components/dashboard/dashboard"
import { setMockMode } from "@/lib/db"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCcw, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { selectDevice, loadFromStorage, clearDeviceData } from "@/store/slices/deviceSlice"

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [mockMode, setMockModeState] = useState(false)
  const [authCheckComplete, setAuthCheckComplete] = useState(false)
  const [dbStatus, setDbStatus] = useState<{
    success: boolean
    message: string
    envVars?: string[]
  } | null>(null)

  const device = useAppSelector(selectDevice)
  const dispatch = useAppDispatch()
  const router = useRouter()

  const checkDbConnection = async () => {
    try {
      setLoading(true)

      // Force mock mode to false
      setMockMode(false)
      setMockModeState(false)

      // Then try to check the database connection
      let data
      try {
        const response = await fetch("/api/db-check")
        data = await response.json()

        setDbStatus({
          success: data.success,
          message: data.message,
          envVars: data.env?.vars || [],
        })

        // Always set mock mode to false
        setMockMode(false)
        setMockModeState(false)
      } catch (error) {
        console.error("Error checking database connection:", error)
        setDbStatus({
          success: false,
          message: error instanceof Error ? error.message : "Unknown error checking database",
        })
        // Always set mock mode to false even if check fails
        setMockMode(false)
        setMockModeState(false)
      }
    } catch (error) {
      console.error("Error in checkDbConnection:", error)
      // Always set mock mode to false even if there's an error
      setMockMode(false)
      setMockModeState(false)
    } finally {
      setLoading(false)
    }
  }

  // Load Redux state and check authentication
  useEffect(() => {
    // Load state from localStorage first
    dispatch(loadFromStorage())

    // Set a timeout to allow Redux hydration
    const timer = setTimeout(() => {
      // Check if device data is available in Redux (persisted)
      if (!device.id || !device.user?.token) {
        // If no device data or token, redirect to login
        router.replace("/")
        return
      }

      setAuthCheckComplete(true)
      // Check database connection on mount
      checkDbConnection()
    }, 100) // Small delay to ensure hydration

    return () => clearTimeout(timer)
  }, []) // Empty dependency array to run only once

  // Handle logout
  const handleLogout = () => {
    dispatch(clearDeviceData())
    router.replace("/")
  }

  const handleRetry = () => {
    checkDbConnection()
  }

  const toggleMockMode = () => {
    // Always set to false regardless of current state
    setMockMode(false)
    setMockModeState(false)
  }

  // Show loading while checking authentication
  if (!authCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {mockMode && (
        <div className="container mx-auto p-4">
          <Alert variant="warning" className="mb-4">
            <Database className="h-4 w-4" />
            <AlertTitle>Running in Demo Mode</AlertTitle>
            <AlertDescription>
              The application is running with mock data. Some features may be limited.
              {!dbStatus?.success && dbStatus?.message && (
                <div className="mt-2 text-sm">
                  <strong>Database error:</strong> {dbStatus.message}
                </div>
              )}
              {dbStatus?.envVars && dbStatus.envVars.length === 0 && (
                <div className="mt-2 text-sm">
                  <strong>No database environment variables found.</strong> The application will use mock data.
                </div>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 mb-4">
            <Button onClick={handleRetry} variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>

            {dbStatus?.success && (
              <Button onClick={toggleMockMode} variant="secondary">
                <Database className="mr-2 h-4 w-4" />
                Disable Mock Mode
              </Button>
            )}
          </div>
        </div>
      )}

      <Dashboard mockMode={mockMode} />
    </>
  )
}
