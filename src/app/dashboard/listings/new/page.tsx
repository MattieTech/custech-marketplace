'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { MARKETPLACE_CATEGORIES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { VerificationGate } from '@/components/verification/verification-gate';
import { createMarketplaceListing } from '@/app/dashboard/listings/actions';

export default function CreateListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('New');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('product');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('categories').select('*').order('name');
        if (data && data.length > 0) {
          setDbCategories(data);
        }
      } catch (e) {
        console.error('Error fetching categories:', e);
      }
    }
    loadCategories();
  }, []);

  const handleEnhanceWithAI = async () => {
    if (!description.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'improve_description', text: description, title, category }),
      });
      const data = await res.json();
      if (data.result) {
        setDescription(data.result);
        toast.success('Description enhanced with AI!', 'Polished');
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Could not enhance description at this time');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 6) {
        toast.warning('Maximum 6 images allowed');
        return;
      }
      const validFiles = newFiles.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 5 * 1024 * 1024);
      setFiles(prev => [...prev, ...validFiles]);
      
      const newPreviews = validFiles.map(f => URL.createObjectURL(f));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('location', location);
      formData.append('listing_type', type);

      files.forEach((file) => {
        formData.append('images', file);
      });

      const res = await createMarketplaceListing(formData);

      if (!res.success) {
        toast.error(res.error || 'Failed to publish listing');
        if (res.needsVerification) {
          setTimeout(() => {
            router.push('/dashboard/verification');
          }, 1500);
        }
        return;
      }

      toast.success('Listing published successfully!', 'Published');
      router.push(`/marketplace/${res.listingId}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create a Listing</h1>
        
        <VerificationGate type="marketplace">
          <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-xl border">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <Input 
                required 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="What are you selling?"
                maxLength={100}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  disabled={isEnhancing || !description.trim()}
                  className="text-xs text-green-700 hover:text-green-800 font-medium flex items-center gap-1 disabled:opacity-40 transition-opacity"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isEnhancing ? 'Improving with AI...' : 'Enhance with AI'}
                </button>
              </div>
              <Textarea 
                required 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Describe your item in detail..."
                className="min-h-[120px]"
                maxLength={2000}
              />
              <div className="text-xs text-gray-500 text-right mt-1">{description.length}/2000</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type *</label>
                <Select value={type} onChange={(e: any) => setType(e.target.value)} className="w-full">
                  <option value="product">Product to Sell</option>
                  <option value="free">Free Item</option>
                  <option value="need">Request / I Need</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <Select required value={category} onChange={(e: any) => setCategory(e.target.value)} className="w-full">
                  <option value="">Select a category</option>
                  {(dbCategories.length > 0 ? dbCategories : MARKETPLACE_CATEGORIES).map(c => (
                    <option key={c.id} value={c.id}>{(c as any).name || (c as any).label}</option>
                  ))}
                </Select>
              </div>
            </div>

            {type === 'product' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label>
                  <Input 
                    required 
                    type="number" 
                    min="1"
                    value={price} 
                    onChange={e => setPrice(e.target.value)} 
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
                  <Select value={condition} onChange={(e: any) => setCondition(e.target.value)} className="w-full">
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </Select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <Input 
                required 
                value={location} 
                onChange={e => setLocation(e.target.value)} 
                placeholder="e.g. Male Hostel A, Library..."
              />
            </div>
          </div>

          <div className="border-t pt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Images</h3>
            <p className="text-sm text-gray-500 mb-4">Upload up to 6 images. First image will be the cover. Max 5MB per image.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg border bg-gray-50 overflow-hidden group">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {previews.length < 6 && (
                <label className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 bg-gray-50 hover:bg-green-50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <UploadCloud className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500 font-medium">Add Photo</span>
                  <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <div className="border-t pt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Publish Listing'}
            </Button>
          </div>
        </form>
        </VerificationGate>
      </div>
    </PageContainer>
  );
}
