'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6 bg-slate-800/90 p-8 rounded-3xl border border-slate-700 shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">System Encountered An Error</h1>
            <p className="text-sm text-slate-400">
              An unexpected application error occurred. You can reload the page or return to the main campus homepage.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg cursor-pointer"
            >
              Reload Page
            </button>
            <a
              href="/"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm transition-all text-center flex items-center justify-center"
            >
              Go to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
