import { NextResponse } from 'next/server';
import { improveListingDescription, suggestListingTitle } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, text, title, category } = body;

    if (type === 'suggest_title') {
      if (!text) return NextResponse.json({ error: 'Description is required' }, { status: 400 });
      const suggestedTitle = await suggestListingTitle(text, category || 'General');
      return NextResponse.json({ result: suggestedTitle.trim().replace(/^["']|["']$/g, '') });
    }

    if (type === 'improve_description') {
      if (!text) return NextResponse.json({ error: 'Description is required' }, { status: 400 });
      const improved = await improveListingDescription(text, title || '', category || 'General');
      return NextResponse.json({ result: improved.trim() });
    }

    return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  } catch (error: any) {
    console.error('AI enhance error:', error);
    return NextResponse.json({ error: 'Failed to process AI enhancement' }, { status: 500 });
  }
}
