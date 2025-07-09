"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Building, Users, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createCompany, getCompanies } from "@/app/actions/admin-actions"

type Company = {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  description?: string
  logo_url?: string
  user_count?: number
  created_at?: string
}

export default function CompanySetupTab() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    setIsLoading(true)
    try {
      const result = await getCompanies()
      if (result.success) {
        // Update this line to use the correct property name
        setCompanies(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load companies",
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

  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await createCompany(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Company added successfully",
        })
        setIsAddDialogOpen(false)
        fetchCompanies()
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Companies</h2>
          <p className="text-muted-foreground">Manage company profiles and settings.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Company
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Management</CardTitle>
          <CardDescription>View and manage all companies in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : companies.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No companies found. Add your first company to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <Card
                  key={company.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => {
                    setSelectedCompany(company)
                    setIsViewDialogOpen(true)
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium">{company.name}</h3>
                        <p className="text-sm text-muted-foreground">{company.address || "No address provided"}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{company.user_count || 0} users</span>
                      </div>
                      <span className="text-muted-foreground">Created: {formatDate(company.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Company Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>Create a new company profile in the system.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCompany} className="space-y-4">
            {formError && (
              <Alert variant="destructive" className="border-red-300 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input id="logo_url" name="logo_url" type="url" placeholder="https://example.com/logo.png" />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                  </>
                ) : (
                  "Add Company"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Company Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
            <DialogDescription>View company information and associated users.</DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="rounded-md bg-gray-50 p-4">
                <h3 className="mb-2 text-lg font-medium">{selectedCompany.name}</h3>
                {selectedCompany.address && (
                  <p className="text-sm">
                    <span className="font-medium">Address:</span> {selectedCompany.address}
                  </p>
                )}
                {selectedCompany.phone && (
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span> {selectedCompany.phone}
                  </p>
                )}
                {selectedCompany.email && (
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {selectedCompany.email}
                  </p>
                )}
                {selectedCompany.description && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Description:</span> {selectedCompany.description}
                  </p>
                )}
                <p className="mt-2 text-sm">
                  <span className="font-medium">Created:</span> {formatDate(selectedCompany.created_at)}
                </p>
              </div>
              <div>
                <h4 className="mb-2 font-medium">Associated Users</h4>
                <p className="text-sm text-muted-foreground">
                  This company has {selectedCompany.user_count || 0} associated users.
                </p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
