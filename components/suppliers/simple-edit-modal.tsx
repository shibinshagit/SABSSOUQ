"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface SimpleEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  supplierId: number
  userId: number
}

function SimpleEditModal({ isOpen, onClose, onSuccess, supplierId, userId }: SimpleEditModalProps) {
  console.log("🔵 SimpleEditModal: Component rendered", { isOpen, supplierId, userId })

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && supplierId) {
      console.log("🟢 SimpleEditModal: Loading supplier data")
      loadSupplierData()
    }
  }, [isOpen, supplierId])

  const loadSupplierData = () => {
    setIsLoading(true)
    setError(null)

    import("@/app/actions/supplier-actions")
      .then((actions) => {
        console.log("🟡 SimpleEditModal: Actions imported")
        return actions.getSupplierById(supplierId)
      })
      .then((response) => {
        console.log("🟡 SimpleEditModal: Data response", response)
        if (response.success) {
          const supplier = response.data
          setName(supplier.name || "")
          setPhone(supplier.phone || "")
          setEmail(supplier.email || "")
          setAddress(supplier.address || "")
        } else {
          setError(response.message || "Failed to load supplier data")
        }
      })
      .catch((err) => {
        console.error("🔴 SimpleEditModal: Exception", err)
        setError("An unexpected error occurred")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🟡 SimpleEditModal: Form submitted", { name, phone, email, address })

    if (!name.trim() || !phone.trim()) {
      console.log("🔴 SimpleEditModal: Validation failed")
      setError("Name and phone are required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const submitData = () => {
      console.log("🟡 SimpleEditModal: Starting submission")

      import("@/app/actions/supplier-actions")
        .then((actions) => {
          console.log("🟡 SimpleEditModal: Actions imported")
          const formData = new FormData()
          formData.append("id", supplierId.toString())
          formData.append("name", name.trim())
          formData.append("phone", phone.trim())
          formData.append("email", email.trim())
          formData.append("address", address.trim())
          formData.append("user_id", userId.toString())

          return actions.updateSupplier(formData)
        })
        .then((result) => {
          console.log("🟡 SimpleEditModal: Update result", result)
          if (result.success) {
            console.log("🟢 SimpleEditModal: Success")
            onSuccess()
          } else {
            console.error("🔴 SimpleEditModal: Update failed", result.message)
            setError(result.message || "Failed to update supplier")
          }
        })
        .catch((err) => {
          console.error("🔴 SimpleEditModal: Exception", err)
          setError("An unexpected error occurred")
        })
        .finally(() => {
          console.log("🟡 SimpleEditModal: Submission completed")
          setIsSubmitting(false)
        })
    }

    submitData()
  }

  const handleClose = () => {
    console.log("🟡 SimpleEditModal: Close requested")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading supplier data...</span>
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
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
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

export default SimpleEditModal
