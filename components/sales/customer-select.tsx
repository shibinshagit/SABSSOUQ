"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Plus, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCustomers } from "@/app/actions/customer-actions"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Customer {
  id: number
  name: string
  phone?: string
  email?: string
}

interface CustomerSelectProps {
  id?: string
  value: number | null
  onChange: (value: number | null, name?: string) => void
  onAddNew: () => void
  userId: number
  placeholder?: string
}

export default function CustomerSelect({
  id,
  value,
  onChange,
  onAddNew,
  userId,
  placeholder = "Select customer...",
}: CustomerSelectProps) {
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true)
      try {
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

    fetchCustomers()
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

  // Load recent customers
  useEffect(() => {
    try {
      const storedRecent = localStorage.getItem(`recent-customers-${userId}`)
      if (storedRecent) {
        setRecentCustomers(JSON.parse(storedRecent).slice(0, 3))
      }
    } catch (error) {
      console.error("Error loading recent customers:", error)
    }
  }, [userId])

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      const popoverTrigger = document.querySelector(`#${id}`)
      if (popoverTrigger && !popoverTrigger.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, id])

  const handleCustomerSelect = (customerId: number | null, customerName?: string) => {
    onChange(customerId, customerName)
    setOpen(false)

    // Save to recent customers
    if (customerId) {
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
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="truncate">{selectedCustomer ? selectedCustomer.name : placeholder}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
        <Command className="bg-white dark:bg-gray-800">
          <div className="flex items-center border-b border-gray-200 dark:border-gray-600 px-3 py-2 bg-gray-50 dark:bg-gray-700">
            <User className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <CommandInput
              placeholder="Search customers..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex-1 bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          <CommandList className="max-h-[200px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading customers...</div>
            ) : (
              <>
                <CommandEmpty className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No customers found.
                </CommandEmpty>
                <CommandGroup>
                  {/* Walk-in Customer Option */}
                  <CommandItem
                    value="walk-in"
                    onSelect={() => {
                      handleCustomerSelect(null, "Walk-in Customer")
                    }}
                    className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === null ? "opacity-100 text-blue-600 dark:text-blue-400" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">Walk-in Customer</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">No customer details</span>
                    </div>
                  </CommandItem>

                  {/* Customer List */}
                  {filteredCustomers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.name}
                      onSelect={() => {
                        handleCustomerSelect(customer.id, customer.name)
                      }}
                      className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === customer.id ? "opacity-100 text-blue-600 dark:text-blue-400" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{customer.name}</span>
                        {(customer.phone || customer.email) && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {customer.phone && customer.email
                              ? `${customer.phone} • ${customer.email}`
                              : customer.phone || customer.email}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>

          {/* Add New Customer Button */}
          <div className="border-t border-gray-200 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700">
            <Button
              onClick={() => {
                setOpen(false)
                onAddNew()
              }}
              variant="ghost"
              className="w-full justify-start text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Customer
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
