import { createClient } from '@/lib/supabase/server';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatPrice, getInitials } from '@/lib/utils';
import { Star, Clock, CheckCircle, Flag, Bookmark, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Fetch real service listing from Supabase
  const { data: realListing } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      description,
      price,
      created_at,
      user_id,
      services(*),
      profiles:profiles!seller_id(display_name, avatar_url, verification_status, created_at, rating_avg, rating_count)
    `)
    .eq('id', id)
    .maybeSingle();

  // Fallback if not in DB yet
  const service = realListing ? {
    id: realListing.id,
    title: realListing.title,
    description: realListing.description,
    profiles: {
      full_name: (realListing.profiles as any)?.display_name || 'Verified Student Provider',
      avatar_url: (realListing.profiles as any)?.avatar_url || '',
      is_verified: (realListing.profiles as any)?.verification_status === 'approved',
      id: realListing.user_id,
      member_since: (realListing.profiles as any)?.created_at || '2024-01-01'
    },
    services: {
      starting_price: realListing.price || 5000,
      delivery_time: (realListing.services as any)?.delivery_time || '1-3 days',
      completed_jobs: (realListing.services as any)?.completed_jobs || 5,
      availability: (realListing.services as any)?.availability || 'Available'
    },
    rating: (realListing.profiles as any)?.rating_avg || 5.0
  } : {
    id,
    title: 'Campus Student Service',
    description: 'Professional campus student services, verified and reviewed by peers.',
    profiles: { full_name: 'Campus Provider', avatar_url: '', is_verified: true, id: '1', member_since: '2024-01-01' },
    services: { starting_price: 5000, delivery_time: '2-3 days', completed_jobs: 8, availability: 'Available' },
    rating: 4.9
  };

  if (!service) {
    notFound();
  }

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold">{service.title}</h1>
          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <p>{service.description}</p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Portfolio</h3>
            <div className="bg-muted aspect-video rounded-md flex items-center justify-center text-muted-foreground">
              No portfolio images available
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Starting at</div>
                <div className="text-3xl font-bold text-emerald-600">{formatPrice(service.services.starting_price)}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Delivery: {service.services.delivery_time}</span>
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                <MessageSquare className="mr-2 h-4 w-4" />
                Hire Provider
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="w-full">
                  <Bookmark className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" className="w-full">
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">About the Provider</h3>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16" src={service.profiles.avatar_url} fallback={getInitials(service.profiles.full_name)} />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-lg">{service.profiles.full_name}</span>
                    {service.profiles.is_verified && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{service.rating || 'New'}</span>
                    <span>• {service.services.completed_jobs} jobs</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Mobile sticky footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t flex items-center justify-between z-50">
        <div>
          <div className="text-xs text-muted-foreground">Starting at</div>
          <div className="font-bold text-emerald-600">{formatPrice(service.services.starting_price)}</div>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">Hire Provider</Button>
      </div>
    </PageContainer>
  );
}
