'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { formatPrice } from '@/lib/utils'
import { Tag, MessageSquare, Check, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MakeOfferModalProps {
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
    whatsapp_number?: string
    phone?: string
  }
}

export function MakeOfferModal({ open, onOpenChange, listing, seller }: MakeOfferModalProps) {
  const router = useRouter()
  const originalPrice = listing.price
  const [offerPrice, setOfferPrice] = useState<number>(Math.round(originalPrice * 0.9))
  const [customInput, setCustomInput] = useState<string>(String(Math.round(originalPrice * 0.9)))
  const [note, setNote] = useState('I am currently on campus and ready to pick up today.')
  const [submitting, setSubmitting] = useState(false)

  const applyDiscount = (percent: number) => {
    const discounted = Math.round(originalPrice * (1 - percent / 100))
    setOfferPrice(discounted)
    setCustomInput(String(discounted))
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    setCustomInput(val)
    if (val) {
      setOfferPrice(parseInt(val, 10))
    }
  }

  const handleSubmitOffer = () => {
    if (!offerPrice || offerPrice <= 0) {
      toast.error('Please enter a valid offer price.')
      return
    }

    if (offerPrice >= originalPrice) {
      toast.warning('Your offer is equal to or greater than the original price!')
    }

    setSubmitting(true)

    // Pre-filled WhatsApp link if available
    const rawPhone = seller.whatsapp_number || seller.phone || ''
    const cleanPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '234')
    const discountAmount = originalPrice - offerPrice
    const discountPercent = Math.round((discountAmount / originalPrice) * 100)

    const offerMsg = encodeURIComponent(
      `Hello ${seller.display_name}, I am making an offer for "${listing.title}".\n\nListed Price: ${formatPrice(originalPrice)}\nMy Offer: ${formatPrice(offerPrice)} (${discountPercent > 0 ? discountPercent + '% off' : 'custom'})\nNote: ${note}\n\nCan we meet at an approved campus location?`
    )

    toast.success(
      `Offer of ${formatPrice(offerPrice)} submitted! Opening chat with seller...`,
      'Offer Sent'
    )

    setTimeout(() => {
      setSubmitting(false)
      onOpenChange(false)
      if (cleanPhone) {
        window.open(`https://wa.me/${cleanPhone}?text=${offerMsg}`, '_blank')
      } else {
        router.push(`/messages?user=${seller.id}&offer=${offerPrice}`)
      }
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-green-700 font-bold">
            <Tag className="w-5 h-5 text-green-600" />
            <span>Campus Bargain Engine</span>
          </div>
          <DialogTitle className="text-xl">Make an Offer</DialogTitle>
          <DialogDescription className="text-xs text-gray-600">
            Negotiate a student-friendly price for <strong>{listing.title}</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Current Price vs Offer Price Comparison */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Listed Price</span>
            <span className="text-base font-bold text-gray-500 line-through">
              {formatPrice(originalPrice)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-green-700 block">Your Offer</span>
            <span className="text-lg font-black text-green-700">
              {formatPrice(offerPrice || 0)}
            </span>
          </div>
        </div>

        {/* Quick Discount Shortcuts */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Quick Counter-Offer Shortcuts:</label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => applyDiscount(pct)}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  offerPrice === Math.round(originalPrice * (1 - pct / 100))
                    ? 'border-green-600 bg-green-50 text-green-800 ring-1 ring-green-600'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                -{pct}% ({formatPrice(Math.round(originalPrice * (1 - pct / 100)))})
              </button>
            ))}
          </div>
        </div>

        {/* Custom Price Input */}
        <div className="space-y-1.5">
          <label htmlFor="custom-offer" className="text-xs font-semibold text-gray-700">
            Or Type Custom Price (₦)
          </label>
          <Input
            id="custom-offer"
            type="text"
            value={customInput}
            onChange={handleCustomChange}
            placeholder="e.g. 25000"
            className="text-base font-bold text-gray-900"
          />
        </div>

        {/* Short Note */}
        <div className="space-y-1.5">
          <label htmlFor="offer-note" className="text-xs font-semibold text-gray-700">
            Quick Note to Seller:
          </label>
          <Input
            id="offer-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Ready to pick up at SUB in 30 mins"
            maxLength={120}
          />
        </div>

        <div className="pt-2">
          <Button
            type="button"
            onClick={handleSubmitOffer}
            disabled={submitting}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold flex items-center justify-center gap-2"
          >
            {submitting ? 'Sending Offer...' : `Send Offer (${formatPrice(offerPrice || 0)})`}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
