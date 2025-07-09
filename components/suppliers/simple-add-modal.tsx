"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface SimpleAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: number
}

function SimpleAddModal({ isOpen, onClose, onSuccess, userId }: SimpleAddModalProps) {
  console.log("🔵 SimpleAddModal: Component rendered", { isOpen, userId })

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🟡 SimpleAddModal: Form submitted", { name, phone, email, address })

    if (!name.trim() || !phone.trim()) {
      console.log("🔴 SimpleAddModal: Validation failed")
      setError("Name and phone are required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const submitData = () => {
      console.log("🟡 SimpleAddModal: Starting submission")

      import("@/app/actions/supplier-actions")
        .then((actions) => {
          console.log("🟡 SimpleAddModal: Actions imported")
          const formData = new FormData()
          formData.append("name", name.trim())
          formData.append("phone", phone.trim())
          formData.append("email", email.trim())
          formData.append("address", address.trim())
          formData.append("user_id", userId.toString())

          return actions.createSupplier(formData)
        })
        .then((result) => {
          console.log("🟡 SimpleAddModal: Create result", result)
          if (result.success) {
            console.log("🟢 SimpleAddModal: Success")
            onSuccess()
          } else {
            console.error("🔴 SimpleAddModal: Create failed", result.message)
            setError(result.message || "Failed to add supplier")
          }
        })
        .catch((err) => {
          console.error("🔴 SimpleAddModal: Exception", err)
          setError("An unexpected error occurred")
        })
        .finally(() => {
          console.log("🟡 SimpleAddModal: Submission completed")
          setIsSubmitting(false)
        })
    }

    submitData()
  }

  const handleClose = () => {
    console.log("🟡 SimpleAddModal: Close requested")
    setName("")
    setPhone("")
    setEmail("")
    setAddress("")
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter supplier name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="add-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-email">Email</Label>
            <Input
              id="add-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-address">Address</Label>
            <Textarea
              id="add-address"
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
                  Adding...
                </>
              ) : (
                "Add Supplier"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SimpleAddModal
