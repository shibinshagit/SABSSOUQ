"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createDevice, getUsers, updateDevice, deleteDevice, getCompanies } from "@/app/actions/admin-actions"

type User = {
  id: number
  name: string
  email: string
  company_name: string
  company_id: number
  created_at?: string
}

type Company = {
  id: number
  name: string
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch users
      const usersResult = await getUsers()
      if (usersResult.success) {
        // Update this line to use the correct property name
        setUsers(usersResult.data || [])
      } else {
        toast({
          title: "Error",
          description: usersResult.message || "Failed to load users",
          variant: "destructive",
        })
      }

      // Fetch companies
      const companiesResult = await getCompanies()
      if (companiesResult.success) {
        // Update this line to use the correct property name
        setCompanies(companiesResult.data || [])
      } else {
        toast({
          title: "Error",
          description: companiesResult.message || "Failed to load companies",
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

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await createDevice(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "User added successfully",
        })
        setIsAddDialogOpen(false)
        fetchData()
      } else {
        setFormError(result.message)
      }
    } catch (error) {
      setFormError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser) return

    setFormError(null)
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      formData.append("id", selectedUser.id.toString())
      const result = await updateDevice(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        setIsEditDialogOpen(false)
        fetchData()
      } else {
        setFormError(result.message)
      }
    } catch (error) {
      setFormError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)

    try {
      const result = await deleteDevice(selectedUser.id)

      if (result.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        setIsDeleteDialogOpen(false)
        fetchData()
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete user",
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
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage system users here.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>No users found. Add your first user to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="px-4 py-3 text-sm">{user.name}</td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3 text-sm">{user.company_name || "N/A"}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with company access.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            {formError && (
              <Alert variant="destructive" className="border-red-300 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_id">Company</Label>
              {companies.length === 0 ? (
                <div className="text-sm text-red-500">No companies available. Please add a company first.</div>
              ) : (
                <Select name="company_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || companies.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                  </>
                ) : (
                  "Add User"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user account details.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              {formError && (
                <Alert variant="destructive" className="border-red-300 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2">{formError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" name="name" defaultValue={selectedUser.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" name="email" type="email" defaultValue={selectedUser.email} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
                <Input id="edit-password" name="password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company_id">Company</Label>
                {companies.length === 0 ? (
                  <div className="text-sm text-red-500">No companies available. Please add a company first.</div>
                ) : (
                  <Select name="company_id" defaultValue={selectedUser.company_id?.toString()} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || companies.length === 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Update User"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="rounded-md bg-gray-50 p-4">
                <p>
                  <span className="font-medium">Name:</span> {selectedUser.name}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {selectedUser.email}
                </p>
                <p>
                  <span className="font-medium">Company:</span> {selectedUser.company_name || "N/A"}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteUser} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    "Delete User"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
