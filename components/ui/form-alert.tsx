import { AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface FormAlertProps {
  type: "success" | "error" | "warning"
  message: string
  className?: string
}

export function FormAlert({ type, message, className = "" }: FormAlertProps) {
  if (!message) return null

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
  }

  const backgrounds = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-md border ${backgrounds[type]} ${className} animate-fadeIn`}>
      {icons[type]}
      <p className="text-sm">{message}</p>
    </div>
  )
}
