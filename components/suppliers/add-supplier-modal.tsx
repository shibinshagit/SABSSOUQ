"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { createSupplier } from "@/app/actions/supplier-actions"
import { FormAlert } from "@/components/ui/form-alert"
import { useNotification } from "@/components/ui/global-notification"

interface AddSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  userId: number
}

function AddSupplierModal({ isOpen, onClose, onSuccess, userId }: AddSupplierModalProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formAlert, setFormAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null)

  const { showNotification } = useNotification()

  // Auto-dismiss form alerts after 5 seconds
  useEffect(() => {
    if (formAlert) {
      const timer = setTimeout(() => {
        setFormAlert(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [formAlert])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("")
      setPhone("")
      setEmail("")
      setAddress("")
      setFormAlert(null)
    }
  }, [isOpen])

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
        formData.append("name", name.trim())
        formData.append("phone", phone.trim())
        formData.append("email", email.trim())
        formData.append("address", address.trim())
        formData.append("user_id", userId.toString())

        const result = await createSupplier(formData)

        if (result.success) {
          showNotification("success", "Supplier added successfully")
          if (onSuccess) {
            onSuccess()
          }
          setTimeout(() => {
            onClose()
          }, 500)
        } else {
          setFormAlert({
            type: "error",
            message: result.message || "Failed to add supplier",
          })
          showNotification("error", result.message || "Failed to add supplier")
        }
      } catch (error) {
        console.error("Add supplier error:", error)
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
          <DialogTitle className="text-xl font-bold">Add New Supplier</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter supplier name"
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
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

export default AddSupplierModal
