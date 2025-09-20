'use client'

import { UserButton } from '@clerk/nextjs'
import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { traccarService, Device, Position } from '../../lib/traccar'

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('../components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center">Loading map...</div>
})

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [gpxData, setGpxData] = useState<string | null>(null)
  const [authError, setAuthError] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [displayTime, setDisplayTime] = useState<string>('Loading...')
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devicesData, positionsData] = await Promise.all([
          traccarService.getDevices(),
          traccarService.getLatestPositions()
        ])
        setDevices(devicesData)
        setPositions(positionsData)
        setAuthError(false)
        setLastUpdate(new Date())
      } catch (error: unknown) {
        console.error('Failed to fetch Traccar data:', error)
        const axiosError = error as { response?: { status?: number } }
        if (axiosError.response?.status === 401) {
          console.error('Traccar authentication failed. Please check your credentials in .env.local')
          setAuthError(true)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.name.endsWith('.gpx')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setGpxData(content)
        // Save to localStorage to persist across page refreshes
        localStorage.setItem('jagalari-gpx-data', content)
        localStorage.setItem('jagalari-gpx-filename', file.name)
      }
      reader.readAsText(file)
    } else {
      alert('Please select a valid GPX file')
    }
  }

  const clearGpxData = () => {
    setGpxData(null)
    localStorage.removeItem('jagalari-gpx-data')
    localStorage.removeItem('jagalari-gpx-filename')
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Load GPX data from localStorage on component mount
  useEffect(() => {
    const savedGpxData = localStorage.getItem('jagalari-gpx-data')
    if (savedGpxData) {
      setGpxData(savedGpxData)
    }
  }, [])

  // Update display time after hydration
  useEffect(() => {
    setDisplayTime(lastUpdate.toLocaleTimeString())
  }, [lastUpdate])

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Jagalari Tracker Dashboard</h1>
          <p className="text-sm text-gray-700">
            Last updated: {displayTime}
          </p>
        </div>
        <UserButton />
      </header>

      {/* Main Content - Desktop */}
      <main className="hidden lg:flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="w-80 bg-white border-r p-4 flex-shrink-0">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-black mb-2">GPX Upload</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx"
                onChange={handleFileUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {gpxData && (
                <div className="mt-2 space-y-2">
                  <div className="text-base font-medium text-green-700 flex items-center">
                    <span className="mr-2">📍</span>
                    GPX file loaded: {localStorage.getItem('jagalari-gpx-filename') || 'GPX Route'}
                  </div>
                  <button
                    onClick={clearGpxData}
                    className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Clear GPX
                  </button>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-black mb-2">Active Vehicles</h2>
              {authError && (
                <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-base text-yellow-800">
                  ⚠️ Using demo data - Traccar authentication failed. Please check your credentials in .env.local
                </div>
              )}
              {loading ? (
                <div className="text-base text-gray-700">Loading devices...</div>
              ) : (
                <div className="space-y-2">
                  {devices.map(device => {
                    const deviceName = device.name.toLowerCase()
                    let icon = '📍'
                    if (deviceName.includes('ambulance')) {
                      icon = '🚑'
                    } else if (deviceName.includes('motor mobile') || deviceName.includes('motor')) {
                      icon = '🏍️'
                    }

                    return (
                      <div key={device.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{icon}</span>
                          <span className="text-base text-gray-800">{device.name}</span>
                        </div>
                        <span className={`text-sm font-medium ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                          {device.status}
                        </span>
                      </div>
                    )
                  })}
                  {devices.length === 0 && !authError && (
                    <div className="text-base text-gray-700">No devices found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Desktop Map Container */}
        <div className="flex-1 relative">
          <MapComponent gpxData={gpxData} devices={devices} positions={positions} />
        </div>
      </main>

      {/* Main Content - Mobile */}
      <main className="flex flex-col lg:hidden h-full">
        {/* Mobile Menu Bar - Above Map */}
        <div className="bg-white border-b shadow-sm">
          {/* Menu Toggle */}
          <div className="p-3 border-b">
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">📋</span>
                <span className="font-medium text-gray-800">Menu & Controls</span>
              </div>
              <span className={`transform transition-transform ${showMobileSidebar ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>

          {/* Expandable Menu Content */}
          {showMobileSidebar && (
            <div className="border-t bg-gray-50">
              <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                {/* GPX Upload Section */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="mr-2">📍</span>
                    GPX Route
                  </h3>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".gpx"
                    onChange={handleFileUpload}
                    className="w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                  />
                  {gpxData ? (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-green-600">✅ Route loaded</span>
                      <button
                        onClick={clearGpxData}
                        className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-gray-500">No route loaded</div>
                  )}
                </div>

                {/* Fleet Stats */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="mr-2">🚐</span>
                    Fleet Status
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50 rounded p-2">
                      <div className="text-lg font-bold text-blue-600">{devices.length}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                    <div className="bg-green-50 rounded p-2">
                      <div className="text-lg font-bold text-green-600">
                        {devices.filter(d => d.status === 'online').length}
                      </div>
                      <div className="text-xs text-gray-600">Online</div>
                    </div>
                    <div className="bg-red-50 rounded p-2">
                      <div className="text-lg font-bold text-red-600">
                        {devices.filter(d => d.status === 'offline').length}
                      </div>
                      <div className="text-xs text-gray-600">Offline</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="mr-2">⚡</span>
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-2 bg-blue-50 text-blue-700 rounded text-sm hover:bg-blue-100 transition-colors">
                      🔄 Refresh
                    </button>
                    <button className="p-2 bg-gray-50 text-gray-700 rounded text-sm hover:bg-gray-100 transition-colors">
                      ⚙️ Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Map Container - Below Menu */}
        <div className="flex-1 relative">
          <MapComponent gpxData={gpxData} devices={devices} positions={positions} />
        </div>
      </main>
    </div>
  )
}
