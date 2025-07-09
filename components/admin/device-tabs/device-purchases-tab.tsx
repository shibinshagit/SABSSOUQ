"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Receipt, Search, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getPurchasesByDevice } from "@/app/actions/admin-actions"
import { format } from "date-fns"

interface DevicePurchasesTabProps {
  deviceId: number
}

export default function DevicePurchasesTab({ deviceId }: DevicePurchasesTabProps) {
  const [purchases, setPurchases] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchPurchases()
  }, [deviceId])

  const fetchPurchases = async () => {
    setIsLoading(true)
    try {
      const result = await getPurchasesByDevice(deviceId)
      if (result.success) {
        setPurchases(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load purchases",
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

  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.id.toString().includes(searchTerm),
  )

  const formatDate = (dateString: string) => {
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
          <Receipt className="mr-2 h-5 w-5" />
          PURCHASES
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#94A3B8]" />
          <Input
            type="search"
            placeholder="Search purchases..."
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
        ) : filteredPurchases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#334155] text-left text-sm font-medium text-[#94A3B8]">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-[#334155] hover:bg-[#0F172A]/50">
                    <td className="px-4 py-3 text-white">#{purchase.id}</td>
                    <td className="px-4 py-3 text-white">{purchase.supplier}</td>
                    <td className="px-4 py-3 text-white">${purchase.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          purchase.status === "Completed"
                            ? "bg-green-900/20 text-green-400"
                            : purchase.status === "Pending"
                              ? "bg-yellow-900/20 text-yellow-400"
                              : "bg-[#334155] text-[#94A3B8]"
                        }`}
                      >
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{formatDate(purchase.purchase_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <Receipt className="mb-2 h-10 w-10 text-[#334155]" />
            <h3 className="text-lg font-medium text-white">No purchases found</h3>
            <p className="text-[#94A3B8]">
              {searchTerm ? "No purchases match your search criteria" : "This device doesn't have any purchases yet"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
