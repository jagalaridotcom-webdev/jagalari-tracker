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

// Mock data for testing when Traccar is not available
const mockDevices: Device[] = [
  { id: 1, name: 'Ambulance 1', uniqueId: 'AMB001', status: 'online', lastUpdate: new Date().toISOString() },
  { id: 2, name: 'Motor Mobile 1', uniqueId: 'MOTOR001', status: 'online', lastUpdate: new Date().toISOString() },
  { id: 3, name: 'Ambulance 2', uniqueId: 'AMB002', status: 'online', lastUpdate: new Date().toISOString() },
  { id: 4, name: 'Motor Mobile 2', uniqueId: 'MOTOR002', status: 'offline', lastUpdate: new Date(Date.now() - 3600000).toISOString() }
]

const mockPositions: Position[] = [
  { id: 1, deviceId: 1, latitude: -6.2088, longitude: 106.8456, speed: 45, course: 90, altitude: 50, accuracy: 10, timestamp: new Date().toISOString() },
  { id: 2, deviceId: 2, latitude: -6.2100, longitude: 106.8470, speed: 32, course: 180, altitude: 45, accuracy: 8, timestamp: new Date().toISOString() },
  { id: 3, deviceId: 3, latitude: -6.2120, longitude: 106.8490, speed: 38, course: 270, altitude: 48, accuracy: 12, timestamp: new Date().toISOString() },
  { id: 4, deviceId: 4, latitude: -6.2140, longitude: 106.8510, speed: 0, course: 0, altitude: 52, accuracy: 15, timestamp: new Date(Date.now() - 3600000).toISOString() }
]

class TraccarService {
  private authHeader: string
  private useMockData: boolean = false

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
    if (this.useMockData) {
      console.log('Using mock data for devices')
      return mockDevices
    }

    try {
      const response = await axios.get(`${TRACCAR_URL}/api/devices`, {
        headers: this.getHeaders()
      })
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch devices:', error.response?.status, error.response?.data)
      if (error.response?.status === 401) {
        console.error('Authentication failed. Switching to mock data mode.')
        this.useMockData = true
        return mockDevices
      }
      throw error
    }
  }

  async getPositions(deviceId?: number): Promise<Position[]> {
    if (this.useMockData) {
      console.log('Using mock data for positions')
      return deviceId ? mockPositions.filter(p => p.deviceId === deviceId) : mockPositions
    }

    try {
      const url = deviceId
        ? `${TRACCAR_URL}/api/positions?deviceId=${deviceId}`
        : `${TRACCAR_URL}/api/positions`

      const response = await axios.get(url, {
        headers: this.getHeaders()
      })
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch positions:', error)
      if (error.response?.status === 401) {
        this.useMockData = true
        return deviceId ? mockPositions.filter(p => p.deviceId === deviceId) : mockPositions
      }
      throw error
    }
  }

  async getLatestPositions(): Promise<Position[]> {
    if (this.useMockData) {
      console.log('Using mock data for latest positions')
      return mockPositions
    }

    try {
      const response = await axios.get(`${TRACCAR_URL}/api/positions?latest=true`, {
        headers: this.getHeaders()
      })
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch latest positions:', error)
      if (error.response?.status === 401) {
        this.useMockData = true
        return mockPositions
      }
      throw error
    }
  }
}

export const traccarService = new TraccarService()