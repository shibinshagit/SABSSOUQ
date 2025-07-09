"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User, UserCheck, UserX } from "lucide-react"
import { FormAlert } from "@/components/ui/form-alert"

interface Staff {
  id: number
  name: string
  position: string
  is_active: boolean
  // Add other staff properties as needed
}

interface StaffSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (staffId: number, staffName: string) => void
  onAddNew: () => void
  selectedStaffId?: number | null
  deviceId?: number | null
  staffData: Staff[] // Use passed staff data from Redux
}

export default function StaffSelectionModal({
  isOpen,
  onClose,
  onSelect,
  onAddNew,
  selectedStaffId,
  deviceId,
  staffData,
}: StaffSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter staff based on search term - show both active and inactive
  useEffect(() => {
    if (!staffData) {
      setFilteredStaff([])
      return
    }

    setIsLoading(true)
    try {
      // Create a copy of the array to avoid mutating the original Redux state
      let filtered = [...staffData]

      // Filter by search term if provided
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(
          (staff) => staff.name.toLowerCase().includes(term) || staff.position.toLowerCase().includes(term),
        )
      }

      // Sort by active status first (active staff at the top), then by name
      // Create a new sorted array instead of mutating the existing one
      const sortedFiltered = filtered.slice().sort((a, b) => {
        if (a.is_active && !b.is_active) return -1
        if (!a.is_active && b.is_active) return 1
        return a.name.localeCompare(b.name)
      })

      setFilteredStaff(sortedFiltered)
      setError(null)
    } catch (err) {
      console.error("Error filtering staff:", err)
      setError("Failed to filter staff data")
      setFilteredStaff([])
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, staffData])

  const handleStaffClick = (staff: Staff) => {
    if (!staff.is_active) {
      // Don't allow selection of inactive staff
      return
    }
    onSelect(staff.id, staff.name)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Select Staff Member
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {error && <FormAlert type="error" message={error} className="mb-4" />}

          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search staff by name or position..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto rounded-md border border-gray-200">
            {isLoading ? (
              <div className="flex items-center justify-center p-4 text-sm text-gray-500">Loading staff...</div>
            ) : filteredStaff.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className={`flex items-center justify-between p-3 transition-colors ${
                      staff.is_active
                        ? `cursor-pointer ${
                            selectedStaffId === staff.id ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                          }`
                        : "cursor-not-allowed bg-gray-50 opacity-75"
                    }`}
                    onClick={() => handleStaffClick(staff)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-full ${staff.is_active ? "bg-green-100" : "bg-red-100"}`}>
                        {staff.is_active ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <UserX className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${!staff.is_active ? "text-gray-500" : ""}`}>{staff.name}</div>
                        <div className="text-xs text-gray-500">{staff.position}</div>
                        {!staff.is_active && (
                          <div className="text-xs text-red-500 mt-1">Inactive - Make active to select</div>
                        )}
                      </div>
                    </div>
                    {selectedStaffId === staff.id && staff.is_active && (
                      <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <User className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-1">No staff members found</p>
                {searchTerm && <p className="text-xs text-gray-400">Try adjusting your search terms</p>}
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
