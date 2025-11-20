'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-gpx'
import { Position, Device } from '../../lib/traccar'

// Fix default marker icons in Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// =============== FULLSCREEN CONTROL ==================

const addFullscreenControl = (map: L.Map) => {
  const fullscreenButton = L.Control.extend({
    options: { position: 'bottomleft' },
    onAdd: function () {
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
        background-color: white;
        border-radius: 6px;
        font-size: 18px;
        color: #333;
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

const toggleFullscreen = async (map: L.Map, controlContainer: HTMLElement) => {
  const mapContainer = map.getContainer()

  try {
    if (!document.fullscreenElement) {
      await mapContainer.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }

    setTimeout(() => {
      map.invalidateSize()
    }, 200)
  } catch (err) {
    console.error('Fullscreen error:', err)
  }
}

// =============== CUSTOM ICON GENERATOR ==================

const createCustomIcon = (
  type: 'ambulance' | 'motor' | 'default',
  isOnline = true,
  vehicleName = ''
) => {
  const color = isOnline ? '#10b981' : '#ef4444'
  const displayName = vehicleName.length > 12 ? vehicleName.slice(0, 12) + '...' : vehicleName

  const html = `
    <div style="position: relative; text-align: center;">
      <div style="
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0,0,0,0.7);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
      ">${displayName}</div>

      <div style="
        background-color: ${color};
        border: 2px solid white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display:flex;
        justify-content:center;
        align-items:center;
      ">
        <span style="font-size:14px;">${
          type === 'ambulance'
            ? '🚑'
            : type === 'motor'
            ? '🏍️'
            : '📍'
        }</span>
      </div>
    </div>
  `

  return L.divIcon({
    className: 'custom-marker',
    html,
    iconSize: [30, 35],
    iconAnchor: [15, 35],
  })
}

interface MapComponentProps {
  gpxData?: string | null
  devices?: Device[]
  positions?: Position[]
}

export default function MapComponent({
  gpxData,
  devices = [],
  positions = []
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<number, L.Marker>>(new Map())

  const [showStats, setShowStats] = useState(true)

  // =============== INITIALIZE MAP ==================

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current).setView([-6.2088, 106.8456], 13)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      addFullscreenControl(map)
      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [])

  // =============== UPDATE MARKERS ==================

  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current.clear()

    positions.forEach((p) => {
      const device = devices.find((d) => d.id === p.deviceId)
      if (!device) return

      const lower = device.name.toLowerCase()

      let type: 'ambulance' | 'motor' | 'default' = 'default'
      if (lower.includes('ambulance')) type = 'ambulance'
      else if (lower.includes('motor')) type = 'motor'

      const icon = createCustomIcon(type, device.status === 'online', device.name)

      const marker = L.marker([p.latitude, p.longitude], { icon }).addTo(map)
      markersRef.current.set(device.id, marker)
    })

    if (markersRef.current.size > 0) {
      const group = L.featureGroup([...markersRef.current.values()])
      map.fitBounds(group.getBounds().pad(0.2))
    }
  }, [positions, devices])

  // =============== STATS CALC ==================

  const total = devices.length
  const ambulanceCount = devices.filter((d) => d.name.toLowerCase().includes('ambulance')).length
  const motorCount = devices.filter((d) => d.name.toLowerCase().includes('motor')).length
  const online = devices.filter((d) => d.status === 'online').length
  const offline = devices.filter((d) => d.status === 'offline').length

  // =============== RENDER ==================

  return (
    <div ref={mapRef} className="w-full h-full relative">

      {/* STATS TOGGLE BUTTON */}
      <div className="absolute top-4 right-4 z-[9999]">
        <button
          className="px-3 py-1 bg-gray-700 text-white rounded shadow"
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </button>

        {/* STATS CARDS */}
        {showStats && (
          <div className="mt-2 space-y-2 w-48">

            {/* Total */}
            <div className="bg-blue-100 rounded shadow px-3 py-2">
              <div className="text-sm font-bold">Total Kendaraan</div>
              <div className="text-2xl font-bold text-blue-800">{total}</div>
            </div>

            {/* Ambulance */}
            <div className="bg-red-100 rounded shadow px-3 py-2">
              <div className="text-sm font-bold">Ambulance</div>
              <div className="text-2xl font-bold text-red-800">{ambulanceCount}</div>
            </div>

            {/* Motor */}
            <div className="bg-orange-100 rounded shadow px-3 py-2">
              <div className="text-sm font-bold">Motor Mobile</div>
              <div className="text-2xl font-bold text-orange-800">{motorCount}</div>
            </div>

            {/* Online */}
            <div className="bg-green-100 rounded shadow px-3 py-2">
              <div className="text-sm font-bold">Online</div>
              <div className="text-2xl font-bold text-green-800">{online}</div>
            </div>

            {/* Offline */}
            <div className="bg-gray-200 rounded shadow px-3 py-2">
              <div className="text-sm font-bold">Offline</div>
              <div className="text-2xl font-bold text-gray-800">{offline}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
