import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number, currency = "QAR") => {
  // Define currency formatting options for different currencies
  const currencyFormats: Record<string, { locale: string; currency: string }> = {
    QAR: { locale: "en-QA", currency: "QAR" },
    USD: { locale: "en-US", currency: "USD" },
    EUR: { locale: "en-DE", currency: "EUR" },
    GBP: { locale: "en-GB", currency: "GBP" },
    AED: { locale: "en-AE", currency: "AED" },
    SAR: { locale: "en-SA", currency: "SAR" },
    KWD: { locale: "en-KW", currency: "KWD" },
    BHD: { locale: "en-BH", currency: "BHD" },
    OMR: { locale: "en-OM", currency: "OMR" },
    INR: { locale: "en-IN", currency: "INR" },
    PKR: { locale: "en-PK", currency: "PKR" },
  }

  // Get format options for the specified currency, or default to QAR
  const format = currencyFormats[currency] || currencyFormats.QAR

  return new Intl.NumberFormat(format.locale, {
    style: "currency",
    currency: format.currency,
  }).format(amount)
}
