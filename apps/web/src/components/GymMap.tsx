import { LngLatBounds, Map, Popup, type GeoJSONSource, type MapMouseEvent, type StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'

export type GymMarker = {
  id: string
  name: string
  lat: number
  lng: number
  district?: string | null
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

// 音游地图风格：按分区着色圆点
const DISTRICT_COLORS: Record<string, string> = {
  蜀山区: '#e11d48',
  庐阳区: '#f59e0b',
  包河区: '#10b981',
  瑶海区: '#3b82f6',
  政务区: '#8b5cf6',
}
const DEFAULT_COLOR = '#4f46e5'

function districtColor(d?: string | null): string {
  return (d && DISTRICT_COLORS[d]) || DEFAULT_COLOR
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
  const popupRef = useRef<Popup | null>(null)

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
    } else {
      map.on('click', 'gym-unclustered', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['gym-unclustered'] })
        if (!features.length) return
        const f = features[0]
        const props = f.properties as Record<string, string>
        const coords = (f.geometry as { coordinates: [number, number] }).coordinates
        popupRef.current?.remove()
        popupRef.current = new Popup({ offset: 14 }).setLngLat(coords).setHTML(buildPopupHTML(props)).addTo(map)
        popupRef.current.getElement()?.addEventListener('click', (ev: MouseEvent) => {
          const el = (ev.target as HTMLElement).closest('[data-id]')
          if (!el) return
          const id = el.getAttribute('data-id')
          const section = el.getAttribute('data-section') || undefined
          if (id) onSelect?.(id, section)
        })
      })

      map.on('click', 'gym-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['gym-clusters'] })
        if (!features.length) return
        const feature = features[0]
        const clusterId = feature.properties?.cluster_id as number
        const source = map.getSource('gyms') as GeoJSONSource
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const coords = (feature.geometry as { coordinates: [number, number] }).coordinates
          map.easeTo({ center: coords, zoom })
        })
      })

      map.on('mouseenter', 'gym-unclustered', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'gym-unclustered', () => (map.getCanvas().style.cursor = ''))
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || clickToPick || !gyms) return

    const geojson = {
      type: 'FeatureCollection',
      features: gyms.map((g) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [g.lng, g.lat] },
        properties: {
          id: g.id,
          name: g.name,
          color: districtColor(g.district),
          district: g.district ?? '',
          price: g.price ?? '暂无',
          environment: g.environment ?? '暂无',
          equip: g.equipment.length ? g.equipment.map((e) => `${e.name}×${e.quantity}`).join('、') : '暂无',
          damaged: g.equipment.filter((e) => e.status !== 'NORMAL').length,
        },
      })),
    }

    const source = map.getSource('gyms') as GeoJSONSource | undefined
    if (source) {
      source.setData(geojson as never)
    } else {
      map.addSource('gyms', {
        type: 'geojson',
        data: geojson as never,
        cluster: true,
        clusterRadius: 50,
        clusterMaxZoom: 14,
      })
      map.addLayer({
        id: 'gym-clusters',
        type: 'circle',
        source: 'gyms',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#4f46e5',
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 26, 30, 34],
          'circle-opacity': 0.85,
        },
      })
      map.addLayer({
        id: 'gym-cluster-count',
        type: 'symbol',
        source: 'gyms',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Regular'],
          'text-size': 13,
        },
        paint: { 'text-color': '#ffffff' },
      })
      map.addLayer({
        id: 'gym-unclustered',
        type: 'circle',
        source: 'gyms',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })
    }

    const bounds = new LngLatBounds()
    for (const g of gyms) bounds.extend([g.lng, g.lat])
    if (gyms.length > 0) map.fitBounds(bounds, { padding: 60, maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gyms])

  return <div ref={containerRef} className="h-full w-full" />
}

function buildPopupHTML(p: Record<string, string>): string {
  const damaged = Number(p.damaged) > 0 ? ` · 损坏 ${p.damaged}` : ''
  return `<div style="min-width:170px">
    <strong style="font-size:14px">${p.name}</strong>
    <div style="margin:4px 0 6px;color:#888;font-size:11px">${p.district}</div>
    <div style="display:flex;flex-direction:column;gap:3px;font-size:13px">
      <button data-id="${p.id}" data-section="equipment" style="text-align:left;color:#4f46e5;cursor:pointer;background:none;border:none;padding:0">器械：${p.equip}${damaged}</button>
      <button data-id="${p.id}" data-section="price" style="text-align:left;color:#4f46e5;cursor:pointer;background:none;border:none;padding:0">价格：${p.price}</button>
      <button data-id="${p.id}" data-section="environment" style="text-align:left;color:#4f46e5;cursor:pointer;background:none;border:none;padding:0">环境：${p.environment}</button>
    </div>
    <button data-id="${p.id}" style="margin-top:6px;color:#333;cursor:pointer;background:none;border:none;padding:0;text-decoration:underline;font-size:12px">查看详情 →</button>
  </div>`
}
