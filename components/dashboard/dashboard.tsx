"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
  Home,
  ShoppingCart,
  Receipt,
  Package,
  User,
  AlertTriangle,
  BarChart2,
  Truck,
  Calculator,
  Plus,
  Power,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { logout } from "@/app/actions/auth-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import HomeTab from "./home-tab"
import SaleTab from "./sale-tab"
import PurchaseTab from "./purchase-tab"
import ProductTab from "./product-tab"
import CustomerTab from "./customer-tab"
import StockTab from "./stock-tab"
import AccountingTab from "./accounting-tab"
import NewSaleTab from "./new-sale-tab"
import SupplierTab from "./supplier-tab"
import NewSaleModal from "@/components/sales/new-sale-modal"
import StaffHeaderDropdown from "./staff-header-dropdown"
import { AnimatedThemeToggle } from "@/components/ui/animated-theme-toggle"
import { useTheme } from "next-themes"

import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { selectUser, selectCompany, selectDevice, clearDeviceData } from "@/store/slices/deviceSlice"

type TabType = "home" | "sale" | "purchase" | "product" | "customer" | "stock" | "accounting" | "newsale" | "supplier"

interface DashboardProps {
  mockMode?: boolean
}

// Fallback component for when a tab fails to load
function ErrorTab({ name }: { name: string }) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading {name} Tab</AlertTitle>
      <AlertDescription>There was an error loading this tab. Please try again later.</AlertDescription>
    </Alert>
  )
}

// Loading component
function LoadingTab() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  )
}

export function Dashboard({ mockMode = false }: DashboardProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") as TabType | null

  const [activeTab, setActiveTab] = useState<TabType>(tabParam || "home")
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectUser)
  const company = useAppSelector(selectCompany)
  const device = useAppSelector(selectDevice)
  const [isLoading, setIsLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isHeaderSaleModalOpen, setIsHeaderSaleModalOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    // Force set theme to light on first mount if it's not set
    if (!theme || theme === "system") {
      console.log("Setting initial theme to light")
      setTheme("light")
    }
  }, [theme, setTheme])

  // Update active tab when URL changes
  useEffect(() => {
    if (
      tabParam &&
      ["home", "sale", "purchase", "product", "customer", "stock", "accounting", "newsale", "supplier"].includes(
        tabParam,
      )
    ) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Handle tab change with URL update
  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab)
      setIsAddModalOpen(false) // Reset modal state when changing tabs

      // Update URL without full page reload
      const url = new URL(window.location.href)
      url.searchParams.set("tab", tab)
      router.replace(url.pathname + url.search)
    },
    [router],
  )

  useEffect(() => {
    // If no user in Redux, redirect to login
    if (!user?.id) {
      router.push("/")
      return
    }
    setIsLoading(false)
  }, [user, router])

  const handleLogout = async () => {
    try {
      // Clear Redux store
      dispatch(clearDeviceData())

      if (!mockMode) {
        await logout()
      }

      // Redirect to home page
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      })

      // Even if server logout fails, clear Redux and redirect
      dispatch(clearDeviceData())
      router.push("/")
    }
  }

  const handleAddButtonClick = (tab?: TabType) => {
    if (tab === "sale") {
      // For sales, navigate to the new sale tab instead of opening a modal
      handleTabChange("newsale")
      return
    }

    setIsAddModalOpen(true)
    // If a specific tab is passed, switch to that tab first
    if (tab && tab !== activeTab) {
      handleTabChange(tab)
    }
    // Otherwise just open the modal for the current tab
  }

  // Handle header sale button click
  const handleHeaderSaleClick = () => {
    setIsHeaderSaleModalOpen(true)
  }

  // Handle header sale modal close
  const handleHeaderSaleModalClose = () => {
    setIsHeaderSaleModalOpen(false)
    // Refresh sales data if we're on the sales tab
    if (activeTab === "sale") {
      // Force refresh the sales tab
      window.location.reload()
    }
  }

  // Handle theme toggle - Simplified approach
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    console.log("All theme values:", { theme, resolvedTheme, systemTheme })
    console.log("Switching from", theme, "to", newTheme)

    setTheme(newTheme)

    // Force update after a short delay to ensure the change takes effect
    setTimeout(() => {
      console.log("Theme after change:", { theme, resolvedTheme, systemTheme })
    }, 100)
  }

  // Get the current theme for display purposes - simplified
  const currentTheme = theme === "light" ? "light" : "dark"

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Render the appropriate tab content with error handling
  const renderTabContent = () => {
    try {
      const deviceId = device.id
      const companyId = company?.id || 1

      switch (activeTab) {
        case "home":
          return <HomeTab userId={user?.id} deviceId={deviceId} />
        case "sale":
          return (
            <SaleTab
              userId={user?.id}
              isAddModalOpen={activeTab === "sale" && isAddModalOpen}
              onModalClose={() => setIsAddModalOpen(false)}
            />
          )
        case "purchase":
          return (
            <PurchaseTab
              userId={user?.id}
              isAddModalOpen={activeTab === "purchase" && isAddModalOpen}
              onModalClose={() => setIsAddModalOpen(false)}
            />
          )
        case "product":
          return (
            <ProductTab
              userId={user?.id}
              isAddModalOpen={activeTab === "product" && isAddModalOpen}
              onModalClose={() => setIsAddModalOpen(false)}
            />
          )
        case "customer":
          return (
            <CustomerTab
              userId={user?.id}
              isAddModalOpen={activeTab === "customer" && isAddModalOpen}
              onModalClose={() => setIsAddModalOpen(false)}
            />
          )
        case "supplier":
          return (
            <SupplierTab
              userId={user?.id}
              isAddModalOpen={activeTab === "supplier" && isAddModalOpen}
              onModalClose={() => setIsAddModalOpen(false)}
            />
          )
        case "stock":
          return <StockTab userId={user?.id} />
        case "accounting":
          return <AccountingTab userId={user?.id || 0} companyId={companyId} deviceId={deviceId || 0} />
        case "newsale":
          return <NewSaleTab userId={user?.id} />
        default:
          return <ErrorTab name={activeTab} />
      }
    } catch (error) {
      console.error(`Error rendering ${activeTab} tab:`, error)
      return <ErrorTab name={activeTab} />
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {dbError && (
        <div className="mb-4 p-4 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-red-700 dark:text-red-400 flex items-center">
            <span className="mr-2">⚠️</span>
            <span>Database error: {dbError}</span>
          </p>
        </div>
      )}
      {/* Top Navbar */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm">
        <div className="flex items-center">
          <div className="relative mr-3 h-10 w-10">
            {company?.logo_url ? (
              <Image
                src={company.logo_url || "/placeholder.svg"}
                alt="Company Logo"
                fill
                className="object-contain"
                priority
              />
            ) : (
              <Image src="/images/ap-logo.png" alt="Default Logo" fill className="object-contain" priority />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-800 dark:text-gray-200 font-serif tracking-wide">
              {company?.name || "AL ANEEQ"}
            </span>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {device?.name || "Device"} - {device?.currency || "AED"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Animated Theme Toggle */}
          <AnimatedThemeToggle />

          {/* Add Sale Button */}
          <Button
            onClick={handleHeaderSaleClick}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Sale</span>
          </Button>

          {/* Staff Dropdown */}
          <StaffHeaderDropdown deviceId={device?.id || null} userId={user?.id || null} />

          {/* Direct Logout Button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            title="Logout"
          >
            <Power className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-20 pt-6">
        {/* Database Error Alert */}
        {dbError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Database Connection Error</AlertTitle>
            <AlertDescription>{dbError} Some features may be limited.</AlertDescription>
          </Alert>
        )}

        {/* Tab Content */}
        <div className="pb-4">{renderTabContent()}</div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex h-16 items-center justify-around rounded-t-xl border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
        <NavItem icon={<Home />} label="Home" isActive={activeTab === "home"} onClick={() => handleTabChange("home")} />
        <NavItem
          icon={<ShoppingCart />}
          label="Sale"
          isActive={activeTab === "sale"}
          onClick={() => handleTabChange("sale")}
        />
        <NavItem
          icon={<Receipt />}
          label="Purchase"
          isActive={activeTab === "purchase"}
          onClick={() => handleTabChange("purchase")}
        />
        <NavItem
          icon={<Package />}
          label="Product"
          isActive={activeTab === "product"}
          onClick={() => handleTabChange("product")}
        />
        <NavItem
          icon={<User />}
          label="Customer"
          isActive={activeTab === "customer"}
          onClick={() => handleTabChange("customer")}
        />
        <NavItem
          icon={<Truck />}
          label="Supplier"
          isActive={activeTab === "supplier"}
          onClick={() => handleTabChange("supplier")}
        />
        <NavItem
          icon={<BarChart2 />}
          label="Stock"
          isActive={activeTab === "stock"}
          onClick={() => handleTabChange("stock")}
        />
        <NavItem
          icon={<Calculator />}
          label="Accounting"
          isActive={activeTab === "accounting"}
          onClick={() => handleTabChange("accounting")}
        />
      </nav>

      {/* Header Sale Modal */}
      <NewSaleModal
        isOpen={isHeaderSaleModalOpen}
        onClose={handleHeaderSaleModalClose}
        userId={user?.id || 0}
        currency={device?.currency || "AED"}
      />
    </div>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}

function NavItem({ icon, label, isActive, onClick }: NavItemProps) {
  return (
    <button
      className={`flex flex-1 flex-col items-center justify-center transition-all duration-200 ${
        isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
      }`}
      onClick={onClick}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

// Add default export
export default Dashboard
