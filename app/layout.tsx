import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "@/components/ui/global-notification"
import { ClientProvider } from "@/components/client-provider"
import { CustomThemeProvider } from "@/hooks/use-custom-theme"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Ezzy-Accounting",
  description: "All in one accounting solution for small businesses",
  generator: "opencoders.io",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientProvider>
          <CustomThemeProvider>
            <NotificationProvider>
              {children}
              <Toaster />
            </NotificationProvider>
          </CustomThemeProvider>
        </ClientProvider>
      </body>
    </html>
  )
}
