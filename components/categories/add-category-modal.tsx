"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createCategory } from "@/app/actions/category-actions"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Category {
  id: number
  name: string
  description?: string
}

interface AddCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (category: Category) => void
  userId?: number
  existingCategories: Category[]
}

export function AddCategoryModal({ isOpen, onClose, onSuccess, userId, existingCategories }: AddCategoryModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        description: "",
      })
      setError(null)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent form submission

    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Validate form
      if (!formData.name.trim()) {
        setError("Category name is required")
        setIsSubmitting(false)
        return
      }

      // Check for duplicate category
      const isDuplicate = existingCategories.some(
        (cat) => cat.name.toLowerCase() === formData.name.trim().toLowerCase(),
      )

      if (isDuplicate) {
        setError("A category with this name already exists")
        setIsSubmitting(false)
        return
      }

      // Create category
      const result = await createCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        userId: userId,
      })

      if (result.success && result.data) {
        toast({
          title: "Success",
          description: `Category "${result.data.name}" created successfully`,
        })

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess(result.data)
        }

        // Close modal
        onClose()
      } else {
        setError(result.message || "Failed to create category")
      }
    } catch (error) {
      console.error("Error creating category:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter category name"
                required
                className="bg-white"
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter category description"
                className="bg-white resize-none min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault()
                onClose()
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
