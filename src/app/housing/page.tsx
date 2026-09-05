import { createClient } from '@/lib/supabase/server';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { MapPin, BedDouble, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default async function HousingPage() {
  const supabase = createClient();
  
  // Dummy data
  const properties = [
    {
      id: '1',
      title: 'Self-Contained Room near Main Gate',
      properties: { property_type: 'Self-Contained', rent: 150000, rooms: 1, distance: '5 mins walk', amenities: ['Water', 'Security', 'Electricity'] },
      profiles: { is_verified: true }
    }
  ];

  return (
    <PageContainer>
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">CUSTECH Housing</h1>
        <p className="text-muted-foreground">Find accommodation near CUSTECH</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop: any) => (
          <Link href={`/housing/${prop.id}`} key={prop.id}>
            <Card className="h-full hover:shadow-md transition-shadow overflow-hidden flex flex-col">
              <div className="aspect-video bg-muted relative">
                <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90">
                  {prop.properties?.property_type}
                </Badge>
              </div>
              <CardContent className="p-4 flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold line-clamp-2">{prop.title}</h3>
                  {prop.profiles?.is_verified && (
                    <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                  )}
                </div>
                <div className="text-lg font-bold text-emerald-600 mb-2">
                  {formatPrice(prop.properties?.rent)} <span className="text-sm font-normal text-muted-foreground">/yr</span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{prop.properties?.distance} from campus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4" />
                    <span>{prop.properties?.rooms} Room(s)</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex gap-1 flex-wrap">
                {prop.properties?.amenities?.slice(0, 3).map((amenity: string) => (
                  <Badge key={amenity} variant="outline" className="text-[10px]">
                    {amenity}
                  </Badge>
                ))}
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
