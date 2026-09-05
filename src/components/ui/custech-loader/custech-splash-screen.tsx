'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustechLogoLoader, LoaderSize } from './custech-logo-loader';

export interface CustechSplashScreenProps {
  /**
   * Whether the splash screen is visible
   */
  isLoading?: boolean;

  /**
   * Optional status message under the logo
   */
  message?: string;

  /**
   * Size of the logo inside the splash screen
   * @default 'lg'
   */
  size?: LoaderSize;

  /**
   * Background style
   */
  blurred?: boolean;

  /**
   * Optional callback when the exit transition finishes
   */
  onExitComplete?: () => void;
}

export function CustechSplashScreen({
  isLoading = true,
  message = 'Connecting to CUSTECH Campus Network...',
  size = 'lg',
  blurred = true,
  onExitComplete,
}: CustechSplashScreenProps) {
  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 select-none ${
            blurred
              ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md'
              : 'bg-white dark:bg-slate-950'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Loading Application"
        >
          {/* Main Logo Reveal Loader */}
          <div className="flex flex-col items-center justify-center max-w-sm w-full">
            <CustechLogoLoader
              mode="splash"
              size={size}
              message={message}
              loop={true}
            />

            {/* Subtle campus safety badge footnote */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-[11px] font-medium text-green-700 dark:text-green-300"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>CUSTECH Verified Community Platform</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
