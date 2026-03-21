import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/client';
import { getStripeClient } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' }, { status: 500 });
  }

  const payload = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'checkout.session.expired':
        await markOrderStatus(event.data.object as Stripe.Checkout.Session, 'expired');
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  const orderId = metadata?.orderId;
  const userId = metadata?.userId;
  const creditsValue = metadata?.credits;

  if (!orderId || !userId || !creditsValue) {
    throw new Error('Stripe checkout session metadata is incomplete');
  }

  const credits = parseInt(creditsValue, 10);
  if (Number.isNaN(credits)) {
    throw new Error('Stripe checkout session credits metadata is invalid');
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, user_id, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (order.user_id !== userId) {
    throw new Error(`Order ${orderId} does not belong to user ${userId}`);
  }

  const { data: existingPurchase } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('related_id', orderId)
    .eq('transaction_type', 'purchase')
    .maybeSingle();

  if (!existingPurchase) {
    const { data: creditUpdated, error: creditError } = await supabase.rpc('update_user_credits', {
      p_user_id: userId,
      p_amount: credits,
      p_type: 'purchase',
      p_description: `Purchased ${credits} credits`,
      p_related_id: orderId,
    });

    if (creditError || !creditUpdated) {
      throw creditError ?? new Error('Failed to update credits');
    }
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : null;

  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({
      status: 'completed',
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateOrderError) {
    throw updateOrderError;
  }

  if (paymentIntentId) {
    const { error: transactionUpdateError } = await supabase
      .from('credit_transactions')
      .update({ stripe_payment_intent_id: paymentIntentId })
      .eq('related_id', orderId)
      .eq('transaction_type', 'purchase')
      .is('stripe_payment_intent_id', null);

    if (transactionUpdateError) {
      throw transactionUpdateError;
    }
  }
}

async function markOrderStatus(session: Stripe.Checkout.Session, status: string) {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    return;
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from('orders')
    .update({
      status,
      stripe_session_id: session.id,
    })
    .eq('id', orderId)
    .neq('status', 'completed');

  if (error) {
    throw error;
  }
}
