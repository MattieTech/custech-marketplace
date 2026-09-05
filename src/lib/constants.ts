export const BRAND_NAME = 'CUSTECH Marketplace'
export const BRAND_TAGLINE = 'Buy. Sell. Connect. Safely.'
export const BRAND_DESCRIPTION = 'The official campus marketplace for the CUSTECH community.'

export const VERIFICATION_FEE_KOBO = Number(process.env.VERIFICATION_FEE_KOBO || '100000')
export const REFERRAL_REWARD_KOBO = Number(process.env.REFERRAL_REWARD_KOBO || '50000')

export const Colors = {
  primary: '#22c55e',
  primaryDark: '#047857', // emerald-700
  accentSuccess: '#10b981',
  accentWarning: '#f59e0b',
  accentError: '#ef4444',
  accentInfo: '#3b82f6',
} as const

export const LISTING_STATUSES = ['active', 'reserved', 'sold', 'expired', 'removed'] as const
export const TRUST_LEVELS = ['registered', 'custech_verified', 'trusted_seller'] as const
export const VERIFICATION_STATUSES = ['pending_payment', 'paid', 'under_review', 'approved', 'rejected'] as const

export const MAX_LISTING_IMAGES = 6
export const MAX_IMAGE_SIZE_MB = 5
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const NAIRA_SYMBOL = '₦'

export const MARKETPLACE_CATEGORIES = [
  // Products
  { id: 'phones', name: 'Phones', slug: 'phones', icon: 'Smartphone', type: 'product' },
  { id: 'laptops', name: 'Laptops', slug: 'laptops', icon: 'Laptop', type: 'product' },
  { id: 'electronics', name: 'Electronics', slug: 'electronics', icon: 'Tv', type: 'product' },
  { id: 'clothes', name: 'Clothes', slug: 'clothes', icon: 'Shirt', type: 'product' },
  { id: 'shoes', name: 'Shoes', slug: 'shoes', icon: 'Footprints', type: 'product' },
  { id: 'books', name: 'Books', slug: 'books', icon: 'Book', type: 'product' },
  { id: 'school-materials', name: 'School Materials', slug: 'school-materials', icon: 'Library', type: 'product' },
  { id: 'furniture', name: 'Furniture', slug: 'furniture', icon: 'Armchair', type: 'product' },
  { id: 'food', name: 'Food', slug: 'food', icon: 'Utensils', type: 'product' },
  { id: 'accessories', name: 'Accessories', slug: 'accessories', icon: 'Watch', type: 'product' },
  { id: 'gaming', name: 'Gaming', slug: 'gaming', icon: 'Gamepad2', type: 'product' },
  { id: 'appliances', name: 'Appliances', slug: 'appliances', icon: 'Refrigerator', type: 'product' },
  { id: 'handcrafted', name: 'Handcrafted', slug: 'handcrafted', icon: 'Palette', type: 'product' },
  { id: 'other', name: 'Other', slug: 'other', icon: 'Package', type: 'product' },

  // Services
  { id: 'web-development', name: 'Web Development', slug: 'web-development', icon: 'Code', type: 'service' },
  { id: 'graphic-design', name: 'Graphic Design', slug: 'graphic-design', icon: 'PenTool', type: 'service' },
  { id: 'video-editing', name: 'Video Editing', slug: 'video-editing', icon: 'Video', type: 'service' },
  { id: 'photography', name: 'Photography', slug: 'photography', icon: 'Camera', type: 'service' },
  { id: 'tutoring', name: 'Tutoring', slug: 'tutoring', icon: 'GraduationCap', type: 'service' },
  { id: 'hair-barbing', name: 'Hair/Barbing', slug: 'hair-barbing', icon: 'Scissors', type: 'service' },
  { id: 'makeup', name: 'Makeup', slug: 'makeup', icon: 'Brush', type: 'service' },
  { id: 'laundry', name: 'Laundry', slug: 'laundry', icon: 'WashingMachine', type: 'service' },
  { id: 'printing', name: 'Printing', slug: 'printing', icon: 'Printer', type: 'service' },
  { id: 'cv-design', name: 'CV Design', slug: 'cv-design', icon: 'FileText', type: 'service' },
  { id: 'phone-repair', name: 'Phone Repair', slug: 'phone-repair', icon: 'Wrench', type: 'service' },
  { id: 'laptop-repair', name: 'Laptop Repair', slug: 'laptop-repair', icon: 'Wrench', type: 'service' },
  { id: 'delivery', name: 'Delivery', slug: 'delivery', icon: 'Truck', type: 'service' },
  { id: 'food-services', name: 'Food Services', slug: 'food-services', icon: 'ChefHat', type: 'service' },
  { id: 'fashion-tailoring', name: 'Fashion/Tailoring', slug: 'fashion-tailoring', icon: 'Scissors', type: 'service' },

  // Housing
  { id: 'single-room', name: 'Single Room', slug: 'single-room', icon: 'Bed', type: 'housing' },
  { id: 'self-contained', name: 'Self-Contained', slug: 'self-contained', icon: 'Home', type: 'housing' },
  { id: 'one-bedroom', name: 'One-Bedroom', slug: 'one-bedroom', icon: 'Home', type: 'housing' },
  { id: 'two-bedroom', name: 'Two-Bedroom', slug: 'two-bedroom', icon: 'Home', type: 'housing' },
  { id: 'shared-apartment', name: 'Shared Apartment', slug: 'shared-apartment', icon: 'Users', type: 'housing' },
  { id: 'hostel', name: 'Hostel', slug: 'hostel', icon: 'Building', type: 'housing' },
] as const

export const REPORT_CATEGORIES = [
  'scam',
  'inappropriate_content',
  'spam',
  'harassment',
  'counterfeit',
  'other'
] as const

export const LOCATIONS = [
  'Main Campus',
  'Hostel Area',
  'Off-Campus (North Gate)',
  'Off-Campus (South Gate)',
  'Staff Quarters',
  'Technology Village',
  'Central Market',
  'Other / Delivery',
] as const

export const CATEGORIES = MARKETPLACE_CATEGORIES.map(c => ({
  ...c,
  value: c.id,
  label: c.name,
}))

