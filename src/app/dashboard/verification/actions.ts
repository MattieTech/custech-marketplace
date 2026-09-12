'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { initializeTransaction } from '@/lib/paystack';
import { VERIFICATION_FEE_KOBO } from '@/lib/constants';
import { isUserAdmin } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

export async function getVerificationStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return 'unverified';
  }

  // First check profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('verification_status, trust_level')
    .eq('user_id', user.id)
    .single();

  if (
    profile?.verification_status === 'approved' || 
    profile?.verification_status === 'verified' || 
    profile?.trust_level === 'custech_verified'
  ) {
    return 'verified';
  }

  // Then check latest request
  const { data: request } = await supabase
    .from('verification_requests')
    .select('verification_status, payment_status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (request?.verification_status === 'approved' || request?.verification_status === 'verified') return 'verified';
  if (request?.verification_status === 'rejected') return 'rejected';
  if (request?.payment_status === 'success' || request?.verification_status === 'under_review') return 'under_review';

  return 'unverified';
}

/**
 * Admin Instant Self-Verification (Fee Waived)
 */
export async function verifyAdminSelf() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const admin = await isUserAdmin();
    if (!admin) {
      return { success: false, error: 'Only administrators can use the instant fee waiver.' };
    }

    const adminClient = await createAdminClient();

    // 1. Update profiles table
    await adminClient
      .from('profiles')
      .update({
        verification_status: 'approved',
        trust_level: 'custech_verified',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    // 2. Ensure super_admin role
    await adminClient
      .from('admin_roles')
      .upsert({
        user_id: user.id,
        role: 'super_admin'
      }, { onConflict: 'user_id,role' });

    // 3. Record approved verification request with waived fee
    await adminClient
      .from('verification_requests')
      .insert({
        user_id: user.id,
        verification_method: 'manual',
        full_name: user.user_metadata?.full_name || 'Admin',
        phone: 'Admin Account',
        payment_status: 'success',
        payment_amount: 0,
        payment_reference: `WAIVED-ADMIN-${Date.now()}`,
        verification_status: 'approved',
        reviewed_at: new Date().toISOString(),
        student_info: { role: 'super_admin', fee_waived: true }
      });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/verification');
    revalidatePath('/profile');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('verifyAdminSelf error:', error);
    return { success: false, error: error.message || 'Failed to verify admin account' };
  }
}

export async function checkIsAdminUser() {
  try {
    return await isUserAdmin();
  } catch {
    return false;
  }
}



export async function submitVerification(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const verificationMethod = (formData.get('verificationMethod') as string) || 'id_card';
    const fullName = formData.get('fullName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const matricNumber = formData.get('matricNumber') as string;
    const department = formData.get('department') as string;
    const faculty = (formData.get('faculty') as string) || '';
    const level = formData.get('level') as string;
    const whatsappNumber = formData.get('whatsappNumber') as string;
    const hostelAddress = (formData.get('hostelAddress') as string) || '';
    const emergencyContact = (formData.get('emergencyContact') as string) || '';
    
    const profilePicture = formData.get('profilePicture') as File | null;
    const document = formData.get('document') as File | null;

    // MANDATORY REQUIREMENT: Profile picture must be uploaded for both options
    if (!profilePicture || profilePicture.size === 0) {
      return { success: false, error: 'A live student profile picture is required to display on your profile.' };
    }

    const ALLOWED_AVATAR_MIMES: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    const avatarMime = (profilePicture.type || '').toLowerCase();
    if (!ALLOWED_AVATAR_MIMES[avatarMime]) {
      return { success: false, error: 'Profile picture must be a valid image (JPG, PNG, or WebP).' };
    }

    if (verificationMethod === 'id_card' && (!document || document.size === 0)) {
      return { success: false, error: 'School ID card document is required for Fast Track verification.' };
    }

    const ALLOWED_DOC_MIMES: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    };

    if (document && document.size > 0) {
      const docMime = (document.type || '').toLowerCase();
      if (!ALLOWED_DOC_MIMES[docMime]) {
        return { success: false, error: 'Student ID document must be a valid image or PDF.' };
      }
    }

    // 1. Upload Profile Picture
    let avatarUrl = '';
    const avatarExt = ALLOWED_AVATAR_MIMES[avatarMime] || 'jpg';
    const avatarFileName = `avatar-${user.id}-${Date.now()}.${avatarExt}`;
    
    const { error: avatarError, data: avatarData } = await supabase.storage
      .from('avatars')
      .upload(avatarFileName, profilePicture, { upsert: true, contentType: avatarMime });

    if (!avatarError && avatarData) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarData.path);
      avatarUrl = publicUrlData.publicUrl;
    } else {
      // Fallback to verification-documents bucket if avatars bucket isn't created
      const { data: fallbackAvatar } = await supabase.storage
        .from('verification-documents')
        .upload(`avatar-${avatarFileName}`, profilePicture, { contentType: avatarMime });
      if (fallbackAvatar) {
        const { data: fbUrl } = supabase.storage
          .from('verification-documents')
          .getPublicUrl(fallbackAvatar.path);
        avatarUrl = fbUrl.publicUrl;
      }
    }

    // 2. Upload ID Document if provided
    let documentPath = '';
    if (document && document.size > 0) {
      const docMime = (document.type || '').toLowerCase();
      const fileExt = ALLOWED_DOC_MIMES[docMime] || 'jpg';
      const docFileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { data: uploadData } = await supabase.storage
        .from('verification-documents')
        .upload(docFileName, document, { contentType: docMime });
      
      if (uploadData) {
        documentPath = uploadData.path;
      }
    }

    // 3. Immediately update user's profile with Profile Picture and Student details
    await supabase
      .from('profiles')
      .update({
        display_name: fullName || undefined,
        avatar_url: avatarUrl || undefined,
        phone: phoneNumber || undefined,
        whatsapp_number: whatsappNumber || undefined,
        matric_number: matricNumber || undefined,
        department: department || undefined,
        faculty: faculty || undefined,
        academic_level: level || undefined,
        hostel_address: hostelAddress || undefined,
      })
      .eq('user_id', user.id);

    // 4. Create verification request record
    const reference = `VER-${user.id}-${Date.now()}`;
    const studentInfo = {
      method: verificationMethod,
      full_name: fullName,
      matric_number: matricNumber,
      department,
      faculty,
      level,
      whatsapp_number: whatsappNumber,
      phone_number: phoneNumber,
      hostel_address: hostelAddress,
      emergency_contact: emergencyContact,
      avatar_url: avatarUrl,
    };

    // Check if user is an administrator - waive verification fee automatically
    const admin = await isUserAdmin();
    if (admin) {
      const adminClient = await createAdminClient();

      await adminClient
        .from('profiles')
        .update({
          display_name: fullName || undefined,
          avatar_url: avatarUrl || undefined,
          phone: phoneNumber || undefined,
          whatsapp_number: whatsappNumber || undefined,
          matric_number: matricNumber || undefined,
          department: department || undefined,
          faculty: faculty || undefined,
          academic_level: level || undefined,
          hostel_address: hostelAddress || undefined,
          verification_status: 'approved',
          trust_level: 'custech_verified',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      await adminClient
        .from('verification_requests')
        .insert({
          user_id: user.id,
          full_name: fullName,
          phone: phoneNumber,
          student_info: studentInfo,
          id_document_path: documentPath || null,
          payment_reference: `WAIVED-ADMIN-${Date.now()}`,
          payment_status: 'success',
          payment_amount: 0,
          verification_status: 'approved',
          reviewed_at: new Date().toISOString(),
          rejection_reason: null
        });

      revalidatePath('/dashboard');
      revalidatePath('/dashboard/verification');
      revalidatePath('/profile');
      return { 
        success: true, 
        autoVerified: true 
      };
    }

    const { error: dbError } = await supabase
      .from('verification_requests')
      .insert({
        user_id: user.id,
        full_name: fullName,
        phone: phoneNumber,
        student_info: studentInfo,
        id_document_path: documentPath || null,
        payment_reference: reference,
        payment_status: 'pending',
        verification_status: 'pending_payment'
      });

    if (dbError) {
      console.error('DB Error:', dbError);
      return { success: false, error: 'Failed to record verification request.' };
    }

    // 5. Initialize Paystack verification fee payment
    const email = user.email!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://custechmarketplace.vercel.app';
    const paystackResponse = await initializeTransaction({
      email,
      amount: VERIFICATION_FEE_KOBO,
      reference,
      metadata: {
        userId: user.id,
        type: 'verification',
        method: verificationMethod
      },
      callback_url: `${siteUrl}/dashboard/verification/callback`
    });


    if (!paystackResponse || !paystackResponse.status) {
      return { success: false, error: 'Failed to connect to payment gateway. Please try again.' };
    }

    return { 
      success: true, 
      authorization_url: paystackResponse?.data?.authorization_url 
    };

  } catch (error) {
    console.error('Verification submit error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

