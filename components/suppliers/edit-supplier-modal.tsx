"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { getSupplierById, updateSupplier } from "@/app/actions/supplier-actions"
import { FormAlert } from "@/components/ui/form-alert"
import { useNotification } from "@/components/ui/global-notification"

interface EditSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  supplierId: number
  userId: number
}

function EditSupplierModal({ isOpen, onClose, onSuccess, supplierId, userId }: EditSupplierModalProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formAlert, setFormAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null)

  const { showNotification } = useNotification()

  useEffect(() => {
    if (isOpen && supplierId) {
      loadSupplierData()
    }
  }, [isOpen, supplierId])

  useEffect(() => {
    if (formAlert) {
      const timer = setTimeout(() => {
        setFormAlert(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [formAlert])

  const loadSupplierData = () => {
    setIsLoading(true)

    const fetchData = async () => {
      try {
        const response = await getSupplierById(supplierId)
        if (response.success) {
          const supplier = response.data
          setName(supplier.name || "")
          setPhone(supplier.phone || "")
          setEmail(supplier.email || "")
          setAddress(supplier.address || "")
        } else {
          setFormAlert({
            type: "error",
            message: response.message || "Failed to load supplier data",
          })
        }
      } catch (error) {
        console.error("Load supplier error:", error)
        setFormAlert({
          type: "error",
          message: "An unexpected error occurred",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !phone.trim()) {
      setFormAlert({
        type: "error",
        message: "Name and phone are required",
      })
      return
    }

    setIsSubmitting(true)

    const submitData = async () => {
      try {
        const formData = new FormData()
        formData.append("id", supplierId.toString())
        formData.append("name", name.trim())
        formData.append("phone", phone.trim())
        formData.append("email", email.trim())
        formData.append("address", address.trim())
        formData.append("user_id", userId.toString())

        const result = await updateSupplier(formData)

        if (result.success) {
          showNotification("success", "Supplier updated successfully")
          if (onSuccess) {
            onSuccess()
          }
          setTimeout(() => {
            onClose()
          }, 500)
        } else {
          setFormAlert({
            type: "error",
            message: result.message || "Failed to update supplier",
          })
          showNotification("error", result.message || "Failed to update supplier")
        }
      } catch (error) {
        console.error("Update supplier error:", error)
        setFormAlert({
          type: "error",
          message: "An unexpected error occurred",
        })
        showNotification("error", "An unexpected error occurred")
      } finally {
        setIsSubmitting(false)
      }
    }

    submitData()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Supplier</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3">Loading supplier data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter supplier name"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address"
                rows={3}
                className="resize-none"
              />
            </div>

            {formAlert && <FormAlert type={formAlert.type} message={formAlert.message} />}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="h-10">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 h-10">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                  </>
                ) : (
                  "Update Supplier"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default EditSupplierModal
