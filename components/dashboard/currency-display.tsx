import { useAppSelector } from "@/store/hooks"
import { selectDeviceCurrency } from "@/store/slices/deviceSlice"

export function CurrencyDisplay() {
  const currency = useAppSelector(selectDeviceCurrency)

  return (
    <div className="flex items-center gap-1 text-sm text-gray-600">
      <span className="font-medium">{currency}</span>
    </div>
  )
}
