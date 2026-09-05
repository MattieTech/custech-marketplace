'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface CustechEmblemProps {
  className?: string;
  isDark?: boolean;
  animated?: boolean;
  speed?: number;
  reducedMotion?: boolean;
}

export function CustechEmblem({
  className = '',
  isDark = false,
  animated = true,
  speed = 1,
  reducedMotion = false,
}: CustechEmblemProps) {
  const duration = (sec: number) => sec / speed;

  // Colors based on original brand identity - 100% full rich color contrast
  const greenColor = isDark ? '#22c55e' : '#00a859';
  const cartColor = isDark ? '#4ade80' : '#16a34a';
  const navyColor = isDark ? '#94a3b8' : '#0f172a';

  // Animation variants for the 'C'
  const cVariants: Variants = reducedMotion || !animated ? {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
  } : {
    initial: { 
      opacity: 0, 
      pathLength: 0.2, 
      rotate: -15, 
      scale: 0.96 
    },
    animate: { 
      opacity: 1, 
      pathLength: 1, 
      rotate: 0, 
      scale: 1,
      transition: { 
        duration: duration(0.7), 
        ease: [0.16, 1, 0.3, 1] 
      } 
    },
  };

  // Animation variants for the 'M'
  const mVariants: Variants = reducedMotion || !animated ? {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
  } : {
    initial: { 
      opacity: 0, 
      x: 14, 
      y: -8, 
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      x: 0, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: duration(0.65), 
        delay: duration(0.18), 
        ease: [0.16, 1, 0.3, 1] 
      } 
    },
  };

  // Animation variants for the Shopping Cart inside 'C'
  const cartVariants: Variants = reducedMotion || !animated ? {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
  } : {
    initial: { 
      opacity: 0, 
      x: -16, 
      scale: 0.85 
    },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { 
        duration: duration(0.55), 
        delay: duration(0.32), 
        ease: [0.22, 1, 0.36, 1] 
      } 
    },
  };

  const wheelVariants: Variants = reducedMotion || !animated ? {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
  } : {
    initial: { 
      scale: 0, 
      opacity: 0 
    },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        duration: duration(0.35), 
        delay: duration(0.48), 
        ease: [0.34, 1.56, 0.64, 1] 
      } 
    },
  };

  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full select-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      <g id="custech-emblem-group">
        {/* Stylized 'C' Ring (Campus Green) */}
        <motion.path
          d="M 128 54.5 C 117.5 44.5 103 38 87 38 C 52.8 38 25 65.8 25 100 C 25 134.2 52.8 162 87 162 C 103 162 117.5 155.5 128 145.5 L 110.5 128 C 104.5 134 96.2 137.5 87 137.5 C 66.3 137.5 49.5 120.7 49.5 100 C 49.5 79.3 66.3 62.5 87 62.5 C 96.2 62.5 104.5 66 110.5 72 L 128 54.5 Z"
          fill={greenColor}
          variants={cVariants}
          initial="initial"
          animate="animate"
          style={{ transformOrigin: '87px 100px' }}
        />

        {/* Shopping Cart Icon (Inside 'C' Opening) */}
        <motion.g
          variants={cartVariants}
          initial="initial"
          animate="animate"
          style={{ transformOrigin: '84px 98px' }}
        >
          {/* Cart Handle & Frame */}
          <path
            d="M 52 79 L 58.5 79 C 60.8 79 62.6 80.5 63.2 82.7 L 69.5 104 C 70.1 106.2 72.1 107.8 74.4 107.8 L 97.5 107.8 C 99.8 107.8 101.8 106.2 102.4 104 L 107 88 C 107.5 86.2 106.1 84.5 104.2 84.5 L 65 84.5"
            stroke={cartColor}
            strokeWidth="4.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cart Basket Ribs */}
          <path
            d="M 68 91 L 102 91"
            stroke={cartColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 70.5 97.5 L 98 97.5"
            stroke={cartColor}
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Cart Left Wheel */}
          <motion.circle
            cx="75.5"
            cy="116"
            r="4.8"
            fill={cartColor}
            variants={wheelVariants}
            initial="initial"
            animate="animate"
            style={{ transformOrigin: '75.5px 116px' }}
          />

          {/* Cart Right Wheel */}
          <motion.circle
            cx="94.5"
            cy="116"
            r="4.8"
            fill={cartColor}
            variants={wheelVariants}
            initial="initial"
            animate="animate"
            style={{ transformOrigin: '94.5px 116px' }}
          />
        </motion.g>

        {/* Stylized 'M' Monogram (Obsidian Navy) */}
        <motion.path
          d="M 124 50 L 158 126 L 192 50 L 215 50 L 215 162 L 192 162 L 192 98 L 166.5 152 L 149.5 152 L 124 98 L 124 162 L 106 162 L 106 142 L 118 142 L 118 84 L 106 84 L 106 50 L 124 50 Z"
          fill={navyColor}
          variants={mVariants}
          initial="initial"
          animate="animate"
          style={{ transformOrigin: '160px 100px' }}
        />
      </g>
    </svg>
  );
}
