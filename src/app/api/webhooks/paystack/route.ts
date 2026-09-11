import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, verifyTransaction } from '@/lib/paystack';
import { createAdminClient } from '@/lib/supabase/server';
import { VERIFICATION_FEE_KOBO } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const bodyText = await req.text();
    const isValid = await verifyWebhookSignature(bodyText, signature);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(bodyText);

    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;

      // Verify transaction on Paystack to be absolutely sure
      const verification = await verifyTransaction(reference);
      
      const vData = verification.data as any;
      if (!verification.status || vData?.status !== 'success') {
        return NextResponse.json({ error: 'Transaction not valid on Paystack' }, { status: 400 });
      }

      if (vData?.currency && vData.currency !== 'NGN') {
        return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
      }

      const metadata = vData?.metadata || {};
      const type = metadata.type;
      const userId = metadata.userId;
      const amount = vData?.amount;

      if (!userId || typeof userId !== 'string') {
        console.error('Webhook error: Missing or invalid userId in transaction metadata', { reference, metadata });
        return NextResponse.json({ error: 'Missing or invalid userId in metadata' }, { status: 400 });
      }

      const supabase = await createAdminClient();

      if (type === 'verification') {
        // Validate amount
        if (amount !== VERIFICATION_FEE_KOBO) {
          return NextResponse.json({ error: 'Invalid amount for verification' }, { status: 400 });
        }

        // Idempotency check
        const { data: existingReq } = await supabase
          .from('verification_requests')
          .select('payment_status')
          .eq('payment_reference', reference)
          .single();

        if (existingReq?.payment_status === 'success') {
          return NextResponse.json({ message: 'Already processed' }, { status: 200 });
        }

        // Process verification payment
        await supabase
          .from('verification_requests')
          .update({ 
            payment_status: 'success', 
            verification_status: 'under_review' 
          })
          .eq('payment_reference', reference);

        await supabase
          .from('profiles')
          .update({ verification_status: 'paid' })
          .eq('user_id', userId);

        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: userId,
            type: 'verification_payment',
            amount: -amount,
            reference: reference,
            description: 'Verification fee payment'
          });

        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Payment Successful',
            body: 'Your verification fee has been received and your request is under review.',
            type: 'payment'
          });
      } else if (type === 'wallet_funding') {
        const amountKobo = Math.round(Number(amount));
        const nairaAmount = Math.round(amountKobo / 100);

        // Try atomic credit_wallet_balance RPC with kobo
        const { data: rpcRes, error: rpcErr } = await supabase.rpc('credit_wallet_balance', {
          p_user_id: userId,
          p_amount_kobo: amountKobo,
          p_reference: reference,
          p_description: 'Wallet top-up via Paystack',
        });

        if (rpcErr) {
          console.warn('RPC credit_wallet_balance fallback:', rpcErr);

          // Idempotency check on reference
          const { data: existingTx } = await supabase
            .from('wallet_transactions')
            .select('id')
            .eq('reference', reference)
            .maybeSingle();

          if (existingTx) {
            return NextResponse.json({ message: 'Already processed' }, { status: 200 });
          }

          // Get or create wallet
          let { data: wallet } = await supabase
            .from('wallets')
            .select('id, balance')
            .eq('user_id', userId)
            .maybeSingle();

          if (!wallet) {
            const { data: newWallet } = await supabase
              .from('wallets')
              .insert({ user_id: userId, balance: 0 })
              .select('id, balance')
              .single();
            wallet = newWallet;
          }

          if (wallet) {
            // Keep balance stored strictly in Kobo
            const newBalanceKobo = Number(wallet.balance) + amountKobo;
            await supabase
              .from('wallets')
              .update({ 
                balance: newBalanceKobo,
                updated_at: new Date().toISOString()
              })
              .eq('id', wallet.id);

            await supabase
              .from('wallet_transactions')
              .insert({
                wallet_id: wallet.id,
                user_id: userId,
                type: 'credit',
                amount: amountKobo,
                balance_after: newBalanceKobo,
                reference: reference,
                description: 'Wallet top-up via Paystack',
              });

            await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                title: 'Wallet Funded Successfully',
                body: `Your wallet has been credited with ₦${nairaAmount.toLocaleString()}. Current balance: ₦${Math.round(newBalanceKobo / 100).toLocaleString()}.`,
                type: 'wallet_credit'
              });
          }
        }
      } else if (type === 'marketplace_transaction') {
        // Handle marketplace transactions here in the future
      }
    }

    return NextResponse.json({ message: 'Webhook processed' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
