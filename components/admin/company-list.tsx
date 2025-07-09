"use client"

import { Building2, Users, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type Company = {
  id: number
  name: string
  address?: string
  phone?: string
  email?: string
  description?: string
  logo_url?: string
  device_count?: number
}

interface CompanyListProps {
  companies: Company[]
  isLoading: boolean
  onSelect: (company: Company) => void
}

export default function CompanyList({ companies, isLoading, onSelect }: CompanyListProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#6366F1]" />
          <p className="mt-4 text-[#94A3B8]">LOADING COMPANIES...</p>
        </div>
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <Card className="border-[#334155] bg-[#1E293B]">
        <CardContent className="flex h-64 flex-col items-center justify-center p-6">
          <Building2 className="h-16 w-16 text-[#475569]" />
          <h3 className="mt-4 text-xl font-bold text-white">NO COMPANIES FOUND</h3>
          <p className="mt-2 text-center text-[#94A3B8]">
            Add your first company to begin managing your retail empire.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => (
        <Card
          key={company.id}
          className="group relative overflow-hidden border-[#334155] bg-[#1E293B] transition-all duration-300 hover:border-[#6366F1] hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          onClick={() => onSelect(company)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#EC4899] opacity-0 transition-opacity duration-300 group-hover:opacity-5"></div>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#334155] text-[#6366F1]">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-1 overflow-hidden">
                <h3 className="font-orbitron text-lg font-bold text-white truncate">{company.name}</h3>
                <p className="text-sm text-[#94A3B8] truncate">{company.address || "No address provided"}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1 text-[#94A3B8]">
                <Users className="h-4 w-4" />
                <span>{company.device_count || 0} devices</span>
              </div>
              <div className="rounded-full bg-[#334155] px-3 py-1 text-xs font-medium text-[#94A3B8]">
                ID: {company.id}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
