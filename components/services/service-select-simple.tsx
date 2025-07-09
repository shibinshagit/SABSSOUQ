"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { getDeviceServices, searchServices } from "@/app/actions/service-actions"

interface Service {
  id: number
  name: string
  description?: string
  category?: string
  price: number | string
  duration_minutes?: number
}

interface ServiceSelectSimpleProps {
  id?: string
  value: number | null
  onChange: (value: number, name: string, price: number, duration?: number) => void
  onAddNew: () => void
  userId?: number
  deviceId: number
}

export default function ServiceSelectSimple({
  id,
  value,
  onChange,
  onAddNew,
  userId,
  deviceId,
}: ServiceSelectSimpleProps) {
  const [open, setOpen] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Load services when popover opens
  useEffect(() => {
    if (open && deviceId) {
      loadServices()
    }
  }, [open, deviceId])

  const loadServices = async () => {
    setIsLoading(true)
    try {
      const result = await getDeviceServices(deviceId)
      if (result.success && result.data) {
        setServices(result.data)
      } else {
        console.error("Failed to load services:", result.message)
        setServices([])
      }
    } catch (error) {
      console.error("Error loading services:", error)
      setServices([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (searchValue: string) => {
    setSearchTerm(searchValue)
    if (searchValue.trim() === "") {
      loadServices()
      return
    }

    setIsLoading(true)
    try {
      const result = await searchServices(deviceId, searchValue)
      if (result.success && result.data) {
        setServices(result.data)
      } else {
        setServices([])
      }
    } catch (error) {
      console.error("Error searching services:", error)
      setServices([])
    } finally {
      setIsLoading(false)
    }
  }

  const selectedService = services.find((service) => service.id === value)

  const handleServiceSelect = (service: Service) => {
    const price = typeof service.price === "string" ? Number.parseFloat(service.price) : service.price
    onChange(service.id, service.name, price || 0, service.duration_minutes)
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
          {selectedService ? (
            <span className="truncate">{selectedService.name}</span>
          ) : (
            <span className="text-gray-500">Select service...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start" side="bottom">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search services..."
              value={searchTerm}
              onValueChange={handleSearch}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-gray-500">Loading services...</div>
            ) : (
              <>
                <CommandEmpty>
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 mb-2">
                      {searchTerm ? `No services found for "${searchTerm}"` : "No services found."}
                    </p>
                    <Button size="sm" onClick={onAddNew} className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="h-4 w-4 mr-1" />
                      Add New Service
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {services.map((service) => {
                    const price = typeof service.price === "string" ? Number.parseFloat(service.price) : service.price
                    return (
                      <CommandItem
                        key={service.id}
                        value={`${service.name}-${service.id}`}
                        onSelect={() => handleServiceSelect(service)}
                        className="flex items-center justify-between py-2 cursor-pointer"
                      >
                        <div className="flex items-center">
                          <Check className={cn("mr-2 h-4 w-4", value === service.id ? "opacity-100" : "opacity-0")} />
                          <div>
                            <div className="font-medium">{service.name}</div>
                            {service.description && (
                              <div className="text-xs text-gray-500 truncate max-w-[150px]">{service.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">${(price || 0).toFixed(2)}</div>
                          {service.duration_minutes && service.duration_minutes > 0 && (
                            <div className="text-xs text-gray-500">{service.duration_minutes} min</div>
                          )}
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
            <div className="border-t p-2">
              <Button size="sm" onClick={onAddNew} className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-1" />
                Add New Service
              </Button>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
