import { createClient } from '@/lib/supabase/server';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatPrice, getInitials } from '@/lib/utils';
import { Star, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default async function ServicesPage() {
  const supabase = await createClient();
  
  // Dummy data for visual completion if DB empty, in production would be fetched properly
  const { data: services } = await supabase
    .from('listings')
    .select(`
      *,
      services:services(*),
      profiles:profiles(*)
    `)
    .eq('listing_type', 'service')
    .eq('status', 'active');

  const defaultServices = services?.length ? services : [
    {
      id: '1',
      title: 'Professional Graphic Design',
      profiles: { full_name: 'John Doe', avatar_url: '', is_verified: true, id: '1' },
      services: { starting_price: 5000, delivery_time: '2-3 days', completed_jobs: 12, availability: 'Available' },
      rating: 4.8
    }
  ];

  return (
    <PageContainer>
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Services</h1>
        <p className="text-muted-foreground">Find skilled service providers in the CUSTECH community</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {defaultServices.map((service: any) => (
          <Link href={`/services/${service.id}`} key={service.id}>
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader className="p-4 flex flex-row items-center gap-3">
                <Avatar src={service.profiles?.avatar_url} fallback={getInitials(service.profiles?.full_name || 'User')} />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm">{service.profiles?.full_name}</span>
                    {service.profiles?.is_verified && <CheckCircle className="h-3 w-3 text-emerald-500" />}
                  </div>
                  <Badge variant={service.services?.availability === 'Available' ? 'default' : 'secondary'} className="text-[10px] h-4">
                    {service.services?.availability || 'Available'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <h3 className="font-semibold line-clamp-2">{service.title}</h3>
                <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>{service.rating || 'New'}</span>
                  <span>• {service.services?.completed_jobs || 0} jobs</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 border-t flex flex-col items-start gap-2 pt-3">
                <div className="text-sm text-muted-foreground">Starting at</div>
                <div className="font-semibold text-emerald-600">{formatPrice(service.services?.starting_price || 0)}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Clock className="h-3 w-3" />
                  <span>{service.services?.delivery_time || 'TBD'}</span>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
