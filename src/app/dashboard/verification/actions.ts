'use server';

import { createClient } from '@/lib/supabase/server';
import { initializeTransaction } from '@/lib/paystack';
import { VERIFICATION_FEE_KOBO } from '@/lib/constants';

export async function getVerificationStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return 'unverified';
  }

  // First check profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('verification_status')
    .eq('user_id', user.id)
    .single();

  if (profile?.verification_status === 'verified') return 'verified';

  // Then check latest request
  const { data: request } = await supabase
    .from('verification_requests')
    .select('verification_status, payment_status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (request?.verification_status === 'rejected') return 'rejected';
  if (request?.payment_status === 'success' || request?.verification_status === 'under_review') return 'under_review';

  return 'unverified';
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

    if (verificationMethod === 'id_card' && (!document || document.size === 0)) {
      return { success: false, error: 'School ID card document is required for Fast Track verification.' };
    }

    // 1. Upload Profile Picture
    let avatarUrl = '';
    const avatarExt = profilePicture.name.split('.').pop() || 'jpg';
    const avatarFileName = `avatar-${user.id}-${Date.now()}.${avatarExt}`;
    
    const { error: avatarError, data: avatarData } = await supabase.storage
      .from('avatars')
      .upload(avatarFileName, profilePicture, { upsert: true });

    if (!avatarError && avatarData) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(avatarData.path);
      avatarUrl = publicUrlData.publicUrl;
    } else {
      // Fallback to verification-documents bucket if avatars bucket isn't created
      const { data: fallbackAvatar } = await supabase.storage
        .from('verification-documents')
        .upload(`avatar-${avatarFileName}`, profilePicture);
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
      const fileExt = document.name.split('.').pop() || 'jpg';
      const docFileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('verification-documents')
        .upload(docFileName, document);
      
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

