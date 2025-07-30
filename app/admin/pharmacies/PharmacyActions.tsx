'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

interface PharmacyActionsProps {
  pharmacy: any;
}

export default function PharmacyActions({ pharmacy }: PharmacyActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/pharmacies/${pharmacy.id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to approve pharmacy');

      toast.success('薬局を承認しました');
      router.refresh();
    } catch (error) {
      toast.error('承認に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('本当にこの薬局を却下しますか？')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/pharmacies/${pharmacy.id}/reject`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to reject pharmacy');

      toast.success('薬局を却下しました');
      router.refresh();
    } catch (error) {
      toast.error('却下に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/pharmacy/${pharmacy.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80"
      >
        <Eye className="w-5 h-5" />
      </a>
      
      {pharmacy.status === 'pending' && (
        <>
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="text-green-600 hover:text-green-700 disabled:opacity-50"
            title="承認"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 disabled:opacity-50"
            title="却下"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}