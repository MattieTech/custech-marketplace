import Link from 'next/link';
import Image from 'next/image';
import { BRAND_NAME } from '@/lib/constants';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4 sm:p-6">
      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        <Link href="/" className="flex flex-col items-center gap-2 group">
          <div className="w-16 h-16 rounded-2xl bg-white p-2.5 flex items-center justify-center border border-slate-200 shadow-sm group-hover:border-emerald-300 group-hover:shadow-md transition-all">
            <Image
              src="/logo.png"
              alt="CUSTECH Marketplace Logo"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 leading-tight">
              <span className="text-xl font-black text-emerald-600 tracking-tight">CUSTECH</span>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Marketplace</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
              Official Campus Student Platform
            </p>
          </div>
        </Link>
        <div className="w-full">
          {children}
        </div>
        <p className="text-xs text-slate-400 text-center max-w-xs">
          Secure campus verification & direct peer-to-peer student trading.
        </p>
      </div>
    </div>
  );
}
