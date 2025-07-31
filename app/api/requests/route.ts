import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    // Check if user is a doctor
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can create requests' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { pharmacyId, doctorInfo, patientInfo, aiDocument } = body

    // Validate pharmacy exists and is active
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('pharmacies')
      .select('id, name, status')
      .eq('id', pharmacyId)
      .single()

    if (pharmacyError || !pharmacy || pharmacy.status !== 'active') {
      return NextResponse.json(
        { error: 'Invalid or inactive pharmacy' },
        { status: 400 }
      )
    }

    // Create request
    const { data: newRequest, error: createError } = await supabase
      .from('requests')
      .insert({
        doctor_id: user.id,
        pharmacy_id: pharmacyId,
        doctor_info: doctorInfo || {},
        patient_info: patientInfo,
        ai_document: aiDocument,
        status: 'pending'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating request:', createError)
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 }
      )
    }

    // Send notification to pharmacy (using existing notification system)
    // This would integrate with your existing email notification service
    
    return NextResponse.json({
      success: true,
      request: newRequest
    })

  } catch (error) {
    console.error('Error in request creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const pharmacyId = searchParams.get('pharmacyId')
    const status = searchParams.get('status')
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build query
    let query = supabase
      .from('requests')
      .select(`
        *,
        doctor:users!doctor_id(id, email, organization_name),
        pharmacy:pharmacies!pharmacy_id(id, name, address),
        responses(*)
      `)

    // Filter based on user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role === 'doctor') {
      query = query.eq('doctor_id', user.id)
    } else if (userData?.role === 'pharmacy_admin') {
      // Get pharmacy associated with user
      const { data: userPharmacy } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (userPharmacy) {
        query = query.eq('pharmacy_id', userPharmacy.id)
      }
    }

    // Apply filters
    if (pharmacyId) {
      query = query.eq('pharmacy_id', pharmacyId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Execute query
    const { data: requests, error: queryError } = await query
      .order('created_at', { ascending: false })

    if (queryError) {
      console.error('Error fetching requests:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      requests
    })

  } catch (error) {
    console.error('Error in request listing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}