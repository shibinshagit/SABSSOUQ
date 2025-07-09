"use client"

import { Moon, Sun } from "lucide-react"
import { useCustomTheme } from "@/hooks/use-custom-theme"

export function AnimatedThemeToggle() {
  const { theme, setTheme } = useCustomTheme();
  // Ensure dark is default if theme is not set
  const isDark = theme === "dark" || !theme;

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative w-12 h-6 flex items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400
        ${isDark ? "bg-white-800" : "bg-yellow-300"}`}
      style={{ minWidth: 48 }}
    >
      <span
        className={`absolute left-1 top-1 transition-transform duration-300 flex items-center justify-center w-4 h-4 rounded-full shadow
          ${isDark ? "translate-x-6 bg-gray-900 text-yellow-300" : "translate-x-0 bg-white text-yellow-500"}`}
      >
        {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
      </span>
      {/* Visually hidden for accessibility */}
      <span className="sr-only">{isDark ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}
