import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const password = body.password;

    if (!password) {
      return NextResponse.json({ error: 'Password is required to delete account' }, { status: 400 });
    }

    // Verify password
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password
    });

    if (authError) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
    }

    const admin = await createAdminClient();
    const userId = user.id;

    // Cascade delete
    await admin.from('listings').delete().or(`user_id.eq.${userId},seller_id.eq.${userId}`);
    await admin.from('saved_listings').delete().eq('user_id', userId);
    await admin.from('notifications').delete().eq('user_id', userId);
    await admin.from('verification_requests').delete().eq('user_id', userId);
    await admin.from('profiles').delete().eq('user_id', userId);
    await admin.auth.admin.deleteUser(userId);

    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Account deletion API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
