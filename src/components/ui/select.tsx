'use client'

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  labelMap: Record<string, string>
  registerItem: (value: string, label: string) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  options?: SelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  onChange?: any
  children?: React.ReactNode
}

export function Select({
  className,
  label,
  error,
  id,
  options,
  value,
  onValueChange,
  onChange,
  children,
  ...props
}: SelectProps) {
  const selectId = id || React.useId()
  const errorId = `${selectId}-error`
  const [open, setOpen] = React.useState(false)
  const [labelMap, setLabelMap] = React.useState<Record<string, string>>({})

  const registerItem = React.useCallback((val: string, lbl: string) => {
    setLabelMap((prev) => (prev[val] === lbl ? prev : { ...prev, [val]: lbl }))
  }, [])

  // If options array is provided or children contains native option elements
  const hasNativeOptions = React.Children.toArray(children).some(
    (child) => React.isValidElement(child) && child.type === 'option'
  )

  if ((options && options.length > 0) || hasNativeOptions) {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-gray-900">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            value={value}
            onChange={(e) => {
              onValueChange?.(e.target.value)
              onChange?.(e)
            }}
            className={cn(
              "flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              error && "border-red-500 focus-visible:ring-red-500",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...props}
          >
            {options
              ? options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-500 pointer-events-none" />
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  }

  // Compound component mode
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, labelMap, registerItem }}>
      <div className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => context?.setOpen(!context.open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

export interface SelectValueProps {
  placeholder?: string
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const context = React.useContext(SelectContext)
  const currentLabel = context?.value ? context.labelMap[context.value] || context.value : null
  return <span>{currentLabel || placeholder || "Select..."}</span>
}

export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SelectContent({ className, children, ...props }: SelectContentProps) {
  const context = React.useContext(SelectContext)
  if (!context?.open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => context.setOpen(false)} />
      <div
        className={cn(
          "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg text-sm",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  )
}

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

export function SelectItem({ value, children, className, ...props }: SelectItemProps) {
  const context = React.useContext(SelectContext)

  React.useEffect(() => {
    if (typeof children === 'string') {
      context?.registerItem(value, children)
    }
  }, [context, value, children])

  const isSelected = context?.value === value

  const handleSelect = () => {
    context?.onValueChange?.(value)
    context?.setOpen(false)
  }

  return (
    <div
      onClick={handleSelect}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-3 text-sm outline-none hover:bg-green-50 hover:text-green-900 transition-colors",
        isSelected && "bg-green-100 font-semibold text-green-900",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

