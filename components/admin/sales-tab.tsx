"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Search, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getSalesByCompany } from "@/app/actions/admin-actions"
import { format } from "date-fns"

interface SalesTabProps {
  companyId: number
}

type Sale = {
  id: number
  customer_name?: string
  total_amount: number
  status: string
  sale_date: string
  created_by: number
}

export default function SalesTab({ companyId }: SalesTabProps) {
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchSales()
  }, [companyId])

  const fetchSales = async () => {
    setIsLoading(true)
    try {
      const result = await getSalesByCompany(companyId)
      if (result.success) {
        setSales(result.data || [])
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to load sales",
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

  const filteredSales = sales.filter(
    (sale) =>
      (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      sale.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toString().includes(searchTerm),
  )

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <CardTitle className="flex items-center">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Sales
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search sales..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-gray-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">#{sale.id}</td>
                    <td className="px-4 py-3">{sale.customer_name || "Walk-in Customer"}</td>
                    <td className="px-4 py-3">
                      $
                      {typeof sale.total_amount === "number"
                        ? sale.total_amount.toFixed(2)
                        : Number(sale.total_amount).toFixed(2) || "0.00"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          sale.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : sale.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(sale.sale_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <ShoppingCart className="mb-2 h-10 w-10 text-gray-400" />
            <h3 className="text-lg font-medium">No sales found</h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? "No sales match your search criteria" : "This company doesn't have any sales yet"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
