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

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Description text is required' }, { status: 400 });
    }

    if (text.length > 2000) {
      return NextResponse.json({ error: 'Text must not exceed 2000 characters' }, { status: 400 });
    }

    if (title && typeof title === 'string' && title.length > 200) {
      return NextResponse.json({ error: 'Title must not exceed 200 characters' }, { status: 400 });
    }

    const safeCategory = typeof category === 'string' ? category.slice(0, 50) : 'General';

    if (type === 'suggest_title') {
      const suggestedTitle = await suggestListingTitle(text, safeCategory);
      return NextResponse.json({ result: suggestedTitle.trim().replace(/^["']|["']$/g, '') });
    }

    if (type === 'improve_description') {
      const improved = await improveListingDescription(text, typeof title === 'string' ? title : '', safeCategory);
      return NextResponse.json({ result: improved.trim() });
    }

    return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  } catch (error: any) {
    console.error('AI enhance error:', error);
    return NextResponse.json({ error: 'Failed to process AI enhancement' }, { status: 500 });
  }
}
