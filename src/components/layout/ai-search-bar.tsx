'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Sparkles, 
  X, 
  Loader2, 
  ArrowRight, 
  Package, 
  Home, 
  Briefcase, 
  Tag, 
  MapPin 
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface SearchResultItem {
  id: string;
  title: string;
  type: string;
  price: number;
  location: string;
  imageUrl: string | null;
  link: string;
}

export function AISearchBar({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setInterpretation('');
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/ai/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query.trim() })
        });
        const data = await res.json();
        if (data.success) {
          setResults(data.results || []);
          setInterpretation(data.interpretation || '');
        }
      } catch (err) {
        console.warn('AI search request failed:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/marketplace?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const popularQueries = [
    'Casio FX-991 Calculator',
    'Self-Contained Lodge near Gate',
    'Laptop Repair & Windows Install',
    'Free Engineering Handouts',
    'Rechargeable Study Fan'
  ];

  const handleSelectQuery = (q: string) => {
    setQuery(q);
    inputRef.current?.focus();
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'housing':
        return <Home className="w-3.5 h-3.5 text-sky-600" />;
      case 'service':
        return <Briefcase className="w-3.5 h-3.5 text-purple-600" />;
      case 'free':
        return <Tag className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Package className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* Liquid Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative w-full group">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            placeholder="Search products, hostels, services with AI..."
            className="w-full text-xs bg-slate-100/75 hover:bg-slate-100/95 focus:bg-white border border-slate-200/80 focus:border-emerald-500/80 rounded-full pl-9 pr-24 py-2 focus:outline-none backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.14)] transition-all text-slate-900 placeholder:text-slate-400"
          />

          {/* Left search icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Right AI indicator badge and clear button */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setInterpretation('');
                }}
                className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors mr-1"
                aria-label="Clear search"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/15 border border-emerald-500/20 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full select-none pointer-events-none">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
              <span>AI Search</span>
            </div>
          </div>
        </div>
      </form>

      {/* AI Smart Search Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.1)] p-3 z-50 overflow-hidden select-none animate-in fade-in-50 slide-in-from-top-2 duration-150 max-h-[420px] overflow-y-auto">
          {/* AI Query Interpretation banner */}
          {interpretation && (
            <div className="mb-3 px-3 py-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-start gap-2 text-xs text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">AI Understood: </span>
                <span className="text-emerald-800">{interpretation}</span>
              </div>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 ? (
            <div className="space-y-1.5 mb-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center justify-between">
                <span>Direct Matches ({results.length})</span>
                <span className="text-[10px] text-emerald-600 font-medium">Gemini 3.6 Flash</span>
              </div>

              {results.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getItemIcon(item.type)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold shrink-0">
                        {item.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-bold text-slate-900">
                        {item.price > 0 ? `₦${item.price.toLocaleString()}` : 'Free'}
                      </span>
                      {item.location && (
                        <span className="flex items-center gap-0.5 text-slate-400 truncate">
                          <MapPin className="w-2.5 h-2.5" />
                          {item.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}

              {/* View All button */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/marketplace?search=${encodeURIComponent(query.trim())}`);
                }}
                className="w-full mt-2 py-2 px-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View all marketplace results for &ldquo;{query}&rdquo;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : query.trim().length >= 2 && !loading ? (
            <div className="py-4 text-center">
              <p className="text-xs text-slate-500">No direct listings found matching your query.</p>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/marketplace?search=${encodeURIComponent(query.trim())}`);
                }}
                className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
              >
                Search full catalog on Marketplace
              </button>
            </div>
          ) : null}

          {/* Popular campus searches when query is empty */}
          {(!query || query.trim().length < 2) && (
            <div className="space-y-2 py-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                Popular Campus Searches
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularQueries.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuery(item)}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors flex items-center gap-1 border border-slate-200/60"
                  >
                    <Search className="w-2.5 h-2.5 text-slate-400" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
