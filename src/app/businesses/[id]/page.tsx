import PageContainer from '@/components/layout/page-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ShieldCheck, Mail, Phone, Globe, Flag } from 'lucide-react';

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const biz = {
    name: 'CUSTECH Print Hub',
    description: 'Quality printing, photocopying, and binding services for students. Open late during exam periods.',
    location: 'Student Center, Block A',
    services: ['Printing', 'Photocopying', 'Binding', 'Lamination'],
    is_verified: true,
    email: 'contact@printhub.com',
    phone: '08012345678',
    website: 'www.printhub.custech.edu'
  };

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{biz.name}</h1>
            {biz.is_verified && <ShieldCheck className="h-6 w-6 text-emerald-500" />}
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            <span>{biz.location}</span>
          </div>

          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-2">About</h3>
            <p>{biz.description}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Services Offered</h3>
            <div className="flex flex-wrap gap-2">
              {biz.services.map(s => (
                <Badge key={s} variant="secondary" className="text-sm py-1 px-3">{s}</Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-4 pt-4">
            <h3 className="text-xl font-semibold">Current Deals</h3>
            <div className="bg-muted p-6 rounded-lg text-center text-muted-foreground">
              No active deals at the moment.
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{biz.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{biz.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{biz.website}</span>
                </div>
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4">
                Contact Business
              </Button>
              <Button variant="outline" className="w-full">
                <Flag className="mr-2 h-4 w-4" />
                Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
