import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createReportSchema } from '@/lib/validations/report';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request
    const validatedData = createReportSchema.parse(body);

    // Rate limiting: check recent reports by user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error: countError } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('reporter_id', user.id)
      .gte('created_at', today.toISOString());

    if (countError) throw countError;

    if (count !== null && count >= 10) {
      return NextResponse.json({ message: 'Rate limit exceeded. Try again tomorrow.' }, { status: 429 });
    }

    const reportedType = validatedData.reportedListingId ? 'listing' : 'user';
    const reportedId = validatedData.reportedListingId || validatedData.reportedUserId;

    if (!reportedId) {
      return NextResponse.json({ message: 'Must provide either a reported user or listing' }, { status: 400 });
    }

    const details = validatedData.evidenceUrls && validatedData.evidenceUrls.length > 0
      ? `${validatedData.description}\n\nEvidence: ${validatedData.evidenceUrls.join(', ')}`
      : validatedData.description;

    // Insert report
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_type: reportedType,
        reported_id: reportedId,
        reason: validatedData.category,
        details: details,
        status: 'pending'
      });

    if (insertError) {
      console.error('Report insert error:', insertError);
      return NextResponse.json({ message: 'Failed to create report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Report submitted successfully' });
  } catch (error: any) {
    console.error('Report API error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
