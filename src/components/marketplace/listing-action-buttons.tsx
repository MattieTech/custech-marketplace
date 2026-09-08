'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  CreditCard, 
  Heart, 
  ShieldCheck, 
  Check, 
  Tag, 
  KeyRound, 
  FileText,
  Lock
} from 'lucide-react';
import { PaySellerModal } from './pay-seller-modal';
import { BuyWithEscrowModal } from './buy-with-escrow-modal';
import { CampusSafeZonesModal } from './campus-safe-zones-modal';
import { MakeOfferModal } from './make-offer-modal';
import { HandshakePinModal } from './handshake-pin-modal';
import { OwnershipReceiptModal } from './ownership-receipt-modal';
import { ShareButton } from './share-button';
import { toast } from '@/components/ui/toast';
import { toggleLikeListing, getListingUserInteraction } from '@/app/marketplace/[id]/actions';

interface ListingActionButtonsProps {
  listing: {
    id: string;
    title: string;
    price: number;
    category?: string;
  };
  seller: {
    id: string;
    display_name: string;
    trust_level?: string;
    verification_status?: string;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    whatsapp_number?: string;
    phone?: string;
    matric_number?: string;
    department?: string;
  };
  onSaveAction: (listingId: string) => Promise<any>;
}

export function ListingActionButtons({ listing, seller, onSaveAction }: ListingActionButtonsProps) {
  const [escrowModalOpen, setEscrowModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [safeZonesOpen, setSafeZonesOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    getListingUserInteraction(listing.id)
      .then((data) => {
        setSaved(data.isSaved);
        setLiked(data.isLiked);
        setLikesCount(data.likesCount);
      })
      .catch((err) => console.error('Error fetching interaction status:', err));
  }, [listing.id]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await onSaveAction(listing.id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setSaved(!saved);
      if (!saved) {
        toast.success('Saved to your bookmarks!', 'Saved');
      } else {
        toast.info('Removed from bookmarks.');
      }
    } catch {
      toast.error('Failed to update bookmark.');
    } finally {
      setSaving(false);
    }
  };

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);

    // Optimistic toggle
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await toggleLikeListing(listing.id);
      if (res.error || typeof res.liked !== 'boolean') {
        setLiked(prevLiked);
        setLikesCount(prevCount);
        toast.error(res.error || 'Failed to update like');
        return;
      }
      setLiked(res.liked);
      setLikesCount(res.count ?? prevCount);
    } catch {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error('Could not update like.');
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* FEATURED PRIMARY: Buy with Platform Escrow (Option 2) */}
      <Button
        type="button"
        onClick={() => setEscrowModalOpen(true)}
        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm h-11 rounded-2xl shadow-md flex items-center justify-center gap-2"
      >
        <Lock className="w-4 h-4" />
        <span>Buy with Marketplace Escrow</span>
      </Button>

      {/* SECONDARY ROW: Message Seller & Pay Directly (Option 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button 
          asChild 
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 h-10 rounded-2xl shadow-xs"
        >
          <Link href={`/messages?user=${seller.id}`}>
            <MessageCircle className="w-4 h-4" /> Message Seller
          </Link>
        </Button>

        <Button 
          type="button"
          onClick={() => setPayModalOpen(true)}
          variant="outline"
          className="w-full border-amber-600/40 text-amber-800 hover:bg-amber-50 font-bold text-xs flex items-center justify-center gap-2 h-10 rounded-2xl"
        >
          <CreditCard className="w-4 h-4 text-amber-700" /> Pay Seller Directly
        </Button>
      </div>

      {/* Bargain & In-Person Handshake PIN Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button 
          type="button"
          variant="outline"
          onClick={() => setOfferModalOpen(true)}
          className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-center gap-1.5 h-9 text-xs rounded-xl"
        >
          <Tag className="w-3.5 h-3.5 text-emerald-600" /> Make an Offer (Bargain)
        </Button>

        <Button 
          type="button"
          variant="outline"
          onClick={() => setPinModalOpen(true)}
          className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-center gap-1.5 h-9 text-xs rounded-xl"
        >
          <KeyRound className="w-3.5 h-3.5 text-blue-600" /> Meetup Handshake PIN
        </Button>
      </div>

      {/* Social Interactions: Like, Save, Share, Gate Pass */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {/* Real Like Button */}
        <Button 
          type="button"
          variant="outline" 
          size="sm"
          className={`h-9 text-xs rounded-xl font-semibold gap-1 ${
            liked ? 'text-rose-600 border-rose-300 bg-rose-50/70' : 'text-slate-700 hover:text-rose-600'
          }`}
          onClick={handleLike}
          disabled={liking}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-600' : ''}`} />
          <span>{likesCount > 0 ? likesCount : 'Like'}</span>
        </Button>

        {/* Real Save Button */}
        <Button 
          type="button"
          variant="outline" 
          size="sm"
          className={`h-9 text-xs rounded-xl font-semibold gap-1 ${
            saved ? 'text-emerald-700 border-emerald-300 bg-emerald-50/70' : 'text-slate-700 hover:text-emerald-700'
          }`}
          onClick={handleSave}
          disabled={saving}
        >
          {saved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Heart className="w-3.5 h-3.5" />}
          <span>{saved ? 'Saved' : 'Save'}</span>
        </Button>

        {/* Real Multi-channel Share Button */}
        <ShareButton 
          title={listing.title} 
          className="h-9 text-xs rounded-xl font-semibold w-full"
        />

        {/* Gate Pass / Ownership Receipt */}
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          className="h-9 text-xs text-slate-700 hover:text-emerald-700 rounded-xl font-semibold"
          onClick={() => setReceiptModalOpen(true)}
        >
          <FileText className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Pass
        </Button>
      </div>

      {/* Safe Trade Locations Tip */}
      <div className="pt-0.5">
        <button
          type="button"
          onClick={() => setSafeZonesOpen(true)}
          className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center justify-center w-full gap-1 py-1 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Recommended CUSTECH Safe Meetup Spots</span>
        </button>
      </div>

      {/* Modals */}
      <BuyWithEscrowModal
        open={escrowModalOpen}
        onOpenChange={setEscrowModalOpen}
        listing={listing}
        seller={seller}
      />

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
  );
}
