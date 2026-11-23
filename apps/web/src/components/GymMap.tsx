import { LngLatBounds, Map, Popup, setWorkerUrl, type GeoJSONSource, type MapMouseEvent, type StyleSpecification } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'

setWorkerUrl(maplibreWorkerUrl)

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

const BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    base: {
      type: 'raster',
      tiles: ['https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'],
      tileSize: 256,
      attribution: '© 高德地图',
    },
  },
  layers: [{ id: 'base', type: 'raster', source: 'base' }],
}

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

// 地图钉 SVG（尖端在底部）
function pinSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42"><path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.7 23.3 0 15 0z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/><circle cx="15" cy="15" r="5.2" fill="#ffffff"/></svg>`
}

function loadPinImage(map: Map, color: string): Promise<void> {
  return new Promise((resolve) => {
    const name = 'pin-' + color.slice(1)
    if (map.hasImage(name)) {
      resolve()
      return
    }
    const img = new Image()
    img.onload = () => {
      if (!map.hasImage(name)) map.addImage(name, img)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pinSvg(color))
  })
}

function buildFeatures(gyms: GymMarker[]) {
  return {
    type: 'FeatureCollection',
    features: gyms.map((g) => {
      const color = districtColor(g.district)
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [g.lng, g.lat] },
        properties: {
          id: g.id,
          name: g.name,
          color,
          icon: 'pin-' + color.slice(1),
          district: g.district ?? '',
          price: g.price ?? '暂无',
          environment: g.environment ?? '暂无',
          equip: g.equipment.length ? g.equipment.map((e) => `${e.name}×${e.quantity}`).join('、') : '暂无',
          damaged: g.equipment.filter((e) => e.status !== 'NORMAL').length,
        },
      }
    }),
  }
}

function applyGyms(map: Map, gyms: GymMarker[]) {
  const source = map.getSource('gyms') as GeoJSONSource | undefined
  if (!source) return
  source.setData(buildFeatures(gyms) as never)
  const bounds = new LngLatBounds()
  for (const g of gyms) bounds.extend([g.lng, g.lat])
  if (gyms.length > 0) map.fitBounds(bounds, { padding: 60, maxZoom: 15 })
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

export default function GymMap({
  gyms,
  onSelect,
  clickToPick,
  onPick,
  focus,
}: {
  gyms?: GymMarker[]
  onSelect?: (id: string, section?: string) => void
  clickToPick?: boolean
  onPick?: (lng: number, lat: number) => void
  focus?: { lng: number; lat: number; zoom?: number } | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const popupRef = useRef<Popup | null>(null)
  const gymsRef = useRef<GymMarker[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    let map: Map | null = null
    try {
      map = new Map({
        container: containerRef.current,
        style: BASE_STYLE,
        center: [116.4, 39.9],
        zoom: 11,
      })
      mapRef.current = map
      const m = map

      if (clickToPick && onPick) {
        m.on('click', (e: MapMouseEvent) => onPick(e.lngLat.lng, e.lngLat.lat))
      } else {
        m.on('load', async () => {
          try {
            // 预加载各分区颜色图钉
            for (const color of Object.values(DISTRICT_COLORS)) await loadPinImage(m, color)
            await loadPinImage(m, DEFAULT_COLOR)

            if (!m.getSource('gyms')) {
              m.addSource('gyms', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
                cluster: true,
                clusterRadius: 50,
                clusterMaxZoom: 14,
              })
              m.addLayer({
                id: 'gym-clusters',
                type: 'circle',
                source: 'gyms',
                filter: ['has', 'point_count'],
                paint: {
                  'circle-color': '#4f46e5',
                  'circle-radius': ['step', ['get', 'point_count'], 18, 10, 26, 30, 34],
                  'circle-opacity': 0.85,
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff',
                },
              })
              m.addLayer({
                id: 'gym-unclustered',
                type: 'symbol',
                source: 'gyms',
                filter: ['!', ['has', 'point_count']],
                layout: {
                  'icon-image': ['get', 'icon'],
                  'icon-size': 0.7,
                  'icon-allow-overlap': true,
                  'icon-anchor': 'bottom',
                },
              })
            }
            applyGyms(m, gymsRef.current)
          } catch (err) {
            console.error('map layer setup failed:', err)
          }
        })

        m.on('click', 'gym-unclustered', (e) => {
          const features = m.queryRenderedFeatures(e.point, { layers: ['gym-unclustered'] })
          if (!features.length) return
          const f = features[0]
          const props = f.properties as Record<string, string>
          const coords = (f.geometry as { coordinates: [number, number] }).coordinates
          popupRef.current?.remove()
          popupRef.current = new Popup({ offset: 28 }).setLngLat(coords).setHTML(buildPopupHTML(props)).addTo(m)
          popupRef.current.getElement()?.addEventListener('click', (ev: MouseEvent) => {
            const el = (ev.target as HTMLElement).closest('[data-id]')
            if (!el) return
            const id = el.getAttribute('data-id')
            const section = el.getAttribute('data-section') || undefined
            if (id) onSelect?.(id, section)
          })
        })

        m.on('click', 'gym-clusters', (e) => {
          const features = m.queryRenderedFeatures(e.point, { layers: ['gym-clusters'] })
          if (!features.length) return
          const feature = features[0]
          const clusterId = feature.properties?.cluster_id as number
          const source = m.getSource('gyms') as GeoJSONSource
          source.getClusterExpansionZoom(clusterId).then((zoom) => {
            const coords = (feature.geometry as { coordinates: [number, number] }).coordinates
            m.easeTo({ center: coords, zoom })
          })
        })

        m.on('mouseenter', 'gym-unclustered', () => (m.getCanvas().style.cursor = 'pointer'))
        m.on('mouseleave', 'gym-unclustered', () => (m.getCanvas().style.cursor = ''))
      }
    } catch (err) {
      console.error('map init failed:', err)
      setFailed(true)
    }

    return () => {
      map?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    gymsRef.current = gyms ?? []
    const map = mapRef.current
    if (map && map.getSource('gyms')) {
      applyGyms(map, gyms ?? [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gyms])

  useEffect(() => {
    if (focus && mapRef.current) {
      mapRef.current.flyTo({ center: [focus.lng, focus.lat], zoom: focus.zoom ?? 13 })
    }
  }, [focus])

  if (failed) {
    return <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">地图加载失败，请刷新重试</div>
  }
  return <div ref={containerRef} className="h-full w-full" />
}
