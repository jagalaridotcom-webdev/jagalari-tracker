import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const TRACCAR_URL = process.env.NEXT_PUBLIC_TRACCAR_URL || 'https://demo.traccar.org'
const TRACCAR_EMAIL = process.env.NEXT_PUBLIC_TRACCAR_EMAIL || 'admin'
const TRACCAR_PASSWORD = process.env.NEXT_PUBLIC_TRACCAR_PASSWORD || 'admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || ''

  try {
    // Create axios instance with cookie jar support
    const axiosInstance = axios.create({
      baseURL: TRACCAR_URL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // First, login to get session
    await axiosInstance.post('/api/session', {
      email: TRACCAR_EMAIL,
      password: TRACCAR_PASSWORD
    })

    // Now make the API request
    const response = await axiosInstance.get(`/api/${path}`)

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Traccar API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Traccar API' },
      { status: 500 }
    )
  }
}
