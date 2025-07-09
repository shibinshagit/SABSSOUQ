"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollableContent } from "@/components/ui/custom-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { updateProduct } from "@/app/actions/product-actions"
import { getCategories, createCategory } from "@/app/actions/category-actions"
import { printBarcodeSticker } from "@/lib/barcode-utils"
import { AlertCircle, Check, ChevronRight, Loader2, Plus, Search, Tag, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { getDeviceCurrency } from "@/app/actions/dashboard-actions"
import { FormError } from "@/components/ui/form-error"

interface Category {
  id: number
  name: string
  description?: string
}

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onSuccess?: (product: any) => void
  userId?: number
}

export default function EditProductModal({ isOpen, onClose, product, onSuccess, userId }: EditProductModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useState("QAR") // Default currency
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    companyName: "",
    category: "",
    categoryId: null as number | null,
    description: "",
    price: "",
    wholesalePrice: "",
    stock: "",
    barcode: "",
  })

  // Category selection state
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [categorySearchQuery, setCategorySearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const categorySearchInputRef = useRef<HTMLInputElement>(null)
  const newCategoryInputRef = useRef<HTMLInputElement>(null)

  // Add this state for field-specific errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Auto-dismiss error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Auto-dismiss field errors after 5 seconds
  useEffect(() => {
    if (Object.keys(fieldErrors).length > 0) {
      const timer = setTimeout(() => {
        setFieldErrors({})
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [fieldErrors])

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name || "",
        companyName: product.company_name || "",
        category: product.category || "",
        categoryId: product.category_id || null,
        description: product.description || "",
        price: product.price?.toString() || "",
        wholesalePrice: product.wholesale_price?.toString() || "",
        stock: product.stock?.toString() || "0",
        barcode: product.barcode || "",
      })

      // Set selected category if available
      if (product.category_id && product.category) {
        setSelectedCategory({
          id: product.category_id,
          name: product.category,
        })
      } else {
        setSelectedCategory(null)
      }
    }
  }, [product])

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      setError(null)
      setFieldErrors({})

      // Fetch currency
      const fetchCurrency = async () => {
        try {
          const deviceCurrency = await getDeviceCurrency(userId || 1)
          setCurrency(deviceCurrency)
        } catch (err) {
          console.error("Error fetching currency:", err)
        }
      }
      fetchCurrency()
    }
  }, [isOpen, userId])

  // Filter categories based on search query
  useEffect(() => {
    if (categorySearchQuery.trim() === "") {
      setFilteredCategories(categories)
    } else {
      const query = categorySearchQuery.toLowerCase()
      setFilteredCategories(categories.filter((category) => category.name.toLowerCase().includes(query)))
    }
  }, [categorySearchQuery, categories])

  // Focus search input when category dialog opens
  useEffect(() => {
    if (isCategoryDialogOpen && categorySearchInputRef.current) {
      setTimeout(() => {
        categorySearchInputRef.current?.focus()
      }, 100)
    }
  }, [isCategoryDialogOpen])

  // Focus new category input when adding new category
  useEffect(() => {
    if (isAddingNewCategory && newCategoryInputRef.current) {
      setTimeout(() => {
        newCategoryInputRef.current?.focus()
      }, 100)
    }
  }, [isAddingNewCategory])

  const fetchCategories = async () => {
    setIsLoadingCategories(true)
    setCategorySearchQuery("")
    try {
      const result = await getCategories(userId)
      if (result.success) {
        setCategories(result.data)
        setFilteredCategories(result.data)
        console.log("Categories loaded for userId:", userId, result.data)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load categories",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createCategory({
        name: newCategoryName.trim(),
        userId: userId,
      })

      if (result.success && result.data) {
        // Add to categories list
        setCategories((prev) => {
          // Check if category already exists
          const exists = prev.some((cat) => cat.id === result.data.id)
          if (!exists) {
            return [...prev, result.data]
          }
          return prev
        })

        // Set as selected category
        setSelectedCategory(result.data)
        setFormData({
          ...formData,
          category: result.data.name,
          categoryId: result.data.id,
        })

        toast({
          title: "Success",
          description: `Category "${result.data.name}" added successfully`,
        })

        // Reset state
        setNewCategoryName("")
        setIsAddingNewCategory(false)
        setIsCategoryDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add category",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      ...formData,
      category: category.name,
      categoryId: category.id,
    })
    setIsCategoryDialogOpen(false)

    toast({
      title: "Category Selected",
      description: `"${category.name}" has been selected`,
      duration: 2000,
    })
  }

  // Update the handleSubmit function to handle field-specific errors
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setFieldErrors({})

    try {
      // Validate form
      if (!formData.name || !formData.price) {
        setFieldErrors({
          ...(formData.name ? {} : { name: "Product name is required" }),
          ...(formData.price ? {} : { price: "Price is required" }),
        })
        setIsSubmitting(false)
        return
      }

      // Update product
      const result = await updateProduct({
        id: formData.id,
        name: formData.name,
        company_name: formData.companyName,
        category: formData.category,
        category_id: formData.categoryId,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        wholesale_price: Number.parseFloat(formData.wholesalePrice || "0"),
        stock: Number.parseInt(formData.stock || "0"),
        barcode: formData.barcode,
        user_id: userId,
      })

      if (result && result.success) {
        toast({
          title: "Success",
          description: "Product updated successfully",
        })

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess(result.data)
        }

        // Close the modal
        onClose()
      } else {
        // Handle field-specific errors
        if (result?.field) {
          setFieldErrors({ [result.field]: result.message })
        } else {
          setError(result?.message || "Failed to update product. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error updating product:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrintPriceTag = () => {
    if (product) {
      printBarcodeSticker(product)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md p-0 max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-800 border dark:border-gray-700">
          <ScrollableContent className="p-6 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-gray-100">Edit Product</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid gap-4">
                {/* Update the form fields to show field-specific errors */}
                {/* For example, update the name input field: */}
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                    Product Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    required
                    className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${fieldErrors.name ? "border-red-500 dark:border-red-400" : ""}`}
                  />
                  <FormError message={fieldErrors.name || ""} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="companyName" className="text-gray-700 dark:text-gray-300">
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>

                {/* Redesigned Category Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-gray-700 dark:text-gray-300">
                    Category *
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between bg-white dark:bg-gray-700 text-left border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                      onClick={() => setIsCategoryDialogOpen(true)}
                    >
                      {selectedCategory ? (
                        <span className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          {selectedCategory.name}
                        </span>
                      ) : (
                        "Select category..."
                      )}
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Button>
                  </div>
                  {selectedCategory && (
                    <p className="text-xs text-gray-500">
                      Selected:{" "}
                      <Badge
                        variant="outline"
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        {selectedCategory.name}
                      </Badge>
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter product description"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="wholesalePrice" className="text-gray-700 dark:text-gray-300">
                      Wholesale Price ({currency})
                    </Label>
                    <Input
                      id="wholesalePrice"
                      name="wholesalePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.wholesalePrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    />
                  </div>

                  {/* Update the price input field: */}
                  <div className="grid gap-2">
                    <Label htmlFor="price" className="text-gray-700 dark:text-gray-300">
                      MRP ({currency}) *
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                      className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${fieldErrors.price ? "border-red-500 dark:border-red-400" : ""}`}
                    />
                    <FormError message={fieldErrors.price || ""} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stock" className="text-gray-700 dark:text-gray-300">
                    Stock
                  </Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                    placeholder="0"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>

                {/* Update the barcode input field: */}
                <div className="grid gap-2">
                  <Label htmlFor="barcode" className="text-gray-700 dark:text-gray-300">
                    Barcode
                  </Label>
                  <Input
                    id="barcode"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="Enter barcode"
                    className={`bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 ${fieldErrors.barcode ? "border-red-500 dark:border-red-400" : ""}`}
                  />
                  <FormError message={fieldErrors.barcode || ""} />
                  <p className="text-xs text-gray-500">Enter a barcode or scan a product to update.</p>
                </div>
              </div>

              {/* Error Message Display - Above Buttons */}
              {error && (
                <Alert
                  variant="destructive"
                  className="mt-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-red-800 dark:text-red-300">Error</AlertTitle>
                  <AlertDescription className="text-red-700 dark:text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrintPriceTag}
                  className="w-full sm:w-auto border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-transparent"
                >
                  Print Price Tag
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </ScrollableContent>
        </DialogContent>
      </Dialog>

      {/* Category Selection Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-800 border dark:border-gray-700">
          <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-gray-900 dark:text-gray-100">Select Category</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCategoryDialogOpen(false)}
                className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {isAddingNewCategory ? (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Add New Category</h3>
                <div className="flex gap-2">
                  <Input
                    ref={newCategoryInputRef}
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddNewCategory}
                    disabled={!newCategoryName.trim() || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingNewCategory(false)}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <Input
                  ref={categorySearchInputRef}
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="pl-9 pr-4 py-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
                {categorySearchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setCategorySearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-1">
            {isLoadingCategories ? (
              <div className="py-8 flex flex-col items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p>Loading categories...</p>
              </div>
            ) : (
              !isAddingNewCategory && (
                <>
                  {filteredCategories.length > 0 ? (
                    <div className="grid gap-1 p-2">
                      {filteredCategories.map((category) => (
                        <Button
                          key={category.id}
                          type="button"
                          variant="ghost"
                          className={`w-full justify-start text-left h-auto py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            selectedCategory?.id === category.id ? "bg-gray-100 dark:bg-gray-700" : ""
                          }`}
                          onClick={() => handleCategorySelect(category)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span>{category.name}</span>
                            </div>
                            {selectedCategory?.id === category.id && (
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      <p>No categories found</p>
                      <p className="mt-1 text-xs">Try a different search or add a new category</p>
                    </div>
                  )}
                </>
              )
            )}
          </div>

          {!isAddingNewCategory && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-transparent"
                onClick={() => setIsAddingNewCategory(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Category
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
