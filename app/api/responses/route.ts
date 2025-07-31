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

    // Check if user is a pharmacy admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'pharmacy_admin') {
      return NextResponse.json(
        { error: 'Only pharmacy admins can respond to requests' },
        { status: 403 }
      )
    }

    // Get user's pharmacy
    const { data: userPharmacy, error: pharmacyError } = await supabase
      .from('pharmacies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (pharmacyError || !userPharmacy) {
      return NextResponse.json(
        { error: 'No pharmacy associated with user' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { requestId, accepted, rejectionReasons, notes } = body

    // Validate request exists and is for this pharmacy
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('id, pharmacy_id, status')
      .eq('id', requestId)
      .single()

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    if (requestData.pharmacy_id !== userPharmacy.id) {
      return NextResponse.json(
        { error: 'Request is not for your pharmacy' },
        { status: 403 }
      )
    }

    if (requestData.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    // Create response
    const { data: newResponse, error: createError } = await supabase
      .from('responses')
      .insert({
        request_id: requestId,
        pharmacy_id: userPharmacy.id,
        accepted,
        rejection_reasons: rejectionReasons || {},
        notes
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating response:', createError)
      return NextResponse.json(
        { error: 'Failed to create response' },
        { status: 500 }
      )
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('requests')
      .update({ 
        status: accepted ? 'accepted' : 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating request status:', updateError)
    }

    // Note: The accepted_patients_count is automatically incremented by the database trigger

    return NextResponse.json({
      success: true,
      response: newResponse
    })

  } catch (error) {
    console.error('Error in response creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}