'use client';

import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ManageBusinessPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Manage Business Profile</h1>
          <p className="text-muted-foreground">Set up or edit your campus business listing.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Business Name</label>
                <Input placeholder="e.g. CUSTECH Print Hub" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea placeholder="What does your business do?" rows={4} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location on Campus</label>
                <Input placeholder="e.g. Student Center, Block A" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Services (comma separated)</label>
                <Input placeholder="Printing, Photocopying, Binding" required />
              </div>
              
              <div className="pt-4 space-y-4 border-t">
                <h3 className="font-medium">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="contact@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input type="tel" placeholder="08012345678" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website (Optional)</label>
                  <Input type="url" placeholder="https://..." />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4" disabled={loading}>
                {loading ? 'Saving...' : 'Save Business Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
