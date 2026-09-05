'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/toast';

export function DeleteListingButton({ listingId, listingTitle }: { listingId: string; listingTitle?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete "${listingTitle || 'this listing'}"? This action cannot be undone.`);
    if (!confirmed) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('listings').delete().eq('id', listingId);
      if (error) throw error;

      toast.success('Listing deleted successfully', 'Deleted');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleDelete}
      disabled={loading}
      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
      title="Delete Listing"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
    </Button>
  );
}
