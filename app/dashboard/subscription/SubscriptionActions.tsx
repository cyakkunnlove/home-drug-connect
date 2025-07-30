'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CreditCard, ExternalLink } from 'lucide-react';

interface SubscriptionActionsProps {
  subscription?: any;
  hasStripeCustomer: boolean;
}

export default function SubscriptionActions({ subscription, hasStripeCustomer }: SubscriptionActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: 'basic',
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      toast.error('チェックアウトの開始に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (error) {
      toast.error('カスタマーポータルの開始に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!subscription || subscription.status === 'canceled') {
    return (
      <button
        onClick={handleCheckout}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        {isLoading ? 'ロード中...' : 'プランに登録する'}
      </button>
    );
  }

  if (hasStripeCustomer && subscription.status === 'active') {
    return (
      <button
        onClick={handlePortal}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
      >
        <ExternalLink className="w-4 h-4 mr-2" />
        {isLoading ? 'ロード中...' : '支払い方法を管理'}
      </button>
    );
  }

  return null;
}