'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface DropdownItem {
  label: string
  onClick: () => void
  icon?: LucideIcon
  variant?: "default" | "destructive"
}

export interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: "left" | "right"
  className?: string
}

export function Dropdown({ trigger, items, align = "right", className }: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div 
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen(!open)
          }
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 rounded-md"
      >
        {trigger}
      </div>

      {open && (
        <div 
          className={cn(
            "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-md animate-in fade-in-80 zoom-in-95",
            align === "right" ? "right-0" : "left-0",
            className
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                role="menuitem"
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 hover:bg-gray-100",
                  item.variant === "destructive" ? "text-red-600 focus:bg-red-50 hover:bg-red-50" : "text-gray-900"
                )}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
              >
                {Icon && <Icon className="mr-2 h-4 w-4" />}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
