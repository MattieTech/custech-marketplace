import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-11 w-full rounded-2xl border border-slate-200/80 bg-slate-100/70 hover:bg-slate-100/90 focus:bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12),0_8px_24px_rgba(0,0,0,0.04)] focus:border-emerald-500/80 focus:outline-none transition-all duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-rose-500 focus:border-rose-500 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.12)]",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs font-semibold text-rose-600">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
