import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Webhook handler not configured' },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Update subscription in database
          await supabase
            .from('subscriptions')
            .update({
              stripe_subscription_id: subscription.id,
              status: 'active',
              current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            })
            .eq('stripe_customer_id', session.customer as string);

          // Update pharmacy status to active
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.customer_email!)
            .single();

          if (user) {
            await supabase
              .from('pharmacies')
              .update({ status: 'active' })
              .eq('user_id', user.id);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if ((invoice as any).subscription) {
          // Record payment history
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('stripe_subscription_id', (invoice as any).subscription as string)
            .single();

          if (subscription) {
            await supabase
              .from('payment_history')
              .insert({
                subscription_id: subscription.id,
                stripe_payment_intent_id: (invoice as any).payment_intent as string,
                amount_jpy: invoice.amount_paid,
                status: 'succeeded',
                paid_at: new Date((invoice as any).status_transitions.paid_at! * 1000).toISOString(),
              });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status as any,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            cancel_at: (subscription as any).cancel_at 
              ? new Date((subscription as any).cancel_at * 1000).toISOString() 
              : null,
            canceled_at: (subscription as any).canceled_at 
              ? new Date((subscription as any).canceled_at * 1000).toISOString() 
              : null,
          })
          .eq('stripe_subscription_id', subscription.id);

        // Update pharmacy status based on subscription status
        if ((subscription as any).status !== 'active' && (subscription as any).status !== 'trialing') {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

          if (sub) {
            await supabase
              .from('pharmacies')
              .update({ status: 'inactive' })
              .eq('user_id', sub.user_id);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Deactivate pharmacy
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (sub) {
          await supabase
            .from('pharmacies')
            .update({ status: 'inactive' })
            .eq('user_id', sub.user_id);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}