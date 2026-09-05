import * as React from "react"
import { Shield, ShieldCheck, BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type TrustLevel = 'registered' | 'custech_verified' | 'trusted_seller'

export interface TrustBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: TrustLevel
  showLabel?: boolean
}

export function TrustBadge({ level = 'custech_verified', showLabel = true, className, ...props }: TrustBadgeProps) {
  const config = {
    registered: {
      icon: Shield,
      color: "text-gray-500",
      bg: "bg-gray-100",
      label: "Registered User",
      tooltip: "Basic registered user account"
    },
    custech_verified: {
      icon: ShieldCheck,
      color: "text-green-600",
      bg: "bg-green-50",
      label: "CUSTECH Verified",
      tooltip: "Verified student or staff of CUSTECH"
    },
    trusted_seller: {
      icon: BadgeCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      label: "Trusted Seller",
      tooltip: "Highly rated seller with proven track record"
    }
  }

  const current = config[level]
  const Icon = current.icon

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium border border-transparent cursor-help",
        current.bg,
        current.color,
        className
      )}
      title={current.tooltip}
      {...props}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span>{current.label}</span>}
    </div>
  )
}
