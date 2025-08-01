import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/google-maps/geocoding'

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json()
    
    if (!address) {
      return NextResponse.json(
        { error: '住所が指定されていません' },
        { status: 400 }
      )
    }
    
    const result = await geocodeAddress(address)
    
    if (!result) {
      return NextResponse.json(
        { error: '住所から位置情報を取得できませんでした' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Geocoding API error:', error)
    return NextResponse.json(
      { error: '位置情報の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}