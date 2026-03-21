import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/client';
import { getAppUrl, getCreditPackage, getStripeClient } from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createServiceRoleSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const creditPackage = getCreditPackage(body.packageId);

    if (!creditPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        package_id: creditPackage.id,
        credits: creditPackage.credits,
        amount: creditPackage.unitAmount / 100,
        currency: creditPackage.currency.toUpperCase(),
        status: 'pending',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('Create order error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const stripe = getStripeClient();
    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: creditPackage.currency,
            product_data: {
              name: creditPackage.name,
              description: `${creditPackage.credits} credits for Pixel Alchemy`,
            },
            unit_amount: creditPackage.unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancel`,
      metadata: {
        orderId: order.id,
        userId: user.id,
        packageId: creditPackage.id,
        credits: String(creditPackage.credits),
      },
      customer_email: user.email,
    });

    const { error: updateOrderError } = await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    if (updateOrderError) {
      console.error('Update order with session error:', updateOrderError);
      return NextResponse.json({ error: 'Failed to persist checkout session' }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      sessionId: session.id,
      url: session.url,
      package: {
        id: creditPackage.id,
        credits: creditPackage.credits,
        unitAmount: creditPackage.unitAmount,
        currency: creditPackage.currency,
      },
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
