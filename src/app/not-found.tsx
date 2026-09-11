import Link from 'next/link';
import { ShoppingBag, Home, Briefcase, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12 text-center bg-slate-50/50">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-3xl font-black">
          404
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Item or Page Not Found</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            The page or listing you are looking for might have been sold, deleted, or relocated.
          </p>
        </div>

        <div className="pt-2 grid grid-cols-2 gap-2 text-left">
          <Link 
            href="/marketplace"
            className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Marketplace</p>
              <p className="text-[10px] text-slate-400">Buy & sell items</p>
            </div>
          </Link>

          <Link 
            href="/housing"
            className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Campus Housing</p>
              <p className="text-[10px] text-slate-400">Find lodges</p>
            </div>
          </Link>

          <Link 
            href="/services"
            className="p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Services</p>
              <p className="text-[10px] text-slate-400">Hire students</p>
            </div>
          </Link>

          <Link 
            href="/deals"
            className="p-3 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Campus Deals</p>
              <p className="text-[10px] text-slate-400">Hot discounts</p>
            </div>
          </Link>
        </div>

        <div className="pt-2">
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campus Home
          </Link>
        </div>
      </div>
    </div>
  );
}
