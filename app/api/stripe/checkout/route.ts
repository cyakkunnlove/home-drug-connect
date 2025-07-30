import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createStripeCustomer, createCheckoutSession } from '@/lib/stripe/subscription';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/config';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { planType } = await request.json();

    if (!planType || !SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let customerId = existingSubscription?.stripe_customer_id;

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await createStripeCustomer(user.email!, user.id);
      customerId = customer.id;

      // Save customer ID to database
      if (existingSubscription) {
        await supabase
          .from('subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('id', existingSubscription.id);
      } else {
        // Get the plan ID from database
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('name', 'ベーシックプラン')
          .single();

        if (!plan) {
          throw new Error('Subscription plan not found');
        }

        await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            stripe_customer_id: customerId,
            status: 'trialing',
            plan_id: plan.id,
          });
      }
    }

    const plan = SUBSCRIPTION_PLANS[planType as keyof typeof SUBSCRIPTION_PLANS];
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?success=true`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`;

    const session = await createCheckoutSession(
      customerId,
      plan.stripePriceId,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}