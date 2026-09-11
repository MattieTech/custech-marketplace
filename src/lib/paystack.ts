'use server'

import crypto from 'crypto'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

interface InitializeTransactionResponse {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export async function initializeTransaction(
  emailOrOptions: string | { email: string; amount?: number; amountKobo?: number; reference?: string; metadata?: Record<string, any>; callback_url?: string; callbackUrl?: string },
  amountKobo?: number,
  reference?: string,
  metadata?: Record<string, any>,
  callbackUrl?: string
): Promise<InitializeTransactionResponse> {
  let email = ''
  let amount = 0
  let ref = ''
  let meta: Record<string, any> = {}
  let cbUrl: string | undefined

  if (typeof emailOrOptions === 'object') {
    email = emailOrOptions.email
    amount = emailOrOptions.amountKobo || emailOrOptions.amount || 0
    ref = emailOrOptions.reference || `TX-${Date.now()}`
    meta = emailOrOptions.metadata || {}
    cbUrl = emailOrOptions.callback_url || emailOrOptions.callbackUrl
  } else {
    email = emailOrOptions
    amount = amountKobo || 0
    ref = reference || `TX-${Date.now()}`
    meta = metadata || {}
    cbUrl = callbackUrl
  }

  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount,
      reference: ref,
      metadata: meta,
      callback_url: cbUrl,
    }),
  })

  return response.json()
}

interface VerifyTransactionResponse {
  status: boolean
  message: string
  data?: {
    status: string
    reference: string
    amount: number
    gateway_response: string
    metadata: Record<string, any>
  }
}

export async function verifyTransaction(reference: string): Promise<VerifyTransactionResponse> {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  })

  return response.json()
}

export async function verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
  if (!signature || !PAYSTACK_SECRET_KEY) {
    return false
  }

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex')

  const hashBuffer = Buffer.from(hash, 'utf8')
  const sigBuffer = Buffer.from(signature, 'utf8')

  if (hashBuffer.length !== sigBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(hashBuffer, sigBuffer)
}

