import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-gradient-to-b from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-[0_6px_20px_-3px_rgba(16,185,129,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-emerald-400/40",
    destructive: "bg-gradient-to-b from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 shadow-[0_6px_20px_-3px_rgba(244,63,94,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-rose-400/40",
    outline: "border border-slate-200/80 bg-white/80 hover:bg-white text-slate-800 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)] hover:border-slate-300",
    secondary: "bg-slate-100/85 hover:bg-slate-200/80 text-slate-800 backdrop-blur-lg border border-white/60 shadow-[0_4px_12px_rgba(0,0,0,0.02)]",
    ghost: "hover:bg-slate-100/80 text-slate-700 active:bg-slate-200/70",
    link: "text-emerald-600 underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-5 py-2.5 text-sm rounded-xl sm:rounded-2xl",
    sm: "h-8 px-3.5 text-xs rounded-lg sm:rounded-xl",
    lg: "h-12 px-8 text-base rounded-2xl font-bold",
    icon: "h-10 w-10 rounded-xl",
  }
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant
  size?: keyof typeof buttonVariants.size
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, isLoading, disabled, children, ...props }, ref) => {
    const rootClass = cn(
      "inline-flex items-center justify-center whitespace-nowrap font-semibold ring-offset-white transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
      buttonVariants.variant[variant],
      buttonVariants.size[size],
      className
    )

    if (asChild && React.isValidElement(children)) {
      const childProps = (children as React.ReactElement<any>).props || {}
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(rootClass, childProps.className),
        ref,
        disabled: disabled || isLoading,
        ...props
      })
    }

    return (
      <button
        className={rootClass}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
