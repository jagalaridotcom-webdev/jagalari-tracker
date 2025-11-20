import axios from 'axios'

const TRACCAR_URL = process.env.NEXT_PUBLIC_TRACCAR_URL || 'https://demo.traccar.org'
const TRACCAR_EMAIL = process.env.NEXT_PUBLIC_TRACCAR_EMAIL || 'admin'
const TRACCAR_PASSWORD = process.env.NEXT_PUBLIC_TRACCAR_PASSWORD || 'admin'

export interface Device {
  id: number
  name: string
  uniqueId: string
  status: string
  lastUpdate: string
  positionId?: number
}

export interface Position {
  id: number
  deviceId: number
  latitude: number
  longitude: number
  speed: number
  course: number
  altitude: number
  accuracy: number
  timestamp: string
}



class TraccarService {
  private authHeader: string

  constructor() {
    // Create Basic Auth header
    const credentials = btoa(`${TRACCAR_EMAIL}:${TRACCAR_PASSWORD}`)
    this.authHeader = `Basic ${credentials}`
  }

  private getHeaders() {
    return {
      'Authorization': this.authHeader,
      'Content-Type': 'application/json'
    }
  }

  async getDevices(): Promise<Device[]> {
    try {
      const response = await axios.get(`${TRACCAR_URL}/api/devices`, {
        headers: this.getHeaders()
      })
      return response.data
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: unknown } }
      console.error('Failed to fetch devices:', axiosError.response?.status, axiosError.response?.data)
      throw error
    }
  }

  async getPositions(deviceId?: number): Promise<Position[]> {
    try {
      const url = deviceId
        ? `${TRACCAR_URL}/api/positions?deviceId=${deviceId}`
        : `${TRACCAR_URL}/api/positions`

      const response = await axios.get(url, {
        headers: this.getHeaders()
      })
      return response.data
    } catch (error: unknown) {
      console.error('Failed to fetch positions:', error)
      throw error
    }
  }

  async getLatestPositions(): Promise<Position[]> {
    try {
      const response = await axios.get(`${TRACCAR_URL}/api/positions?latest=true`, {
        headers: this.getHeaders()
      })
      return response.data
    } catch (error: unknown) {
      console.error('Failed to fetch latest positions:', error)
      throw error
    }
  }
}

export const traccarService = new TraccarService()
