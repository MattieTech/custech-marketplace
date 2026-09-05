'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { ShieldCheck, KeyRound, CheckCircle, Award, FileText } from 'lucide-react'

interface HandshakePinModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listingId: string
  listingTitle: string
  isSeller?: boolean
  onSuccess?: () => void
  onOpenReceipt?: () => void
}

export function HandshakePinModal({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  isSeller = false,
  onSuccess,
  onOpenReceipt
}: HandshakePinModalProps) {
  // Deterministic 4-digit PIN based on listing ID for demo/interaction
  const seed = listingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const pin = String((seed % 9000) + 1000)

  const [inputPin, setInputPin] = useState('')
  const [completed, setCompleted] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const handleVerify = () => {
    if (inputPin.trim() !== pin) {
      toast.error('Invalid 4-Digit Handshake PIN. Ask the buyer for the correct code shown on their screen.', 'PIN Mismatch')
      return
    }

    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      setCompleted(true)
      toast.success('In-person trade verified! +1 added to your CUSTECH Verified Trades count.', 'Deal Completed')
      onSuccess?.()
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-green-700 font-bold">
            <KeyRound className="w-5 h-5 text-green-600" />
            <span>Campus Meetup Deal Code</span>
          </div>
          <DialogTitle className="text-xl">In-Person Handshake PIN</DialogTitle>
          <DialogDescription className="text-xs text-gray-600">
            Secure handover verification for <strong>{listingTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        {completed ? (
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Transaction Confirmed!</h3>
              <p className="text-xs text-gray-600 mt-1">
                This item has been officially marked as sold. Both buyer and seller have earned trust points on CUSTECH Marketplace.
              </p>
            </div>

            <div className="pt-3 flex flex-col gap-2">
              {onOpenReceipt && (
                <Button 
                  onClick={() => { onOpenChange(false); onOpenReceipt(); }}
                  className="bg-green-700 hover:bg-green-800 text-white font-medium"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Campus Gate Clearance Receipt
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : isSeller ? (
          /* SELLER VIEW: Enter Buyer's PIN */
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 leading-relaxed">
              <strong>Seller Instructions:</strong> Ask the buyer for their 4-digit Handshake Code <em>after</em> they inspect the item and payment is confirmed in your mobile bank app.
            </div>

            <div className="space-y-2 text-center">
              <label htmlFor="handshake-pin" className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Enter 4-Digit Buyer PIN
              </label>
              <Input
                id="handshake-pin"
                type="text"
                maxLength={4}
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • •"
                className="text-center text-3xl font-mono tracking-widest font-black h-14 w-44 mx-auto"
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={verifying || inputPin.length !== 4}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold"
            >
              {verifying ? 'Verifying Handshake...' : 'Confirm Handover & Complete Trade'}
            </Button>
          </div>
        ) : (
          /* BUYER VIEW: Show My PIN */
          <div className="space-y-4 text-center">
            <p className="text-xs text-gray-600">
              Only reveal this code to the seller <strong>after</strong> you have physically tested the item and confirmed it works:
            </p>

            {/* Big 4-Digit Code Box */}
            <div className="bg-gray-50 border-2 border-dashed border-green-600 rounded-2xl p-6 shadow-inner inline-block w-full">
              <span className="text-xs font-bold uppercase tracking-widest text-green-700 block mb-1">
                Your Secret Handshake Code
              </span>
              <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-gray-900">
                {pin.split('').join(' ')}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 text-left">
              <strong>Campus Safety Rule:</strong> Never send this PIN over WhatsApp or SMS before meeting in person. Hand it over only at your campus safe meetup spot.
            </div>

            <Button 
              variant="outline" 
              className="w-full text-xs"
              onClick={() => onOpenChange(false)}
            >
              Close Window
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
