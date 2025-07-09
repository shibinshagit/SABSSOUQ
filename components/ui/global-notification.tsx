"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type NotificationType = "success" | "error" | "warning"

interface GlobalNotificationProps {
  type: NotificationType
  message: string
  duration?: number
  onClose?: () => void
}

export function GlobalNotification({ type, message, duration = 5000, onClose }: GlobalNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!message) return

    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onClose) setTimeout(onClose, 300) // Allow animation to complete
    }, duration)

    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  if (!message) return null

  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
  }

  const backgrounds = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-amber-600 text-white",
  }

  const handleClose = () => {
    setIsVisible(false)
    if (onClose) setTimeout(onClose, 300) // Allow animation to complete
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full flex justify-end pointer-events-none">
      <div
        className={cn(
          "flex items-center gap-2 p-4 rounded-md shadow-lg pointer-events-auto",
          backgrounds[type],
          isVisible ? "animate-slideIn" : "animate-slideOut opacity-0",
        )}
      >
        {icons[type]}
        <p className="text-sm flex-1">{message}</p>
        <button
          onClick={handleClose}
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Context and hook for global notifications
import { createContext, useContext, type ReactNode } from "react"

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, duration?: number) => void
  hideNotification: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<{
    type: NotificationType
    message: string
    duration?: number
  } | null>(null)

  const showNotification = (type: NotificationType, message: string, duration = 5000) => {
    setNotification({ type, message, duration })
  }

  const hideNotification = () => {
    setNotification(null)
  }

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notification && (
        <GlobalNotification
          type={notification.type}
          message={notification.message}
          duration={notification.duration}
          onClose={hideNotification}
        />
      )}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider")
  }
  return context
}
