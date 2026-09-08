'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
      <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

interface ShareButtonProps {
  title: string;
  url?: string;
  className?: string;
  variant?: 'outline' | 'default' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ShareButton({
  title,
  url,
  className,
  variant = 'outline',
  size = 'sm',
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getCanonicalUrl = () => {
    if (url) return url;
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const shareUrl = getCanonicalUrl();
  const shareText = `Check out "${title}" on CUSTECH Marketplace!`;

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setOpen(true);
        }
        return;
      }
    }
    setOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Listing link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleNativeShare}
        className={className || 'rounded-xl text-xs gap-1.5 font-semibold h-8'}
        aria-label="Share listing"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Share</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 w-full max-w-sm shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-slate-900">Share this Listing</h3>
                <p className="text-xs text-slate-500 truncate max-w-[240px]">{title}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Social Channels */}
            <div className="grid grid-cols-3 gap-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-green-50 hover:bg-green-100 text-green-700 transition-all border border-green-200 text-center"
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="text-[11px] font-bold">WhatsApp</span>
              </a>

              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 transition-all border border-slate-200 text-center"
              >
                <XIcon className="w-5 h-5 text-slate-800" />
                <span className="text-[11px] font-bold">X (Twitter)</span>
              </a>

              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all border border-blue-200 text-center"
              >
                <FacebookIcon className="w-5 h-5 text-blue-600" />
                <span className="text-[11px] font-bold">Facebook</span>
              </a>
            </div>

            {/* Copy Link Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Direct Link
              </label>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl p-1.5">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="bg-transparent text-xs font-mono text-slate-700 flex-1 px-2.5 focus:outline-none truncate"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopy}
                  className={`rounded-xl text-xs font-bold shrink-0 h-8 gap-1 transition-all ${
                    copied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
