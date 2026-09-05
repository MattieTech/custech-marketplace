'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { VerificationGate } from '@/components/verification/verification-gate';
import { createHousingListing } from '@/app/dashboard/listings/actions';
import { toast } from '@/components/ui/toast';
import { 
  Building2, 
  Home, 
  MapPin, 
  Zap, 
  Droplets, 
  UploadCloud, 
  X, 
  Loader2, 
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('self_contained');
  const [rent, setRent] = useState('');
  const [distance, setDistance] = useState('');
  const [location, setLocation] = useState('');
  const [electricityType, setElectricityType] = useState('NEPA + Generator');
  const [waterSource, setWaterSource] = useState('Borehole Running Water');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of filesArray) {
      if (images.length + validFiles.length >= 6) {
        toast.warning('You can only upload a maximum of 6 images.');
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
      toast.error('Please enter a property title');
      return;
    }
    if (!description.trim()) {
      toast.error('Please provide property details');
      return;
    }
    if (!rent || Number(rent) <= 0) {
      toast.error('Please specify a valid rent amount');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('propertyType', propertyType);
      formData.append('rent', rent);
      formData.append('distance', distance.trim() || 'Near Campus Gate');
      formData.append('location', location.trim() || 'Off-Campus CUSTECH');
      formData.append('electricityType', electricityType);
      formData.append('waterSource', waterSource);

      images.forEach(imageFile => {
        formData.append('images', imageFile);
      });

      const res = await createHousingListing(formData);

      if (!res.success) {
        toast.error(res.error || 'Failed to publish accommodation listing');
        if (res.needsVerification) {
          setTimeout(() => {
            router.push('/dashboard/verification');
          }, 1500);
        }
        return;
      }

      toast.success('Property published successfully!', 'Listed');
      router.push('/housing');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to list property. Please try again.');
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
            href="/housing" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Housing
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">List an Accommodation</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Post verified student housing or hostel rooms for the CUSTECH community.</p>
            </div>
          </div>
        </div>

        {/* Verification Gate Enforcing Verified-Only Access */}
        <VerificationGate type="housing">
          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Home className="w-4 h-4 text-emerald-600" />
                Property Information
              </h2>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Property Title *</label>
                <Input 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Spacious Self-Contained Flat near Campus Gate"
                  maxLength={120}
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Description *</label>
                <Textarea 
                  required 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Describe rooms, amenities, security, environment, and landlord terms in detail..."
                  className="min-h-[130px] rounded-xl"
                  maxLength={3000}
                />
                <div className="text-xs text-slate-400 text-right mt-1">{description.length}/3000</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Property Type *</label>
                  <Select value={propertyType} onChange={(e: any) => setPropertyType(e.target.value)} className="w-full rounded-xl">
                    <option value="self_contained">Self-Contained Room</option>
                    <option value="single_room">Single Room</option>
                    <option value="flat">One-Bedroom Flat</option>
                    <option value="shared_room">Shared Bedspace</option>
                    <option value="hostel_bedspace">Student Hostel Block</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Rent per Year (₦) *</label>
                  <Input 
                    required 
                    type="number" 
                    min="1000"
                    value={rent} 
                    onChange={e => setRent(e.target.value)} 
                    placeholder="e.g. 150000"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Location & Amenities */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Location & Utilities
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Address / Campus Area *</label>
                  <Input 
                    required 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    placeholder="e.g. Phase 2, Behind Tech Hostel"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Distance to Campus *</label>
                  <Input 
                    required 
                    value={distance} 
                    onChange={e => setDistance(e.target.value)} 
                    placeholder="e.g. 5 mins walk to Main Gate"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Electricity Setup
                  </label>
                  <Select value={electricityType} onChange={(e: any) => setElectricityType(e.target.value)} className="w-full rounded-xl">
                    <option value="NEPA + Generator">NEPA + Generator</option>
                    <option value="NEPA (24/7 Grid)">NEPA (Dedicated Line)</option>
                    <option value="NEPA + Solar Inverter">NEPA + Solar Inverter</option>
                    <option value="Prepaid Meter">Personal Prepaid Meter</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" />
                    Water Supply
                  </label>
                  <Select value={waterSource} onChange={(e: any) => setWaterSource(e.target.value)} className="w-full rounded-xl">
                    <option value="Borehole Running Water">Borehole Running Water</option>
                    <option value="Overhead Storage Tank">Overhead Tank System</option>
                    <option value="Well Water with Treatment">Well Water + Treatment</option>
                    <option value="Public Supply">Public Water Line</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Accommodation Photos</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Upload up to 6 clear photos of the room, bathroom, and building compound. Max 5MB each.</p>
                </div>
                <span className="text-xs font-medium text-slate-400">{images.length}/6 photos</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative aspect-video rounded-xl border border-slate-200 bg-slate-50 overflow-hidden group shadow-sm">
                    <img src={preview} alt={`Property photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-white/90 hover:bg-white text-rose-600 rounded-full shadow-sm transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-slate-900/80 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                        Cover Photo
                      </span>
                    )}
                  </div>
                ))}

                {images.length < 6 && (
                  <label className="relative aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 flex flex-col items-center justify-center cursor-pointer transition-colors p-3 text-center group">
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 mb-1.5 transition-colors" />
                    <span className="text-xs font-medium text-slate-600 group-hover:text-emerald-700">Add Photo</span>
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
                  'Publish Property'
                )}
              </Button>
            </div>
          </form>
        </VerificationGate>
      </div>
    </PageContainer>
  );
}
