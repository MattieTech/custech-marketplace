import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  variant: {
    default: "border-emerald-400/40 bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]",
    secondary: "border-white/70 bg-white/80 text-slate-800 backdrop-blur-md shadow-2xs",
    success: "border-emerald-300/60 bg-emerald-50/90 text-emerald-800 backdrop-blur-md",
    warning: "border-amber-300/60 bg-amber-50/90 text-amber-900 backdrop-blur-md",
    error: "border-rose-300/60 bg-rose-50/90 text-rose-800 backdrop-blur-md",
    destructive: "border-rose-400/40 bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-[0_2px_8px_rgba(244,63,94,0.3)]",
    outline: "text-slate-800 border-slate-200/80 bg-white/60 backdrop-blur-sm",
  },
  size: {
    default: "px-3 py-1 text-xs font-bold",
    sm: "px-2.5 py-0.5 text-[10px] font-bold",
  }
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants.variant
  size?: keyof typeof badgeVariants.size
}

function Badge({ className, variant = "default", size = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border tracking-tight transition-all duration-200 select-none",
        badgeVariants.variant[variant],
        badgeVariants.size[size],
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
