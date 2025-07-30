import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendInquiryNotification } from '@/lib/email/notifications';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pharmacyId, name, email, phone, subject, message } = body;

    if (!pharmacyId || !name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser();

    // Create inquiry
    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .insert({
        pharmacy_id: pharmacyId,
        from_user_id: user?.id || null,
        from_name: name,
        from_email: email,
        from_phone: phone || null,
        subject,
        message,
      })
      .select()
      .single();

    if (error) throw error;

    // Get pharmacy details for notification
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('name, email')
      .eq('id', pharmacyId)
      .single();

    // Send email notification to pharmacy
    if (pharmacy?.email) {
      await sendInquiryNotification({
        pharmacyEmail: pharmacy.email,
        pharmacyName: pharmacy.name,
        inquiryDetails: {
          from: name,
          email,
          phone,
          subject,
          message,
        },
      });
    }

    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    console.error('Inquiry error:', error);
    return NextResponse.json(
      { error: 'Failed to send inquiry' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's pharmacies
    const { data: pharmacies } = await supabase
      .from('pharmacies')
      .select('id')
      .eq('user_id', user.id);

    if (!pharmacies || pharmacies.length === 0) {
      return NextResponse.json({ inquiries: [] });
    }

    const pharmacyIds = pharmacies.map(p => p.id);

    // Get inquiries for user's pharmacies
    const { data: inquiries, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        pharmacy:pharmacies(name)
      `)
      .in('pharmacy_id', pharmacyIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Get inquiries error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}