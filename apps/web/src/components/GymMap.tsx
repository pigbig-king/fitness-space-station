import { LngLatBounds, Map, Marker, Popup, type MapMouseEvent, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'

export type GymMarker = {
  id: string
  name: string
  lat: number
  lng: number
  price?: string | null
  environment?: string | null
  equipment: { name: string; quantity: number; status: string }[]
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
  onSelect?: (id: string, section?: string) => void
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
      const totalCount = g.equipment.reduce((s, e) => s + e.quantity, 0)
      const damagedCount = g.equipment.filter((e) => e.status !== 'NORMAL').length
      const equipSummary = `共 ${g.equipment.length} 种 ${totalCount} 件${damagedCount ? ` · 损坏 ${damagedCount}` : ''}`
      const price = g.price || '暂无'
      const environment = g.environment || '暂无'

      const html = `<div style="min-width:160px">
        <strong>${g.name}</strong>
        <div style="margin:6px 0;display:flex;flex-direction:column;gap:3px">
          <button data-id="${g.id}" data-section="equipment" style="text-align:left;color:#4f46e5;cursor:pointer;background:none;border:none;padding:0">器械：${equipSummary}</button>
          <button data-id="${g.id}" data-section="price" style="text-align:left;color:#4f46e5;cursor:pointer;background:none;border:none;padding:0">价格：${price}</button>
          <button data-id="${g.id}" data-section="environment" style="text-align:left;color:#4f46e5;cursor:pointer;background:none;border:none;padding:0">环境：${environment}</button>
        </div>
        <button data-id="${g.id}" style="color:#333;cursor:pointer;background:none;border:none;padding:0;text-decoration:underline">查看详情 →</button>
      </div>`

      const popup = new Popup({ offset: 28 }).setHTML(html)
      popup.getElement()?.addEventListener('click', (e: MouseEvent) => {
        const el = (e.target as HTMLElement).closest('[data-id]')
        if (!el) return
        const id = el.getAttribute('data-id')
        const section = el.getAttribute('data-section') || undefined
        if (id) onSelect?.(id, section)
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
