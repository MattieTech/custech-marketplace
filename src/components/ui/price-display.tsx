import * as React from "react"
import { cn } from "@/lib/utils"

export interface PriceDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  amount: number // in kobo
  currency?: string
  size?: "sm" | "default" | "lg"
  originalAmount?: number // in kobo
}

export function PriceDisplay({ 
  amount, 
  currency = "NGN", 
  size = "default", 
  originalAmount,
  className,
  ...props 
}: PriceDisplayProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value / 100) // Convert kobo to Naira
  }

  const sizes = {
    sm: "text-sm",
    default: "text-lg",
    lg: "text-2xl",
  }

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <span className={cn("font-bold text-gray-900", sizes[size])}>
        {formatPrice(amount)}
      </span>
      {originalAmount !== undefined && originalAmount > amount && (
        <span className="text-sm text-gray-500 line-through">
          {formatPrice(originalAmount)}
        </span>
      )}
    </div>
  )
}
