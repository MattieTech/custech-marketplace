export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  tag: string;
  tone: 'pidgin_humor' | 'accommodation' | 'seller_cashout' | 'food_services' | 'weekly_digest';
  subject: string;
  previewText: string;
  badge: string;
  headline: string;
  bodyParagraphs: string[];
  bulletPoints: string[];
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
}

export const PRESET_EMAIL_CAMPAIGNS: CampaignTemplate[] = [
  {
    id: 'pidgin_deals',
    name: '🔥 "Omo Who Dey Breath?" (Pidgin Campus Deals)',
    description: 'Relatable, humorous Nigerian Pidgin email highlighting crazy discounted electronics, gadgets & food.',
    tag: 'Humor & Pidgin',
    tone: 'pidgin_humor',
    subject: 'Omo, who dey sell cheap iPhone & mini fridge for campus? 👀',
    previewText: 'Fresh deals don land on CUSTECH Marketplace! Grab dem before hostel mate carry am go.',
    badge: '🔥 HOT CAMPUS DEALS',
    headline: 'No Go Carry Last This Semester!',
    bodyParagraphs: [
      'Omo! As semester just dey pick up, you still dey borrow phone charger or dey struggle to boil water with ring boiler?',
      'Verified CUSTECH students just dropped clean laptops, smartphones, power banks, clothes, and mini fridges at give-away campus student prices.',
      'No need to risk road-side sellers or pay agent money. Connect directly with verified course mates and lodge neighbors, inspect physical items in daylight, and pay safely on meetup!'
    ],
    bulletPoints: [
      '📱 Clean iPhones & Androids from students switching gadgets',
      '⚡ Fast-charging power banks for long library & lecture hall hours',
      '🍳 Mini fridges, cooking pots & kettles for hostel cooking',
      '👟 Affordable campus fashion, hoodies & accessories'
    ],
    ctaText: 'Explore Fresh Campus Deals →',
    ctaUrl: '/marketplace',
    secondaryCtaText: 'Got unused stuff? Sell it here for cash',
    secondaryCtaUrl: '/dashboard/listings/new'
  },
  {
    id: 'hostel_hunting',
    name: '🏠 "Hostel Wahala Don Finish" (Accommodation Alert)',
    description: 'Solves student lodge hunting headache, eliminating greedy middlemen and scam agents.',
    tag: 'Hostels & Lodges',
    tone: 'accommodation',
    subject: 'Hostel wahala? Clean verified lodges near campus without agent scam 🏠',
    previewText: 'Find your next lodge directly from verified owners with zero agent wahala.',
    badge: '🏠 VERIFIED CAMPUS LODGES',
    headline: 'Say Goodbye to 50k Agent Wahala!',
    bodyParagraphs: [
      'Finding a quiet, clean, and secure lodge around CUSTECH shouldn\'t give you high blood pressure or drain your pocket with bogus "inspection fees".',
      'On CUSTECH Marketplace, verified students and lodge owners list single rooms, self-contain apartments, and shared flats directly.',
      'Check water situation, light availability, walk distance to campus gate, and contact owners directly without any agent in between.'
    ],
    bulletPoints: [
      '🛏️ Self-contain & Single rooms walking distance to school gate',
      '💡 Verified light & running water conditions',
      '🤝 Direct contact with owners — NO agent inspection fee!',
      '🔐 Daylight physical inspection before you pay a single kobo'
    ],
    ctaText: 'Browse Available Hostels →',
    ctaUrl: '/housing',
    secondaryCtaText: 'Have an empty room or sublet? Post it here',
    secondaryCtaUrl: '/dashboard/properties/new'
  },
  {
    id: 'seller_cashout',
    name: '💸 "Turn Clutter into Urgent 2k-50k" (Seller Motivation)',
    description: 'Encourages students to clean out their rooms, sell unused textbooks, fans, or shoes, and make instant cash.',
    tag: 'Quick Cash Out',
    tone: 'seller_cashout',
    subject: 'Turn that your unused textbook & gadget into urgent 2k–50k cash 💸',
    previewText: 'Why keep wetin you no dey use? Verified students dey find am right now!',
    badge: '💰 QUICK STUDENT CASHOUT',
    headline: 'Why Keep Wetin You No Dey Use?',
    bodyParagraphs: [
      'Look around your hostel room right now.',
      'That 100L or 200L textbook you don finish with, the extra pair of sneakers you rarely wear, that spare pressing iron or fan — another student on campus is looking for it and ready to pay today.',
      'Instead of letting it collect dust till you graduate, snap 2 clear photos, post it on CUSTECH Marketplace in under 60 seconds, and collect your money straight into your OPay, PalmPay, or bank account.'
    ],
    bulletPoints: [
      '📸 Free to post: takes less than 1 minute',
      '💰 100% of the sale goes to your pocket — 0% commission',
      '🎓 Only verified campus students see your ad',
      '🤝 Meet safely in public campus spots during daylight'
    ],
    ctaText: 'Post a Free Listing Now →',
    ctaUrl: '/dashboard/listings/new',
    secondaryCtaText: 'See what other students are buying',
    secondaryCtaUrl: '/marketplace'
  },
  {
    id: 'food_and_services',
    name: '🍔✂️ "Who Get Hustle?" (Food & Student Services)',
    description: 'Promotes student freelance services, haircuts, photography, home cooking, and project typing.',
    tag: 'Services & Hustle',
    tone: 'food_services',
    subject: 'Who get haircut, graphic design, or sweet food for campus? 🍔✂️',
    previewText: 'Support student entrepreneurs and get services delivered straight to your lodge.',
    badge: '🎓 SUPPORT CAMPUS HUSTLE',
    headline: 'Discover Top Student Services Right Inside Campus',
    bodyParagraphs: [
      'Need a fresh haircut before Monday morning 8am class? Craving hot homemade jollof or meat pies delivered to your lodge doorstep?',
      'Or you need project typing, graphic design, laptop repairs, or phone screen fixing without leaving campus?',
      'Our CUSTECH Services Directory connects you with talented student hustlers who do the job well, at student-friendly prices!'
    ],
    bulletPoints: [
      '💇‍♂️ Barbers & Hair stylists in student lodges',
      '🍲 Homemade meals & snack deliveries',
      '💻 Assignment typing, tech fixes & graphic design',
      '⚡ Phone & electronics repair specialists'
    ],
    ctaText: 'Explore Campus Services →',
    ctaUrl: '/services',
    secondaryCtaText: 'Offer your own skill or service',
    secondaryCtaUrl: '/dashboard/services/new'
  },
  {
    id: 'weekly_digest',
    name: '🚀 "Weekend Campus Drops" (Marketplace Weekly Digest)',
    description: 'Curated weekly recap of new verified student deals, clearance sales, and campus freebies.',
    tag: 'Weekly Digest',
    tone: 'weekly_digest',
    subject: 'Weekend campus market drops: What\'s new on CUSTECH Marketplace 🚀',
    previewText: 'See what verified students just listed on CUSTECH Marketplace this week.',
    badge: '✨ WEEKEND CAMPUS DIGEST',
    headline: 'Fresh Listings Just Dropped This Week',
    bodyParagraphs: [
      'Over 50 new items, services, and student hostel accommodations were published on CUSTECH Marketplace this week.',
      'From discounted textbooks and scientific calculators to room accessories, sneakers, and freelance tutoring, see what your fellow students have available before someone else buys them!'
    ],
    bulletPoints: [
      '📚 Past questions, handouts & departmental textbooks',
      '🎁 Free items section: Campus donations & giveaways (₦0.00)',
      '🏷️ Flash clearance sales from graduating seniors',
      '🛡️ 100% verified campus sellers with student ID check'
    ],
    ctaText: 'View All New Campus Drops →',
    ctaUrl: '/marketplace',
    secondaryCtaText: 'Check Free Items Section (₦0)',
    secondaryCtaUrl: '/free-items'
  }
];
