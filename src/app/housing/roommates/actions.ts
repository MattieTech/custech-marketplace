'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface RoommatePost {
  id: string;
  userId: string;
  creatorName: string;
  creatorAvatar: string | null;
  creatorDepartment: string | null;
  creatorLevel: string | null;
  creatorGender: string | null;
  creatorPhone: string | null;
  creatorWhatsapp: string | null;
  isVerified: boolean;
  hasAccommodation: boolean;
  accommodationDetails: {
    lodgeName?: string;
    location?: string;
    roomType?: string;
    totalRent?: number;
    splitBudget?: number;
    distanceToCampus?: string;
    amenities?: string[];
  };
  preferredGender: string;
  departmentPreference?: string;
  lifestyleHabits: {
    cleanliness?: string;
    sleepHabit?: string;
    readingHabit?: string;
    cookingPreference?: string;
    smokingDrinking?: string;
  };
  notes?: string;
  status: string;
  createdAt: string;
}

/**
 * Retrieves all active roommate requests with optional filters
 */
export async function getRoommatePosts(filters?: {
  hasAccommodation?: string; // 'all' | 'secured' | 'seeking'
  preferredGender?: string;
  location?: string;
}): Promise<{ success: boolean; data?: RoommatePost[]; error?: string }> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('listings')
      .select(`
        id,
        user_id,
        title,
        description,
        price,
        location,
        status,
        created_at,
        metadata
      `)
      .eq('listing_type', 'roommate')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (filters?.location && filters.location !== 'all') {
      query = query.ilike('location', `%${filters.location}%`);
    }

    const { data: listings, error } = await query;

    if (error) {
      console.error('getRoommatePosts error:', error);
      return { success: false, error: error.message };
    }

    if (!listings || listings.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch creators profiles
    const userIds = [...new Set(listings.map((l: any) => l.user_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, department, level, gender, phone, whatsapp_number, verification_status, trust_level')
      .in('user_id', userIds);

    const profileMap = (profiles || []).reduce((acc: any, p: any) => {
      acc[p.user_id] = p;
      return acc;
    }, {});

    const posts: RoommatePost[] = listings.map((l: any) => {
      const p = profileMap[l.user_id] || {};
      const meta = l.metadata || {};
      const hasAccommodation = Boolean(meta.has_accommodation);

      return {
        id: l.id,
        userId: l.user_id,
        creatorName: p.display_name || 'CUSTECH Student',
        creatorAvatar: p.avatar_url || null,
        creatorDepartment: p.department || null,
        creatorLevel: p.level || null,
        creatorGender: p.gender || meta.creator_gender || null,
        creatorPhone: p.phone || null,
        creatorWhatsapp: p.whatsapp_number || p.phone || null,
        isVerified: p.verification_status === 'approved' || p.verification_status === 'verified' || p.trust_level === 'custech_verified',
        hasAccommodation,
        accommodationDetails: {
          lodgeName: meta.lodge_name || l.title,
          location: l.location || 'Near Campus Gate',
          roomType: meta.room_type || 'Self Contained',
          totalRent: Number(meta.total_rent || l.price || 0),
          splitBudget: Number(meta.split_budget || (Number(l.price || 0) > 0 ? Math.round(Number(l.price) / 2) : 0)),
          distanceToCampus: meta.distance_to_campus || '10 mins walk',
          amenities: Array.isArray(meta.amenities) ? meta.amenities : ['Running Water', 'Electricity'],
        },
        preferredGender: meta.preferred_gender || 'any',
        departmentPreference: meta.department_preference || 'Any department',
        lifestyleHabits: {
          cleanliness: meta.cleanliness || 'Neat & Organized',
          sleepHabit: meta.sleep_habit || 'Flexible',
          readingHabit: meta.reading_habit || 'Library & Room',
          cookingPreference: meta.cooking_preference || 'Cooks at home',
          smokingDrinking: meta.smoking_drinking || 'Non-smoker',
        },
        notes: l.description,
        status: l.status,
        createdAt: l.created_at,
      };
    });

    // Apply client filters if specified
    let filtered = posts;
    if (filters?.hasAccommodation === 'secured') {
      filtered = filtered.filter(p => p.hasAccommodation);
    } else if (filters?.hasAccommodation === 'seeking') {
      filtered = filtered.filter(p => !p.hasAccommodation);
    }

    if (filters?.preferredGender && filters.preferredGender !== 'all') {
      filtered = filtered.filter(p => p.preferredGender === filters.preferredGender || p.preferredGender === 'any');
    }

    return { success: true, data: filtered };
  } catch (err: any) {
    console.error('getRoommatePosts unexpected error:', err);
    return { success: false, error: err.message || 'Failed to retrieve roommate postings' };
  }
}

/**
 * Creates a new Roommate Request (whether student has secured a lodge or is looking to pair up)
 */
export async function createRoommatePost(formData: FormData): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'You must be logged in to post a roommate request.' };
    }

    const hasAccommodation = formData.get('hasAccommodation') === 'true';
    const title = (formData.get('title') as string || '').trim();
    const description = (formData.get('description') as string || '').trim();
    const lodgeName = (formData.get('lodgeName') as string || '').trim();
    const location = (formData.get('location') as string || '').trim();
    const roomType = (formData.get('roomType') as string || 'self_contained').trim();
    const rawTotalRent = (formData.get('totalRent') as string || '').replace(/[^0-9.]/g, '');
    const rawSplitBudget = (formData.get('splitBudget') as string || '').replace(/[^0-9.]/g, '');
    const preferredGender = (formData.get('preferredGender') as string || 'any').trim();
    const departmentPreference = (formData.get('departmentPreference') as string || 'Any department').trim();
    const cleanliness = (formData.get('cleanliness') as string || 'Very Clean').trim();
    const sleepHabit = (formData.get('sleepHabit') as string || 'Normal (11 PM - 6 AM)').trim();
    const readingHabit = (formData.get('readingHabit') as string || 'Quiet room studies').trim();
    const cookingPreference = (formData.get('cookingPreference') as string || 'Cooks frequently').trim();
    const distanceToCampus = (formData.get('distanceToCampus') as string || '10 mins walk').trim();

    if (!title || title.length < 5) {
      return { success: false, error: 'Please enter a descriptive post title (minimum 5 characters).' };
    }

    if (!description || description.length < 10) {
      return { success: false, error: 'Please describe yourself and what you are looking for in a roommate (minimum 10 characters).' };
    }

    const totalRentKobo = rawTotalRent ? Math.round(parseFloat(rawTotalRent) * 100) : 0;
    const splitBudgetKobo = rawSplitBudget ? Math.round(parseFloat(rawSplitBudget) * 100) : 0;

    const adminClient = await createAdminClient();

    // Find housing category
    const { data: catData } = await adminClient
      .from('categories')
      .select('id')
      .eq('type', 'housing')
      .limit(1)
      .maybeSingle();

    const metadata = {
      has_accommodation: hasAccommodation,
      lodge_name: lodgeName || title,
      room_type: roomType,
      total_rent: totalRentKobo,
      split_budget: splitBudgetKobo,
      preferred_gender: preferredGender,
      department_preference: departmentPreference,
      cleanliness,
      sleep_habit: sleepHabit,
      reading_habit: readingHabit,
      cooking_preference: cookingPreference,
      distance_to_campus: distanceToCampus,
    };

    const { data: newListing, error: insertError } = await adminClient
      .from('listings')
      .insert({
        user_id: user.id,
        seller_id: user.id,
        title,
        description,
        price: splitBudgetKobo > 0 ? splitBudgetKobo : totalRentKobo,
        currency: 'NGN',
        category_id: catData?.id || null,
        location: location || 'CUSTECH Campus Area',
        listing_type: 'roommate',
        status: 'active',
        metadata,
      })
      .select()
      .single();

    if (insertError || !newListing) {
      console.error('Error inserting roommate listing:', insertError);
      return { success: false, error: insertError?.message || 'Failed to publish roommate request.' };
    }

    revalidatePath('/housing');
    revalidatePath('/housing/roommates');
    revalidatePath('/dashboard/listings');

    return { success: true, id: newListing.id };
  } catch (err: any) {
    console.error('createRoommatePost error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred.' };
  }
}
