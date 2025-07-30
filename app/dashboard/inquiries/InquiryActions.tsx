'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Eye, Reply, Archive } from 'lucide-react';

interface InquiryActionsProps {
  inquiry: any;
}

export default function InquiryActions({ inquiry }: InquiryActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsRead = async () => {
    if (inquiry.status !== 'pending') return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/inquiries/${inquiry.id}/read`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      toast.success('既読にしました');
      router.refresh();
    } catch (error) {
      toast.error('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = () => {
    window.location.href = `mailto:${inquiry.from_email}?subject=Re: ${inquiry.subject}`;
  };

  const handleClose = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inquiries/${inquiry.id}/close`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to close inquiry');

      toast.success('お問い合わせをクローズしました');
      router.refresh();
    } catch (error) {
      toast.error('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {inquiry.status === 'pending' && (
        <button
          onClick={handleMarkAsRead}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Eye className="w-4 h-4 mr-1" />
          既読にする
        </button>
      )}
      
      <button
        onClick={handleReply}
        className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        <Reply className="w-4 h-4 mr-1" />
        返信する
      </button>

      {inquiry.status !== 'closed' && (
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="inline-flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          <Archive className="w-4 h-4 mr-1" />
          クローズ
        </button>
      )}
    </div>
  );
}