"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { getDeviceStaff, searchStaff } from "@/app/actions/staff-actions"

interface Staff {
  id: number
  name: string
  phone: string
  position: string
  salary: number
}

interface StaffSelectSimpleProps {
  id?: string
  value: number | null
  onChange: (value: number, name: string) => void
  onAddNew: () => void
  userId?: number
  deviceId: number
}

export default function StaffSelectSimple({ id, value, onChange, onAddNew, userId, deviceId }: StaffSelectSimpleProps) {
  const [open, setOpen] = useState(false)
  const [staff, setStaff] = useState<Staff[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Load staff when popover opens
  useEffect(() => {
    if (open && deviceId) {
      loadStaff()
    }
  }, [open, deviceId])

  const loadStaff = async () => {
    setIsLoading(true)
    try {
      const result = await getDeviceStaff(deviceId)
      if (result.success && result.data) {
        setStaff(result.data)
      } else {
        console.error("Failed to load staff:", result.message)
        setStaff([])
      }
    } catch (error) {
      console.error("Error loading staff:", error)
      setStaff([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (searchValue: string) => {
    setSearchTerm(searchValue)
    if (searchValue.trim() === "") {
      loadStaff()
      return
    }

    setIsLoading(true)
    try {
      const result = await searchStaff(deviceId, searchValue)
      if (result.success && result.data) {
        setStaff(result.data)
      } else {
        setStaff([])
      }
    } catch (error) {
      console.error("Error searching staff:", error)
      setStaff([])
    } finally {
      setIsLoading(false)
    }
  }

  const selectedStaff = staff.find((member) => member.id === value)

  const handleStaffSelect = (staffMember: Staff) => {
    onChange(staffMember.id, staffMember.name)
    setOpen(false)
    setSearchTerm("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 text-left font-normal"
        >
          {selectedStaff ? (
            <span className="truncate">
              {selectedStaff.name}
              <span className="text-xs text-gray-500 ml-1">({selectedStaff.position})</span>
            </span>
          ) : (
            <span className="text-gray-500">Select staff member...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start" side="bottom">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search staff..."
              value={searchTerm}
              onValueChange={handleSearch}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-gray-500">Loading staff...</div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 mb-2">
                      {searchTerm ? `No staff found for "${searchTerm}"` : "No staff members found."}
                    </p>
                    <Button size="sm" onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-1" />
                      Add New Staff
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {staff.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={`${member.name}-${member.id}`}
                      onSelect={() => handleStaffSelect(member)}
                      className="flex items-center justify-between py-2 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <Check className={cn("mr-2 h-4 w-4", value === member.id ? "opacity-100" : "opacity-0")} />
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-gray-500">{member.phone}</div>
                          <div className="text-xs text-blue-600 font-medium">{member.position}</div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            <div className="border-t p-2">
              <Button size="sm" onClick={onAddNew} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-1" />
                Add New Staff
              </Button>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
