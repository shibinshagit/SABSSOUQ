"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Monitor, Search, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getDevicesByCompany, createDevice, updateDevice } from "@/app/actions/admin-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Device = {
  id: number
  name: string
  email: string
  company_id: number
  created_at?: string
  currency?: string
}

interface DevicesTabProps {
  companyId: number
  onDeviceSelect?: (device: Device) => void
}

export default function DevicesTab({ companyId, onDeviceSelect }: DevicesTabProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const currencyOptions = [
    { value: "QAR", label: "Qatari Riyal (QAR)" },
    { value: "USD", label: "US Dollar (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "GBP", label: "British Pound (GBP)" },
    { value: "AED", label: "UAE Dirham (AED)" },
    { value: "SAR", label: "Saudi Riyal (SAR)" },
    { value: "KWD", label: "Kuwaiti Dinar (KWD)" },
    { value: "BHD", label: "Bahraini Dinar (BHD)" },
    { value: "OMR", label: "Omani Rial (OMR)" },
    { value: "INR", label: "Indian Rupee (INR)" },
    { value: "PKR", label: "Pakistani Rupee (PKR)" },
  ]

  useEffect(() => {
    fetchDevices()
  }, [companyId])

  const fetchDevices = async () => {
    setIsLoading(true)
    try {
      const result = await getDevicesByCompany(companyId)
      if (result.success) {
        setDevices(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load devices",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDevice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.append("company_id", companyId.toString())
      const result = await createDevice(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Device added successfully",
        })
        setIsAddDialogOpen(false)
        fetchDevices()
      } else {
        setFormError(result.message)
      }
    } catch (error) {
      setFormError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateDevice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedDevice) return

    setFormError(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.append("id", selectedDevice.id.toString())
      formData.append("company_id", companyId.toString())
      const result = await updateDevice(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Device updated successfully",
        })
        setIsEditDialogOpen(false)
        fetchDevices()
      } else {
        setFormError(result.message)
      }
    } catch (error) {
      setFormError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const filteredDevices = devices.filter(
    (device) =>
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-orbitron text-lg font-medium text-white">DEVICES</h3>
          <p className="text-sm text-[#94A3B8]">Manage devices for this company</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-[#334155] bg-[#0F172A] text-white focus:border-[#6366F1]"
            />
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED]"
          >
            <Plus className="mr-2 h-4 w-4" /> ADD DEVICE
          </Button>
        </div>
      </div>

      <Card className="border-[#334155] bg-[#1E293B]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="py-8 text-center text-[#94A3B8]">
              <Monitor className="mx-auto mb-2 h-10 w-10 text-[#334155]" />
              <p>No devices found. Add your first device to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#334155]">
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#94A3B8]">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#94A3B8]">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#94A3B8]">Currency</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#94A3B8]">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-[#94A3B8]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((device) => (
                    <tr key={device.id} className="border-b border-[#334155] hover:bg-[#0F172A]/50">
                      <td className="px-4 py-3 text-sm text-white">
                        <div className="flex items-center">
                          <Monitor className="mr-2 h-4 w-4 text-[#6366F1]" />
                          <span>{device.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{device.email}</td>
                      <td className="px-4 py-3 text-sm text-white">{device.currency || "QAR"}</td>
                      <td className="px-4 py-3 text-sm text-white">{formatDate(device.created_at)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeviceSelect && onDeviceSelect(device)}
                            className="text-[#94A3B8] hover:bg-[#334155] hover:text-white"
                          >
                            <Monitor className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedDevice(device)
                              setIsEditDialogOpen(true)
                            }}
                            className="text-[#94A3B8] hover:bg-[#334155] hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="border-[#334155] bg-[#1E293B] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-xl text-white">ADD NEW DEVICE</DialogTitle>
            <DialogDescription className="text-[#94A3B8]">
              Create a new device account for this company.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddDevice} className="space-y-4">
            {formError && (
              <Alert variant="destructive" className="border-red-500 bg-red-900/20 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#94A3B8]">
                Device Name
              </Label>
              <Input
                id="name"
                name="name"
                required
                className="border-[#334155] bg-[#0F172A] text-white focus:border-[#6366F1]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#94A3B8]">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="border-[#334155] bg-[#0F172A] text-white focus:border-[#6366F1]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-[#94A3B8]">
                Currency
              </Label>
              <Select name="currency" defaultValue="QAR">
                <SelectTrigger
                  id="currency"
                  className="border-[#334155] bg-[#0F172A] text-white focus:border-[#6366F1]"
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="border-[#334155] bg-[#1E293B] text-white">
                  {currencyOptions.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#94A3B8]">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="border-[#334155] bg-[#0F172A] text-white focus:border-[#6366F1]"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="border-[#334155] bg-transparent text-[#94A3B8] hover:bg-[#334155] hover:text-white"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> ADDING...
                  </>
                ) : (
                  "ADD DEVICE"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-[#334155] bg-[#1E293B] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-xl text-white">EDIT DEVICE</DialogTitle>
            <DialogDescription className="text-[#94A3B8]">Update device account details.</DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <form onSubmit={handleUpdateDevice} className="space-y-4">
              {formError && (
                <Alert variant="destructive" className="border-red-500 bg-red-900/20 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2">{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-[#94A3B8]">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={selectedDevice.name}
                  required
                  className="border-[#334155] bg-[#0F172A] text-white focus:border-[#6366F1]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-[#94A3B8]">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={selectedDevice.email}
                  required
                  className="border-[#334155] bg-[#0F172A] text-white focus:border-[#6366F1]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currency" className="text-[#94A3B8]">
                  Currency
                </Label>
                <Select name="currency" defaultValue={selectedDevice.currency || "QAR"}>
                  <SelectTrigger
                    id="edit-currency"
                    className="border-[#334155] bg-[#0F172A] text-white focus:border-[#6366F1]"
                  >
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="border-[#334155] bg-[#1E293B] text-white">
                    {currencyOptions.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password" className="text-[#94A3B8]">
                  Password (leave blank to keep current)
                </Label>
                <Input
                  id="edit-password"
                  name="password"
                  type="password"
                  className="border-[#334155] bg-[#0F172A] text-white focus:border-[#6366F1]"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-[#334155] bg-transparent text-[#94A3B8] hover:bg-[#334155] hover:text-white"
                >
                  CANCEL
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#4F46E5] hover:to-[#7C3AED]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> UPDATING...
                    </>
                  ) : (
                    "UPDATE DEVICE"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
