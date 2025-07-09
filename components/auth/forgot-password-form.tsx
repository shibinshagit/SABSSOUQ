"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "@/app/actions/auth-actions"
import { useToast } from "@/components/ui/use-toast"

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await forgotPassword(formData)

      toast({
        title: result.success ? "Success" : "Error",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      })
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
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-500">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input id="reset-email" name="reset-email" type="email" placeholder="name@example.com" required />
      </div>

      <Button
        type="submit"
        className="w-full rounded-xl bg-blue-600 py-2 font-medium text-white transition-all hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Reset Password"}
      </Button>
    </form>
  )
}
