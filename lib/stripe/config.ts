import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Subscription plan configuration
export const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'ベーシックプラン',
    priceJpy: 2200,
    stripePriceId: process.env.STRIPE_BASIC_PLAN_PRICE_ID || '',
    features: [
      '薬局情報の掲載',
      '問い合わせ受付',
      '月次レポート',
      'アナリティクス機能',
      'メール通知',
    ],
  },
} as const;

export type PlanType = keyof typeof SUBSCRIPTION_PLANS;