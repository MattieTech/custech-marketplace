import { z } from 'zod'

export const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  price: z.number().positive('Price must be a positive number'),
  categoryId: z.string().min(1, 'Category is required'),
  condition: z.string().min(1, 'Condition is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.enum(['product', 'service', 'housing']),
})

export type CreateListingInput = z.infer<typeof createListingSchema>

export const updateListingSchema = createListingSchema.partial()

export type UpdateListingInput = z.infer<typeof updateListingSchema>

export const searchListingSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  verifiedSeller: z.boolean().optional(),
  sortBy: z.enum(['newest', 'price_asc', 'price_desc', 'popular']).optional(),
})

export type SearchListingInput = z.infer<typeof searchListingSchema>
