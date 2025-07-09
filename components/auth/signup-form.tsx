"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { signUp } from "@/app/actions/auth-actions"
import { useToast } from "@/components/ui/use-toast"

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)

      if (formData.get("password") !== formData.get("confirm-password")) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const result = await signUp(formData)

      if (result.success) {
        // Store user data in localStorage
        if (result.userData) {
          localStorage.setItem("userId", result.userData.id.toString())
          localStorage.setItem("userName", result.userData.name)
          localStorage.setItem("userEmail", result.userData.email)
          localStorage.setItem("authToken", result.userData.token)
        }

        toast({
          title: "Success",
          description: result.message,
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Error",
          description: result.message,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" type="text" placeholder="John Doe" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" name="email" type="email" placeholder="name@example.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <EyeIcon className="h-4 w-4 text-gray-400" />
            )}
            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            name="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOffIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <EyeIcon className="h-4 w-4 text-gray-400" />
            )}
            <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full rounded-xl bg-blue-600 py-2 font-medium text-white transition-all hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Sign Up"}
      </Button>
    </form>
  )
}
