import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('name, address, description')
    .eq('id', id)
    .single();

  if (!pharmacy) {
    return {
      title: '薬局が見つかりません',
    };
  }

  return {
    title: pharmacy.name,
    description: pharmacy.description || `${pharmacy.name}は${pharmacy.address}にある在宅対応薬局です。`,
    openGraph: {
      title: pharmacy.name,
      description: pharmacy.description || `${pharmacy.name}は${pharmacy.address}にある在宅対応薬局です。`,
      type: 'website',
    },
  };
}