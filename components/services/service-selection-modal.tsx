"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Check, Trash2 } from "lucide-react"
import { getDeviceServices, searchServices, deleteService } from "@/app/actions/service-actions"
import { useToast } from "@/components/ui/use-toast"
import { useAppSelector } from "@/store/hooks"
import { selectDeviceId } from "@/store/slices/deviceSlice"

interface Service {
  id: number
  name: string
  description?: string
  category?: string
  price: number | string
  duration_minutes?: number
}

interface ServiceSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (serviceId: number, serviceName: string, price: number, duration?: number) => void
  onAddNew: () => void
  selectedServiceId?: number | null
}

export default function ServiceSelectionModal({
  isOpen,
  onClose,
  onSelect,
  onAddNew,
  selectedServiceId,
}: ServiceSelectionModalProps) {
  const [services, setServices] = useState<Service[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const { toast } = useToast()

  // Get deviceId from Redux store
  const deviceId = useAppSelector(selectDeviceId)

  // Load services when modal opens
  useEffect(() => {
    if (isOpen) {
      loadServices()
    }
  }, [isOpen])

  const loadServices = async () => {
    setIsLoading(true)
    try {
      if (!deviceId) {
        toast({
          title: "Error",
          description: "Device ID is not available. Please refresh the page.",
          variant: "destructive",
        })
        setServices([])
        setIsLoading(false)
        return
      }

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

    if (!deviceId) {
      toast({
        title: "Error",
        description: "Device ID is not available. Please refresh the page.",
        variant: "destructive",
      })
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

  const handleServiceSelect = (service: Service) => {
    const price = typeof service.price === "string" ? Number.parseFloat(service.price) : service.price
    onSelect(service.id, service.name, price || 0, service.duration_minutes)
    onClose()
  }

  const handleDeleteService = async (serviceId: number, serviceName: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent service selection when clicking delete

    if (!deviceId) {
      toast({
        title: "Error",
        description: "Device ID is not available. Please refresh the page.",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete "${serviceName}"?`)) {
      return
    }

    setDeletingId(serviceId)
    try {
      const result = await deleteService(serviceId, deviceId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Service deleted successfully",
        })
        // Reload services
        loadServices()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete service",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddNew = () => {
    onClose()
    onAddNew()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold text-gray-900">Select Service</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading services...</div>
            </div>
          ) : services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-500 mb-4">
                {searchTerm ? `No services found for "${searchTerm}"` : "No services found"}
              </div>
              <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add New Service
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const price = typeof service.price === "string" ? Number.parseFloat(service.price) : service.price
                const isSelected = selectedServiceId === service.id
                const isDeleting = deletingId === service.id

                return (
                  <div
                    key={service.id}
                    onClick={() => !isDeleting && handleServiceSelect(service)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                    } ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-green-500 bg-green-500" : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            {service.category && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {service.category}
                              </span>
                            )}
                            {service.duration_minutes && service.duration_minutes > 0 && (
                              <span className="text-xs text-gray-500">{service.duration_minutes} minutes</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">AED {(price || 0).toFixed(2)}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteService(service.id, service.name, e)}
                          disabled={isDeleting}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t p-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New Service
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
