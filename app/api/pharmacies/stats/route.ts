import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's pharmacy
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!pharmacy) {
      // Try with email as fallback
      const { data: userInfo } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single()
      
      if (userInfo?.email) {
        const { data: pharmacyByEmail } = await supabase
          .from('pharmacies')
          .select('id')
          .eq('email', userInfo.email)
          .single()
        
        if (!pharmacyByEmail) {
          return NextResponse.json(
            { error: 'No pharmacy found' },
            { status: 404 }
          )
        }
        pharmacy.id = pharmacyByEmail.id
      }
    }

    // Get current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get profile views count for this month
    const { count: viewsCount } = await supabase
      .from('pharmacy_views')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacy.id)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    // Get inquiries count for this month
    const { count: inquiriesCount } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacy.id)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    // Get accepted requests count
    const { count: acceptedCount } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacy.id)
      .eq('status', 'accepted')

    // Get pending requests count
    const { count: pendingCount } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('pharmacy_id', pharmacy.id)
      .eq('status', 'pending')

    return NextResponse.json({
      success: true,
      stats: {
        profileViews: viewsCount || 0,
        inquiries: inquiriesCount || 0,
        acceptedPatients: acceptedCount || 0,
        pendingRequests: pendingCount || 0
      }
    })

  } catch (error) {
    console.error('Error fetching pharmacy stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}