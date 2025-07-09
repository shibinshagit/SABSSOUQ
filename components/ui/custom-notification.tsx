"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NotificationProps {
  message: string
  type?: "success" | "error" | "warning" | "info"
  duration?: number
  onClose?: () => void
  className?: string
}

export function CustomNotification({ message, type = "info", duration = 5000, onClose, className }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    if (onClose) onClose()
  }

  if (!isVisible) return null

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-600 text-white"
      case "error":
        return "bg-red-600 text-white"
      case "warning":
        return "bg-yellow-500 text-white"
      case "info":
      default:
        return "bg-blue-600 text-white"
    }
  }

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center justify-between rounded-lg p-4 shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-5",
        getTypeStyles(),
        className,
      )}
      role="alert"
    >
      <div className="mr-3 font-medium">{message}</div>
      <button
        onClick={handleClose}
        className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 text-white hover:bg-white/20 focus:ring-2 focus:ring-white/50"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function useNotification() {
  const [notifications, setNotifications] = useState<(NotificationProps & { id: string })[]>([])

  const showNotification = (props: NotificationProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    setNotifications((prev) => [...prev, { ...props, id }])
    return id
  }

  const closeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((notification) => (
        <CustomNotification
          key={notification.id}
          {...notification}
          onClose={() => closeNotification(notification.id)}
        />
      ))}
    </div>
  )

  return {
    showNotification,
    closeNotification,
    NotificationContainer,
  }
}
