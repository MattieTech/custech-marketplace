'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { checkAdminAccess, logAdminAction } from '@/lib/admin';
import { revalidatePath } from 'next/cache';

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'custech', 'support', 'help', 'api', 
  'dashboard', 'moderator', 'official', 'security', 'scamcheck', 
  'marketplace', 'staff', 'system', 'root'
]);

// ==========================================
// 1. VERIFICATION ACTIONS
// ==========================================

export async function approveVerification(requestId: string, userId: string) {
  const { user } = await checkAdminAccess(['super_admin', 'verification_officer']);
  const adminClient = await createAdminClient();

  // Update request
  await adminClient
    .from('verification_requests')
    .update({ 
      verification_status: 'approved', 
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq('id', requestId);

  // Update user profile
  await adminClient
    .from('profiles')
    .update({ 
      verification_status: 'approved', 
      trust_level: 'custech_verified',
      updated_at: new Date().toISOString() 
    })
    .eq('user_id', userId);

  // Insert notification with correct 'body' column
  await adminClient.from('notifications').insert({
    user_id: userId,
    type: 'verification_approved',
    title: 'Student Verification Approved',
    body: 'Your CUSTECH student verification was approved! You now have the verified badge and can post marketplace listings, hostel rooms, and freelance services.'
  });

  await logAdminAction(user.id, 'approve_verification', 'verification_request', requestId);
  revalidatePath('/admin/verification');
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function rejectVerification(requestId: string, userId: string, reason: string) {
  const { user } = await checkAdminAccess(['super_admin', 'verification_officer']);
  const adminClient = await createAdminClient();

  await adminClient
    .from('verification_requests')
    .update({ 
      verification_status: 'rejected', 
      rejection_reason: reason || 'Documents did not meet criteria.',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq('id', requestId);

  await adminClient
    .from('profiles')
    .update({ 
      verification_status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  await adminClient.from('notifications').insert({
    user_id: userId,
    type: 'verification_rejected',
    title: 'Verification Request Update',
    body: `Your verification request was reviewed and could not be approved. Reason: ${reason || 'Incomplete or unreadable documents'}`
  });

  await logAdminAction(user.id, 'reject_verification', 'verification_request', requestId, { reason });
  revalidatePath('/admin/verification');
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

/**
 * Requirement 13: Admin Manual Verification Control (Fee Waived)
 * Grants instant verified status to any account without requiring payment.
 */
export async function manualVerifyUser(targetUserId: string, reason: string = 'Administrative override (fee waived)') {
  const { user } = await checkAdminAccess(['super_admin', 'verification_officer']);
  const adminClient = await createAdminClient();

  // 1. Update profiles table
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ 
      verification_status: 'approved', 
      trust_level: 'custech_verified',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', targetUserId);

  if (profileError) {
    console.error('Error updating profile verification:', profileError);
    return { success: false, error: profileError.message };
  }

  // 2. Record in verification_requests
  await adminClient.from('verification_requests').insert({
    user_id: targetUserId,
    verification_method: 'manual',
    full_name: 'Verified by Campus Administrator',
    phone: 'Admin Verified',
    payment_status: 'success',
    payment_amount: 0,
    payment_reference: `WAIVED-ADMIN-${Date.now()}`,
    verification_status: 'approved',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    rejection_reason: null
  });

  // 3. Notify user
  await adminClient.from('notifications').insert({
    user_id: targetUserId,
    type: 'verification_approved',
    title: 'Account Verified by Administration',
    body: `Your CUSTECH Marketplace student verification has been granted directly by campus administration (verification fee waived). Reason: ${reason}`
  });

  await logAdminAction(user.id, 'manual_verify_user', 'profile', targetUserId, { reason, feeWaived: true });
  
  revalidatePath('/admin/verification');
  revalidatePath('/admin/users');
  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Requirement 13: Admin Manual Revocation of Verification
 */
export async function manualRevokeVerification(targetUserId: string, reason: string = 'Revoked by administration') {
  const { user } = await checkAdminAccess(['super_admin', 'verification_officer']);
  const adminClient = await createAdminClient();

  await adminClient
    .from('profiles')
    .update({ 
      verification_status: 'unverified', 
      trust_level: 'registered',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', targetUserId);

  await adminClient
    .from('verification_requests')
    .update({ 
      verification_status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', targetUserId);

  await adminClient.from('notifications').insert({
    user_id: targetUserId,
    type: 'verification_revoked',
    title: 'Verification Status Revoked',
    body: `Your verified student badge was revoked by campus administration. Reason: ${reason}`
  });

  await logAdminAction(user.id, 'manual_revoke_verification', 'profile', targetUserId, { reason });

  revalidatePath('/admin/verification');
  revalidatePath('/admin/users');
  revalidatePath('/dashboard');
  return { success: true };
}

// Search users for admin inspection
export async function searchUsersForAdmin(term: string) {
  await checkAdminAccess();
  const adminClient = await createAdminClient();

  if (!term || term.trim().length < 2) {
    const { data } = await adminClient
      .from('profiles')
      .select('id, user_id, display_name, referral_code, matric_number, verification_status, trust_level, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    return data || [];
  }

  const q = term.trim();
  const { data } = await adminClient
    .from('profiles')
    .select('id, user_id, display_name, referral_code, matric_number, verification_status, trust_level, created_at')
    .or(`display_name.ilike.%${q}%,referral_code.ilike.%${q}%,matric_number.ilike.%${q}%`)
    .limit(20);

  return data || [];
}

// ==========================================
// 2. CONTROLLED USERNAME CHANGE ACTIONS
// ==========================================

export async function requestUsernameChange(newUsername: string, reason: string = '') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be logged in to request a username change.' };
  }

  const clean = newUsername.trim().toLowerCase();
  if (!/^[a-zA-Z0-9_]{5,30}$/.test(clean)) {
    return { success: false, error: 'Username must be 5-30 characters and contain only letters, numbers, and underscores.' };
  }

  if (RESERVED_USERNAMES.has(clean)) {
    return { success: false, error: 'This username is reserved by the platform and cannot be selected.' };
  }

  const adminClient = await createAdminClient();

  // Check if username is already taken in referral_code or username column
  const { data: existingRef } = await adminClient
    .from('profiles')
    .select('id')
    .ilike('referral_code', clean)
    .maybeSingle();

  if (existingRef) {
    return { success: false, error: 'This username is already taken. Please choose another.' };
  }

  const { data: existingUserCol } = await adminClient
    .from('profiles')
    .select('id')
    .ilike('username', clean)
    .maybeSingle();

  if (existingUserCol) {
    return { success: false, error: 'This username is already taken. Please choose another.' };
  }

  // Get current username
  const { data: currentProfile } = await adminClient
    .from('profiles')
    .select('referral_code, display_name')
    .eq('user_id', user.id)
    .single();

  const currentUsername = currentProfile?.referral_code || currentProfile?.display_name || 'user';

  // Check if there is already a pending request
  const { data: pending } = await adminClient
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('reported_type', 'username_change')
    .eq('status', 'pending')
    .maybeSingle();

  if (pending) {
    return { success: false, error: 'You already have a pending username change request awaiting administrator review.' };
  }

  // Insert request into reports table for admin queue
  const { error: insertError } = await adminClient.from('reports').insert({
    reporter_id: user.id,
    reported_type: 'username_change',
    reported_id: user.id,
    reason: `Username change to @${clean}`,
    details: JSON.stringify({
      currentUsername,
      newUsername: clean,
      reasonNote: reason.trim()
    }),
    status: 'pending'
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true };
}

export async function approveUsernameChange(reportId: string) {
  const { user: adminUser } = await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();

  const { data: report } = await adminClient
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (!report) {
    return { success: false, error: 'Request not found' };
  }

  let details: any = {};
  try {
    details = JSON.parse(report.details || '{}');
  } catch {}

  const targetUserId = report.reported_id;
  const newUsername = details.newUsername?.toLowerCase()?.trim();

  if (!newUsername) {
    return { success: false, error: 'Missing new username in request details' };
  }

  if (RESERVED_USERNAMES.has(newUsername)) {
    return { success: false, error: 'Cannot approve: Requested username is reserved by platform policies.' };
  }

  // Verify availability one more time against both columns
  const { data: takenRef } = await adminClient
    .from('profiles')
    .select('id')
    .ilike('referral_code', newUsername)
    .maybeSingle();

  if (takenRef && takenRef.id !== targetUserId) {
    return { success: false, error: 'Username was claimed by someone else while pending.' };
  }

  const { data: takenUserCol } = await adminClient
    .from('profiles')
    .select('id')
    .ilike('username', newUsername)
    .maybeSingle();

  if (takenUserCol && takenUserCol.id !== targetUserId) {
    return { success: false, error: 'Username was claimed by someone else while pending.' };
  }

  // 1. Update user profile referral_code and username
  const updatePayload: Record<string, any> = { 
    referral_code: newUsername,
    updated_at: new Date().toISOString() 
  };

  const { error: updateErr } = await adminClient
    .from('profiles')
    .update({ 
      ...updatePayload,
      username: newUsername
    })
    .eq('user_id', targetUserId);

  if (updateErr) {
    await adminClient
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', targetUserId);
  }

  // 2. Mark report resolved
  await adminClient
    .from('reports')
    .update({ 
      status: 'resolved', 
      action_taken: `Approved username change to @${newUsername}`,
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', reportId);

  // 3. Notify user
  await adminClient.from('notifications').insert({
    user_id: targetUserId,
    type: 'username_change_approved',
    title: 'Username Change Approved',
    body: `Your username and referral code have officially been updated to @${newUsername}. All your existing listings, reviews, and links remain active.`
  });

  await logAdminAction(adminUser.id, 'approve_username_change', 'profile', targetUserId, { newUsername });

  revalidatePath('/admin/usernames');
  revalidatePath('/admin/users');
  return { success: true };
}

export async function rejectUsernameChange(reportId: string, reason: string = '') {
  const { user: adminUser } = await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();

  const { data: report } = await adminClient
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (!report) {
    return { success: false, error: 'Request not found' };
  }

  await adminClient
    .from('reports')
    .update({ 
      status: 'dismissed', 
      action_taken: `Rejected username change. Reason: ${reason}`,
      reviewed_by: adminUser.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', reportId);

  await adminClient.from('notifications').insert({
    user_id: report.reported_id,
    type: 'username_change_rejected',
    title: 'Username Change Request',
    body: `Your username change request was not approved by administration. Reason: ${reason || 'Does not meet university marketplace criteria'}`
  });

  await logAdminAction(adminUser.id, 'reject_username_change', 'profile', report.reported_id, { reason });

  revalidatePath('/admin/usernames');
  return { success: true };
}

// ==========================================
// 3. USER MANAGEMENT ACTIONS
// ==========================================

export async function suspendUser(userId: string, reason: string) {
  const { user } = await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();

  await adminClient
    .from('profiles')
    .update({ 
      trust_level: 'registered',
      updated_at: new Date().toISOString() 
    })
    .eq('user_id', userId);

  await adminClient
    .from('listings')
    .update({ status: 'removed' })
    .eq('seller_id', userId)
    .eq('status', 'active');

  await adminClient.from('notifications').insert({
    user_id: userId,
    type: 'account_suspended',
    title: 'Account Flagged',
    body: `Your account has been temporarily flagged for review. Reason: ${reason}`
  });

  await logAdminAction(user.id, 'suspend_user', 'profile', userId, { reason });
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function banUser(userId: string, reason: string) {
  const { user } = await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();

  await adminClient
    .from('listings')
    .update({ status: 'removed' })
    .eq('seller_id', userId);

  await adminClient.from('notifications').insert({
    user_id: userId,
    type: 'account_banned',
    title: 'Account Terminated',
    body: `Your account has been suspended for violation of campus marketplace policies. Reason: ${reason}`
  });

  await logAdminAction(user.id, 'ban_user', 'profile', userId, { reason });
  revalidatePath('/admin/users');
  return { success: true };
}

// ==========================================
// 4. LISTING ACTIONS
// ==========================================

export async function removeListing(listingId: string, sellerId: string, reason: string) {
  const { user } = await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();

  await adminClient
    .from('listings')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', listingId);

  await adminClient.from('notifications').insert({
    user_id: sellerId,
    type: 'listing_removed',
    title: 'Listing Removed by Moderator',
    body: `Your listing was removed by campus administration. Reason: ${reason}`
  });

  await logAdminAction(user.id, 'remove_listing', 'listing', listingId, { reason });
  revalidatePath('/admin/listings');
  revalidatePath('/marketplace');
  return { success: true };
}

export async function featureListing(listingId: string, currentState: boolean) {
  const { user } = await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();

  await adminClient
    .from('listings')
    .update({ is_featured: !currentState, updated_at: new Date().toISOString() })
    .eq('id', listingId);

  await logAdminAction(user.id, currentState ? 'unfeature_listing' : 'feature_listing', 'listing', listingId);
  revalidatePath('/admin/listings');
  revalidatePath('/marketplace');
  return { success: true };
}

// ==========================================
// 5. REPORT & DISPUTE ACTIONS
// ==========================================

export async function resolveReport(reportId: string, notes: string) {
  const { user } = await checkAdminAccess(['super_admin', 'moderator']);
  const adminClient = await createAdminClient();

  await adminClient
    .from('reports')
    .update({ 
      status: 'resolved', 
      action_taken: notes, 
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString() 
    })
    .eq('id', reportId);

  await logAdminAction(user.id, 'resolve_report', 'report', reportId, { notes });
  revalidatePath('/admin/reports');
  return { success: true };
}

export async function resolveDispute(disputeId: string, resolution: string) {
  const { user } = await checkAdminAccess(['super_admin', 'support_agent']);
  const adminClient = await createAdminClient();

  await adminClient
    .from('disputes')
    .update({ 
      status: 'resolved', 
      resolution: resolution, 
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', disputeId);

  await logAdminAction(user.id, 'resolve_dispute', 'dispute', disputeId, { resolution });
  revalidatePath('/admin/disputes');
  return { success: true };
}

// ==========================================
// 6. ADMIN RBAC MANAGEMENT
// ==========================================

export async function assignAdminRole(targetUserId: string, role: string) {
  const { user } = await checkAdminAccess(['super_admin']);
  const adminClient = await createAdminClient();

  const validRoles = ['super_admin', 'moderator', 'finance_admin', 'verification_officer', 'support_agent'];
  if (!validRoles.includes(role)) {
    throw new Error('Invalid administrative role specified.');
  }

  // Upsert into admin_roles
  const { error: roleError } = await adminClient
    .from('admin_roles')
    .upsert({
      user_id: targetUserId,
      role: role
    }, { onConflict: 'user_id' });

  if (roleError) {
    console.error('assignAdminRole error:', roleError);
    throw new Error(roleError.message);
  }

  // Update profile role column if present
  await adminClient
    .from('profiles')
    .update({ role: role, updated_at: new Date().toISOString() })
    .eq('user_id', targetUserId);

  await adminClient.from('notifications').insert({
    user_id: targetUserId,
    type: 'role_granted',
    title: 'Administrative Role Assigned',
    body: `You have been granted the ${role.replace('_', ' ')} role on the CUSTECH administration portal.`
  });

  await logAdminAction(user.id, 'assign_admin_role', 'user', targetUserId, { role });
  revalidatePath('/admin/roles');
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${targetUserId}`);
  return { success: true };
}

export async function revokeAdminRole(targetUserId: string) {
  const { user } = await checkAdminAccess(['super_admin']);

  if (targetUserId === user.id) {
    throw new Error('You cannot revoke your own super administrator privileges.');
  }

  const adminClient = await createAdminClient();

  await adminClient
    .from('admin_roles')
    .delete()
    .eq('user_id', targetUserId);

  await adminClient
    .from('profiles')
    .update({ role: 'student', updated_at: new Date().toISOString() })
    .eq('user_id', targetUserId);

  await adminClient.from('notifications').insert({
    user_id: targetUserId,
    type: 'role_revoked',
    title: 'Administrative Access Revoked',
    body: 'Your administrative privileges on CUSTECH Marketplace have been revoked.'
  });

  await logAdminAction(user.id, 'revoke_admin_role', 'user', targetUserId);
  revalidatePath('/admin/roles');
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${targetUserId}`);
  return { success: true };
}

export interface OnboardAdminInput {
  email: string;
  fullName: string;
  password?: string;
  role: string;
  department?: string;
  phoneNumber?: string;
}

/**
 * Requirement: Onboard new administrators directly from the Admin Dashboard
 * Creates pre-verified accounts with chosen RBAC role, or promotes existing users.
 */
export async function onboardNewAdmin(input: OnboardAdminInput) {
  const { user } = await checkAdminAccess(['super_admin']);
  const adminClient = await createAdminClient();

  const email = (input.email || '').trim().toLowerCase();
  const fullName = (input.fullName || '').trim();
  const role = input.role || 'moderator';
  const password = input.password?.trim() || `Admin_${Math.random().toString(36).slice(-6)}!${Date.now().toString().slice(-3)}`;

  if (!email || !email.includes('@')) {
    return { success: false, error: 'A valid email address is required.' };
  }

  if (!fullName || fullName.length < 2) {
    return { success: false, error: 'Full legal or staff name is required.' };
  }

  const validRoles = ['super_admin', 'moderator', 'finance_admin', 'verification_officer', 'support_agent'];
  if (!validRoles.includes(role)) {
    return { success: false, error: 'Invalid administrative role selected.' };
  }

  try {
    // 1. Check if user already exists in auth.users
    const { data: listData } = await adminClient.auth.admin.listUsers();
    const existingUser = (listData?.users || []).find(
      u => (u.email || '').toLowerCase() === email
    );

    let targetUserId: string;
    let isNewUser = false;

    if (existingUser) {
      targetUserId = existingUser.id;
    } else {
      // 2. Create brand new user in auth.users
      const { data: newUserData, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          display_name: fullName
        }
      });

      if (createErr || !newUserData?.user) {
        console.error('createUser error in onboardNewAdmin:', createErr);
        return { 
          success: false, 
          error: createErr?.message || 'Failed to create new administrator user account.' 
        };
      }

      targetUserId = newUserData.user.id;
      isNewUser = true;
    }

    // 3. Upsert admin profile (approved, verified, with full name)
    const { error: profileErr } = await adminClient
      .from('profiles')
      .upsert({
        user_id: targetUserId,
        display_name: fullName,
        phone: input.phoneNumber?.trim() || null,
        department: input.department?.trim() || null,
        verification_status: 'approved',
        trust_level: 'custech_verified',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (profileErr) {
      console.warn('Profile upsert notice:', profileErr.message);
    }

    // 4. Assign role in admin_roles table
    const { error: roleErr } = await adminClient
      .from('admin_roles')
      .upsert({
        user_id: targetUserId,
        role,
        assigned_by: user.id
      }, { onConflict: 'user_id' });

    if (roleErr) {
      await adminClient
        .from('admin_roles')
        .upsert({
          user_id: targetUserId,
          role,
          assigned_by: user.id
        }, { onConflict: 'user_id,role' });
    }

    // 5. Ensure wallet is created
    await adminClient
      .from('wallets')
      .upsert({
        user_id: targetUserId,
        balance: 0,
        locked_balance: 0,
        currency: 'NGN'
      }, { onConflict: 'user_id' });

    // 6. Record verification request as approved & fee waived
    await adminClient
      .from('verification_requests')
      .insert({
        user_id: targetUserId,
        verification_method: 'manual',
        full_name: fullName,
        phone: input.phoneNumber || 'Admin Account',
        payment_status: 'success',
        payment_amount: 0,
        payment_reference: `ONBOARDED-ADMIN-${Date.now()}`,
        verification_status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        student_info: { role, onboarded_by: user.id, fee_waived: true }
      });

    // 7. Send in-app notification to new admin
    await adminClient.from('notifications').insert({
      user_id: targetUserId,
      type: 'role_granted',
      title: 'Welcome to CUSTECH Administration Team',
      body: `You have been onboarded as a ${role.replace('_', ' ')}. You have immediate administrative access to the campus marketplace.`
    });

    await logAdminAction(user.id, 'onboard_admin', 'user', targetUserId, {
      email,
      fullName,
      role,
      isNewUser
    });

    revalidatePath('/admin');
    revalidatePath('/admin/roles');
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${targetUserId}`);

    return {
      success: true,
      isNewUser,
      userId: targetUserId,
      email,
      password: isNewUser ? password : null,
      role,
      message: isNewUser
        ? `Administrator account for ${fullName} (${email}) created and authorized successfully!`
        : `Existing account (${email}) successfully elevated to ${role.replace('_', ' ')}!`
    };
  } catch (error: any) {
    console.error('onboardNewAdmin caught error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred during admin onboarding.' };
  }
}

/**
 * Search registered campus users by email, name or matric number to promote them
 */
export async function searchPotentialAdmins(query: string) {
  await checkAdminAccess(['super_admin']);
  const adminClient = await createAdminClient();

  const q = (query || '').trim();
  if (q.length < 2) return [];

  // 1. Search profiles
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('user_id, display_name, avatar_url, department, matric_number, verification_status')
    .or(`display_name.ilike.%${q}%,matric_number.ilike.%${q}%,referral_code.ilike.%${q}%`)
    .limit(10);

  // 2. Search auth users for email match
  const { data: authData } = await adminClient.auth.admin.listUsers();
  const matchingAuthUsers = (authData?.users || []).filter(
    u => (u.email || '').toLowerCase().includes(q.toLowerCase())
  ).slice(0, 10);

  // Combine and deduplicate
  const userMap = new Map<string, any>();

  for (const u of matchingAuthUsers) {
    userMap.set(u.id, {
      userId: u.id,
      email: u.email,
      displayName: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
      department: null,
      matricNumber: null,
      verificationStatus: 'unverified'
    });
  }

  if (profiles) {
    for (const p of profiles) {
      const existing = userMap.get(p.user_id) || {};
      const authU = (authData?.users || []).find(u => u.id === p.user_id);
      userMap.set(p.user_id, {
        ...existing,
        userId: p.user_id,
        email: authU?.email || existing.email || 'Registered User',
        displayName: p.display_name || existing.displayName,
        department: p.department,
        matricNumber: p.matric_number,
        verificationStatus: p.verification_status
      });
    }
  }

  const userIds = Array.from(userMap.keys());
  if (userIds.length > 0) {
    const { data: existingRoles } = await adminClient
      .from('admin_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    const rolesMap = new Map((existingRoles || []).map(r => [r.user_id, r.role]));
    for (const [id, userObj] of userMap.entries()) {
      userObj.existingRole = rolesMap.get(id) || null;
    }
  }

  return Array.from(userMap.values());
}


// ==========================================
// 7. ADMIN ESCROW ORDER RESOLUTION
// ==========================================

export async function resolveEscrowOrder(
  orderId: string, 
  action: 'release_to_seller' | 'refund_to_buyer', 
  notes: string
) {
  const { user } = await checkAdminAccess(['super_admin', 'finance_admin']);
  const adminClient = await createAdminClient();

  if (action === 'release_to_seller') {
    const { data: rpcRes, error: rpcError } = await adminClient.rpc('release_escrow_funds', {
      p_order_id: orderId,
      p_caller_id: user.id
    });

    if (rpcError || !rpcRes?.success) {
      throw new Error(rpcError?.message || rpcRes?.error || 'Failed to release escrow funds.');
    }

    await adminClient
      .from('escrow_orders')
      .update({ resolution_notes: notes, resolved_by: user.id })
      .eq('id', orderId);
  } else if (action === 'refund_to_buyer') {
    const { data: rpcRes, error: rpcError } = await adminClient.rpc('refund_escrow_order', {
      p_order_id: orderId,
      p_caller_id: user.id,
      p_reason: notes || 'Administrative dispute refund.'
    });

    if (rpcError || !rpcRes?.success) {
      throw new Error(rpcError?.message || rpcRes?.error || 'Failed to refund escrow order.');
    }

    await adminClient
      .from('escrow_orders')
      .update({ resolution_notes: notes, resolved_by: user.id })
      .eq('id', orderId);
  }

  await logAdminAction(user.id, 'resolve_escrow_order', 'escrow_order', orderId, { action, notes });
  revalidatePath('/admin/orders');
  return { success: true };
}


