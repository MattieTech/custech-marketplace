'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldAlert, AlertTriangle, CheckCircle2, Smartphone, Eye, ExternalLink, XCircle } from 'lucide-react'

interface FakeAlertDefenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FakeAlertDefenseModal({ open, onOpenChange }: FakeAlertDefenseModalProps) {
  const [checked1, setChecked1] = useState(false)
  const [checked2, setChecked2] = useState(false)
  const [checked3, setChecked3] = useState(false)

  const allVerified = checked1 && checked2 && checked3

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 font-bold">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <span>Campus Anti-Fraud Protocol</span>
          </div>
          <DialogTitle className="text-xl">Fake Bank Alert Defense Guide</DialogTitle>
          <DialogDescription className="text-xs text-gray-600">
            Fake credit alerts are the #1 way student sellers lose gadgets and laptops in Nigerian universities. Follow this 3-step defense before releasing any item.
          </DialogDescription>
        </DialogHeader>

        {/* The 3 Modus Operandi Warning Box */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2.5">
          <span className="text-xs font-bold text-red-900 flex items-center gap-1.5 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            How Scammers Cheat Students:
          </span>
          <ul className="text-xs text-red-800 space-y-1.5 list-disc list-inside">
            <li><strong>Spoofed SMS Alerts:</strong> Scammers use bulk SMS services with custom sender IDs like <em>&quot;GTBank&quot;</em> or <em>&quot;FirstBank&quot;</em> that arrive in your real bank&apos;s SMS thread.</li>
            <li><strong>Fake Banking Apps:</strong> They show you a realistic &quot;Transfer Successful&quot; screen on their own phone screen.</li>
            <li><strong>Reversible/Uncleared Checks:</strong> Staged transfers that bounce after you part with your item.</li>
          </ul>
        </div>

        {/* Interactive Verification Checklist */}
        <div className="space-y-3 pt-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
            Mandatory Seller Defense Checklist:
          </h3>

          <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
            checked1 ? 'bg-green-50/70 border-green-300' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={checked1}
              onChange={(e) => setChecked1(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
            />
            <div className="text-xs text-gray-800 leading-relaxed">
              <strong className="block text-gray-900 font-semibold mb-0.5">1. Never Trust SMS Alerts:</strong>
              I will ignore any SMS alert on my phone and open my official mobile banking application instead.
            </div>
          </label>

          <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
            checked2 ? 'bg-green-50/70 border-green-300' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={checked2}
              onChange={(e) => setChecked2(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
            />
            <div className="text-xs text-gray-800 leading-relaxed">
              <strong className="block text-gray-900 font-semibold mb-0.5">2. Check &quot;Available Balance&quot;:</strong>
              I have opened my bank app (OPay, Kuda, GTBank, etc.) and verified that my actual <em>Available Balance</em> increased by the exact purchase price.
            </div>
          </label>

          <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
            checked3 ? 'bg-green-50/70 border-green-300' : 'bg-white border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="checkbox"
              checked={checked3}
              onChange={(e) => setChecked3(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
            />
            <div className="text-xs text-gray-800 leading-relaxed">
              <strong className="block text-gray-900 font-semibold mb-0.5">3. Verified on My Own Device:</strong>
              I will not look at the buyer&apos;s phone screen as proof. I will only hand over the item after my own phone confirms cleared funds.
            </div>
          </label>
        </div>

        {/* Verification Status Banner */}
        <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
          allVerified ? 'bg-green-100 text-green-900 font-semibold' : 'bg-gray-100 text-gray-600'
        }`}>
          {allVerified ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-700 flex-shrink-0" />
              <span>All 3 safety points acknowledged. You are protected!</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span>Check all 3 boxes above to confirm you are safe against fake alerts.</span>
            </>
          )}
        </div>

        <div className="pt-2">
          <Button 
            className="w-full bg-green-700 hover:bg-green-800 text-white"
            onClick={() => onOpenChange(false)}
          >
            I Understand &amp; Will Trade Safely
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
