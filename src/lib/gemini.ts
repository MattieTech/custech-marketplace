'use server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Strip any stray emojis from AI responses to ensure 100% professional tone
function stripEmojis(text: string): string {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu;
  return text.replace(emojiRegex, '').trim();
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  // 1. Intelligent Campus Offline Assistant (Active while user configures their Gemini API key)
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_gemini') || GEMINI_API_KEY === 'placeholder') {
    const lower = prompt.toLowerCase();

    if (lower.includes('safe') || lower.includes('meet') || lower.includes('zone') || lower.includes('where')) {
      return `CUSTECH Campus Trade Safety Rules:
1. Approved Safe Zones: Always meet buyers and sellers in high-traffic campus areas during daylight hours:
   - Student Union Building (SUB) Ground Concourse
   - Central University Library Entrance
   - Faculty of Engineering Quadrangle
   - Osara Main Security Gate Checkpoint
2. Never meet strangers in secluded bush paths, remote farm roads, or private off-campus rooms.
3. Bring a course-mate or trusted friend along for high-value tech transactions.`;
    }

    if (lower.includes('verify') || lower.includes('badge') || lower.includes('id') || lower.includes('matric')) {
      return `CUSTECH Student ID Verification:
1. Navigate to your Dashboard -> Verification.
2. Two verification routes are supported:
   - Fast Track (School ID Card): Upload a clear photo of your official CUSTECH Student ID Card and your face profile photo.
   - Manual Student Record: Provide your Matric Number, Faculty, Department, Academic Level, and Lodge location.
3. Verified accounts receive the green 'Verified Student' shield badge, unlocking higher buyer trust and priority search ranking.`;
    }

    if (lower.includes('fake') || lower.includes('alert') || lower.includes('scam') || lower.includes('bank') || lower.includes('sms')) {
      return `Anti-Scam & Fake Bank Alert Defense:
1. Never release an item based on an SMS alert screenshot or incoming text message. Fraudsters use spoofed bulk SMS headers.
2. Always log into your official mobile banking application (OPay, Palmpay, Kuda, GTBank, Zenith) and verify that your ACTUAL available ledger balance has increased.
3. For in-person deals, use our 4-Digit Meetup Handshake PIN so both parties confirm inspection before closing the transaction.`;
    }

    if (lower.includes('hostel') || lower.includes('lodge') || lower.includes('room') || lower.includes('house') || lower.includes('rent')) {
      return `Off-Campus Lodges & Hostel Inspection Guide:
1. Never pay upfront deposit or 'agent commitment fee' before physically entering and inspecting the room in Osara or surrounding student lodges.
2. Verify water supply, electricity metering, gate security, and roof condition in person.
3. Pay directly to verified caretakers or landlords listed on CUSTECH Marketplace with zero middleman fees.`;
    }

    if (lower.includes('discount') || lower.includes('deal') || lower.includes('cheap') || lower.includes('coupon') || lower.includes('code')) {
      return `CUSTECH Campus Deals & Savings:
1. Visit /deals to explore verified clearance discounts and price drops across campus.
2. Visit /free-items to claim 100% free textbook donations and student giveaways.
3. Message sellers directly to arrange student-friendly pricing and bundle deals.`;
    }

    return `Welcome to CUSTECH Marketplace AI Support.
I can assist you with:
- Campus safe trade locations (SUB, Central Library, Osara Main Gate)
- Student ID & Matriculation verification
- Fake bank alert defense and transaction safety
- Off-campus hostel and lodge guidelines
- Listing products and campus freelance services

Please feel free to ask any specific question!`;
  }

  // 2. Live Google Gemini API Integration with Multi-Model Fallback
  const candidateModels = [GEMINI_MODEL, 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const body: any = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      };

      if (systemInstruction) {
        body.systemInstruction = {
          role: 'user',
          parts: [{ text: systemInstruction + ' Maintain professional tone with zero emojis.' }]
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          return stripEmojis(rawText);
        }
      }
    } catch (err) {
      console.warn(`Gemini model ${model} error:`, err);
    }
  }

  return 'Our campus marketplace assistant is temporarily optimizing connection. Please ensure you inspect all items in daylight on campus before completing payment.';
}

export async function improveListingDescription(
  currentDescription: string,
  title: string,
  category: string
): Promise<string> {
  const prompt = `Please improve this marketplace listing description. Make it more engaging, professional, and highlight key selling points for campus students.
  
Title: ${title}
Category: ${category}
Current Description: ${currentDescription}`;

  const systemInstruction = 'You are an expert copywriter for CUSTECH Marketplace in Nigeria. Improve the description while keeping it truthful, concise, and student-appropriate. Never invent false details. Strictly no emojis.';

  return generateText(prompt, systemInstruction);
}

export async function suggestListingTitle(
  description: string,
  category: string
): Promise<string> {
  const prompt = `Suggest a catchy, clear, and concise title (max 50 characters) for this marketplace listing.
  
Category: ${category}
Description: ${description}`;

  const systemInstruction = 'You are a copywriter for CUSTECH Marketplace. Output ONLY the suggested title text with no quotation marks. Strictly no emojis.';

  return generateText(prompt, systemInstruction);
}

export async function getMarketplaceSafetyAdvice(itemType: string, category: string): Promise<string> {
  const prompt = `Provide 3 concise, highly relevant safety tips for a CUSTECH student buying or selling a ${category} (${itemType}) on campus.`;
  const systemInstruction = 'You are the CUSTECH Campus Safety Advisor. Provide direct, bulleted safety tips for Nigerian university students without emojis or accusatory language.';

  return generateText(prompt, systemInstruction);
}

export interface AISearchAnalysis {
  keywords: string[];
  targetType: 'all' | 'product' | 'housing' | 'service' | 'free';
  categoryHint: string | null;
  maxPriceNaira: number | null;
  summary: string;
}

export async function aiInterpretSearch(userQuery: string): Promise<AISearchAnalysis> {
  const prompt = `You are an AI Search Engine Parser for CUSTECH Campus Marketplace in Osara, Nigeria.
Analyze this user search query: "${userQuery}"

Output a STRICT raw JSON object with no markdown fences, no formatting, no emojis, with these exact keys:
{
  "keywords": ["keyword1", "keyword2"],
  "targetType": "all" | "product" | "housing" | "service" | "free",
  "categoryHint": "category_slug or null",
  "maxPriceNaira": number or null,
  "summary": "Brief 1-sentence friendly explanation of what you are searching for"
}`;

  try {
    const raw = await generateText(prompt, 'You are an accurate JSON search parser. Return ONLY pure valid JSON. No markdown backticks.');
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        keywords: Array.isArray(parsed.keywords) && parsed.keywords.length > 0 ? parsed.keywords : [userQuery.trim()],
        targetType: ['all', 'product', 'housing', 'service', 'free'].includes(parsed.targetType) ? parsed.targetType : 'all',
        categoryHint: parsed.categoryHint || null,
        maxPriceNaira: typeof parsed.maxPriceNaira === 'number' ? parsed.maxPriceNaira : null,
        summary: parsed.summary || `Searching for ${userQuery}`
      };
    }
  } catch (e) {
    console.warn('AI search interpret fallback:', e);
  }

  // Fallback heuristic
  const q = userQuery.toLowerCase();
  let targetType: 'all' | 'product' | 'housing' | 'service' | 'free' = 'all';
  if (q.includes('hostel') || q.includes('room') || q.includes('lodge') || q.includes('flat') || q.includes('bedspace')) {
    targetType = 'housing';
  } else if (q.includes('repair') || q.includes('service') || q.includes('design') || q.includes('tutor') || q.includes('barb') || q.includes('fix')) {
    targetType = 'service';
  } else if (q.includes('free') || q.includes('giveaway')) {
    targetType = 'free';
  }

  return {
    keywords: userQuery.split(/\s+/).filter(w => w.length > 2),
    targetType,
    categoryHint: null,
    maxPriceNaira: null,
    summary: `Searching for ${userQuery}`
  };
}
