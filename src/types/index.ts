import {
  LISTING_STATUSES,
  TRUST_LEVELS,
  VERIFICATION_STATUSES
} from '@/lib/constants'

export type TrustLevel = typeof TRUST_LEVELS[number]
export type ListingStatus = typeof LISTING_STATUSES[number]
export type VerificationStatus = typeof VERIFICATION_STATUSES[number]
export type ListingType = 'product' | 'service' | 'housing'
export type ReportCategory = 'scam' | 'inappropriate_content' | 'spam' | 'harassment' | 'counterfeit' | 'other'

export interface User {
  id: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface Profile {
  id: string
  userId: string
  displayName: string
  bio?: string
  location?: string
  avatarUrl?: string
  trustLevel: TrustLevel
  isVerified: boolean
  joinedAt: string
}

export interface Listing {
  id: string
  sellerId: string
  title: string
  description: string
  price: number // in Kobo
  categoryId: string
  condition: string
  location: string
  type: ListingType
  status: ListingStatus
  createdAt: string
  updatedAt: string
  views: number
}

export interface ListingImage {
  id: string
  listingId: string
  url: string
  order: number
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  type: ListingType
}

export interface Service extends Listing {
  type: 'service'
  serviceType: string
}

export interface Property extends Listing {
  type: 'housing'
  propertyType: string
}

export interface Conversation {
  id: string
  listingId?: string
  buyerId: string
  sellerId: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  readAt?: string
  createdAt: string
}

export interface Report {
  id: string
  reporterId: string
  reportedUserId?: string
  reportedListingId?: string
  category: ReportCategory
  description: string
  evidenceUrls?: string[]
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  createdAt: string
}

export interface Review {
  id: string
  reviewerId: string
  revieweeId: string
  listingId: string
  rating: number
  comment?: string
  createdAt: string
}

export interface VerificationRequest {
  id: string
  userId: string
  status: VerificationStatus
  documentUrl: string
  studentId: string
  paymentReference?: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  reference: string
  status: 'pending' | 'success' | 'failed'
  type: 'verification' | 'listing_fee' | 'other'
  createdAt: string
}

export interface WalletTransaction {
  id: string
  walletId: string
  amount: number
  type: 'credit' | 'debit'
  description: string
  createdAt: string
}

export interface Referral {
  id: string
  referrerId: string
  referredId: string
  rewardAmount: number
  status: 'pending' | 'completed'
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  content: string
  isRead: boolean
  link?: string
  createdAt: string
}

export interface Dispute {
  id: string
  transactionId: string
  initiatorId: string
  reason: string
  status: 'open' | 'under_review' | 'resolved'
  createdAt: string
}

export interface Business {
  id: string
  ownerId: string
  name: string
  description: string
  verified: boolean
  createdAt: string
}

export interface Deal {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  agreedPrice: number
  status: 'pending' | 'completed' | 'cancelled'
  createdAt: string
}

export interface AuditLog {
  id: string
  adminId: string
  action: string
  details: any
  createdAt: string
}

export type AdminRole = 'super_admin' | 'moderator' | 'support'
