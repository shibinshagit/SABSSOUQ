"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupplierNames } from "@/app/actions/supplier-actions"

interface SupplierAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  id?: string
  name?: string
  userId: number // Add this line
}

export default function SupplierAutocomplete({
  value,
  onChange,
  placeholder = "Enter supplier name",
  className,
  required = false,
  id,
  name,
  userId, // Add this line
}: SupplierAutocompleteProps) {
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers()
  }, [])

  // Filter suppliers when value changes
  useEffect(() => {
    if (!value.trim()) {
      setFilteredSuppliers([])
      return
    }

    const filtered = suppliers.filter(
      (supplier) =>
        supplier.toLowerCase().includes(value.toLowerCase()) && supplier.toLowerCase() !== value.toLowerCase(),
    )
    setFilteredSuppliers(filtered)
  }, [value, suppliers])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchSuppliers = async () => {
    try {
      const result = await getSupplierNames(userId)
      if (result.success) {
        setSuppliers(result.data)
      } else {
        console.error("Failed to load suppliers:", result.message)
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setIsOpen(true)
  }

  const handleSupplierSelect = (supplier: string) => {
    onChange(supplier)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={cn("pr-8", className)}
        required={required}
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("")
            inputRef.current?.focus()
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {isOpen && filteredSuppliers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white rounded-md border border-gray-200 shadow-md max-h-60 overflow-auto"
        >
          {filteredSuppliers.map((supplier, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-gray-100",
                index === 0 ? "rounded-t-md" : "",
                index === filteredSuppliers.length - 1 ? "rounded-b-md" : "",
                "flex items-center justify-between",
              )}
              onClick={() => handleSupplierSelect(supplier)}
            >
              <span>{supplier}</span>
              {value === supplier && <Check className="h-4 w-4 text-green-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
