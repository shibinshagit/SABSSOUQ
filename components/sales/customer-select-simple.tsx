"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Loader2, Search, User, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCustomers } from "@/app/actions/customer-actions"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface CustomerSelectSimpleProps {
  id?: string
  value: number | null
  onChange: (value: number, name: string) => void
  onAddNew: () => void
  userId?: number
}

export default function CustomerSelectSimple({ id, value, onChange, onAddNew, userId = 1 }: CustomerSelectSimpleProps) {
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [recentCustomers, setRecentCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load customers when component mounts
  useEffect(() => {
    fetchCustomers()
    loadRecentCustomers()
  }, [userId])

  // Filter customers when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers)
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower)),
    )
    setFilteredCustomers(filtered)
  }, [searchTerm, customers])

  // Set selected customer when value changes
  useEffect(() => {
    if (value) {
      const customer = customers.find((c) => c.id === value)
      if (customer) {
        setSelectedCustomer(customer)
      }
    } else {
      setSelectedCustomer(null)
    }
  }, [value, customers])

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const result = await getCustomers(userId)
      if (result.success) {
        setCustomers(result.data)
        setFilteredCustomers(result.data)
      } else {
        console.error("Failed to load customers:", result.message)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentCustomers = () => {
    try {
      const storedRecent = localStorage.getItem(`recent-customers-${userId}`)
      if (storedRecent) {
        setRecentCustomers(JSON.parse(storedRecent).slice(0, 3))
      }
    } catch (error) {
      console.error("Error loading recent customers:", error)
    }
  }

  const handleCustomerSelect = (customerId: number, customerName: string) => {
    onChange(customerId, customerName)
    setOpen(false)

    // Save to recent customers
    try {
      const customer = customers.find((c) => c.id === customerId)
      if (customer) {
        const storedRecent = localStorage.getItem(`recent-customers-${userId}`) || "[]"
        const recentList = JSON.parse(storedRecent)

        // Remove if already exists
        const filtered = recentList.filter((c: any) => c.id !== customerId)

        // Add to beginning
        filtered.unshift(customer)

        // Keep only last 5
        const newRecent = filtered.slice(0, 5)
        localStorage.setItem(`recent-customers-${userId}`, JSON.stringify(newRecent))
        setRecentCustomers(newRecent.slice(0, 3))
      }
    } catch (error) {
      console.error("Error saving recent customer:", error)
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <Button
        id={id}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn(
          "w-full justify-between transition-all duration-200 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700",
          value ? "bg-gray-50 dark:bg-gray-700" : "",
        )}
        type="button"
        onClick={() => {
          setOpen(!open)
          if (!open) {
            // Refresh customer list when opening
            fetchCustomers()
          }
        }}
      >
        {selectedCustomer ? (
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4 text-gray-500" />
            <span>{selectedCustomer.name}</span>
          </div>
        ) : (
          "Select customer..."
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 shadow-lg overflow-hidden"
        >
          <div className="p-2 border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers..."
              className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
              </Button>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto p-1">
            {loading ? (
              <div className="py-6 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading customers...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-6 text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                  <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No customers found</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">Try a different search term</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mx-auto bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                  onClick={() => {
                    setOpen(false)
                    onAddNew()
                  }}
                >
                  Add New Customer
                </Button>
              </div>
            ) : (
              <>
                {/* Recent customers section */}
                {recentCustomers.length > 0 && !searchTerm && (
                  <div className="mb-2">
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <span>Recent</span>
                      <Badge variant="outline" className="ml-2 text-xs py-0">
                        {recentCustomers.length}
                      </Badge>
                    </div>
                    {recentCustomers.map((customer) => (
                      <button
                        key={`recent-${customer.id}`}
                        type="button"
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center gap-2",
                          "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                          value === customer.id
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "text-gray-900 dark:text-gray-100",
                        )}
                        onClick={() => handleCustomerSelect(customer.id, customer.name)}
                      >
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{customer.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {customer.phone || customer.email || "No contact info"}
                          </div>
                        </div>
                        {value === customer.id && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </button>
                    ))}
                    <div className="my-1 border-t border-gray-100 dark:border-gray-600"></div>
                  </div>
                )}

                {/* All customers section */}
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <span>{searchTerm ? "Search Results" : "All Customers"}</span>
                    <Badge variant="outline" className="ml-2 text-xs py-0">
                      {filteredCustomers.length}
                    </Badge>
                  </div>
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-md text-sm flex items-center gap-2",
                        "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                        value === customer.id
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "text-gray-900 dark:text-gray-100",
                      )}
                      onClick={() => handleCustomerSelect(customer.id, customer.name)}
                    >
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{customer.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {customer.phone || customer.email || "No contact info"}
                        </div>
                      </div>
                      {value === customer.id && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    </button>
                  ))}
                </div>

                {/* Add new customer button */}
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-600 px-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                    onClick={() => {
                      setOpen(false)
                      onAddNew()
                    }}
                  >
                    Add New Customer
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
