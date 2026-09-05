'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { MARKETPLACE_CATEGORIES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Trash2 } from 'lucide-react';
import { CustechLogoLoader } from '@/components/ui/custech-loader';
import { toast } from '@/components/ui/toast';

export default function EditListingPage() {
  const router = useRouter();
  const routeParams = useParams();
  const id = routeParams?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('Good');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('active');
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      if (!id) return;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const [catRes, listingRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('listings').select('*').eq('id', id).single()
      ]);

      if (catRes.data) setDbCategories(catRes.data);

      const listing = listingRes.data;
      if (listingRes.error || !listing || (user && listing.seller_id !== user.id && listing.user_id !== user.id)) {
        toast.error('Listing not found or you do not have permission to edit it');
        router.push('/dashboard/listings');
        return;
      }

      setTitle(listing.title);
      setDescription(listing.description);
      setPrice((listing.price / 100).toString());
      setCategory(listing.category_id || '');
      
      const conditionReverseMap: Record<string, string> = {
        'new': 'New',
        'like_new': 'Like New',
        'good': 'Good',
        'fair': 'Fair',
        'poor': 'Poor'
      };
      setCondition(conditionReverseMap[listing.condition] || listing.condition || 'Good');
      setLocation(listing.location || '');
      setStatus(listing.status);
      setLoading(false);
    }
    init();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    
    // Resolve Category ID
    let resolvedCategoryId: string | null = null;
    if (category) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        resolvedCategoryId = category;
      } else {
        const { data: catData } = await supabase.from('categories').select('id').eq('slug', category).maybeSingle();
        resolvedCategoryId = catData?.id || null;
      }
    }

    const conditionMap: Record<string, string> = {
      'New': 'new',
      'Like New': 'like_new',
      'Good': 'good',
      'Fair': 'fair',
      'Poor': 'poor',
    };
    const resolvedCondition = conditionMap[condition] || condition.toLowerCase();

    const { error } = await supabase.from('listings').update({
      title,
      description,
      price: parseInt(price || '0') * 100,
      category_id: resolvedCategoryId,
      condition: resolvedCondition,
      location
    }).eq('id', id);

    setSaving(false);
    if (error) {
      toast.error(error.message || 'Failed to update listing');
    } else {
      toast.success('Listing updated successfully!');
      router.push(`/dashboard/listings`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('listings').delete().eq('id', id);
    if (error) {
      toast.error(error.message || 'Failed to delete listing');
    } else {
      toast.success('Listing deleted successfully');
      router.push('/dashboard/listings');
    }
  };

  const updateStatus = async (newStatus: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setStatus(newStatus);
      toast.success(`Listing marked as ${newStatus}`);
    } else {
      toast.error('Failed to change listing status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center py-20">
        <CustechLogoLoader mode="in-app" size="md" message="Loading listing details..." />
      </div>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Listing</h1>
          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-xl border mb-6 flex gap-4">
          <Button 
            variant={status === 'active' ? 'default' : 'outline'} 
            className={status === 'active' ? 'bg-green-600 text-white' : ''}
            onClick={() => updateStatus('active')}
          >
            Active
          </Button>
          <Button 
            variant={status === 'reserved' ? 'default' : 'outline'}
            className={status === 'reserved' ? 'bg-yellow-600 text-white' : ''}
            onClick={() => updateStatus('reserved')}
          >
            Reserved
          </Button>
          <Button 
            variant={status === 'sold' ? 'default' : 'outline'}
            className={status === 'sold' ? 'bg-gray-600 text-white' : ''}
            onClick={() => updateStatus('sold')}
          >
            Sold
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-xl border">
          {/* Form fields same as create, simplified for edit */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <Input required value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <Textarea required value={description} onChange={e => setDescription(e.target.value)} className="min-h-[120px]" maxLength={2000} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦) *</label>
                <Input required type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <Select required value={category} onChange={(e: any) => setCategory(e.target.value)} className="w-full">
                  <option value="">Select a category</option>
                  {(dbCategories.length > 0 ? dbCategories : MARKETPLACE_CATEGORIES).map(c => <option key={c.id} value={c.id}>{(c as any).name || (c as any).label}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <Input required value={location} onChange={e => setLocation(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t pt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
