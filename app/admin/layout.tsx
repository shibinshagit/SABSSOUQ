import type React from "react"
import type { Metadata } from "next"
import { Poppins, Orbitron } from "next/font/google"
import "../globals.css"
import { Toaster } from "@/components/ui/toaster"

// Define fonts using Next.js font optimization
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-orbitron",
})

export const metadata: Metadata = {
  title: "EzzyCartz Admin",
  description: "Admin dashboard for managing the EzzyCartz platform",
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${orbitron.variable} font-sans bg-[#0F172A] text-white`}>
        <div className="flex min-h-screen w-full">{children}</div>
        <Toaster />
      </body>
    </html>
  )
}
