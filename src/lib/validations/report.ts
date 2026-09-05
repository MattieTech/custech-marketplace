import { z } from 'zod'
import { REPORT_CATEGORIES } from '@/lib/constants'

export const createReportSchema = z.object({
  category: z.enum(REPORT_CATEGORIES as unknown as [string, ...string[]]),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  reportedUserId: z.string().optional(),
  reportedListingId: z.string().optional(),
  evidenceUrls: z.array(z.string().url('Must be a valid URL')).optional(),
}).refine(data => data.reportedUserId || data.reportedListingId, {
  message: 'Must provide either a reported user or a reported listing',
  path: ['reportedUserId'],
})

export type CreateReportInput = z.infer<typeof createReportSchema>
