'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustechEmblem } from './custech-emblem';
import { CustechKineticWordmark } from './custech-kinetic-wordmark';

export type LoaderMode = 'splash' | 'in-app' | 'icon';
export type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';
export type LoaderTheme = 'light' | 'dark' | 'auto';

export interface CustechLogoLoaderProps {
  /**
   * Mode of the loader:
   * - 'splash': Full branding with expressive kinetic choreography, ideal for startup & route loading
   * - 'in-app': Shorter, subtle, streamlined motion for cards, search, transitions & modals
   * - 'icon': Emblem-only compact kinetic animation for badges, avatars, and buttons
   */
  mode?: LoaderMode;

  /**
   * Size presets or custom width in pixels
   */
  size?: LoaderSize;

  /**
   * Speed multiplier (1 = standard, 1.5 = faster, 0.8 = slower)
   */
  speed?: number;

  /**
   * Whether the animation should loop continuously
   * @default true
   */
  loop?: boolean;

  /**
   * Color theme: 'light', 'dark', or 'auto' (respects system dark mode)
   * @default 'auto'
   */
  theme?: LoaderTheme;

  /**
   * Optional status message displayed below the loader (e.g., "Connecting to campus server...")
   */
  message?: string;

  /**
   * Optional custom className for outer container
   */
  className?: string;

  /**
   * Screen reader accessibility label
   * @default "Loading CUSTECH Marketplace..."
   */
  accessibilityLabel?: string;

  /**
   * Callback fired when a single full animation sequence finishes
   */
  onCycleComplete?: () => void;
}

export function CustechLogoLoader({
  mode = 'splash',
  size = 'md',
  speed = 1,
  loop = true,
  theme = 'light',
  message,
  className = '',
  accessibilityLabel = 'Loading CUSTECH Marketplace...',
  onCycleComplete,
}: CustechLogoLoaderProps) {
  const [iteration, setIteration] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect accessibility prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionMedia.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    motionMedia.addEventListener('change', handleMotionChange);
    return () => motionMedia.removeEventListener('change', handleMotionChange);
  }, []);

  // Theme resolution: Always maintain full vivid brand colors (light mode) unless explicitly requested
  useEffect(() => {
    if (theme === 'dark') {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, [theme]);

  // Adjust base timing by mode:
  // Splash: 8000ms (8.0s full choreographed cycle with hold)
  // In-App: 3600ms (~3.6s rich kinetic letter assembly)
  const cycleDurationMs = (mode === 'splash' ? 8000 : 3600) / speed;

  // Handle continuous looping
  useEffect(() => {
    if (!loop) return;

    const timer = setTimeout(() => {
      setIteration((prev) => prev + 1);
      onCycleComplete?.();
    }, cycleDurationMs);

    return () => clearTimeout(timer);
  }, [iteration, loop, cycleDurationMs, onCycleComplete]);

  // Size mapping for the Emblem SVG container
  const emblemSizes = {
    sm: 'w-10 h-9',
    md: mode === 'splash' ? 'w-20 h-18' : 'w-14 h-12',
    lg: 'w-28 h-24 sm:w-32 sm:h-28',
    xl: 'w-36 h-30 sm:w-44 sm:h-38',
  };

  // Gap between Emblem and Wordmark
  const containerGaps = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
    xl: 'gap-4',
  };

  return (
    <div
      role="status"
      aria-label={accessibilityLabel}
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`custech-loader-loop-${iteration}`}
          initial={{ opacity: iteration > 0 ? 0.85 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.85, transition: { duration: 0.25 / speed } }}
          transition={{ duration: 0.35 / speed }}
          className={`flex flex-col items-center justify-center ${containerGaps[size]}`}
        >
          {/* 1. Official CUSTECH CM Emblem */}
          <div className={`${emblemSizes[size]} relative flex items-center justify-center`}>
            <CustechEmblem
              isDark={isDarkMode}
              speed={mode === 'in-app' ? speed * 1.3 : speed}
              reducedMotion={prefersReducedMotion}
            />
          </div>

          {/* 2. Kinetic Typography Wordmark (CUSTECH & MARKETPLACE) */}
          {mode !== 'icon' && (
            <CustechKineticWordmark
              size={size}
              isDark={isDarkMode}
              speed={mode === 'in-app' ? speed * 1.3 : speed}
              reducedMotion={prefersReducedMotion}
              showTagline={mode === 'splash' || size !== 'sm'}
            />
          )}

          {/* Optional context message */}
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 / speed, duration: 0.35 }}
              className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 text-center"
            >
              {message}
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hidden screen-reader status */}
      <span className="sr-only">{accessibilityLabel}</span>
    </div>
  );
}
