"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollableContent } from "@/components/ui/custom-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { adjustProductStock } from "@/app/actions/product-actions"
import { getDeviceCurrency } from "@/app/actions/dashboard-actions"
import { FormAlert } from "@/components/ui/form-alert"
import { Loader2 } from "lucide-react"

interface AdjustStockModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  userId: number
  currency?: string
  onSuccess?: (product: any) => void
}

export default function AdjustStockModal({
  isOpen,
  onClose,
  product,
  userId,
  currency: currencyProp,
  onSuccess,
}: AdjustStockModalProps) {
  const [stockHistory, setStockHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [adjustType, setAdjustType] = useState<"increase" | "decrease">("increase")
  const [quantity, setQuantity] = useState<string>("1")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currency, setCurrency] = useState(currencyProp || "AED") // Use prop or default
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { toast } = useToast()

  // Auto-dismiss error and success messages after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleSubmit = async () => {
    const quantityNum = Number.parseInt(quantity)

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setErrorMessage("Please enter a valid quantity greater than zero")
      return
    }

    // For decrease, check if we have enough stock
    if (adjustType === "decrease" && quantityNum > product.stock) {
      setErrorMessage("Cannot decrease more than current stock")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const formData = new FormData()
      formData.append("product_id", product.id.toString())
      formData.append("quantity", quantity)
      formData.append("type", adjustType)
      formData.append("notes", notes)
      formData.append("user_id", userId.toString())

      const result = await adjustProductStock(formData)

      if (result.success) {
        setSuccessMessage(result.message || "Stock adjusted successfully")

        // Call onSuccess callback if provided
        if (onSuccess && result.data) {
          onSuccess(result.data)
        }

        resetForm()

        // Close modal after a short delay to show success message
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setErrorMessage(result.message || "Failed to adjust stock")
      }
    } catch (error) {
      console.error("Adjust stock error:", error)
      setErrorMessage("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setQuantity("1")
    setAdjustType("increase")
    setNotes("")
  }

  useEffect(() => {
    const fetchCurrency = async () => {
      if (!isOpen || !product?.id) return

      try {
        setIsLoading(true)

        // If currency is not provided as a prop, fetch it
        if (!currencyProp) {
          try {
            const deviceCurrency = await getDeviceCurrency(userId)
            setCurrency(deviceCurrency)
          } catch (err) {
            console.error("Error fetching currency:", err)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrency()
  }, [isOpen, product?.id, userId, currencyProp])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <ScrollableContent className="p-6">
          <DialogHeader>
            <DialogTitle className="text-center">Adjust Stock for {product?.name}</DialogTitle>
          </DialogHeader>

          {/* Error and Success Messages */}
          {errorMessage && (
            <FormAlert
              variant="destructive"
              title="Error"
              message={errorMessage}
              className="mt-4"
              onDismiss={() => setErrorMessage(null)}
            />
          )}

          {successMessage && (
            <FormAlert
              variant="success"
              title="Success"
              message={successMessage}
              className="mt-4"
              onDismiss={() => setSuccessMessage(null)}
            />
          )}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-base">
                Current Stock: <span className="font-semibold">{product?.stock || 0}</span>
              </Label>
            </div>

            <div className="flex justify-between py-2 border-b">
              <span className="font-medium">Price:</span>
              <span className="font-semibold">
                {currency} {typeof product.price === "number" ? product.price.toFixed(2) : product.price}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Adjustment Type</Label>
              <RadioGroup value={adjustType} onValueChange={setAdjustType} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="increase" id="increase" />
                  <Label htmlFor="increase" className="cursor-pointer">
                    Increase
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="decrease" id="decrease" />
                  <Label htmlFor="decrease" className="cursor-pointer">
                    Decrease
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for adjustment (optional)"
                rows={3}
                className="bg-white"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adjusting...
                </>
              ) : (
                "Adjust Stock"
              )}
            </Button>
          </DialogFooter>
        </ScrollableContent>
      </DialogContent>
    </Dialog>
  )
}
