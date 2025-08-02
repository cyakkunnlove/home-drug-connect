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

    // Get user's company info first
    const { data: userInfo } = await supabase
      .from('users')
      .select('company_id, email')
      .eq('id', user.id)
      .single()

    // Get all pharmacies for stats aggregation
    let pharmacyIds: string[] = []
    
    if (userInfo?.company_id) {
      // Get all pharmacies for the company
      const { data: companyPharmacies } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('company_id', userInfo.company_id)
      
      if (companyPharmacies && companyPharmacies.length > 0) {
        pharmacyIds = companyPharmacies.map(p => p.id)
      }
    } else {
      // Fallback: try with user_id
      const { data: userPharmacies } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('user_id', user.id)
      
      if (userPharmacies && userPharmacies.length > 0) {
        pharmacyIds = userPharmacies.map(p => p.id)
      } else if (userInfo?.email) {
        // Final fallback: try with email
        const { data: emailPharmacies } = await supabase
          .from('pharmacies')
          .select('id')
          .eq('email', userInfo.email)
        
        if (emailPharmacies && emailPharmacies.length > 0) {
          pharmacyIds = emailPharmacies.map(p => p.id)
        }
      }
    }

    if (pharmacyIds.length === 0) {
      return NextResponse.json(
        { error: 'No pharmacy found' },
        { status: 404 }
      )
    }

    // Get current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get profile views count for this month (aggregate all pharmacies)
    const { count: viewsCount } = await supabase
      .from('pharmacy_views')
      .select('*', { count: 'exact', head: true })
      .in('pharmacy_id', pharmacyIds)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    // Get inquiries count for this month (aggregate all pharmacies)
    const { count: inquiriesCount } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .in('pharmacy_id', pharmacyIds)
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString())

    // Get accepted requests count (aggregate all pharmacies)
    const { count: acceptedCount } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .in('pharmacy_id', pharmacyIds)
      .eq('status', 'accepted')

    // Get pending requests count (aggregate all pharmacies)
    const { count: pendingCount } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .in('pharmacy_id', pharmacyIds)
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