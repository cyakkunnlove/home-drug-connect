import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch request with related data
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        doctor:users!doctor_id(id, email, organization_name),
        pharmacy:pharmacies!pharmacy_id(id, name, address, phone, email),
        responses(*)
      `)
      .eq('id', id)
      .single()

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Doctors can only see their own requests
    if (userData?.role === 'doctor' && requestData.doctor_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Pharmacy admins can only see requests sent to their pharmacy
    if (userData?.role === 'pharmacy_admin') {
      const { data: userPharmacy } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!userPharmacy || requestData.pharmacy_id !== userPharmacy.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      request: requestData
    })

  } catch (error) {
    console.error('Error fetching request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}