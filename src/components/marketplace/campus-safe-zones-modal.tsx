'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ShieldCheck, MapPin, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface CampusSafeZonesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CampusSafeZonesModal({ open, onOpenChange }: CampusSafeZonesModalProps) {
  const safeSpots = [
    {
      name: 'Student Union Building (SUB) Foyer',
      area: 'Main Campus Center',
      timing: '8:00 AM - 6:00 PM',
      description: 'High student traffic, monitored lighting, and central seating areas.',
    },
    {
      name: 'CUSTECH Central Library Entrance',
      area: 'Academic Quad',
      timing: '9:00 AM - 5:00 PM',
      description: 'Quiet, secure area with campus security personnel regularly stationed nearby.',
    },
    {
      name: 'University Main Gate Security Hub',
      area: 'Campus Entrance, Osara',
      timing: 'Daylight hours (8:00 AM - 6:00 PM)',
      description: 'Best spot for off-campus buyers and sellers. Direct visibility from campus security post.',
    },
    {
      name: 'Faculty of Engineering / Computing Foyer',
      area: 'Science Complex',
      timing: '8:30 AM - 5:30 PM',
      description: 'Great for testing laptops, phones, gadgets, and textbooks near lecture halls.',
    },
    {
      name: 'Campus Commercial Center & Cafeteria',
      area: 'Student Village',
      timing: '9:00 AM - 7:00 PM',
      description: 'Public dining and retail environment where transactions can be conducted openly.',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-green-700 font-bold mb-1">
            <ShieldCheck className="w-6 h-6 text-green-600" />
            <span>CUSTECH Safe Trade Zones</span>
          </div>
          <DialogTitle className="text-xl">Official Campus Meetup Spots</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            For maximum safety, always arrange to inspect items and make direct payments at these designated high-traffic CUSTECH locations.
          </DialogDescription>
        </DialogHeader>

        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex gap-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-amber-800 mb-0.5">Campus Security Rule:</span>
            Never meet strangers in secluded lodge rooms, unlit areas, or bush pathways. Trade only in daylight inside active campus spots.
          </div>
        </div>

        {/* Safe Locations List */}
        <div className="space-y-3 mt-2">
          {safeSpots.map((spot, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-3.5 hover:border-green-300 transition-colors bg-white">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {spot.name}
                </h4>
                <span className="text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {spot.area}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{spot.description}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Recommended: {spot.timing}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 3 Safety Commandments */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-xs space-y-2 mt-2">
          <div className="font-semibold text-gray-900">Before sending money directly:</div>
          <div className="flex items-start gap-2 text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Hold and inspect the product in your hands.</span>
          </div>
          <div className="flex items-start gap-2 text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Verify electronics power on and account passwords are removed.</span>
          </div>
          <div className="flex items-start gap-2 text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Confirm seller identity on their CUSTECH Marketplace profile.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
