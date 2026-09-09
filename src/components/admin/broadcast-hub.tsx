'use client';

import { useState } from 'react';
import { 
  Megaphone, Send, Eye, Smartphone, Monitor, Sparkles, 
  CheckCircle2, Users, ShieldCheck, ShoppingBag, AlertCircle, 
  Loader2, MailCheck, RefreshCw, Plus, Trash2, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { PRESET_EMAIL_CAMPAIGNS, CampaignTemplate } from '@/lib/email-templates';
import { 
  BroadcastStats, TargetAudience, 
  sendTestBroadcastAction, sendLiveBroadcastAction 
} from '@/app/admin/broadcast/actions';

interface BroadcastHubProps {
  initialStats: BroadcastStats;
  adminEmail: string;
}

export function BroadcastHub({ initialStats, adminEmail }: BroadcastHubProps) {
  const [stats] = useState<BroadcastStats>(initialStats);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(PRESET_EMAIL_CAMPAIGNS[0].id);
  const [campaign, setCampaign] = useState<CampaignTemplate>(PRESET_EMAIL_CAMPAIGNS[0]);
  const [audience, setAudience] = useState<TargetAudience>('all');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  
  // Sending states
  const [testEmail, setTestEmail] = useState(adminEmail);
  const [sendingTest, setSendingTest] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load a preset template
  const handleSelectPreset = (preset: CampaignTemplate) => {
    setSelectedTemplateId(preset.id);
    setCampaign({ ...preset });
    toast.success(`Loaded "${preset.name}" template!`);
  };

  // Body paragraphs helper
  const handleBodyChange = (text: string) => {
    const paragraphs = text.split('\n\n').map(p => p.trim()).filter(Boolean);
    setCampaign(prev => ({ ...prev, bodyParagraphs: paragraphs }));
  };

  // Bullet point helpers
  const handleAddBullet = () => {
    setCampaign(prev => ({
      ...prev,
      bulletPoints: [...prev.bulletPoints, 'New highlighted feature or offer']
    }));
  };

  const handleUpdateBullet = (index: number, val: string) => {
    setCampaign(prev => {
      const copy = [...prev.bulletPoints];
      copy[index] = val;
      return { ...prev, bulletPoints: copy };
    });
  };

  const handleRemoveBullet = (index: number) => {
    setCampaign(prev => ({
      ...prev,
      bulletPoints: prev.bulletPoints.filter((_, i) => i !== index)
    }));
  };

  // Send Test Email
  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email to receive the test.');
      return;
    }

    setSendingTest(true);
    try {
      const res = await sendTestBroadcastAction({
        campaign,
        testEmail,
      });

      if (res.success) {
        toast.success(`Test email dispatched to ${testEmail}! Check your inbox.`);
      } else {
        toast.error(res.error || 'Failed to send test email.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error sending test email.');
    } finally {
      setSendingTest(false);
    }
  };

  // Live Broadcast to All Users
  const handleSendBroadcast = async () => {
    setShowConfirmModal(false);
    setBroadcasting(true);
    setBroadcastResult(null);

    try {
      const res = await sendLiveBroadcastAction({
        campaign,
        audience,
      });

      if (res.success) {
        setBroadcastResult(res);
        toast.success(`Broadcast finished! Sent ${res.sent} emails.`);
      } else {
        toast.error(res.error || 'Broadcast failed.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error executing broadcast.');
    } finally {
      setBroadcasting(false);
    }
  };

  const audienceTargetCount = 
    audience === 'verified' ? stats.verifiedUsers :
    audience === 'unverified' ? stats.unverifiedUsers :
    audience === 'sellers' ? stats.sellersCount : stats.totalUsers;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Audience Counter */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1.5">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Campus Marketing Automation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Email Broadcast & Promotions Hub
          </h1>
          <p className="text-sm text-slate-500">
            Send engaging, funny, or pidgin promotional updates via Resend to encourage buying, selling, and hostel booking.
          </p>
        </div>

        {/* Audience Stat Badges */}
        <div className="flex flex-wrap gap-2.5">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400">Total Users</div>
              <div className="text-base font-black text-slate-900">{stats.totalUsers}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400">Verified</div>
              <div className="text-base font-black text-slate-900">{stats.verifiedUsers}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400">Unverified</div>
              <div className="text-base font-black text-slate-900">{stats.unverifiedUsers}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-400">Sellers</div>
              <div className="text-base font-black text-slate-900">{stats.sellersCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Result Banner if completed */}
      {broadcastResult && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-bold text-emerald-950">Broadcast Completed Successfully!</h3>
            <p className="text-xs text-emerald-800">
              Dispatched <strong>{broadcastResult.sent}</strong> emails via Resend to <strong>{audience}</strong> users.
              {broadcastResult.failed > 0 && ` (${broadcastResult.failed} failed/unsubscribed).`}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setBroadcastResult(null)}
            className="text-emerald-700 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Step 1: Pick a Ready-to-Send Template */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-black">1</span>
            <span>Choose Ready-Made Campus Template (or customize)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {PRESET_EMAIL_CAMPAIGNS.map((preset) => {
            const isSelected = selectedTemplateId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 text-left relative flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-emerald-50/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant={isSelected ? 'default' : 'secondary'} className={isSelected ? 'bg-emerald-600' : ''}>
                      {preset.tag}
                    </Badge>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug pt-1">
                    {preset.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] font-medium text-emerald-700 flex items-center justify-between">
                  <span>Subject: "{preset.subject.substring(0, 32)}..."</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Editor & Live Preview (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Edit Email Details */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="rounded-3xl border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>Customize Campaign Content</span>
                <span className="text-xs font-normal text-slate-400">Live preview on the right</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Edit the Nigerian pidgin humor, headline, offers, and calls-to-action.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              {/* Subject Line */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Subject Line (What students see in their notification bar)
                </label>
                <Input
                  value={campaign.subject}
                  onChange={(e) => setCampaign(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. Omo, who dey sell cheap iPhone for campus? 👀"
                  className="rounded-xl font-medium"
                />
              </div>

              {/* Preview Preheader */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Preview Text (Snippet shown next to subject)
                </label>
                <Input
                  value={campaign.previewText}
                  onChange={(e) => setCampaign(prev => ({ ...prev, previewText: e.target.value }))}
                  placeholder="e.g. Fresh verified deals just dropped on campus..."
                  className="rounded-xl"
                />
              </div>

              {/* Badge & Headline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Top Badge</label>
                  <Input
                    value={campaign.badge}
                    onChange={(e) => setCampaign(prev => ({ ...prev, badge: e.target.value }))}
                    placeholder="🔥 HOT DEALS"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Main Headline</label>
                  <Input
                    value={campaign.headline}
                    onChange={(e) => setCampaign(prev => ({ ...prev, headline: e.target.value }))}
                    placeholder="Headline inside email"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Body Paragraphs */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Body Message (Separate paragraphs with double Enter)
                </label>
                <textarea
                  rows={6}
                  value={campaign.bodyParagraphs.join('\n\n')}
                  onChange={(e) => handleBodyChange(e.target.value)}
                  placeholder="Write the message here..."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Key Bullet Highlights */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Highlighted Deals / Bullet Points
                  </label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddBullet}
                    className="h-7 text-xs rounded-lg text-emerald-700"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Bullet
                  </Button>
                </div>
                <div className="space-y-2">
                  {campaign.bulletPoints.map((bullet, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={bullet}
                        onChange={(e) => handleUpdateBullet(i, e.target.value)}
                        className="h-9 text-xs rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveBullet(i)}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons (Primary & Secondary) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Primary Button Text</label>
                  <Input
                    value={campaign.ctaText}
                    onChange={(e) => setCampaign(prev => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="e.g. Check Deals Now →"
                    className="rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Primary Destination</label>
                  <Input
                    value={campaign.ctaUrl}
                    onChange={(e) => setCampaign(prev => ({ ...prev, ctaUrl: e.target.value }))}
                    placeholder="/marketplace"
                    className="rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              {/* Target Audience Selector */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Recipient Audience
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setAudience('all')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      audience === 'all' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All ({stats.totalUsers})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudience('unverified')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      audience === 'unverified' 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Unverified ({stats.unverifiedUsers})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudience('verified')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      audience === 'verified' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Verified ({stats.verifiedUsers})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudience('sellers')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                      audience === 'sellers' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Sellers ({stats.sellersCount})
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Preview & Action Controls */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="rounded-3xl border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
            <CardHeader className="bg-slate-900 text-white pb-3 pt-4 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <CardTitle className="text-sm font-bold text-white">Live Email Preview</CardTitle>
                </div>
                <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      previewDevice === 'desktop' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      previewDevice === 'mobile' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-1">
                Subject: <span className="text-slate-200 font-semibold">{campaign.subject}</span>
              </p>
            </CardHeader>

            {/* Rendered Email Visual Preview */}
            <CardContent className="p-4 sm:p-6 bg-slate-100/90 flex-1 overflow-y-auto max-h-[600px] flex justify-center">
              <div className={`bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden transition-all duration-300 ${
                previewDevice === 'mobile' ? 'w-[360px] text-xs' : 'w-full max-w-[540px]'
              }`}>
                {/* Header */}
                <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white p-6 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[10px] font-black uppercase tracking-wider mb-2">
                    {campaign.badge}
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                    {campaign.headline}
                  </h2>
                  <p className="text-[11px] text-emerald-200 mt-1">
                    Confluence University (CUSTECH) Official Marketplace
                  </p>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 space-y-3.5 text-slate-700">
                  <div className="text-sm font-extrabold text-emerald-800">
                    Hey Student Scholar 👋,
                  </div>

                  {campaign.bodyParagraphs.map((para, i) => (
                    <p key={i} className="text-xs sm:text-sm leading-relaxed text-slate-600">
                      {para}
                    </p>
                  ))}

                  {/* Highlights box */}
                  {campaign.bulletPoints.length > 0 && (
                    <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 my-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-900 mb-2">
                        ⭐ What's Popping Right Now:
                      </div>
                      <ul className="space-y-1.5">
                        {campaign.bulletPoints.map((item, i) => (
                          <li key={i} className="text-xs font-semibold text-emerald-950 flex items-start gap-1.5">
                            <span className="text-emerald-600">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Button */}
                  <div className="text-center pt-3 pb-2 space-y-2">
                    <div className="inline-block px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer">
                      {campaign.ctaText}
                    </div>
                    {campaign.secondaryCtaText && (
                      <div>
                        <span className="text-xs font-semibold text-emerald-700 underline cursor-pointer">
                          {campaign.secondaryCtaText} →
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Safety note */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[10.5px] text-amber-900 leading-snug">
                    🛡️ <strong>Safety Rule:</strong> Always inspect items and keys in daylight public campus safe zones before transfer.
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-100 p-4 text-center text-[10px] text-slate-400">
                  Sent to CUSTECH student members • Osara, Kogi State
                </div>
              </div>
            </CardContent>

            {/* Dispatch Action Footer */}
            <div className="p-4 bg-white border-t border-slate-200 space-y-3">
              {/* Test Email Row */}
              <div className="flex items-center gap-2">
                <Input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Your admin email for testing"
                  className="text-xs rounded-xl h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendTest}
                  disabled={sendingTest || broadcasting}
                  className="h-9 px-3 shrink-0 rounded-xl text-xs font-bold border-slate-300 hover:bg-slate-50"
                >
                  {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <MailCheck className="w-3.5 h-3.5 mr-1" />}
                  Send Test
                </Button>
              </div>

              {/* Main Broadcast Trigger */}
              <Button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={broadcasting || sendingTest}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md text-sm transition-all"
              >
                {broadcasting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Broadcasting via Resend to {audienceTargetCount} Students...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Broadcast to {audience.toUpperCase()} ({audienceTargetCount} Students)
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Megaphone className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Confirm Email Broadcast</h3>
              <p className="text-xs text-slate-500">
                You are about to send this promotional email via <strong>Resend</strong> to:
              </p>
              <div className="text-sm font-bold text-emerald-700 pt-1">
                {audienceTargetCount} {audience.toUpperCase()} Students/Users
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="font-semibold text-slate-800 truncate">
                Subject: {campaign.subject}
              </div>
              <div className="text-slate-500 text-[11px]">
                Template: {campaign.name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendBroadcast}
                className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Yes, Send Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
