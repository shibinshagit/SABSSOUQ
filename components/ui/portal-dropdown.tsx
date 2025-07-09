"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { createPortal } from "react-dom"

interface PortalDropdownProps {
  isOpen: boolean
  trigger: HTMLElement | null
  children: React.ReactNode
  onClose: () => void
  preventClose?: boolean
}

export function PortalDropdown({ isOpen, trigger, children, onClose, preventClose }: PortalDropdownProps) {
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        trigger &&
        !trigger.contains(event.target as Node)
      ) {
        onClose()
      }
    },
    [trigger, onClose],
  )

  useEffect(() => {
    setMounted(true)

    // Calculate position when trigger element or isOpen changes
    if (trigger && isOpen) {
      const rect = trigger.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }

    // Add click outside handler
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [trigger, isOpen, onClose, handleClickOutside])

  // Don't render on server
  if (!mounted || !isOpen || !trigger) return null

  // Portal the dropdown to the document body
  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 9999,
      }}
      className="dropdown-portal"
    >
      {children}
    </div>,
    document.body,
  )
}
