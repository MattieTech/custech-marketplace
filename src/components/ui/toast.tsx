'use client'

import * as React from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  title?: string
  message: string
  type: ToastType
  duration?: number
}

type ToastListener = (toast: Toast) => void
const toastListeners = new Set<ToastListener>()

function dispatchToast(t: Omit<Toast, 'id'> & { id?: string }) {
  const toastItem: Toast = {
    id: t.id || Math.random().toString(36).substring(2, 9),
    ...t,
  }
  toastListeners.forEach((listener) => listener(toastItem))
}

export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    dispatchToast({ type: 'success', message, title, duration })
  },
  error: (message: string, title?: string, duration?: number) => {
    dispatchToast({ type: 'error', message, title, duration })
  },
  info: (message: string, title?: string, duration?: number) => {
    dispatchToast({ type: 'info', message, title, duration })
  },
  warning: (message: string, title?: string, duration?: number) => {
    dispatchToast({ type: 'warning', message, title, duration })
  },
}

interface ToastContextType {
  toast: typeof toast
  showToast: (options: Omit<Toast, 'id'>) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

function SearchParamToastHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    const successMsg = searchParams.get('success')
    const errorMsg = searchParams.get('error')
    const toastMsg = searchParams.get('toast')

    if (successMsg) {
      toast.success(decodeURIComponent(successMsg))
    } else if (errorMsg) {
      toast.error(decodeURIComponent(errorMsg))
    } else if (toastMsg) {
      if (toastMsg === 'login_success') toast.success('Welcome back to CUSTECH Marketplace!')
      else if (toastMsg === 'registered') toast.success('Account created successfully! Welcome to CUSTECH.')
      else if (toastMsg === 'logged_out') toast.info('You have been logged out safely.')
      else if (toastMsg === 'listing_created') toast.success('Your listing has been published to the marketplace!')
      else toast.info(decodeURIComponent(toastMsg))
    }

    if (successMsg || errorMsg || toastMsg) {
      // Clean query params without reload
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('success')
      newParams.delete('error')
      newParams.delete('toast')
      const newQuery = newParams.toString() ? `?${newParams.toString()}` : ''
      router.replace(`${pathname}${newQuery}`, { scroll: false })
    }
  }, [searchParams, pathname, router])

  return null
}

export function ToastProvider({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = React.useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t])
    const time = t.duration || 4500
    setTimeout(() => {
      removeToast(t.id)
    }, time)
  }, [removeToast])

  React.useEffect(() => {
    toastListeners.add(addToast)
    return () => {
      toastListeners.delete(addToast)
    }
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toast, showToast: (opts) => dispatchToast(opts) }}>
      {children}
      <React.Suspense fallback={null}>
        <SearchParamToastHandler />
      </React.Suspense>
      {/* Top Banner / Toast Notification Container */}
      <div 
        aria-live="assertive" 
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center w-full max-w-lg px-4 pointer-events-none space-y-2.5"
      >
        {toasts.map((t) => (
          <ToastBanner key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    return { toast, showToast: (opts: Omit<Toast, 'id'>) => dispatchToast(opts) }
  }
  return context
}

function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />,
  }

  const borderStyles = {
    success: "border-emerald-500 bg-white text-gray-900 shadow-emerald-500/10",
    error: "border-red-500 bg-white text-gray-900 shadow-red-500/10",
    warning: "border-amber-500 bg-white text-gray-900 shadow-amber-500/10",
    info: "border-blue-500 bg-white text-gray-900 shadow-blue-500/10",
  }

  const topAccents = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    warning: "bg-amber-500",
    info: "bg-blue-600",
  }

  return (
    <div
      role={toast.type === 'error' ? "alert" : "status"}
      className={cn(
        "pointer-events-auto relative w-full overflow-hidden rounded-xl border border-l-4 shadow-xl p-3.5 transition-all animate-in fade-in slide-in-from-top-4 duration-250 bg-white",
        borderStyles[toast.type]
      )}
    >
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", topAccents[toast.type])} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5">{icons[toast.type]}</div>
          <div className="flex-1 min-w-0">
            {toast.title && (
              <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-0.5">
                {toast.title}
              </h4>
            )}
            <p className="text-sm text-gray-700 font-medium leading-snug">
              {toast.message}
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Close notification"
          className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
