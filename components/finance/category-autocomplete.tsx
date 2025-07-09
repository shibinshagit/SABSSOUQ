"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"

interface CategoryAutocompleteProps {
  value: string
  onChange: (value: string) => void
  categories: { id: number | string; name: string }[]
  placeholder?: string
}

export default function CategoryAutocomplete({
  value,
  onChange,
  categories,
  placeholder = "Enter category",
}: CategoryAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<{ id: number | string; name: string }[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on input value
  useEffect(() => {
    if (value.trim() === "") {
      setFilteredSuggestions([])
      return
    }

    const filtered = categories.filter((category) => category.name.toLowerCase().includes(value.toLowerCase()))
    setFilteredSuggestions(filtered)
  }, [value, categories])

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setShowSuggestions(true)
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {filteredSuggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onChange(suggestion.name)
                setShowSuggestions(false)
              }}
            >
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
