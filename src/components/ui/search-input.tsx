'use client'

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "./input"

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onSearch: (value: string) => void
  debounceMs?: number
  containerClassName?: string
}

export function SearchInput({ 
  onSearch, 
  debounceMs = 300, 
  className, 
  containerClassName,
  value,
  defaultValue,
  ...props 
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState<string>((value || defaultValue || "").toString())
  const [prevValue, setPrevValue] = React.useState(value)

  if (value !== undefined && value !== prevValue) {
    setPrevValue(value)
    setLocalValue(value.toString())
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(localValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, debounceMs, onSearch])

  const handleClear = () => {
    setLocalValue("")
    onSearch("")
  }

  return (
    <div className={cn("relative flex items-center w-full", containerClassName)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
      <Input
        type="text"
        className={cn("pl-9 pr-9", className)}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        {...props}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 hover:text-gray-900 focus:outline-none focus:text-gray-900"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
