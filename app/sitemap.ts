import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://homedrug-connect.com';
  const supabase = await createClient();

  // Get all active pharmacies
  const { data: pharmacies } = await supabase
    .from('pharmacies')
    .select('id, updated_at')
    .eq('status', 'active');

  const pharmacyUrls = pharmacies?.map((pharmacy) => ({
    url: `${baseUrl}/pharmacy/${pharmacy.id}`,
    lastModified: new Date(pharmacy.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || [];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pharmacy/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pharmacy/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...pharmacyUrls,
  ];
}