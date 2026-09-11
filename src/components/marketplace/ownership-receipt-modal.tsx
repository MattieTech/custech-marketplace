'use client'

import React, { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Printer, Download, CheckCircle, FileText, School, AlertCircle } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { BRAND_NAME } from '@/lib/constants'

interface OwnershipReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: {
    id: string
    title: string
    price: number
    category?: string
  }
  seller: {
    display_name: string
    matric_number?: string
    department?: string
    phone?: string
  }
  buyerName?: string
  serialNumber?: string
  location?: string
  isConfirmed?: boolean
}

export function OwnershipReceiptModal({
  open,
  onOpenChange,
  listing,
  seller,
  buyerName = 'Current Student Buyer',
  serialNumber = 'N/A',
  location = 'CUSTECH Campus, Osara',
  isConfirmed = false,
}: OwnershipReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const certId = `CST-GATE-${listing.id.substring(0, 8).toUpperCase()}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[95vh] overflow-y-auto print:p-0 print:max-w-none">
        <DialogHeader className="print:hidden">
          <div className="flex items-center gap-2 text-green-700 font-bold">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span>Campus Gate Pass & Bill of Sale</span>
          </div>
          <DialogTitle className="text-xl">Transfer of Ownership Receipt</DialogTitle>
          <DialogDescription className="text-xs text-gray-600">
            Show this digital certificate to CUSTECH campus security guards at university gates and hostel checkpoints as verified proof of purchase.
          </DialogDescription>
        </DialogHeader>

        {/* The Printable Certificate Container */}
        <div 
          ref={receiptRef}
          className="border-2 border-green-800/80 rounded-xl p-6 bg-white space-y-5 text-gray-900 shadow-sm relative overflow-hidden print:border-none print:shadow-none print:p-0"
        >
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none text-7xl font-extrabold text-green-900 uppercase transform -rotate-12">
            CUSTECH VERIFIED
          </div>

          {/* Certificate Header */}
          <div className="text-center pb-4 border-b border-gray-200">
            <div className="inline-flex items-center justify-center gap-2 mb-1">
              <School className="w-6 h-6 text-green-700" />
              <span className="text-xs font-bold uppercase tracking-widest text-green-800">
                {BRAND_NAME || 'CUSTECH Marketplace'}
              </span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-gray-900 uppercase">
              Student Bill of Sale & Gate Clearance Pass
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Confluence University of Science and Technology, Osara, Kogi State
            </p>
            <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold ${
              isConfirmed 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Certificate No: {certId} • {isConfirmed ? 'OFFICIAL VERIFIED' : 'DRAFT PREVIEW'}</span>
            </div>
          </div>

          {/* Item Specifics */}
          <div className="bg-gray-50/80 rounded-lg p-3.5 space-y-2 text-xs border border-gray-100">
            <div className="flex justify-between py-0.5 border-b border-gray-200/60">
              <span className="text-gray-500 font-medium">Transferred Item:</span>
              <span className="font-bold text-gray-900">{listing.title}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-gray-200/60">
              <span className="text-gray-500 font-medium">Agreed Purchase Price:</span>
              <span className="font-bold text-green-700">{formatPrice(listing.price)}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-gray-200/60">
              <span className="text-gray-500 font-medium">Serial / IMEI / Model No:</span>
              <span className="font-mono text-gray-800">{serialNumber}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-gray-500 font-medium">Date & Meetup Spot:</span>
              <span className="text-gray-800">{formatDate(new Date().toISOString())} • {location}</span>
            </div>
          </div>

          {/* Party Credentials */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="border border-gray-200 rounded-lg p-3 space-y-1 bg-white">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Original Owner (Seller)</span>
              <p className="font-bold text-gray-900">{seller.display_name}</p>
              <p className="text-gray-500">Matric: {seller.matric_number || 'Verified Student'}</p>
              <p className="text-gray-500">{seller.department || 'CUSTECH'}</p>
              <div className="pt-2 flex items-center gap-1 text-[10px] text-green-700 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Ownership Relinquished
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 space-y-1 bg-white">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">New Owner (Buyer)</span>
              <p className="font-bold text-gray-900">{buyerName}</p>
              <p className="text-gray-500">Authorized CUSTECH Recipient</p>
              <p className="text-gray-500">Payment Confirmed</p>
              <div className="pt-2 flex items-center gap-1 text-[10px] text-green-700 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Legitimate Possession
              </div>
            </div>
          </div>

          {/* Gate Security Notice */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1 text-amber-900">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" /> Notice to CUSTECH Campus Security & Gate Officers:
            </span>
            <p className="text-amber-800 leading-snug">
              This document serves as proof of legitimate second-hand transfer between registered university students on CUSTECH Marketplace. The buyer named above is the rightful owner of this item and is authorized to transport it through campus checkpoints.
            </p>
          </div>
        </div>

        {/* Action Controls (Hidden in Print) */}
        <div className="flex gap-2 pt-2 print:hidden">
          <Button 
            type="button" 
            onClick={handlePrint}
            className="flex-1 bg-green-700 hover:bg-green-800 text-white font-medium"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print / Save Receipt as PDF
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
