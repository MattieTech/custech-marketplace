'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { VerificationGate } from '@/components/verification/verification-gate';
import { createServiceListing } from '@/app/dashboard/listings/actions';
import { toast } from '@/components/ui/toast';
import { MARKETPLACE_CATEGORIES } from '@/lib/constants';
import { 
  Briefcase, 
  Clock, 
  MapPin, 
  Coins, 
  UploadCloud, 
  X, 
  Loader2, 
  ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

const SERVICE_CATEGORIES = MARKETPLACE_CATEGORIES.filter(c => c.type === 'service');

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0]?.id || 'web-development');
  const [startingPrice, setStartingPrice] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('1-2 days');
  const [availability, setAvailability] = useState('available');
  const [location, setLocation] = useState('Campus Wide / Remote');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of filesArray) {
      if (images.length + validFiles.length >= 6) {
        toast.warning('You can only upload a maximum of 6 portfolio images.');
        break;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`File ${file.name} must be a JPG, PNG, or WEBP image.`);
        continue;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setImages(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...validPreviews]);
  };

  const removeFile = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a service title');
      return;
    }
    if (!description.trim()) {
      toast.error('Please describe what your service offers');
      return;
    }
    if (!startingPrice || Number(startingPrice) <= 0) {
      toast.error('Please specify a valid starting price');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('startingPrice', startingPrice);
      formData.append('deliveryTime', deliveryTime.trim() || '1-2 days');
      formData.append('availability', availability);
      formData.append('location', location.trim() || 'Campus Wide / Remote');

      images.forEach(imageFile => {
        formData.append('images', imageFile);
      });

      const res = await createServiceListing(formData);

      if (!res.success) {
        toast.error(res.error || 'Failed to publish freelance service');
        if (res.needsVerification) {
          setTimeout(() => {
            router.push('/dashboard/verification');
          }, 1500);
        }
        return;
      }

      toast.success('Service published successfully!', 'Listed');
      router.push('/services');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to list service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8 space-y-6">
        {/* Navigation & Header */}
        <div>
          <Link 
            href="/services" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Services
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Offer a Campus Service</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Offer your skills, repairs, tutoring, or creative craft to CUSTECH students.</p>
            </div>
          </div>
        </div>

        {/* Verification Gate Enforcing Verified-Only Access */}
        <VerificationGate type="services">
          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
            {/* Service Details */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                Service Details
              </h2>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Service Title *</label>
                <Input 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Professional Laptop Repair & Software Installation"
                  maxLength={100}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Service Category *</label>
                <Select value={category} onChange={(e: any) => setCategory(e.target.value)} className="w-full rounded-xl">
                  {SERVICE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Description & Scope *</label>
                <Textarea 
                  required 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Describe your skills, past experience, tools used, and what is included in your delivery..."
                  className="min-h-[130px] rounded-xl"
                  maxLength={3000}
                />
                <div className="text-xs text-slate-400 text-right mt-1">{description.length}/3000</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-500" />
                    Starting Price (₦) *
                  </label>
                  <Input 
                    required 
                    type="number" 
                    min="500"
                    value={startingPrice} 
                    onChange={e => setStartingPrice(e.target.value)} 
                    placeholder="e.g. 5000"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    Turnaround / Delivery Time *
                  </label>
                  <Input 
                    required 
                    value={deliveryTime} 
                    onChange={e => setDeliveryTime(e.target.value)} 
                    placeholder="e.g. Same Day / 24-48 Hours"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Availability Status</label>
                  <Select value={availability} onChange={(e: any) => setAvailability(e.target.value)} className="w-full rounded-xl">
                    <option value="available">Available Now</option>
                    <option value="busy">Busy / By Appointment Only</option>
                    <option value="away">Away / On Break</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Delivery Location / Coverage
                  </label>
                  <Input 
                    required 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    placeholder="e.g. Campus Wide, Male Hostel, or Remote"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Portfolio / Proof Images */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Work Samples & Portfolio Photos</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Upload up to 6 portfolio pictures, flyers, or completed jobs. Max 5MB each.</p>
                </div>
                <span className="text-xs font-medium text-slate-400">{images.length}/6 photos</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl border border-slate-200 bg-slate-50 overflow-hidden group shadow-sm">
                    <img src={preview} alt={`Work sample ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-white/90 hover:bg-white text-rose-600 rounded-full shadow-sm transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-slate-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                        Primary Cover
                      </span>
                    )}
                  </div>
                ))}

                {images.length < 6 && (
                  <label className="relative aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors p-3 text-center group">
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 mb-1.5 transition-colors" />
                    <span className="text-xs font-medium text-slate-600 group-hover:text-emerald-700">Add Sample</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/jpeg,image/png,image/webp" 
                      multiple 
                      onChange={handleFileChange} 
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px] rounded-xl shadow-sm shadow-emerald-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  'Publish Service'
                )}
              </Button>
            </div>
          </form>
        </VerificationGate>
      </div>
    </PageContainer>
  );
}
