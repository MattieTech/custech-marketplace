import { NextResponse } from 'next/server';
import { aiInterpretSearch } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json({ results: [], interpretation: '' });
    }

    const trimmed = query.trim().slice(0, 100);
    const analysis = await aiInterpretSearch(trimmed);

    const supabase = await createClient();

    let listingsQuery = supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        price,
        listing_type,
        location,
        created_at,
        listing_images(url)
      `)
      .eq('status', 'active')
      .limit(8);

    if (analysis.targetType !== 'all') {
      listingsQuery = listingsQuery.eq('listing_type', analysis.targetType);
    }

    if (analysis.maxPriceNaira && analysis.maxPriceNaira > 0) {
      listingsQuery = listingsQuery.lte('price', Math.round(analysis.maxPriceNaira * 100));
    }

    // Build search filter using sanitized keywords to prevent PostgREST filter injection
    if (analysis.keywords && analysis.keywords.length > 0) {
      const sanitized = analysis.keywords
        .map(kw => kw.replace(/[^a-zA-Z0-9\s]/g, '').trim())
        .filter(kw => kw.length > 0);

      if (sanitized.length > 0) {
        const orFilters = sanitized
          .map(kw => `title.ilike.%${kw}%,description.ilike.%${kw}%`)
          .join(',');
        listingsQuery = listingsQuery.or(orFilters);
      }
    }

    const { data: listings, error } = await listingsQuery;

    if (error) {
      console.warn('AI search database error:', error);
    }

    const formattedResults = (listings || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.listing_type,
      price: item.price ? Math.round(item.price / 100) : 0,
      location: item.location,
      imageUrl: item.listing_images?.[0]?.url || null,
      link: item.listing_type === 'housing'
        ? `/housing/${item.id}`
        : item.listing_type === 'service'
        ? `/services/${item.id}`
        : `/marketplace/${item.id}`
    }));

    return NextResponse.json({
      success: true,
      analysis,
      interpretation: analysis.summary,
      results: formattedResults
    });
  } catch (error: any) {
    console.error('AI search route error:', error);
    return NextResponse.json({
      success: false,
      results: [],
      interpretation: 'Could not complete AI search interpretation at this time.'
    });
  }
}
