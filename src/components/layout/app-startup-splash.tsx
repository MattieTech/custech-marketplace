'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustechLogoLoader } from '@/components/ui/custech-loader';
import { ShieldCheck } from 'lucide-react';

export function AppStartupSplash() {
  const [showSplash, setShowSplash] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Initializing CUSTECH Marketplace...');

  useEffect(() => {
    // Orchestrated status progression over exactly 8 seconds (8000ms)
    const t1 = setTimeout(() => {
      setStatusMessage('Connecting to Confluence University Network (Osara)...');
    }, 1800);

    const t2 = setTimeout(() => {
      setStatusMessage('Verifying Student Escrow & Safe Campus Trade Zones...');
    }, 3600);

    const t3 = setTimeout(() => {
      setStatusMessage('Loading Verified Campus Listings, Hostels & Services...');
    }, 5400);

    const t4 = setTimeout(() => {
      setStatusMessage('Welcome to CUSTECH Marketplace');
    }, 7000);

    // Automatically complete and dissolve at exactly 8 seconds (8000ms)
    const tEnd = setTimeout(() => {
      setShowSplash(false);
    }, 8000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tEnd);
    };
  }, []);

  const handleSkip = () => {
    setShowSplash(false);
  };

  if (!showSplash) return null;

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="app-startup-splash-overlay"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999999] bg-white flex flex-col items-center justify-center p-6 select-none"
          role="dialog"
          aria-modal="true"
          aria-label="CUSTECH Marketplace Startup"
        >
          {/* Subtle Skip button in top corner */}
          <button
            onClick={handleSkip}
            className="absolute top-5 right-5 text-xs font-semibold text-gray-400 hover:text-gray-800 transition-colors px-3.5 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 shadow-xs"
          >
            Skip &rarr;
          </button>

          {/* Main Kinetic Logo Reveal */}
          <div className="flex flex-col items-center justify-center max-w-md w-full">
            <CustechLogoLoader
              mode="splash"
              size="xl"
              theme="light"
              message={statusMessage}
              speed={1}
              loop={true}
            />

            {/* 8-second progress bar */}
            <div className="w-56 sm:w-72 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-7 shadow-inner">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 8, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 rounded-full shadow-sm"
              />
            </div>

            {/* Campus Trust pill */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="mt-6 flex items-center gap-1.5 text-xs font-bold text-green-800 bg-green-50 px-4 py-1.5 rounded-full border border-green-200 shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>Official Confluence University Student Marketplace</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
