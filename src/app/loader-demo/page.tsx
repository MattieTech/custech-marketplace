'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  CustechLogoLoader,
  CustechSplashScreen,
  CustechEmblem,
  CustechKineticWordmark,
  LoaderMode,
  LoaderSize,
} from '@/components/ui/custech-loader';
import { Play, RotateCcw, Zap, Moon, Sun, Laptop, Smartphone, Eye, CheckCircle2 } from 'lucide-react';

export default function LoaderDemoPage() {
  const [splashOpen, setSplashOpen] = useState(false);
  const [key, setKey] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [selectedSize, setSelectedSize] = useState<LoaderSize>('lg');
  const [selectedMode, setSelectedMode] = useState<LoaderMode>('splash');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [simulatedButtonLoading, setSimulatedButtonLoading] = useState(false);
  const [simulatedSearchLoading, setSimulatedSearchLoading] = useState(false);

  const replay = () => setKey((prev) => prev + 1);

  const handleTestButton = () => {
    setSimulatedButtonLoading(true);
    setTimeout(() => setSimulatedButtonLoading(false), 2200);
  };

  const handleTestSearch = () => {
    setSimulatedSearchLoading(true);
    setTimeout(() => setSimulatedSearchLoading(false), 2600);
  };

  return (
    <PageContainer>
      <div className="py-8 md:py-12 max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                Kinetic Typography Motion System
              </span>
              <span className="text-xs text-gray-500">Vector SVG + Framer Motion</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              CUSTECH Marketplace Brand Loader
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
              Original choreographed letter-reveal animation designed specifically for CUSTECH Marketplace. 
              Zero generic spinners, zero bounce/cartoons, pure fintech-grade kinetic choreography.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={replay}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Replay Motion
            </Button>
            <Button
              onClick={() => setSplashOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 shadow-sm"
            >
              <Play className="w-4 h-4" /> Test App Splash Screen
            </Button>
          </div>
        </div>

        {/* Interactive Playground Control Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-900 border">
          {/* Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Loader Mode
            </label>
            <div className="flex rounded-lg border bg-white dark:bg-slate-800 p-1">
              {(['splash', 'in-app', 'icon'] as LoaderMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMode(m)}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors capitalize ${
                    selectedMode === m
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Size Preset
            </label>
            <div className="flex rounded-lg border bg-white dark:bg-slate-800 p-1">
              {(['sm', 'md', 'lg', 'xl'] as LoaderSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`flex-1 py-1 text-xs font-medium rounded transition-colors uppercase ${
                    selectedSize === s
                      ? 'bg-green-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Speed Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Speed: {speed}x
              </label>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.25"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
          </div>

          {/* Theme Mode Toggle */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Canvas Theme
            </label>
            <div className="flex rounded-lg border bg-white dark:bg-slate-800 p-1">
              <button
                onClick={() => setThemeMode('light')}
                className={`flex-1 py-1 text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${
                  themeMode === 'light'
                    ? 'bg-white shadow-xs text-gray-900 font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
              </button>
              <button
                onClick={() => setThemeMode('dark')}
                className={`flex-1 py-1 text-xs font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${
                  themeMode === 'dark'
                    ? 'bg-slate-950 text-white shadow-xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-blue-400" /> Dark
              </button>
            </div>
          </div>
        </div>

        {/* Live Animation Stage */}
        <div
          className={`relative rounded-2xl border transition-all duration-300 min-h-[380px] flex flex-col items-center justify-center p-8 overflow-hidden ${
            themeMode === 'dark'
              ? 'bg-slate-950 text-white border-slate-800'
              : 'bg-gradient-to-b from-gray-50/70 to-white text-gray-900 border-gray-200'
          }`}
        >
          {/* Subtle grid pattern background */}
          <div
            className={`absolute inset-0 pointer-events-none opacity-30 ${
              themeMode === 'dark'
                ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]'
                : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]'
            }`}
          />

          <div key={key} className="relative z-10">
            <CustechLogoLoader
              mode={selectedMode}
              size={selectedSize}
              speed={speed}
              theme={themeMode}
              message="Choreographed Kinetic Typography Reveal..."
              loop={true}
            />
          </div>

          <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs opacity-60">
            <span>Authentic Logo Vectors</span>
            <span>Choreographed Letter Entrances</span>
            <span>Specular Accent Glides</span>
          </div>
        </div>

        {/* Section: Side-by-Side Fidelity Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              100% Brand Fidelity Verification
            </CardTitle>
            <CardDescription>
              The kinetic animation assembles directly into the exact typography, colors, and proportions of the official CUSTECH Marketplace logo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left: Original Uploaded Logo */}
              <div className="flex flex-col items-center p-6 rounded-xl bg-white border">
                <span className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                  Original Brand Identity (Static Reference)
                </span>
                <div className="relative w-64 h-64">
                  <Image
                    src="/logo.png"
                    alt="Official CUSTECH Marketplace Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Right: Assembled Vector Frame */}
              <div className="flex flex-col items-center p-6 rounded-xl bg-white border">
                <span className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                  Final Assembled Vector Frame
                </span>
                <div className="w-64 h-64 flex flex-col items-center justify-center">
                  <CustechLogoLoader
                    mode="splash"
                    size="xl"
                    speed={1}
                    theme="light"
                    loop={false}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In-App Loader Demonstrations (Cards, Searches, Buttons) */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            In-App Loader Usages
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
            Subtle, high-speed variations for UI elements, product loading, and asynchronous transactions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Example 1: Marketplace Product Feed Loading */}
            <Card className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Product Card Feed</span>
                  <Button size="sm" variant="ghost" onClick={handleTestSearch}>
                    Reload
                  </Button>
                </CardTitle>
                <CardDescription>
                  Used while loading items on /marketplace
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[160px] flex items-center justify-center border-t bg-gray-50/50 dark:bg-slate-900/50">
                {simulatedSearchLoading ? (
                  <CustechLogoLoader
                    mode="in-app"
                    size="sm"
                    message="Fetching latest Osara listings..."
                  />
                ) : (
                  <div className="text-center p-4">
                    <p className="text-sm font-semibold text-gray-800">HP EliteBook 840 G5</p>
                    <p className="text-xs text-green-600 font-bold mt-1">₦195,000</p>
                    <button
                      onClick={handleTestSearch}
                      className="mt-3 text-xs text-blue-600 hover:underline"
                    >
                      Click to test loader
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Example 2: Interactive Modal / Checkout Submission */}
            <Card className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Payment / Transfer Verification</span>
                  <Button size="sm" variant="ghost" onClick={handleTestButton}>
                    Trigger
                  </Button>
                </CardTitle>
                <CardDescription>
                  Used while generating handshake PIN or verifying escrow
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[160px] flex items-center justify-center border-t bg-gray-50/50 dark:bg-slate-900/50">
                {simulatedButtonLoading ? (
                  <CustechLogoLoader
                    mode="in-app"
                    size="md"
                    message="Verifying transaction handshake..."
                  />
                ) : (
                  <div className="text-center p-4">
                    <Button
                      onClick={handleTestButton}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                    >
                      Confirm Meetup PIN
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Example 3: Compact Badge / Icon Mode */}
            <Card className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base">
                  Icon Kinetic Monogram
                </CardTitle>
                <CardDescription>
                  Ultra-compact mode for tight headers, pills, and avatar placeholders
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[160px] flex items-center justify-center border-t bg-gray-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-6">
                  <CustechLogoLoader mode="icon" size="sm" />
                  <CustechLogoLoader mode="icon" size="md" />
                  <CustechLogoLoader mode="icon" size="lg" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Integration Code Guide */}
        <Card className="bg-slate-950 text-slate-100 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg font-mono flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-400" /> Quick Integration Guide
            </CardTitle>
            <CardDescription className="text-slate-400">
              Drop the loader into any page, server component boundary, modal, or async hook:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-mono text-green-400 mb-1.5">// 1. Full Page or App Route Loading (app/loading.tsx)</p>
              <pre className="p-3.5 rounded-lg bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto border border-slate-800">
{`import { CustechLogoLoader } from '@/components/ui/custech-loader';

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <CustechLogoLoader mode="splash" size="lg" message="Loading CUSTECH Marketplace..." />
    </div>
  );
}`}
              </pre>
            </div>

            <div>
              <p className="text-xs font-mono text-green-400 mb-1.5">// 2. In-App Fast Loader for Feed or Modals</p>
              <pre className="p-3.5 rounded-lg bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto border border-slate-800">
{`import { CustechLogoLoader } from '@/components/ui/custech-loader';

{isLoading ? (
  <CustechLogoLoader mode="in-app" size="md" message="Fetching items..." />
) : (
  <ProductList items={items} />
)}`}
              </pre>
            </div>

            <div>
              <p className="text-xs font-mono text-green-400 mb-1.5">// 3. Fullscreen App Splash Screen Overlay</p>
              <pre className="p-3.5 rounded-lg bg-slate-900 text-xs font-mono text-slate-200 overflow-x-auto border border-slate-800">
{`import { CustechSplashScreen } from '@/components/ui/custech-loader';

<CustechSplashScreen
  isLoading={isInitializing}
  message="Connecting to CUSTECH Campus Network..."
  size="lg"
/>`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen Splash Modal Tester */}
      <CustechSplashScreen
        isLoading={splashOpen}
        message="Booting CUSTECH Marketplace..."
        size="lg"
        onExitComplete={() => setSplashOpen(false)}
      />

      {splashOpen && (
        <button
          onClick={() => setSplashOpen(false)}
          className="fixed top-6 right-6 z-[60] px-4 py-2 bg-black/80 hover:bg-black text-white text-xs font-bold rounded-full shadow-lg border border-white/20 transition-transform active:scale-95"
        >
          Close Splash (ESC / Click)
        </button>
      )}
    </PageContainer>
  );
}
