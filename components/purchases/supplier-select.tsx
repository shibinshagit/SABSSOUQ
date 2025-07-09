"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface SupplierSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

// We'll use a simple array of recent suppliers and enhance the component to be similar to CustomerSelect
const recentSuppliers = ["ABC Electronics", "XYZ Audio", "Global Tech", "Mega Supplies", "Tech Wholesalers"]

export default function SupplierSelect({ value, onChange, disabled = false }: SupplierSelectProps) {
  const [open, setOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<string[]>([...recentSuppliers])
  const [inputValue, setInputValue] = useState(value || "")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setInputValue(value || "")
  }, [value])

  const handleSelect = (currentValue: string) => {
    onChange(currentValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value || "Select supplier..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search or enter supplier..."
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleSelect(inputValue)
              }
            }}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>No supplier found, press enter to add "{inputValue}"</CommandEmpty>
                <CommandGroup heading="Recent Suppliers">
                  {suppliers.map((supplier) => (
                    <CommandItem key={supplier} value={supplier} onSelect={() => handleSelect(supplier)}>
                      <Check className={cn("mr-2 h-4 w-4", value === supplier ? "opacity-100" : "opacity-0")} />
                      {supplier}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
