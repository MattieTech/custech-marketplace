import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type AdminRole = 'super_admin' | 'moderator' | 'finance_admin' | 'verification_officer' | 'support_agent';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'matthewaliu001@gmail.com')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export async function checkAdminAccess(allowedRoles?: AdminRole[]) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login?redirect=/admin');
  }

  const userEmail = (user.email || '').toLowerCase();
  const isEnvAdmin = ADMIN_EMAILS.includes(userEmail);

  // Check admin role in database
  const adminClient = await createAdminClient();
  let { data: adminData } = await adminClient
    .from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  // If user is in ADMIN_EMAILS list but doesn't have an admin_roles row yet, auto-elevate
  if ((!adminData || !adminData.role) && isEnvAdmin) {
    const { data: insertedRole, error: insertErr } = await adminClient
      .from('admin_roles')
      .upsert({
        user_id: user.id,
        role: 'super_admin'
      }, { onConflict: 'user_id,role' })
      .select('role')
      .single();

    if (!insertErr && insertedRole) {
      adminData = insertedRole;
    }
  }

  if (!adminData || !adminData.role) {
    redirect('/dashboard?error=unauthorized_admin');
  }

  const userRole = adminData.role as AdminRole;

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    redirect('/admin'); // Redirect to main admin overview if unauthorized for this specific subpage
  }

  return { user, role: userRole };
}

export async function isUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const userEmail = (user.email || '').toLowerCase();
    if (ADMIN_EMAILS.includes(userEmail)) return true;

    const adminClient = await createAdminClient();
    const { data } = await adminClient
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    return !!data?.role;
  } catch {
    return false;
  }
}

export async function logAdminAction(
  adminId: string, 
  action: string, 
  targetType: string, 
  targetId: string | null, 
  details?: Record<string, any>, 
  ipAddress?: string
) {
  try {
    const adminClient = await createAdminClient();
    await adminClient.from('audit_logs').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details || {},
      ip_address: ipAddress || null
    });
  } catch (error) {
    console.warn('Audit log notice (table may be syncing):', error);
  }
}
