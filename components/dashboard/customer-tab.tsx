"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Plus, Search, X, Loader2, RefreshCw, Phone, Mail, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import EditCustomerModal from "../customers/edit-customer-modal"
import ViewCustomerModal from "../customers/view-customer-modal"
import { useNotification } from "@/components/ui/global-notification"
import { exportCustomersToPDF } from "@/lib/pdf-export-utils"
import { getCustomers } from "@/app/actions/customer-actions"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  setCustomers,
  setSearchTerm as setReduxSearchTerm,
  setIsLoading,
  setShowingLimited,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/store/slices/customerSlice"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"

interface Customer {
  id: number
  name: string
  phone: string
  email: string
  address: string
  order_count: number
  created_at?: string
}

// Changed from default export to named export to match how it's imported
export function CustomerTab({ userId }: { userId: number }) {
  // Redux state
  const dispatch = useAppDispatch()
  const {
    customers,
    searchTerm: reduxSearchTerm,
    isLoading: reduxIsLoading,
    lastUpdated,
    showingLimited: reduxShowingLimited,
  } = useAppSelector((state) => state.customer)

  // Local UI state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false)

  const { showNotification } = useNotification()

  // Initial load and background refresh
  useEffect(() => {
    const shouldRefresh = !lastUpdated || Date.now() - lastUpdated > 5 * 60 * 1000

    if (customers.length === 0 || shouldRefresh) {
      if (customers.length === 0) {
        dispatch(setIsLoading(true))
      } else {
        setIsBackgroundRefreshing(true)
      }

      fetchCustomers(reduxSearchTerm, !reduxShowingLimited).finally(() => {
        setIsBackgroundRefreshing(false)
      })
    }
  }, [userId])

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (reduxSearchTerm.trim() === "") {
        fetchCustomers("", !reduxShowingLimited) // Reset to initial state
      } else {
        fetchCustomers(reduxSearchTerm, true)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [reduxSearchTerm])

  const fetchCustomers = async (searchTerm?: string, showAll = false) => {
    try {
      setIsSearching(!!searchTerm)

      // Get customers with limit if not showing all and not searching
      const limit = showAll || searchTerm ? undefined : 5
      const response = await getCustomers(userId, limit, searchTerm)

      if (response.success) {
        dispatch(setCustomers(response.data))
        dispatch(setShowingLimited(!showAll && !searchTerm && response.data.length >= 5))
      } else {
        showNotification("error", "Failed to load customers")
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
      showNotification("error", "Failed to load customers")
    } finally {
      setIsSearching(false)
      dispatch(setIsLoading(false))
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchCustomers(reduxSearchTerm, !reduxShowingLimited)
    setIsRefreshing(false)
  }

  const handleAddCustomer = async (formData: FormData) => {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Add the new customer to Redux
        dispatch(addCustomer(result.data))
        setIsAddModalOpen(false)
        showNotification("success", "Customer added successfully")
        return { success: true }
      } else {
        showNotification("error", result.message || "Failed to add customer")
        return { success: false, message: result.message }
      }
    } catch (error) {
      console.error("Error adding customer:", error)
      showNotification("error", "An unexpected error occurred")
      return { success: false, message: "An unexpected error occurred" }
    }
  }

  const handleEditCustomer = async (formData: FormData) => {
    try {
      const response = await fetch(`/api/customers/${formData.get("id")}`, {
        method: "PUT",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Update the customer in Redux
        dispatch(updateCustomer(result.data))
        setIsEditModalOpen(false)
        showNotification("success", "Customer updated successfully")
        return { success: true }
      } else {
        showNotification("error", result.message || "Failed to update customer")
        return { success: false, message: result.message }
      }
    } catch (error) {
      console.error("Error updating customer:", error)
      showNotification("error", "An unexpected error occurred")
      return { success: false, message: "An unexpected error occurred" }
    }
  }

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return

    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        // Remove the customer from Redux
        dispatch(deleteCustomer(selectedCustomer.id))
        setIsDeleteModalOpen(false)
        showNotification("success", "Customer deleted successfully")
      } else {
        showNotification("error", result.message || "Failed to delete customer")
      }
    } catch (error) {
      console.error("Error deleting customer:", error)
      showNotification("error", "An unexpected error occurred")
    }
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsEditModalOpen(true)
  }

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsViewModalOpen(true)
  }

  const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDeleteModalOpen(true)
  }

  const clearSearch = () => {
    dispatch(setReduxSearchTerm(""))
  }

  // Export customers to CSV
  const exportToCSV = () => {
    if (customers.length === 0) return

    const headers = ["ID", "Name", "Email", "Phone", "Address", "Orders"]
    const csvData = customers.map((customer) => [
      customer.id,
      customer.name,
      customer.email || "",
      customer.phone || "",
      customer.address || "",
      customer.order_count || 0,
    ])

    // Add headers to the beginning
    csvData.unshift(headers)

    // Convert to CSV string
    const csvContent = csvData.map((row) => row.join(",")).join("\n")

    // Create a blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `customers_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Render skeleton loading UI
  const renderSkeletonLoading = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 animate-pulse"
        >
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-gray-100">Customers</h1>
        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-4 py-2 font-medium text-white transition-all"
            disabled={reduxIsLoading || customers.length === 0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-download"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV</span>
          </Button>
          <Button
            onClick={exportCustomersToPDF}
            className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-2 font-medium text-white transition-all"
            disabled={reduxIsLoading || customers.length === 0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-file"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>Export PDF</span>
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="icon" disabled={isRefreshing} className="h-10 w-10">
            <RefreshCw className={`h-4 w-4 ${isRefreshing || isBackgroundRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
          Last updated: {formatDistanceToNow(lastUpdated)} ago
          {isBackgroundRefreshing && (
            <span className="ml-2 flex items-center text-blue-500">
              <Loader2 className="h-3 w-3 animate-spin mr-1" /> Refreshing...
            </span>
          )}
        </div>
      )}

      {/* Search Bar */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers..."
              value={reduxSearchTerm}
              onChange={(e) => dispatch(setReduxSearchTerm(e.target.value))}
              className="pl-10 pr-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
            )}
            {reduxSearchTerm && !isSearching && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      {reduxIsLoading && customers.length === 0 ? (
        renderSkeletonLoading()
      ) : customers.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed dark:border-gray-600">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
              <User className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No customers found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {reduxSearchTerm ? "Try a different search term" : "Get started by adding your first customer"}
          </p>
          {!reduxSearchTerm && (
            <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 hover:shadow-md dark:hover:bg-gray-750 transition-all duration-200 cursor-pointer group"
              onClick={() => openViewModal(customer)}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 mr-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{customer.name}</h3>
                    <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded-full min-w-[24px] h-6 flex items-center justify-center">
                      {customer.order_count || 0}
                    </div>
                    {/* Check if customer is new (created within last 7 days) */}
                    {customer.created_at &&
                      new Date(customer.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                        <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-semibold px-2 py-1 rounded-full">
                          New
                        </span>
                      )}
                  </div>
                </div>

                <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  {customer.phone && (
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                </div>

                {customer.address && (
                  <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditModal(customer)
                  }}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded-lg"
                >
                  Edit
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    openDeleteModal(customer)
                  }}
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 px-3 py-1 text-xs rounded-lg"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show All Button */}
      {reduxShowingLimited && !reduxSearchTerm && (
        <div className="flex justify-center py-4">
          <Button onClick={() => fetchCustomers("", true)} variant="outline" className="flex items-center gap-2">
            Show All Customers
          </Button>
        </div>
      )}

      {/* Add Customer Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form action={handleAddCustomer}>
            <input type="hidden" name="user_id" value={userId} />
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Name
                </label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </label>
                <Input id="phone" name="phone" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Address
                </label>
                <Input id="address" name="address" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      {selectedCustomer && (
        <EditCustomerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          customer={selectedCustomer}
          userId={userId}
        />
      )}

      {/* View Customer Modal */}
      {selectedCustomer && (
        <ViewCustomerModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          customer={selectedCustomer}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete customer <span className="font-medium">{selectedCustomer?.name}</span>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone. All data associated with this customer will be permanently removed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer} className="bg-red-600 hover:bg-red-700">
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Also add this line to maintain backward compatibility with default imports
export default CustomerTab
