import { NextResponse } from 'next/server';
import { generateText } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message cannot exceed 500 characters' }, { status: 400 });
    }

    const systemInstruction = `You are CUSTECH Assistant, an AI helper for CUSTECH Marketplace (Confluence University of Science and Technology, Osara, Kogi State, Nigeria).
Guidelines:
1. Provide helpful, accurate advice for students on buying, selling, finding housing, offering services, or campus safety.
2. Recommend safe meeting locations on campus (e.g. Student Center, Main Library, Faculty buildings during daylight).
3. Warn students NEVER to make advance payments or bank transfers before inspecting items in person.
4. Warn students NEVER to pay for accommodation before physically visiting the room.
5. NEVER accuse specific people of being scammers or make definitive legal judgments.
6. Keep answers concise, clear, and student-friendly. Strictly no emojis.`;

    const reply = await generateText(message, systemInstruction);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('AI assistant error:', error);
    return NextResponse.json({ 
      reply: 'The CUSTECH assistant is temporarily resting. Please remember to trade only in public daylight areas on campus!' 
    });
  }
}
