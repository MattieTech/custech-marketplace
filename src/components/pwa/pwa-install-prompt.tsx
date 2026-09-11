'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Download, 
  X, 
  Share, 
  PlusSquare, 
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    const dismissed = sessionStorage.getItem('custech_pwa_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!mounted || isStandalone || isDismissed) {
    return null;
  }

  const canInstall = deferredPrompt !== null || isIOS;
  if (!canInstall) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('custech_pwa_dismissed', 'true');
  };

  return (
    <>
      <aside 
        aria-label="Install App"
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300"
      >
        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-4 md:p-5 border border-emerald-500/30 shadow-2xl shadow-emerald-950/40 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
            aria-label="Dismiss app install banner"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0 mt-0.5">
              <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-700">
                <Image
                  src="/logo.png"
                  alt="CUSTECH Marketplace App"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </span>
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm font-black text-white tracking-tight">Install CUSTECH App</h2>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                Install directly on your phone or laptop. Fast campus shopping, escrow alerts and offline access without APK download!
              </p>

              <div className="flex items-center gap-2 mt-3.5">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Now</span>
                </Button>

                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl px-3"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {showIOSGuide && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
                <h3 className="font-bold text-sm">Install on iPhone / iPad</h3>
              </div>
              <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apple requires installation through Safari using these 2 simple steps:
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">Step 1</p>
                  <p className="text-[11px] text-slate-400">Tap the Share button at the bottom of Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-100">Step 2</p>
                  <p className="text-[11px] text-slate-400">Scroll down and tap Add to Home Screen.</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowIOSGuide(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl mt-2"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export function PwaInstallHeaderButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (isStandalone) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') setIsStandalone(true);
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      alert('To install, open your browser menu and select \"Install App\" or \"Add to Home Screen\".');
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Install CUSTECH Marketplace Web App"
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/80 text-xs font-bold transition-all active:scale-95 shadow-2xs group"
      >
        <Download className="w-3.5 h-3.5 text-emerald-600 group-hover:animate-bounce" />
        <span>Install App</span>
      </button>

      {showIOSModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
                <h3 className="font-bold text-sm">Install on iPhone</h3>
              </div>
              <button onClick={() => setShowIOSModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Tap the Share button in Safari, then select Add to Home Screen.
            </p>
            <Button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl"
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
