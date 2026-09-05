'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface CustechKineticWordmarkProps {
  isDark?: boolean;
  animated?: boolean;
  speed?: number;
  reducedMotion?: boolean;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface LetterConfig {
  char: string;
  color: 'green' | 'navy';
  variants: (dur: (s: number) => number) => Variants;
}

export function CustechKineticWordmark({
  isDark = false,
  animated = true,
  speed = 1,
  reducedMotion = false,
  showTagline = true,
  size = 'md',
}: CustechKineticWordmarkProps) {
  const dur = (sec: number) => sec / speed;

  // Colors - 100% full rich brand colors
  const greenColor = isDark ? '#22c55e' : '#00a859';
  const navyColor = isDark ? '#94a3b8' : '#0f172a';

  // Typography scaling sizes
  const titleSizes = {
    sm: 'text-xl tracking-[0.18em]',
    md: 'text-3xl tracking-[0.2em]',
    lg: 'text-4xl sm:text-5xl tracking-[0.22em]',
    xl: 'text-5xl sm:text-6xl tracking-[0.24em]',
  };

  const taglineSizes = {
    sm: 'text-[9px] tracking-[0.28em] gap-1.5',
    md: 'text-xs tracking-[0.32em] gap-2.5',
    lg: 'text-sm tracking-[0.36em] gap-3.5',
    xl: 'text-base tracking-[0.4em] gap-4',
  };

  const lineWidths = {
    sm: 'w-4 h-[1.5px]',
    md: 'w-6 sm:w-8 h-[2px]',
    lg: 'w-8 sm:w-12 h-[2px]',
    xl: 'w-10 sm:w-16 h-[2.5px]',
  };

  // Choreographed letter entrance configurations
  const letters: LetterConfig[] = [
    // C - Slides horizontally from the left
    {
      char: 'C',
      color: 'green',
      variants: (d) => ({
        initial: { opacity: 0, x: -22 },
        animate: {
          opacity: 1,
          x: 0,
          transition: { duration: d(0.55), delay: d(0.12), ease: [0.16, 1, 0.3, 1] },
        },
      }),
    },
    // U - Rises gently into position through a bottom mask
    {
      char: 'U',
      color: 'green',
      variants: (d) => ({
        initial: { opacity: 0, y: 18 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: d(0.52), delay: d(0.20), ease: [0.16, 1, 0.3, 1] },
        },
      }),
    },
    // S - Horizontal glide & letter-spacing convergence
    {
      char: 'S',
      color: 'green',
      variants: (d) => ({
        initial: { opacity: 0, x: -14, scale: 0.94 },
        animate: {
          opacity: 1,
          x: 0,
          scale: 1,
          transition: { duration: d(0.54), delay: d(0.28), ease: [0.16, 1, 0.3, 1] },
        },
      }),
    },
    // T - Enters cleanly from above
    {
      char: 'T',
      color: 'navy',
      variants: (d) => ({
        initial: { opacity: 0, y: -16 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: d(0.50), delay: d(0.36), ease: [0.16, 1, 0.3, 1] },
        },
      }),
    },
    // E - Reveals through a clean horizontal wipe mask
    {
      char: 'E',
      color: 'navy',
      variants: (d) => ({
        initial: { opacity: 0, clipPath: 'inset(0% 100% 0% 0%)' },
        animate: {
          opacity: 1,
          clipPath: 'inset(0% 0% 0% 0%)',
          transition: { duration: d(0.52), delay: d(0.44), ease: [0.22, 1, 0.36, 1] },
        },
      }),
    },
    // C - Slides into position from the right
    {
      char: 'C',
      color: 'navy',
      variants: (d) => ({
        initial: { opacity: 0, x: 18 },
        animate: {
          opacity: 1,
          x: 0,
          transition: { duration: d(0.54), delay: d(0.52), ease: [0.16, 1, 0.3, 1] },
        },
      }),
    },
    // H - Docks into position with magnetic precision
    {
      char: 'H',
      color: 'navy',
      variants: (d) => ({
        initial: { opacity: 0, y: 14, scale: 0.95 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: d(0.52), delay: d(0.60), ease: [0.16, 1, 0.3, 1] },
        },
      }),
    },
  ];

  // Tagline Line & Letters Variants
  const leftLineVariants: Variants = reducedMotion || !animated ? {
    initial: { scaleX: 1, opacity: 1 },
    animate: { scaleX: 1, opacity: 1 },
  } : {
    initial: { scaleX: 0, opacity: 0 },
    animate: {
      scaleX: 1,
      opacity: 1,
      transition: { duration: dur(0.45), delay: dur(0.85), ease: [0.16, 1, 0.3, 1] },
    },
  };

  const rightLineVariants: Variants = reducedMotion || !animated ? {
    initial: { scaleX: 1, opacity: 1 },
    animate: { scaleX: 1, opacity: 1 },
  } : {
    initial: { scaleX: 0, opacity: 0 },
    animate: {
      scaleX: 1,
      opacity: 1,
      transition: { duration: dur(0.45), delay: dur(0.85), ease: [0.16, 1, 0.3, 1] },
    },
  };

  const marketplaceTextVariants: Variants = reducedMotion || !animated ? {
    initial: { opacity: 1, y: 0 },
    animate: { opacity: 1, y: 0 },
  } : {
    initial: { opacity: 0, y: 6, letterSpacing: '0.22em' },
    animate: {
      opacity: 1,
      y: 0,
      letterSpacing: '0.34em',
      transition: { duration: dur(0.55), delay: dur(0.90), ease: [0.16, 1, 0.3, 1] },
    },
  };

  // Specular Shimmer across wordmark
  const shimmerVariants: Variants = reducedMotion || !animated ? {
    initial: { opacity: 0 },
    animate: { opacity: 0 },
  } : {
    initial: { x: '-120%', opacity: 0 },
    animate: {
      x: '240%',
      opacity: [0, 0.6, 0.8, 0.4, 0],
      transition: {
        duration: dur(1.1),
        delay: dur(1.2),
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* CUSTECH Kinetic Typography */}
      <div className="relative overflow-hidden px-2 py-1">
        <div className={`font-black font-sans flex items-center justify-center ${titleSizes[size]}`}>
          {letters.map((item, idx) => {
            const letterStyle = item.color === 'green' ? { color: greenColor } : { color: navyColor };
            const variants = reducedMotion || !animated
              ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
              : item.variants(dur);

            return (
              <motion.span
                key={`${item.char}-${idx}`}
                variants={variants}
                initial="initial"
                animate="animate"
                style={letterStyle}
                className="inline-block relative transform-gpu"
              >
                {item.char}
              </motion.span>
            );
          })}
        </div>

        {/* Specular brand accent light beam (Subtle sheen glide) */}
        {animated && !reducedMotion && (
          <motion.div
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            className="absolute inset-0 pointer-events-none w-1/3 bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent skew-x-[-25deg]"
            aria-hidden="true"
          />
        )}
      </div>

      {/* — MARKETPLACE — Sub-brand Tagline */}
      {showTagline && (
        <div className={`flex items-center justify-center font-bold uppercase font-sans mt-1 text-slate-800 ${taglineSizes[size]}`}>
          {/* Left Green Line */}
          <motion.div
            variants={leftLineVariants}
            initial="initial"
            animate="animate"
            style={{ backgroundColor: greenColor, transformOrigin: 'right center' }}
            className={`rounded-full ${lineWidths[size]}`}
          />

          {/* MARKETPLACE Wordmark */}
          <motion.span
            variants={marketplaceTextVariants}
            initial="initial"
            animate="animate"
            style={{ color: navyColor }}
            className="inline-block font-extrabold tracking-[0.25em]"
          >
            MARKETPLACE
          </motion.span>

          {/* Right Green Line */}
          <motion.div
            variants={rightLineVariants}
            initial="initial"
            animate="animate"
            style={{ backgroundColor: greenColor, transformOrigin: 'left center' }}
            className={`rounded-full ${lineWidths[size]}`}
          />
        </div>
      )}
    </div>
  );
}
