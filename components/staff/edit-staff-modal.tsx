"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useNotification } from "@/components/ui/custom-notification"
import { updateStaff } from "@/app/actions/staff-actions"
import { Loader2, User } from "lucide-react"

interface EditStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onStaffUpdated: (updatedStaff: any) => void
  staffData: any
  userId: number | null | undefined
  deviceId: number | null | undefined
}

export default function EditStaffModal({
  isOpen,
  onClose,
  onStaffUpdated,
  staffData,
  userId = null,
  deviceId = null,
}: EditStaffModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    position: "",
    salary: "",
    salaryDate: "",
    joinedOn: "",
    age: "",
    idCardNumber: "",
    address: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showNotification, NotificationContainer } = useNotification()

  // Populate form with existing staff data
  useEffect(() => {
    if (staffData && isOpen) {
      setFormData({
        name: staffData.name || "",
        phone: staffData.phone || "",
        email: staffData.email || "",
        position: staffData.position || "",
        salary: staffData.salary?.toString() || "",
        salaryDate: staffData.salary_date || "",
        joinedOn: staffData.joined_on || "",
        age: staffData.age?.toString() || "",
        idCardNumber: staffData.id_card_number || "",
        address: staffData.address || "",
      })
    }
  }, [staffData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!deviceId || !userId || !staffData?.id) {
      showNotification({
        message: "Missing required information. Please refresh and try again.",
        type: "error",
      })
      return
    }

    // Validate required fields
    if (!formData.name.trim()) {
      showNotification({
        message: "Name is required",
        type: "error",
      })
      return
    }

    if (!formData.phone.trim()) {
      showNotification({
        message: "Phone is required",
        type: "error",
      })
      return
    }

    if (!formData.position.trim()) {
      showNotification({
        message: "Position is required",
        type: "error",
      })
      return
    }

    if (!formData.salary || Number.parseFloat(formData.salary) < 0) {
      showNotification({
        message: "Valid salary is required",
        type: "error",
      })
      return
    }

    if (!formData.salaryDate) {
      showNotification({
        message: "Salary date is required",
        type: "error",
      })
      return
    }

    if (!formData.joinedOn) {
      showNotification({
        message: "Joined date is required",
        type: "error",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Call the updateStaff server action
      const result = await updateStaff(staffData.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        position: formData.position.trim(),
        salary: Number.parseFloat(formData.salary),
        salaryDate: formData.salaryDate,
        joinedOn: formData.joinedOn,
        age: formData.age ? Number.parseInt(formData.age) : undefined,
        idCardNumber: formData.idCardNumber.trim() || undefined,
        address: formData.address.trim() || undefined,
        deviceId: deviceId,
      })

      if (result.success) {
        showNotification({
          message: result.message || "Staff member updated successfully",
          type: "success",
        })

        // Update Redux with the updated data from database
        onStaffUpdated(result.data)
        onClose()
      } else {
        showNotification({
          message: result.message || "Failed to update staff member",
          type: "error",
        })
      }
    } catch (error) {
      console.error("Error updating staff:", error)
      showNotification({
        message: "An unexpected error occurred while updating staff member",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Edit Staff Member
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Required Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-staff-name">Name *</Label>
                <Input
                  id="edit-staff-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-staff-phone">Phone *</Label>
                <Input
                  id="edit-staff-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-staff-position">Position *</Label>
                <Input
                  id="edit-staff-position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Technician, Manager"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-staff-salary">Salary *</Label>
                <Input
                  id="edit-staff-salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-staff-salary-date">Salary Date *</Label>
                <Input
                  id="edit-staff-salary-date"
                  type="date"
                  value={formData.salaryDate}
                  onChange={(e) => setFormData({ ...formData, salaryDate: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-staff-joined">Joined On *</Label>
                <Input
                  id="edit-staff-joined"
                  type="date"
                  value={formData.joinedOn}
                  onChange={(e) => setFormData({ ...formData, joinedOn: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Optional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-staff-email">Email</Label>
                  <Input
                    id="edit-staff-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-staff-age">Age</Label>
                  <Input
                    id="edit-staff-age"
                    type="number"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="25"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-staff-id-card">ID Card Number</Label>
                  <Input
                    id="edit-staff-id-card"
                    value={formData.idCardNumber}
                    onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                    placeholder="ID card number"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="edit-staff-address">Address</Label>
                <Textarea
                  id="edit-staff-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Staff Member"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <NotificationContainer />
    </>
  )
}
