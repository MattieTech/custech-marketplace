import * as React from "react"
import { AlertTriangle, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  message: string
  retry?: {
    label?: string
    onClick: () => void
  }
  icon?: LucideIcon
}

export function ErrorState({ 
  title = "Something went wrong", 
  message, 
  retry, 
  icon: Icon = AlertTriangle,
  className, 
  ...props 
}: ErrorStateProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 text-center",
        className
      )}
      role="alert"
      {...props}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
        <Icon className="h-6 w-6 text-red-600" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 max-w-md">
        {message}
      </p>
      {retry && (
        <div className="mt-6">
          <Button 
            onClick={retry.onClick} 
            variant="outline" 
            className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
          >
            {retry.label || "Try again"}
          </Button>
        </div>
      )}
    </div>
  )
}
