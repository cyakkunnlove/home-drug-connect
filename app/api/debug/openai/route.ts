import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug OpenAI] Starting OpenAI debug check')
    
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        error: 'Not authenticated',
        timestamp: new Date().toISOString()
      }, { status: 401 })
    }
    
    // Check environment variables
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const keyPrefix = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'NOT SET'
    
    // Test OpenAI connection
    let openAIStatus = 'not tested'
    let openAIError = null
    let modelList = null
    
    if (hasOpenAIKey) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        })
        
        // Try to list models as a simple test
        const models = await openai.models.list()
        modelList = models.data.slice(0, 5).map(m => m.id) // First 5 models
        openAIStatus = 'connected'
        
        // Try a simple completion
        const testCompletion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say "test"' }],
          max_tokens: 10
        })
        
        openAIStatus = 'working'
      } catch (error: any) {
        openAIStatus = 'error'
        openAIError = {
          message: error?.message,
          code: error?.code,
          type: error?.type,
          status: error?.status
        }
      }
    }
    
    return NextResponse.json({
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAIKey,
        keyPrefix,
        vercelEnv: process.env.VERCEL_ENV
      },
      openAI: {
        status: openAIStatus,
        error: openAIError,
        availableModels: modelList
      },
      user: {
        id: user.id,
        email: user.email
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[Debug OpenAI] Error:', error)
    
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}