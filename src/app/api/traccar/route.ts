import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const TRACCAR_URL = process.env.NEXT_PUBLIC_TRACCAR_URL || 'https://demo.traccar.org'
const TRACCAR_EMAIL = process.env.NEXT_PUBLIC_TRACCAR_EMAIL || 'admin'
const TRACCAR_PASSWORD = process.env.NEXT_PUBLIC_TRACCAR_PASSWORD || 'admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || ''

  try {
    const credentials = btoa(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`)
    const headers = {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    }

    const response = await axios.get(`${TRACCAR_URL}/api/${path}`, { headers })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Traccar API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Traccar API' },
      { status: 500 }
    )
  }
}
