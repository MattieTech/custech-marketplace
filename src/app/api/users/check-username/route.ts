import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'custech', 'support', 'help', 'api', 
  'dashboard', 'moderator', 'official', 'security', 'scamcheck', 
  'marketplace', 'staff', 'system', 'root'
]);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get('username')?.trim() || '';

    if (!rawUsername) {
      return NextResponse.json({ available: false, message: 'Username is required.' }, { status: 400 });
    }

    const username = rawUsername.toLowerCase();

    if (username.length < 5) {
      return NextResponse.json({ available: false, message: 'Username must be at least 5 characters.' });
    }

    if (username.length > 30) {
      return NextResponse.json({ available: false, message: 'Username cannot exceed 30 characters.' });
    }

    const validPattern = /^[a-zA-Z0-9_]+$/;
    if (!validPattern.test(username)) {
      return NextResponse.json({ available: false, message: 'Only letters, numbers, and underscores are allowed.' });
    }

    if (RESERVED_USERNAMES.has(username)) {
      return NextResponse.json({ available: false, message: 'This username is reserved by the platform.' });
    }

    const admin = await createAdminClient();
    const { data: existing, error } = await admin
      .from('profiles')
      .select('id')
      .ilike('referral_code', username)
      .maybeSingle();

    if (error) {
      console.error('Check username error:', error);
      return NextResponse.json({ available: false, message: 'Error checking availability.' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ available: false, message: 'Username is already taken.' });
    }

    return NextResponse.json({ available: true, message: 'Username is available!' });
  } catch (err: any) {
    console.error('Unhandled check-username error:', err);
    return NextResponse.json({ available: false, message: 'Server error checking username.' }, { status: 500 });
  }
}
