import { z } from 'zod'

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message must be less than 2000 characters'),
  conversationId: z.string().min(1, 'Conversation ID is required'),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>

export const createConversationSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  listingId: z.string().optional(),
  initialMessage: z.string().min(1, 'Message cannot be empty').max(2000, 'Message must be less than 2000 characters'),
})

export type CreateConversationInput = z.infer<typeof createConversationSchema>
