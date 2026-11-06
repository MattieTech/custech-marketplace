'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { createRoommatePost } from '@/app/housing/roommates/actions';
import { 
  Users, 
  Home, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  DollarSign, 
  MapPin, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function NewRoommatePostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasAccommodation, setHasAccommodation] = useState<'secured' | 'seeking'>('secured');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lodgeName, setLodgeName] = useState('');
  const [location, setLocation] = useState('Near Campus Gate');
  const [roomType, setRoomType] = useState('self_contained');
  const [totalRent, setTotalRent] = useState('');
  const [splitBudget, setSplitBudget] = useState('');
  const [preferredGender, setPreferredGender] = useState('any');
  const [cleanliness, setCleanliness] = useState('Very Clean & Tidy');
  const [sleepHabit, setSleepHabit] = useState('Sleeps around 11 PM');
  const [readingHabit, setReadingHabit] = useState('Quiet room studies');
  const [cookingPreference, setCookingPreference] = useState('Cooks frequently');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a title for your post');
      return;
    }
    if (!description.trim() || description.length < 10) {
      toast.error('Please describe what you are looking for in a roommate (at least 10 characters)');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('hasAccommodation', (hasAccommodation === 'secured').toString());
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('lodgeName', lodgeName.trim());
      formData.append('location', location.trim());
      formData.append('roomType', roomType);
      formData.append('totalRent', totalRent);
      formData.append('splitBudget', splitBudget || (totalRent ? (parseFloat(totalRent) / 2).toString() : ''));
      formData.append('preferredGender', preferredGender);
      formData.append('cleanliness', cleanliness);
      formData.append('sleepHabit', sleepHabit);
      formData.append('readingHabit', readingHabit);
      formData.append('cookingPreference', cookingPreference);

      const res = await createRoommatePost(formData);

      if (!res.success) {
        toast.error(res.error || 'Failed to publish roommate request');
        return;
      }

      toast.success('Roommate request posted successfully!', 'Published');
      router.push('/housing/roommates');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 sm:py-10">
      <PageContainer>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back link */}
          <Link
            href="/housing/roommates"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Roommates Directory</span>
          </Link>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Post a Roommate Request
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Find a compatible CUSTECH student to split your lodge rent and cut living expenses.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Accommodation Status Selection */}
            <Card className="rounded-3xl border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
              <Label className="text-sm font-bold text-slate-900 block">
                Do you currently have an accommodation secured?
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setHasAccommodation('secured')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    hasAccommodation === 'secured'
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Home className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold text-xs text-slate-900">
                      Yes, I Have a Room/Lodge
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    You already secured a room and need a co-tenant to move in and share the rent bill.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setHasAccommodation('seeking')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                    hasAccommodation === 'seeking'
                      ? 'border-indigo-500 bg-indigo-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span className="font-extrabold text-xs text-slate-900">
                      No, Looking to Pair & Hunt
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    You don't have an accommodation yet; find a partner to search together and co-sign.
                  </p>
                </button>
              </div>
            </Card>

            {/* Step 2: Post Details */}
            <Card className="rounded-3xl border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-bold text-slate-700">
                  Headline / Post Title *
                </Label>
                <Input
                  id="title"
                  placeholder={
                    hasAccommodation === 'secured'
                      ? 'e.g. Spacious self-con at Royal Villa lodge seeking 1 roommate'
                      : 'e.g. 200L CS student looking for neat roommate to rent self-con near campus'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              {hasAccommodation === 'secured' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="lodgeName" className="text-xs font-bold text-slate-700">
                      Lodge / Apartment Name
                    </Label>
                    <Input
                      id="lodgeName"
                      placeholder="e.g. Royal Villa Lodge"
                      value={lodgeName}
                      onChange={(e) => setLodgeName(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="roomType" className="text-xs font-bold text-slate-700">
                      Accommodation Type
                    </Label>
                    <Select value={roomType} onValueChange={setRoomType}>
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self_contained">Self Contained</SelectItem>
                        <SelectItem value="single_room">Single Room</SelectItem>
                        <SelectItem value="flat">1-Bedroom / Flat</SelectItem>
                        <SelectItem value="hostel_bedspace">Hostel Bedspace</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="totalRent" className="text-xs font-bold text-slate-700">
                    {hasAccommodation === 'secured' ? 'Total Annual Rent (₦)' : 'Max Total Rent (₦)'}
                  </Label>
                  <Input
                    id="totalRent"
                    type="number"
                    placeholder="e.g. 250000"
                    value={totalRent}
                    onChange={(e) => {
                      setTotalRent(e.target.value);
                      if (e.target.value) {
                        setSplitBudget((parseFloat(e.target.value) / 2).toString());
                      }
                    }}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="splitBudget" className="text-xs font-bold text-slate-700">
                    Target Split Share per Student (₦ / year)
                  </Label>
                  <Input
                    id="splitBudget"
                    type="number"
                    placeholder="e.g. 125000"
                    value={splitBudget}
                    onChange={(e) => setSplitBudget(e.target.value)}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-bold text-slate-700">
                  Location / Area
                </Label>
                <Input
                  id="location"
                  placeholder="e.g. Osara Campus Gate, Behind Senate Building, or Along Lokoja Road"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-slate-700">
                  About You & Desired Roommate *
                </Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Introduce yourself (department, study schedule), describe what kind of co-tenant you want, and any house rules (quiet hours, visitors, cooking sharing, etc.)."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl text-xs"
                  required
                />
              </div>
            </Card>

            {/* Step 3: Compatibility & Lifestyle */}
            <Card className="rounded-3xl border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">
                Lifestyle & Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Preferred Roommate Gender
                  </Label>
                  <Select value={preferredGender} onValueChange={setPreferredGender}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any / Open</SelectItem>
                      <SelectItem value="male">Male Only</SelectItem>
                      <SelectItem value="female">Female Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Cleanliness Habit
                  </Label>
                  <Select value={cleanliness} onValueChange={setCleanliness}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Very Clean & Tidy">Very Clean & Tidy</SelectItem>
                      <SelectItem value="Moderately Neat">Moderately Neat</SelectItem>
                      <SelectItem value="Shared Chores Rotation">Shared Chores Rotation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Sleep / Night Schedule
                  </Label>
                  <Select value={sleepHabit} onValueChange={setSleepHabit}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Early Sleeper (Before 10 PM)">Early Sleeper (Before 10 PM)</SelectItem>
                      <SelectItem value="Normal (11 PM - 6 AM)">Normal (11 PM - 6 AM)</SelectItem>
                      <SelectItem value="Night Owl / Late Reader">Night Owl / Late Reader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">
                    Cooking Preference
                  </Label>
                  <Select value={cookingPreference} onValueChange={setCookingPreference}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cooks frequently at home">Cooks frequently at home</SelectItem>
                      <SelectItem value="Willing to share foodstuff costs">Willing to share foodstuff costs</SelectItem>
                      <SelectItem value="Cooks separately">Cooks separately</SelectItem>
                      <SelectItem value="Buys from campus cafeteria">Buys from campus cafeteria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/housing/roommates')}
                className="rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Publishing Request...</span>
                  </>
                ) : (
                  <span>Publish Roommate Request</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </PageContainer>
    </div>
  );
}
