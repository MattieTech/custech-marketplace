import Link from 'next/link'
import { BRAND_NAME } from '@/lib/constants'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        <Link href="/" className="text-2xl font-bold text-green-600 tracking-tight">
          {BRAND_NAME || 'CUSTECH Marketplace'}
        </Link>
        <div className="w-full">
          {children}
        </div>
        <p className="text-sm text-gray-500 text-center max-w-sm">
          {BRAND_NAME || 'CUSTECH Marketplace'} - The trusted marketplace for the CUSTECH community
        </p>
      </div>
    </div>
  )
}
