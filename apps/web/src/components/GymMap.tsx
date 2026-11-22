import { LngLatBounds, Map, Marker, Popup, type MapMouseEvent, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'

export type GymMarker = {
  id: string
  name: string
  lat: number
  lng: number
  equipment: { name: string; quantity: number }[]
}

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
}

export default function GymMap({
  gyms,
  onSelect,
  clickToPick,
  onPick,
}: {
  gyms?: GymMarker[]
  onSelect?: (id: string) => void
  clickToPick?: boolean
  onPick?: (lng: number, lat: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markersRef = useRef<Marker[]>([])

  useEffect(() => {
    if (!containerRef.current) return
    const map = new Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [116.4, 39.9],
      zoom: 11,
    })
    mapRef.current = map
    if (clickToPick && onPick) {
      map.on('click', (e: MapMouseEvent) => onPick(e.lngLat.lng, e.lngLat.lat))
    }
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !gyms) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const bounds = new LngLatBounds()
    for (const g of gyms) {
      const equip = g.equipment.length ? g.equipment.map((e) => `${e.name}×${e.quantity}`).join(' · ') : '无器械信息'
      const popup = new Popup({ offset: 28 }).setHTML(
        `<div style="min-width:140px"><strong>${g.name}</strong><div style="margin:4px 0;color:#555">${equip}</div>${
          onSelect ? `<button data-id="${g.id}" style="color:#4f46e5;cursor:pointer;background:none;border:none;padding:0">查看详情 →</button>` : ''
        }</div>`,
      )
      popup.getElement()?.addEventListener('click', (e: MouseEvent) => {
        const id = (e.target as HTMLElement).closest('[data-id]')?.getAttribute('data-id')
        if (id) onSelect?.(id)
      })
      const marker = new Marker().setLngLat([g.lng, g.lat]).setPopup(popup).addTo(map)
      markersRef.current.push(marker)
      bounds.extend([g.lng, g.lat])
    }
    if (gyms.length > 0) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gyms])

  return <div ref={containerRef} className="h-full w-full" />
}
