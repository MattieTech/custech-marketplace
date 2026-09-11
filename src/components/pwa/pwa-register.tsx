'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(() => {
            // Service worker active
          })
          .catch((err) => {
            console.debug('ServiceWorker error:', err);
          });
      });
    }
  }, []);

  return null;
}
