import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "avatar" | "card" | "custom"
  width?: string | number
  height?: string | number
}

function Skeleton({ className, variant = "custom", width, height, style, ...props }: SkeletonProps) {
  let variantClasses = ""
  
  switch (variant) {
    case "text":
      variantClasses = "h-4 w-full rounded"
      break
    case "avatar":
      variantClasses = "h-10 w-10 rounded-full"
      break
    case "card":
      variantClasses = "h-48 w-full rounded-xl"
      break
    case "custom":
    default:
      variantClasses = "rounded-md"
      break
  }

  return (
    <div
      className={cn("animate-pulse bg-gray-200", variantClasses, className)}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        ...style
      }}
      {...props}
    />
  )
}

export { Skeleton }
