import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatPrice, getInitials } from '@/lib/utils';
import { MapPin, ShieldCheck, Flag, Phone, Calendar, Info } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch real property from Supabase
  const { data: realProperty } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      description,
      price,
      location,
      created_at,
      user_id,
      properties(*),
      images:listing_images(url),
      profiles:profiles!seller_id(display_name, avatar_url, verification_status)
    `)
    .eq('id', id)
    .maybeSingle();

  const prop = realProperty ? {
    title: realProperty.title,
    description: realProperty.description,
    images: realProperty.images?.map((img: any) => img.url) || [],
    properties: {
      property_type: (realProperty.properties as any)?.property_type?.replace('_', ' ') || 'Hostel Room',
      rent: realProperty.price || (realProperty.properties as any)?.rent_per_year || 150000,
      rooms: 1,
      distance: (realProperty.properties as any)?.distance_to_campus || 'Near Campus',
      amenities: ['Water', 'Electricity', 'Security'],
      availability_date: 'Available Now'
    },
    profiles: {
      full_name: (realProperty.profiles as any)?.display_name || 'Hostel Manager / Student',
      is_verified: (realProperty.profiles as any)?.verification_status === 'approved',
      avatar_url: (realProperty.profiles as any)?.avatar_url || ''
    }
  } : {
    title: 'Self-Contained Room near Main Gate',
    description: 'A spacious self-contained room with running water and security.',
    images: [],
    properties: { property_type: 'Self-Contained', rent: 150000, rooms: 1, distance: '5 mins walk', amenities: ['Water', 'Security', 'Electricity'], availability_date: 'Available Now' },
    profiles: { full_name: 'Campus Hostel Agent', is_verified: true, avatar_url: '' }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="aspect-[21/9] bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
          Image Gallery
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge className="mb-2">{prop.properties.property_type}</Badge>
              <h1 className="text-3xl font-bold">{prop.title}</h1>
              <div className="text-3xl font-bold text-emerald-600 mt-2">
                {formatPrice(prop.properties.rent)} <span className="text-lg font-normal text-muted-foreground">/yr</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{prop.properties.distance}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{prop.properties.availability_date}</span>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p>{prop.description}</p>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {prop.properties.amenities.map(a => (
                  <Badge key={a} variant="secondary">{a}</Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-lg">Contact Landlord</h3>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12" src={prop.profiles.avatar_url} fallback={getInitials(prop.profiles.full_name)} />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{prop.profiles.full_name}</span>
                      {prop.profiles.is_verified && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact
                </Button>
                <Button variant="outline" className="w-full">
                  <Flag className="mr-2 h-4 w-4" />
                  Report Property
                </Button>
              </CardContent>
            </Card>
            
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex gap-3 text-amber-800 text-sm">
              <Info className="h-5 w-5 shrink-0 text-amber-600" />
              <p>Safety notice: Always visit properties in person before making payments. Never pay without proper documentation.</p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
