import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'

const TRACCAR_URL = process.env.NEXT_PUBLIC_TRACCAR_URL || 'https://demo.traccar.org'
const TRACCAR_EMAIL = process.env.NEXT_PUBLIC_TRACCAR_EMAIL || 'admin'
const TRACCAR_PASSWORD = process.env.NEXT_PUBLIC_TRACCAR_PASSWORD || 'admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') || ''

  try {
    const jar = new CookieJar()
    const client = wrapper(axios.create({ jar }))

    // First, login to get session
    await client.post(`${TRACCAR_URL}/api/session`, {
      email: TRACCAR_EMAIL,
      password: TRACCAR_PASSWORD
    })

    // Now make the API request
    const response = await client.get(`${TRACCAR_URL}/api/${path}`)

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Traccar API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from Traccar API' },
      { status: 500 }
    )
  }
}
