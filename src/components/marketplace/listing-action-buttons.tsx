'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  MessageCircle, 
  CreditCard, 
  Heart, 
  Share2, 
  ShieldCheck, 
  Check, 
  Tag, 
  KeyRound, 
  FileText 
} from 'lucide-react'
import { PaySellerModal } from './pay-seller-modal'
import { CampusSafeZonesModal } from './campus-safe-zones-modal'
import { MakeOfferModal } from './make-offer-modal'
import { HandshakePinModal } from './handshake-pin-modal'
import { OwnershipReceiptModal } from './ownership-receipt-modal'
import { toast } from '@/components/ui/toast'

interface ListingActionButtonsProps {
  listing: {
    id: string
    title: string
    price: number
    category?: string
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
    matric_number?: string
    department?: string
  }
  onSaveAction: (listingId: string) => Promise<any>
}

export function ListingActionButtons({ listing, seller, onSaveAction }: ListingActionButtonsProps) {
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [safeZonesOpen, setSafeZonesOpen] = useState(false)
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSaveAction(listing.id)
      setSaved(!saved)
      if (!saved) {
        toast.success('Listing saved to your bookmarks!', 'Saved')
      } else {
        toast.info('Listing removed from bookmarks.')
      }
    } catch (err) {
      toast.error('Failed to update bookmark. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Listing link copied to clipboard!', 'Shared')
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Primary Row: Message & Direct Pay */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button 
          asChild 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium flex items-center justify-center gap-2 h-10"
        >
          <Link href={`/messages?user=${seller.id}`}>
            <MessageCircle className="w-4 h-4" /> Message Seller
          </Link>
        </Button>

        <Button 
          type="button"
          onClick={() => setPayModalOpen(true)}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium flex items-center justify-center gap-2 h-10 shadow-sm"
        >
          <CreditCard className="w-4 h-4" /> Pay Seller Directly
        </Button>
      </div>

      {/* Bargain & In-Person Handshake PIN Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button 
          type="button"
          variant="outline"
          onClick={() => setOfferModalOpen(true)}
          className="w-full border-green-600/40 text-green-800 hover:bg-green-50 font-medium flex items-center justify-center gap-1.5 h-9 text-xs"
        >
          <Tag className="w-3.5 h-3.5 text-green-600" /> Make an Offer (Bargain)
        </Button>

        <Button 
          type="button"
          variant="outline"
          onClick={() => setPinModalOpen(true)}
          className="w-full border-blue-600/40 text-blue-800 hover:bg-blue-50 font-medium flex items-center justify-center gap-1.5 h-9 text-xs"
        >
          <KeyRound className="w-3.5 h-3.5 text-blue-600" /> Meetup Handshake PIN
        </Button>
      </div>

      {/* Secondary Row: Save, Share & Gate Pass */}
      <div className="grid grid-cols-3 gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className={`h-8 text-xs ${saved ? 'text-green-600 border-green-300 bg-green-50/50' : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? <Check className="w-3.5 h-3.5 mr-1 text-green-600" /> : <Heart className="w-3.5 h-3.5 mr-1" />}
          {saved ? 'Saved' : 'Save'}
        </Button>

        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleShare}>
          <Share2 className="w-3.5 h-3.5 mr-1" /> Share
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs text-gray-700 hover:text-green-700"
          onClick={() => setReceiptModalOpen(true)}
        >
          <FileText className="w-3.5 h-3.5 mr-1 text-green-600" /> Gate Pass
        </Button>
      </div>

      {/* Safe Trade Locations Tip Link */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setSafeZonesOpen(true)}
          className="text-[11px] text-gray-500 hover:text-green-700 flex items-center justify-center w-full gap-1 py-1 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          <span>Recommended CUSTECH Safe Meetup Spots</span>
        </button>
      </div>

      {/* Modals */}
      <PaySellerModal 
        open={payModalOpen} 
        onOpenChange={setPayModalOpen} 
        listing={listing} 
        seller={seller} 
      />

      <CampusSafeZonesModal 
        open={safeZonesOpen} 
        onOpenChange={setSafeZonesOpen} 
      />

      <MakeOfferModal
        open={offerModalOpen}
        onOpenChange={setOfferModalOpen}
        listing={listing}
        seller={seller}
      />

      <HandshakePinModal
        open={pinModalOpen}
        onOpenChange={setPinModalOpen}
        listingId={listing.id}
        listingTitle={listing.title}
        onOpenReceipt={() => setReceiptModalOpen(true)}
      />

      <OwnershipReceiptModal
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        listing={listing}
        seller={seller}
      />
    </div>
  )
}
