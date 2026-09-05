import * as React from "react"
import { cn } from "@/lib/utils"
import { CustechLogoLoader, LoaderMode, LoaderSize } from "./custech-loader"

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
  text?: string
  size?: "sm" | "default" | "lg"
  mode?: LoaderMode
}

export function LoadingState({ message, text, size = "default", mode = "in-app", className, ...props }: LoadingStateProps) {
  const displayMessage = text || message
  const loaderSizeMap: Record<string, LoaderSize> = {
    sm: "sm",
    default: "md",
    lg: "lg",
  }

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center w-full min-h-[160px] p-6",
        className
      )}
      role="status"
      aria-label={displayMessage || "Loading..."}
      {...props}
    >
      <CustechLogoLoader
        mode={mode}
        size={loaderSizeMap[size] || "md"}
        message={displayMessage}
        loop={true}
      />
    </div>
  )
}
