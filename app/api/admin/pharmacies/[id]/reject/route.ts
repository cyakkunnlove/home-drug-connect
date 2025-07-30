import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Reject pharmacy
    const { error } = await supabase
      .from('pharmacies')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) throw error;

    // TODO: Send rejection email notification

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject pharmacy error:', error);
    return NextResponse.json(
      { error: 'Failed to reject pharmacy' },
      { status: 500 }
    );
  }
}