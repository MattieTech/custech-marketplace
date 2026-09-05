'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface EligibilityResult {
  authenticated: boolean;
  isVerified: boolean;
  verificationStatus: string;
  userEmail?: string;
  displayName?: string;
}

/**
 * Checks if the currently authenticated user is a verified CUSTECH member.
 * Only users with verification_status === 'verified' or 'approved' are eligible
 * to post marketplace items, hostels/housing, and freelance services.
 */
export async function checkListingEligibility(): Promise<EligibilityResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      authenticated: false,
      isVerified: false,
      verificationStatus: 'unauthenticated'
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('verification_status, display_name')
    .eq('user_id', user.id)
    .maybeSingle();

  const status = profile?.verification_status || 'unverified';
  const isVerified = status === 'verified' || status === 'approved';

  return {
    authenticated: true,
    isVerified,
    verificationStatus: status,
    userEmail: user.email,
    displayName: profile?.display_name
  };
}

/**
 * Creates a new marketplace product, donation, or student request listing.
 * Strict policy: ONLY verified members can publish.
 */
export async function createMarketplaceListing(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'You must be logged in to create a listing.' };
    }

    // Verify student verification status
    const { isVerified, verificationStatus } = await checkListingEligibility();
    if (!isVerified) {
      return {
        success: false,
        error: `Only verified CUSTECH members can list items on the marketplace (Your status: ${verificationStatus}). Please complete student verification first.`,
        needsVerification: true
      };
    }

    const title = (formData.get('title') as string || '').trim();
    const description = (formData.get('description') as string || '').trim();
    const rawPrice = (formData.get('price') as string || '').replace(/[^0-9.]/g, '');
    const category = (formData.get('category') as string || '').trim();
    const condition = (formData.get('condition') as string || 'good').toLowerCase();
    const location = (formData.get('location') as string || '').trim();
    const listingType = (formData.get('listing_type') as string || 'product').toLowerCase();

    // Basic Validations
    if (!title || title.length < 3) {
      return { success: false, error: 'Listing title must be at least 3 characters long.' };
    }
    if (!description || description.length < 5) {
      return { success: false, error: 'Please provide a detailed description (minimum 5 characters).' };
    }

    const validTypes = ['product', 'free', 'need'];
    const safeType = validTypes.includes(listingType) ? listingType : 'product';

    let priceInKobo = 0;
    if (safeType === 'product') {
      const parsed = parseFloat(rawPrice);
      if (isNaN(parsed) || parsed <= 0) {
        return { success: false, error: 'Please enter a valid price greater than ?0.' };
      }
      priceInKobo = Math.round(parsed * 100);
    }

    const conditionMap: Record<string, string> = {
      new: 'new',
      'like new': 'like_new',
      like_new: 'like_new',
      good: 'good',
      fair: 'fair',
      poor: 'poor'
    };
    const safeCondition = safeType === 'product' ? (conditionMap[condition] || 'good') : null;

    // Use admin client for guaranteed reliable write and image storage
    const adminClient = await createAdminClient();

    // Resolve Category ID
    let resolvedCategoryId: string | null = null;
    if (category) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        resolvedCategoryId = category;
      } else {
        const { data: catData } = await adminClient
          .from('categories')
          .select('id')
          .eq('slug', category)
          .maybeSingle();
        resolvedCategoryId = catData?.id || null;
      }
    }

    // Insert listing
    const { data: listing, error: listingError } = await adminClient
      .from('listings')
      .insert({
        user_id: user.id,
        seller_id: user.id,
        title,
        description,
        price: priceInKobo,
        currency: 'NGN',
        category_id: resolvedCategoryId,
        condition: safeCondition,
        location,
        listing_type: safeType,
        status: 'active'
      })
      .select()
      .single();

    if (listingError || !listing) {
      console.error('Error inserting listing:', listingError);
      return { success: false, error: listingError?.message || 'Failed to insert listing into database.' };
    }

    // Process image uploads
    const files = formData.getAll('images') as File[];
    const validImageFiles = files.filter(f => f && f.size > 0 && f.size <= 5 * 1024 * 1024);

    for (let i = 0; i < Math.min(validImageFiles.length, 6); i++) {
      const file = validImageFiles[i];
      const ext = file.name.split('.').pop() || 'jpg';
      const storagePath = `${listing.id}-${Date.now()}-${i}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await adminClient.storage
        .from('listing-images')
        .upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true
        });

      if (!uploadError) {
        const { data: { publicUrl } } = adminClient.storage
          .from('listing-images')
          .getPublicUrl(storagePath);

        await adminClient.from('listing_images').insert({
          listing_id: listing.id,
          url: publicUrl,
          storage_path: storagePath,
          position: i
        });
      } else {
        console.error('Failed to upload image', storagePath, uploadError);
      }
    }

    revalidatePath('/marketplace');
    revalidatePath('/dashboard/listings');
    revalidatePath(`/marketplace/${listing.id}`);

    return { success: true, listingId: listing.id };
  } catch (err: any) {
    console.error('Unexpected error in createMarketplaceListing:', err);
    return { success: false, error: err?.message || 'An unexpected server error occurred.' };
  }
}

/**
 * Creates a new student housing / hostel listing.
 * Strict policy: ONLY verified members can publish.
 */
export async function createHousingListing(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'You must be logged in to list a property.' };
    }

    const { isVerified, verificationStatus } = await checkListingEligibility();
    if (!isVerified) {
      return {
        success: false,
        error: `Only verified CUSTECH members can list housing (Your status: ${verificationStatus}). Please complete student verification first.`,
        needsVerification: true
      };
    }

    const title = (formData.get('title') as string || '').trim();
    const description = (formData.get('description') as string || '').trim();
    const propertyType = (formData.get('propertyType') as string || 'self-contained').toLowerCase().replace(/\s+/g, '_');
    const rawRent = (formData.get('rent') as string || '').replace(/[^0-9.]/g, '');
    const distance = (formData.get('distance') as string || '').trim();
    const location = (formData.get('location') as string || '').trim();
    const electricityType = (formData.get('electricityType') as string || 'NEPA + Generator').trim();
    const waterSource = (formData.get('waterSource') as string || 'Borehole Running Water').trim();

    if (!title || title.length < 3) {
      return { success: false, error: 'Property title must be at least 3 characters.' };
    }
    if (!description || description.length < 5) {
      return { success: false, error: 'Please provide accommodation details (minimum 5 characters).' };
    }

    const rentYear = parseFloat(rawRent);
    if (isNaN(rentYear) || rentYear <= 0) {
      return { success: false, error: 'Please provide a valid rent amount per year.' };
    }

    const adminClient = await createAdminClient();

    // Map property types to valid DB enum
    const propertyTypeMap: Record<string, string> = {
      single_room: 'single_room',
      'single room': 'single_room',
      self_contained: 'self_contained',
      'self-contained': 'self_contained',
      flat: 'flat',
      'one-bedroom': 'flat',
      shared_room: 'shared_room',
      shared: 'shared_room',
      hostel_bedspace: 'hostel_bedspace',
      hostel: 'hostel_bedspace'
    };
    const safePropType = propertyTypeMap[propertyType] || 'self_contained';

    // Find housing category
    const { data: catData } = await adminClient
      .from('categories')
      .select('id')
      .eq('type', 'housing')
      .limit(1)
      .maybeSingle();

    // 1. Insert master listing
    const { data: listing, error: listingError } = await adminClient
      .from('listings')
      .insert({
        user_id: user.id,
        seller_id: user.id,
        title,
        description,
        price: Math.round(rentYear * 100),
        currency: 'NGN',
        category_id: catData?.id || null,
        location: location || 'Near Campus Gate',
        listing_type: 'housing',
        status: 'active'
      })
      .select()
      .single();

    if (listingError || !listing) {
      console.error('Error inserting housing listing:', listingError);
      return { success: false, error: listingError?.message || 'Failed to create housing listing.' };
    }

    // 2. Insert properties row
    const { error: propError } = await adminClient
      .from('properties')
      .insert({
        listing_id: listing.id,
        property_type: safePropType,
        rent_per_year: Math.round(rentYear * 100),
        total_package: Math.round(rentYear * 100),
        distance_to_campus: distance || '10 mins walk',
        electricity_type: electricityType,
        water_source: waterSource,
        is_verified_property: true
      });

    if (propError) {
      console.error('Error inserting property details:', propError);
    }

    // 3. Process images
    const files = formData.getAll('images') as File[];
    const validFiles = files.filter(f => f && f.size > 0 && f.size <= 5 * 1024 * 1024);

    for (let i = 0; i < Math.min(validFiles.length, 6); i++) {
      const file = validFiles[i];
      const ext = file.name.split('.').pop() || 'jpg';
      const storagePath = `${listing.id}-${Date.now()}-${i}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadErr } = await adminClient.storage
        .from('listing-images')
        .upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true
        });

      if (!uploadErr) {
        const { data: { publicUrl } } = adminClient.storage
          .from('listing-images')
          .getPublicUrl(storagePath);

        await adminClient.from('listing_images').insert({
          listing_id: listing.id,
          url: publicUrl,
          storage_path: storagePath,
          position: i
        });
      }
    }

    revalidatePath('/housing');
    revalidatePath(`/housing/${listing.id}`);
    revalidatePath('/dashboard/listings');

    return { success: true, listingId: listing.id };
  } catch (err: any) {
    console.error('Unexpected error in createHousingListing:', err);
    return { success: false, error: err?.message || 'An unexpected server error occurred.' };
  }
}

/**
 * Creates a new student freelance service offering.
 * Strict policy: ONLY verified members can publish.
 */
export async function createServiceListing(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'You must be logged in to offer a service.' };
    }

    const { isVerified, verificationStatus } = await checkListingEligibility();
    if (!isVerified) {
      return {
        success: false,
        error: `Only verified CUSTECH members can offer services (Your status: ${verificationStatus}). Please complete student verification first.`,
        needsVerification: true
      };
    }

    const title = (formData.get('title') as string || '').trim();
    const description = (formData.get('description') as string || '').trim();
    const rawPrice = (formData.get('startingPrice') as string || '').replace(/[^0-9.]/g, '');
    const deliveryTime = (formData.get('deliveryTime') as string || '1-2 days').trim();
    const availability = (formData.get('availability') as string || 'available').toLowerCase();
    const location = (formData.get('location') as string || 'On Campus').trim();
    const category = (formData.get('category') as string || '').trim();

    if (!title || title.length < 3) {
      return { success: false, error: 'Service title must be at least 3 characters.' };
    }
    if (!description || description.length < 5) {
      return { success: false, error: 'Please describe the service you offer (minimum 5 characters).' };
    }

    const priceNum = parseFloat(rawPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return { success: false, error: 'Please provide a valid starting price.' };
    }

    const adminClient = await createAdminClient();

    // Resolve Category ID
    let resolvedCategoryId: string | null = null;
    if (category) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        resolvedCategoryId = category;
      } else {
        const { data: catData } = await adminClient
          .from('categories')
          .select('id')
          .eq('slug', category)
          .maybeSingle();
        resolvedCategoryId = catData?.id || null;
      }
    }

    if (!resolvedCategoryId) {
      const { data: anyServCat } = await adminClient
        .from('categories')
        .select('id')
        .eq('type', 'service')
        .limit(1)
        .maybeSingle();
      resolvedCategoryId = anyServCat?.id || null;
    }

    const safeAvailability = ['available', 'busy', 'away'].includes(availability) ? availability : 'available';

    // 1. Insert master listing
    const { data: listing, error: listingError } = await adminClient
      .from('listings')
      .insert({
        user_id: user.id,
        seller_id: user.id,
        title,
        description,
        price: Math.round(priceNum * 100),
        currency: 'NGN',
        category_id: resolvedCategoryId,
        location,
        listing_type: 'service',
        status: 'active'
      })
      .select()
      .single();

    if (listingError || !listing) {
      console.error('Error inserting service listing:', listingError);
      return { success: false, error: listingError?.message || 'Failed to create service listing.' };
    }

    // 2. Insert services row
    const { error: servError } = await adminClient
      .from('services')
      .insert({
        listing_id: listing.id,
        starting_price: Math.round(priceNum * 100),
        delivery_time: deliveryTime,
        completed_jobs: 0,
        availability: safeAvailability
      });

    if (servError) {
      console.error('Error inserting service details:', servError);
    }

    // 3. Process portfolio images
    const files = formData.getAll('images') as File[];
    const validFiles = files.filter(f => f && f.size > 0 && f.size <= 5 * 1024 * 1024);

    for (let i = 0; i < Math.min(validFiles.length, 6); i++) {
      const file = validFiles[i];
      const ext = file.name.split('.').pop() || 'jpg';
      const storagePath = `${listing.id}-${Date.now()}-${i}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadErr } = await adminClient.storage
        .from('listing-images')
        .upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true
        });

      if (!uploadErr) {
        const { data: { publicUrl } } = adminClient.storage
          .from('listing-images')
          .getPublicUrl(storagePath);

        await adminClient.from('listing_images').insert({
          listing_id: listing.id,
          url: publicUrl,
          storage_path: storagePath,
          position: i
        });
      }
    }

    revalidatePath('/services');
    revalidatePath(`/services/${listing.id}`);
    revalidatePath('/dashboard/listings');

    return { success: true, listingId: listing.id };
  } catch (err: any) {
    console.error('Unexpected error in createServiceListing:', err);
    return { success: false, error: err?.message || 'An unexpected server error occurred.' };
  }
}
