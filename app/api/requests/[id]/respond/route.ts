import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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

    // Parse request body
    const body = await request.json()
    const { pharmacyId, accepted, notes, responseType, conditions } = body

    // Verify the user owns the pharmacy
    const { data: pharmacy, error: pharmacyError } = await supabase
      .from('pharmacies')
      .select('id')
      .eq('id', pharmacyId)
      .eq('user_id', user.id)
      .single()

    if (pharmacyError || !pharmacy) {
      return NextResponse.json(
        { error: 'Unauthorized to respond for this pharmacy' },
        { status: 403 }
      )
    }

    // Check if request exists and is for this pharmacy
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('id, pharmacy_id, status')
      .eq('id', id)
      .eq('pharmacy_id', pharmacyId)
      .single()

    if (requestError || !requestData) {
      return NextResponse.json(
        { error: 'Request not found or not for this pharmacy' },
        { status: 404 }
      )
    }

    // Check if already responded
    const { data: existingResponse } = await supabase
      .from('responses')
      .select('id')
      .eq('request_id', id)
      .single()

    if (existingResponse) {
      return NextResponse.json(
        { error: 'Already responded to this request' },
        { status: 400 }
      )
    }

    // Create response
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .insert({
        request_id: id,
        pharmacy_id: pharmacyId,
        accepted,
        notes,
        rejection_reasons: responseType === 'conditional' && conditions ? { conditions } : {}
      })
      .select()
      .single()

    if (responseError) {
      console.error('Error creating response:', responseError)
      return NextResponse.json(
        { error: 'Failed to create response' },
        { status: 500 }
      )
    }

    // Update request status
    const newStatus = accepted ? 'accepted' : 'rejected'
    await supabase
      .from('requests')
      .update({ status: newStatus })
      .eq('id', id)

    return NextResponse.json({
      success: true,
      response
    })

  } catch (error) {
    console.error('Error in response creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}