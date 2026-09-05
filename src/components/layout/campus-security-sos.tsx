'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  ShieldAlert, 
  PhoneCall, 
  MapPin, 
  AlertTriangle, 
  HeartHandshake, 
  Ambulance, 
  UserCheck, 
  X,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toast'

export function CampusSecuritySOS() {
  const [open, setOpen] = useState(false)

  const emergencyContacts = [
    {
      title: 'CUSTECH Osara Main Gate Security Post',
      phone: '0800-CUSTECH-GATE (Ext. 01)',
      tel: 'tel:#',
      role: '24/7 Gate Patrol & Incident Dispatch',
      icon: ShieldAlert,
      color: 'text-red-600 bg-red-50',
    },
    {
      title: 'Campus Rapid Security Surveillance Unit',
      phone: '0800-CUSTECH-PATROL (Ext. 02)',
      tel: 'tel:#',
      role: 'Internal Campus Patrol & SUB Response',
      icon: PhoneCall,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'SUG Chief Security Officer (CSO)',
      phone: '0800-CUSTECH-SUG (Ext. 03)',
      tel: 'tel:#',
      role: 'Student Union Executive Security Desk',
      icon: UserCheck,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'CUSTECH Osara Health Center & Ambulance',
      phone: '0800-CUSTECH-CLINIC (Ext. 04)',
      tel: 'tel:#',
      role: 'Medical Emergency & First Aid Station',
      icon: Ambulance,
      color: 'text-green-600 bg-green-50',
    },
  ]

  return (
    <>
      {/* Floating SOS Action Button on bottom-left to avoid colliding with AI Support on bottom-right */}
      <aside 
        aria-label="Campus emergency assistance"
        className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-40"
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2.5 rounded-full shadow-lg hover:shadow-red-600/30 transition-all font-bold text-xs group"
          aria-label="Open CUSTECH Campus Emergency SOS"
        >
          <ShieldAlert className="w-4 h-4 animate-pulse text-white" />
          <span className="hidden sm:inline">Campus SOS</span>
        </button>
      </aside>

      {/* Emergency Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <ShieldAlert className="w-6 h-6 text-red-600" />
              <span>CUSTECH Emergency Dispatch</span>
            </div>
            <DialogTitle className="text-xl">Campus Security &amp; Safety Desk</DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              Confluence University of Science and Technology, Osara campus emergency hotlines and incident reporting.
            </DialogDescription>
          </DialogHeader>

          {/* Immediate Help Notice */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex gap-3 text-xs text-red-900">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-red-900 mb-0.5">In Immediate Danger on Campus?</strong>
              Call the Osara Main Gate Security Post immediately or proceed to the Student Union Building (SUB) security station.
            </div>
          </div>

          {/* Contacts List with One-Touch Calling */}
          <div className="space-y-2.5 mt-1">
            {emergencyContacts.map((contact, idx) => {
              const Icon = contact.icon
              return (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-gray-300 bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${contact.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{contact.title}</h4>
                      <p className="text-[11px] text-gray-500">{contact.role}</p>
                      <span className="text-xs font-mono font-bold text-gray-800">{contact.phone}</span>
                    </div>
                  </div>

                  <Button 
                    type="button"
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 px-3"
                    onClick={() => {
                      toast.info(`Extension line ${contact.phone} is configured for official CUSTECH Security PBX upon production deployment. For urgent on-campus help, visit Osara Main Gate post.`, 'Campus Security Line');
                    }}
                  >
                    <PhoneCall className="w-3.5 h-3.5 mr-1" />
                    Connect
                  </Button>
                </div>
              )
            })}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-[11px] text-gray-600 text-center">
            <strong>Deployment Note:</strong> Emergency extensions above are configured as placeholders to be linked to the university PBX telecom infrastructure by CUSTECH security administration.
          </div>

          {/* Report Suspicious Person Quick Action */}
          <div className="border-t border-gray-200 pt-3 flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full text-xs font-semibold justify-center">
              <Link href="/scam-check" onClick={() => setOpen(false)}>
                Run CUSTECH Interactive Scam Check
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full text-xs font-semibold justify-center text-red-700 border-red-200 hover:bg-red-50">
              <Link href="/safety" onClick={() => setOpen(false)}>
                View Official CUSTECH Campus Safety Guidelines
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
