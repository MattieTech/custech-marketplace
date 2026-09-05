'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TrustBadge } from '@/components/ui/trust-badge'
import { toast } from '@/components/ui/toast'
import { formatPrice } from '@/lib/utils'
import { CampusSafeZonesModal } from './campus-safe-zones-modal'
import { FakeAlertDefenseModal } from './fake-alert-defense-modal'
import { 
  ShieldAlert, 
  Copy, 
  Check, 
  MessageSquare, 
  Building2, 
  CreditCard, 
  UserCheck, 
  MapPin, 
  Lock, 
  Unlock 
} from 'lucide-react'

interface PaySellerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: {
    id: string
    title: string
    price: number
  }
  seller: {
    id: string
    display_name: string
    trust_level?: string
    verification_status?: string
    bank_name?: string
    account_number?: string
    account_name?: string
    whatsapp_number?: string
    phone?: string
  }
}

export function PaySellerModal({ open, onOpenChange, listing, seller }: PaySellerModalProps) {
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)
  const [safeZonesOpen, setSafeZonesOpen] = useState(false)
  const [fakeAlertOpen, setFakeAlertOpen] = useState(false)

  const handleCopyAccount = () => {
    if (!seller.account_number) return
    navigator.clipboard.writeText(seller.account_number)
    setCopied(true)
    toast.success(`Account number (${seller.account_number}) copied to clipboard!`, 'Copied')
    setTimeout(() => setCopied(false), 2500)
  }

  // Pre-filled WhatsApp message
  const rawPhone = seller.whatsapp_number || seller.phone || ''
  const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '234')
  const waMessage = encodeURIComponent(
    `Hello ${seller.display_name}, I am contacting you from CUSTECH Marketplace regarding "${listing.title}" (${formatPrice(listing.price)}). I would like to inspect the item and finalize payment at a safe campus location.`
  )
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waMessage}` : null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                Direct Seller Payment
              </span>
              {seller.trust_level && (
                <TrustBadge level={seller.trust_level as any} />
              )}
            </div>
            <DialogTitle className="text-xl mt-2">Pay Seller Directly</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Pay <strong className="text-gray-900">{seller.display_name}</strong> for <strong className="text-gray-900">{listing.title}</strong> ({formatPrice(listing.price)}).
            </DialogDescription>
          </DialogHeader>

          {/* CRITICAL ANTI-SCAM SHIELD ALERT */}
          <div className="border-2 border-red-500 bg-red-50/70 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>ANTI-SCAM SAFETY WARNING</span>
            </div>
            <p className="text-xs text-red-800 leading-relaxed">
              <strong>DO NOT SEND MONEY IN ADVANCE.</strong> Never transfer funds before you have met the seller in person and physically tested the item in broad daylight. CUSTECH Marketplace cannot reverse direct bank transfers.
            </p>
            <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => setSafeZonesOpen(true)}
                className="text-xs font-semibold text-green-800 hover:text-green-900 underline flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5 text-green-700" />
                View recommended CUSTECH Campus Safe Meetup Zones
              </button>

              <button
                type="button"
                onClick={() => setFakeAlertOpen(true)}
                className="text-xs font-semibold text-red-700 hover:text-red-800 underline flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                Fake Bank Alert Defense Guide
              </button>
            </div>
          </div>

          {/* Verification Acknowledgment Checkbox */}
          <label className="flex items-start gap-3 p-3.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors bg-white">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
            />
            <span className="text-xs text-gray-800 leading-snug">
              <strong>I confirm:</strong> I am either currently with the seller in person, or will only send this payment after physically inspecting the item at an approved campus location.
            </span>
          </label>

          {/* Bank Account Details Section */}
          <div className="relative">
            {!acknowledged && (
              <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] z-10 rounded-xl flex flex-col items-center justify-center p-4 text-center border border-dashed border-gray-300">
                <Lock className="w-8 h-8 text-gray-400 mb-1" />
                <span className="text-xs font-semibold text-gray-700">Bank Details Locked For Safety</span>
                <span className="text-[11px] text-gray-500 max-w-xs mt-0.5">
                  Check the safety confirmation above to reveal seller account number.
                </span>
              </div>
            )}

            <div className={`space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-xl transition-all ${!acknowledged ? 'filter blur-[1px]' : ''}`}>
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-400" /> Bank Name
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {seller.bank_name || 'Contact seller for bank'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-gray-400" /> Account Number
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-mono font-bold tracking-wider text-green-700">
                    {seller.account_number || 'Not provided'}
                  </span>
                  {seller.account_number && acknowledged && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyAccount}
                      className="h-7 px-2 text-xs flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-gray-400" /> Account Name
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {seller.account_name || seller.display_name}
                </span>
              </div>
            </div>
          </div>

          {/* Actions & WhatsApp Contact */}
          <div className="flex flex-col gap-2 pt-2">
            {waUrl ? (
              <Button 
                asChild 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat with Seller on WhatsApp
                </a>
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="w-full text-xs" 
                onClick={() => onOpenChange(false)}
              >
                Close Window
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Campus Safe Zones Popover */}
      <CampusSafeZonesModal open={safeZonesOpen} onOpenChange={setSafeZonesOpen} />

      {/* Fake Alert Defense Popover */}
      <FakeAlertDefenseModal open={fakeAlertOpen} onOpenChange={setFakeAlertOpen} />
    </>
  )
}
