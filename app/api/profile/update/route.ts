import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    
    // Get current user role
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Filter allowed fields based on role
    let updateData: any = {}
    
    if (currentUser.role === 'doctor') {
      // ドクターが更新できるフィールド
      const allowedFields = ['full_name', 'organization_name', 'clinic_name', 'medical_license_number', 'phone']
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field]
        }
      })
      // nameフィールドをfull_nameにマッピング（後方互換性のため）
      if (body.name !== undefined && !body.full_name) {
        updateData.full_name = body.name
      }
    } else if (currentUser.role === 'pharmacy_admin') {
      // 薬局管理者が更新できるフィールド
      const allowedFields = ['organization_name', 'phone']
      allowedFields.forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field]
        }
      })
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Error in profile update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}