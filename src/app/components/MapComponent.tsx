'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-gpx'
import { Position, Device } from '../../lib/traccar'

// Fix for default markers in Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Fullscreen control function
const addFullscreenControl = (map: L.Map) => {
  // Create fullscreen button
  const fullscreenButton = L.Control.extend({
    options: {
      position: 'bottomleft'
    },

    onAdd: function() {
      const container = L.DomUtil.create('div', 'leaflet-control-fullscreen leaflet-bar leaflet-control')
      const button = L.DomUtil.create('a', 'leaflet-control-fullscreen-button', container)

      button.innerHTML = '⛶'
      button.href = '#'
      button.title = 'Toggle Fullscreen'
      button.style.cssText = `
        width: 36px;
        height: 36px;
        line-height: 36px;
        display: block;
        text-align: center;
        text-decoration: none;
        color: #333;
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        font-size: 18px;
        font-weight: bold;
      `

      L.DomEvent.on(button, 'click', (e) => {
        L.DomEvent.preventDefault(e)
        toggleFullscreen(map, container)
      })

      return container
    }
  })

  map.addControl(new fullscreenButton())
}

// Fullscreen toggle function using browser's Fullscreen API
const toggleFullscreen = async (map: L.Map, controlContainer: HTMLElement) => {
  const mapContainer = map.getContainer()

  try {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      await mapContainer.requestFullscreen()

      // Update button
      const button = controlContainer.querySelector('.leaflet-control-fullscreen-button') as HTMLElement
      if (button) {
        button.innerHTML = '⛶'
        button.title = 'Exit Fullscreen'
      }

      // Force map resize after fullscreen
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    } else {
      // Exit fullscreen
      await document.exitFullscreen()

      // Update button
      const button = controlContainer.querySelector('.leaflet-control-fullscreen-button') as HTMLElement
      if (button) {
        button.innerHTML = '⛶'
        button.title = 'Enter Fullscreen'
      }

      // Force map resize after exiting fullscreen
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }
  } catch (error) {
    console.error('Error toggling fullscreen:', error)
    // Fallback to CSS-based fullscreen if Fullscreen API fails
    fallbackFullscreenToggle(map, controlContainer)
  }
}

// Fallback fullscreen toggle using CSS (original implementation)
const fallbackFullscreenToggle = (map: L.Map, controlContainer: HTMLElement) => {
  const mapContainer = map.getContainer()
  const isFullscreen = mapContainer.classList.contains('leaflet-fullscreen')

  if (!isFullscreen) {
    // Enter fullscreen
    mapContainer.classList.add('leaflet-fullscreen')
    mapContainer.style.position = 'fixed'
    mapContainer.style.top = '0'
    mapContainer.style.left = '0'
    mapContainer.style.width = '100vw'
    mapContainer.style.height = '100vh'
    mapContainer.style.zIndex = '9999'

    // Update button
    const button = controlContainer.querySelector('.leaflet-control-fullscreen-button') as HTMLElement
    if (button) {
      button.innerHTML = '⛶'
      button.title = 'Exit Fullscreen'
    }

    // Force map resize
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  } else {
    // Exit fullscreen
    mapContainer.classList.remove('leaflet-fullscreen')
    mapContainer.style.position = ''
    mapContainer.style.top = ''
    mapContainer.style.left = ''
    mapContainer.style.width = ''
    mapContainer.style.height = ''
    mapContainer.style.zIndex = ''

    // Update button
    const button = controlContainer.querySelector('.leaflet-control-fullscreen-button') as HTMLElement
    if (button) {
      button.innerHTML = '⛶'
      button.title = 'Enter Fullscreen'
    }

    // Force map resize
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  }
}

// Custom marker icons with labels
const createCustomIcon = (type: 'ambulance' | 'motor' | 'default', isOnline: boolean = true, vehicleName: string = '') => {
  const color = isOnline ? '#10b981' : '#ef4444' // green for online, red for offline

  // Truncate vehicle name if too long
  const displayName = vehicleName.length > 12 ? vehicleName.substring(0, 12) + '...' : vehicleName

  let iconHtml = ''
  if (type === 'ambulance') {
    iconHtml = `
      <div style="position: relative; text-align: center;">
        <div style="
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          z-index: 1000;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">${displayName}</div>
        <div style="
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-45deg);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          margin-top: 5px;
        ">
          <span style="
            color: white;
            font-size: 14px;
            font-weight: bold;
            transform: rotate(45deg);
          ">🚑</span>
        </div>
      </div>
    `
  } else if (type === 'motor') {
    iconHtml = `
      <div style="position: relative; text-align: center;">
        <div style="
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          z-index: 1000;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">${displayName}</div>
        <div style="
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          margin-top: 5px;
        ">
          <span style="
            color: white;
            font-size: 14px;
            font-weight: bold;
          ">🏍️</span>
        </div>
      </div>
    `
  } else {
    iconHtml = `
      <div style="position: relative; text-align: center;">
        <div style="
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          z-index: 1000;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        ">${displayName}</div>
        <div style="
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          margin-top: 5px;
        ">
          <span style="
            color: white;
            font-size: 14px;
            font-weight: bold;
          ">📍</span>
        </div>
      </div>
    `
  }

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [30, 35], // Increased height to accommodate label
    iconAnchor: [15, 35], // Adjusted anchor point
    popupAnchor: [0, -35] // Adjusted popup anchor
  })
}

interface MapComponentProps {
  gpxData?: string | null
  devices?: Device[]
  positions?: Position[]
}

export default function MapComponent({ gpxData, devices = [], positions = [] }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const pathLinesRef = useRef<Map<number, L.Layer>>(new Map())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gpxLayerRef = useRef<any>(null)
  const gpxBoundsRef = useRef<L.LatLngBounds | null>(null)
  const gpxErrorCountRef = useRef<number>(0)
  const [showPaths, setShowPaths] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<L.LatLng | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      try {
        // Check for saved location
        const savedLocation = localStorage.getItem('jagalari-current-location')
        let initialView: [number, number] = [-6.2088, 106.8456] // Default Jakarta coordinates
        let initialZoom = 13

        if (savedLocation) {
          try {
            const locationData = JSON.parse(savedLocation)
            initialView = [locationData.lat, locationData.lng]
            initialZoom = locationData.zoom || 16
            console.log('Restoring saved location:', initialView)
          } catch (error) {
            console.error('Error parsing saved location:', error)
          }
        }

        // Initialize map
        const map = L.map(mapRef.current).setView(initialView, initialZoom)

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map)

        // Add global error handler for map
        map.on('error', (e: unknown) => {
          console.error('Map error:', e)
        })

        mapInstanceRef.current = map

        // Add fullscreen control
        addFullscreenControl(map)

        // Restore current location marker if it exists
        if (savedLocation) {
          try {
            const locationData = JSON.parse(savedLocation)
            const currentLocationIcon = L.divIcon({
              html: `
                <div style="
                  background-color: #3b82f6;
                  border: 3px solid white;
                  border-radius: 50%;
                  width: 20px;
                  height: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                  <div style="
                    background-color: white;
                    border-radius: 50%;
                    width: 8px;
                    height: 8px;
                  "></div>
                </div>
              `,
              className: 'current-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })

            const currentLocationMarker = L.marker([locationData.lat, locationData.lng], { icon: currentLocationIcon })
              .addTo(map)
              .bindPopup('📍 Your Current Location (Restored)')

            markersRef.current.set(-1, currentLocationMarker)
            setCurrentLocation(L.latLng(locationData.lat, locationData.lng))
            console.log('Restored current location marker')
          } catch (error) {
            console.error('Error restoring current location marker:', error)
          }
        }
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (error) {
          console.error('Error removing map:', error)
        }
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Global error handler for Leaflet/GPX errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('_leaflet_pos')) {
        console.error('Leaflet bounds error caught globally:', event)
        event.preventDefault() // Prevent the error from propagating
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && event.reason.message.includes('_leaflet_pos')) {
        console.error('Leaflet bounds promise rejection caught:', event.reason)
        event.preventDefault()
      }
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Get recent positions for path drawing (simplified approach)
  const getRecentPositions = (deviceId: number) => {
    // For now, we'll create a simple path using current position
    // In a real implementation, you'd fetch historical data
    const currentPosition = positions.find(p => p.deviceId === deviceId)
    if (currentPosition) {
      // Create a simple path ending at current position
      // This is a placeholder - in production you'd fetch historical positions
      return [currentPosition]
    }
    return []
  }

  // Create or update path indicator for a device
  const updateDevicePath = (deviceId: number, currentPosition: Position) => {
    if (!mapInstanceRef.current || !showPaths) return

    const map = mapInstanceRef.current

    // Remove existing path for this device
    if (pathLinesRef.current.has(deviceId)) {
      map.removeLayer(pathLinesRef.current.get(deviceId)!)
      pathLinesRef.current.delete(deviceId)
    }

    // Get recent positions
    const recentPositions = getRecentPositions(deviceId)

    if (recentPositions.length > 0) {
      // Create a simple circle around current position to indicate "path area"
      const pathCircle = L.circle([currentPosition.latitude, currentPosition.longitude], {
        color: getDevicePathColor(deviceId),
        fillColor: getDevicePathColor(deviceId),
        fillOpacity: 0.1,
        weight: 2,
        radius: 100 // 100 meter radius to show movement area
      })

      pathCircle.addTo(map)
      pathLinesRef.current.set(deviceId, pathCircle as L.Circle)
    }
  }

  // Get color for device path
  const getDevicePathColor = (deviceId: number) => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']
    return colors[deviceId % colors.length]
  }

  // Toggle path visibility
  const togglePaths = () => {
    setShowPaths(!showPaths)
    if (!showPaths) {
      // Show paths - fetch and draw for all devices
      positions.forEach(position => {
        const device = devices.find(d => d.id === position.deviceId)
        if (device) {
          updateDevicePath(device.id, position)
        }
      })
    } else {
      // Hide paths
      if (mapInstanceRef.current) {
        pathLinesRef.current.forEach(line => {
          mapInstanceRef.current!.removeLayer(line)
        })
        pathLinesRef.current.clear()
      }
    }
  }

  // Snap to current location
  const snapToCurrentLocation = () => {
    if (!mapInstanceRef.current) return

    // Prevent multiple simultaneous calls
    if (isLocating) {
      console.log('Location request already in progress')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
      setIsLocating(false)
      return
    }

    console.log('Requesting current location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const currentLatLng = L.latLng(latitude, longitude)

        console.log('Location found:', { latitude, longitude, accuracy })

        // Update state
        setCurrentLocation(currentLatLng)
        setIsLocating(false)

        // Save location to localStorage for persistence
        const locationData = {
          lat: latitude,
          lng: longitude,
          zoom: 16,
          timestamp: Date.now(),
          accuracy: accuracy
        }
        localStorage.setItem('jagalari-current-location', JSON.stringify(locationData))

        // Center map on current location
        mapInstanceRef.current!.setView(currentLatLng, 16)

        // Add a marker for current location if it doesn't exist
        if (!markersRef.current.has(-1)) { // Use -1 as ID for current location marker
          const currentLocationIcon = L.divIcon({
            html: `
              <div style="
                background-color: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">
                <div style="
                  background-color: white;
                  border-radius: 50%;
                  width: 8px;
                  height: 8px;
                "></div>
              </div>
            `,
            className: 'current-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })

          const currentLocationMarker = L.marker(currentLatLng, { icon: currentLocationIcon })
            .addTo(mapInstanceRef.current!)
            .bindPopup(`📍 Your Current Location<br><small>Accuracy: ±${Math.round(accuracy)}m</small>`)

          markersRef.current.set(-1, currentLocationMarker)
        } else {
          // Update existing marker position
          const existingMarker = markersRef.current.get(-1)
          if (existingMarker) {
            existingMarker.setLatLng(currentLatLng)
            existingMarker.setPopupContent(`📍 Your Current Location<br><small>Accuracy: ±${Math.round(accuracy)}m</small>`)
          }
        }

        console.log('Successfully snapped to current location:', latitude, longitude)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setIsLocating(false)

        let errorMessage = 'Unable to get your location'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your GPS/network settings.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.'
            break
          default:
            errorMessage = `Location error: ${error.message || 'Unknown error occurred'}`
            break
        }

        setLocationError(errorMessage)
      },
      {
        enableHighAccuracy: false, // Changed to false to avoid CoreLocation issues
        timeout: 15000, // Increased timeout
        maximumAge: 600000 // 10 minutes cache
      }
    )
  }

  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker))
    markersRef.current.clear()

    // Add markers for each position
    positions.forEach(position => {
      const device = devices.find(d => d.id === position.deviceId)
      if (device) {
        console.log('Adding marker for device:', device.name, 'at', position.latitude, position.longitude)

        // Determine marker type based on device name
        let markerType: 'ambulance' | 'motor' | 'default' = 'default'
        const deviceName = device.name.toLowerCase()

        if (deviceName.includes('ambulance')) {
          markerType = 'ambulance'
        } else if (deviceName.includes('motor mobile') || deviceName.includes('motor')) {
          markerType = 'motor'
        }

        const isOnline = device.status === 'online'
        const customIcon = createCustomIcon(markerType, isOnline, device.name)

        const marker = L.marker([position.latitude, position.longitude], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <b>${device.name}</b><br>
            Status: <span style="color: ${isOnline ? 'green' : 'red'}">${device.status}</span><br>
            Speed: ${position.speed} km/h<br>
            Last Update: ${new Date(position.timestamp).toLocaleString()}
          `)

        markersRef.current.set(position.deviceId, marker)
      }
    })

    console.log('Total markers added:', markersRef.current.size)

    // Update device paths if enabled
    if (showPaths) {
      positions.forEach(position => {
        const device = devices.find(d => d.id === position.deviceId)
        if (device) {
          updateDevicePath(device.id, position)
        }
      })
    }

    // Fit map to show all markers
    if (positions.length > 0 && markersRef.current.size > 0) {
      const validMarkers = Object.values(markersRef.current).filter(marker => marker && marker.getLatLng())
      if (validMarkers.length > 0) {
        const group = L.featureGroup(validMarkers)
        const bounds = group.getBounds()
        if (bounds && bounds.isValid()) {
          try {
            map.fitBounds(bounds.pad(0.1))
          } catch (fitError) {
            console.error('Error fitting marker bounds to map:', fitError)
            // Fallback: set view to first marker position
            const firstMarker = validMarkers[0]
            if (firstMarker) {
              map.setView(firstMarker.getLatLng(), 13)
            }
          }
        } else {
          // Fallback: set view to first marker position
          const firstMarker = validMarkers[0]
          if (firstMarker) {
            map.setView(firstMarker.getLatLng(), 13)
          }
        }
      }
    } else if (positions.length === 0) {
      // No positions yet, set default view
      map.setView([-6.2088, 106.8456], 13)
    }
  }, [positions, devices])

  useEffect(() => {
    if (!mapInstanceRef.current || !gpxData) return

    // Check if we've had too many GPX errors
    if (gpxErrorCountRef.current >= 3) {
      console.warn('GPX functionality disabled due to repeated errors')
      return
    }

    const map = mapInstanceRef.current

    // Remove existing GPX layer
    if (gpxLayerRef.current) {
      map.removeLayer(gpxLayerRef.current)
    }

    // Validate GPX data
    if (!gpxData.trim() || !gpxData.includes('<gpx')) {
      console.warn('Invalid GPX data provided')
      return
    }

    // Add new GPX layer
    try {
      // Additional validation for GPX data
      if (gpxData.length < 100) {
        console.warn('GPX data seems too short, might be invalid')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gpx = new (L as any).GPX(gpxData, {
        async: true,
        marker_options: {
          startIconUrl: null,
          endIconUrl: null,
          shadowUrl: null
        },
        polyline_options: {
          color: '#2563eb',
          weight: 6,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round'
        }
      })

      // Add error handler to GPX object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gpx.on('error', (e: any) => {
        console.error('GPX parsing error:', e)
      })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gpx.on('loaded', (e: any) => {
      try {
        console.log('GPX loaded successfully')
        // Store bounds for manual fitting
        const bounds = e.target.getBounds()
        if (bounds) {
          gpxBoundsRef.current = bounds
          console.log('GPX bounds stored for manual fitting')
        }
      } catch (error) {
        console.error('Error in GPX loaded event:', error)
        gpxErrorCountRef.current++
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gpx.on('error', (e: any) => {
      console.error('GPX loading error:', e)
      gpxErrorCountRef.current++
    })

    gpx.addTo(map)
    gpxLayerRef.current = gpx
    } catch (error) {
      console.error('Error creating GPX layer:', error)
      gpxErrorCountRef.current++
    }
  }, [gpxData])

  // Calculate statistics
  const ambulanceCount = devices.filter(device =>
    device.name.toLowerCase().includes('ambulance')
  ).length

  const motorMobileCount = devices.filter(device =>
    device.name.toLowerCase().includes('motor mobile') || device.name.toLowerCase().includes('motor')
  ).length

  const onlineCount = devices.filter(device => device.status === 'online').length
  const offlineCount = devices.filter(device => device.status === 'offline').length
  const totalCount = devices.length

  return (
    <div ref={mapRef} className="h-full w-full relative">
      {/* Statistics Cards - Floating over map */}
      <div className="absolute top-4 right-4 z-[1000] space-y-3">
        {/* Live Update Indicator */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-md rounded-xl shadow-xl border border-green-200/50 p-4 flex items-center space-x-3 min-w-[180px] hover:shadow-2xl transition-all duration-300">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
          <div>
            <div className="text-sm font-semibold text-green-800">Live Tracking</div>
            <div className="text-xs text-green-600">Real-time updates</div>
          </div>
        </div>

        {/* Total Vehicles */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-md rounded-xl shadow-xl border border-blue-200/50 p-4 min-w-[180px] hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">🚐</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-blue-800">Total Fleet</div>
              <div className="text-2xl font-bold text-blue-900">{totalCount}</div>
            </div>
          </div>
        </div>

        {/* Ambulances */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 backdrop-blur-md rounded-xl shadow-xl border border-red-200/50 p-4 min-w-[180px] hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg flex items-center justify-center">
              <span className="text-white text-xs">🚑</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-red-800">Ambulances</div>
              <div className="text-2xl font-bold text-red-900">{ambulanceCount}</div>
            </div>
          </div>
        </div>

        {/* Motor Mobiles */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 backdrop-blur-md rounded-xl shadow-xl border border-orange-200/50 p-4 min-w-[180px] hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-orange-500 rounded-full shadow-lg flex items-center justify-center">
              <span className="text-white text-xs">🏍️</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-orange-800">Motor Mobile</div>
              <div className="text-2xl font-bold text-orange-900">{motorMobileCount}</div>
            </div>
          </div>
        </div>

        {/* Online Status */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 backdrop-blur-md rounded-xl shadow-xl border border-emerald-200/50 p-4 min-w-[180px] hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center">
              <span className="text-white text-xs">●</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-emerald-800">Online</div>
              <div className="text-2xl font-bold text-emerald-900">{onlineCount}</div>
            </div>
          </div>
        </div>

        {/* Offline Status */}
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 backdrop-blur-md rounded-xl shadow-xl border border-gray-200/50 p-4 min-w-[180px] hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-gray-500 rounded-full shadow-lg flex items-center justify-center">
              <span className="text-white text-xs">●</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">Offline</div>
              <div className="text-2xl font-bold text-gray-900">{offlineCount}</div>
            </div>
          </div>
        </div>

        {/* Path Toggle */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 backdrop-blur-md rounded-xl shadow-xl border border-purple-200/50 p-4 min-w-[180px] hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full shadow-lg flex items-center justify-center ${showPaths ? 'bg-purple-500' : 'bg-gray-400'}`}>
                <span className="text-white text-xs">📍</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-purple-800">Show Paths</div>
                <div className="text-xs text-purple-600">{showPaths ? 'On' : 'Off'}</div>
              </div>
            </div>
            <button
              onClick={togglePaths}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                showPaths
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              }`}
            >
              {showPaths ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Current Location */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 backdrop-blur-md rounded-xl shadow-xl border border-cyan-200/50 p-4 min-w-[180px] hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full shadow-lg flex items-center justify-center ${isLocating ? 'bg-orange-500 animate-pulse' : 'bg-cyan-500'}`}>
                <span className="text-white text-xs">{isLocating ? '⏳' : '📍'}</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-cyan-800">My Location</div>
                <div className="text-xs text-cyan-600">
                  {isLocating ? 'Locating...' : locationError ? 'Error' : currentLocation ? 'Located' : 'Find me'}
                </div>
              </div>
            </div>
            <button
              onClick={snapToCurrentLocation}
              disabled={isLocating}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 shadow-sm ${
                isLocating
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-white'
              }`}
              title={isLocating ? 'Location request in progress...' : 'Center map on your current location'}
            >
              {isLocating ? '⏳' : '📍'}
            </button>
          </div>
          {locationError && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
              {locationError}
            </div>
          )}
        </div>
      </div>

      {/* GPX File Info - Bottom right */}
      {gpxData && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-3">
            <div className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-2">
                <div className="text-lg">📍</div>
                <div>
                  <div className="text-xs text-gray-600">GPX Route</div>
                  <div className="text-sm font-medium text-gray-900">
                    {typeof window !== 'undefined' ? (localStorage.getItem('jagalari-gpx-filename') || 'Route Loaded') : 'Route Loaded'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (mapInstanceRef.current && gpxBoundsRef.current) {
                    try {
                      mapInstanceRef.current.fitBounds(gpxBoundsRef.current, { padding: [20, 20] })
                      console.log('Map fitted to GPX bounds manually')
                    } catch (fitError) {
                      console.error('Error fitting GPX bounds:', fitError)
                      // Fallback: center on bounds center
                      try {
                        const center = gpxBoundsRef.current.getCenter()
                        if (center && mapInstanceRef.current) {
                          mapInstanceRef.current.setView(center, 13)
                        }
                      } catch (centerError) {
                        console.error('Error setting map center:', centerError)
                      }
                    }
                  }
                }}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors duration-200 shadow-sm"
                title="Fit map to show entire GPX route"
              >
                Fit Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
