"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Search, Loader2, User } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getCustomersByDevice } from "@/app/actions/admin-actions"
import { format } from "date-fns"

interface DeviceCustomersTabProps {
  deviceId: number
}

export default function DeviceCustomersTab({ deviceId }: DeviceCustomersTabProps) {
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchCustomers()
  }, [deviceId])

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const result = await getCustomersByDevice(deviceId)
      if (result.success) {
        setCustomers(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load customers",
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

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm)),
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <Card className="border-[#334155] bg-[#1E293B]">
      <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <CardTitle className="flex items-center font-orbitron text-white">
          <Users className="mr-2 h-5 w-5" />
          CUSTOMERS
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8 border-[#334155] bg-[#0F172A] text-white focus:border-[#6366F1]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#6366F1]" />
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#334155] text-left text-sm font-medium text-[#94A3B8]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Total Purchases</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-[#334155] hover:bg-[#0F172A]/50">
                    <td className="px-4 py-3 text-white">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-[#6366F1]" />
                        <span>{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">{customer.email || "N/A"}</td>
                    <td className="px-4 py-3 text-white">{customer.phone || "N/A"}</td>
                    <td className="px-4 py-3 text-white">{customer.total_purchases || 0}</td>
                    <td className="px-4 py-3 text-white">{formatDate(customer.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <Users className="mb-2 h-10 w-10 text-[#334155]" />
            <h3 className="text-lg font-medium text-white">No customers found</h3>
            <p className="text-[#94A3B8]">
              {searchTerm ? "No customers match your search criteria" : "This device doesn't have any customers yet"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
