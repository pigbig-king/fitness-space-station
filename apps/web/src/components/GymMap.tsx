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
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    base: {
      type: 'raster',
      tiles: ['https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'],
      tileSize: 256,
      attribution: '© 高德地图',
    },
  },
  layers: [
    {
      id: 'base',
      type: 'raster',
      source: 'base',
      paint: {
        'raster-brightness-min': 0.3,
        'raster-saturation': -0.5,
        'raster-opacity': 0.9,
      },
    },
  ],
}

const PIN_COLOR = '#ef4444'

function pinSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42"><path fill-rule="evenodd" fill="${PIN_COLOR}" stroke="#ffffff" stroke-width="1.5" d="M15 1C7.3 1 1 7.3 1 15c0 10.5 14 25 14 25s14-14.5 14-25C29 7.3 22.7 1 15 1z M15 10.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z"/></svg>`
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}

function loadPinImage(map: Map): Promise<void> {
  return new Promise((resolve) => {
    if (map.hasImage('gym-pin')) {
      resolve()
      return
    }
    const img = new Image()
    img.onload = () => {
      if (!map.hasImage('gym-pin')) map.addImage('gym-pin', img)
      resolve()
    }
    img.onerror = () => resolve()
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pinSvg())
  })
}

function buildFeatures(gyms: GymMarker[]) {
  return {
    type: 'FeatureCollection',
    features: gyms.map((g) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [g.lng, g.lat] },
      properties: {
        id: g.id,
        name: g.name,
        district: g.district ?? '',
        price: g.price ?? '暂无',
        environment: g.environment ?? '暂无',
        equip: g.equipment.length ? g.equipment.map((e) => `${e.name}×${e.quantity}`).join('、') : '暂无',
        damaged: g.equipment.filter((e) => e.status !== 'NORMAL').length,
      },
    })),
  }
}

function applyGyms(map: Map, gyms: GymMarker[]) {
  const source = map.getSource('gyms') as GeoJSONSource | undefined
  if (!source) return
  source.setData(buildFeatures(gyms) as never)
}

function buildPopupHTML(p: Record<string, string>): string {
  const damaged = Number(p.damaged) > 0 ? ` · 损坏 ${p.damaged}` : ''
  const row = (icon: string, label: string, value: string, section: string) =>
    `<button data-id="${escapeHtml(p.id)}" data-section="${section}" class="popup-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;background:#f6f5ff;border:1px solid #e7e3ff;border-radius:9px;padding:9px 12px;cursor:pointer;font-size:13px;color:#1f2937;transition:background .15s,border-color .15s;">
      <span style="font-weight:600;white-space:nowrap;">${icon} ${label}</span>
      <span style="color:#6b7280;font-size:12px;text-align:right;">${escapeHtml(value)}</span>
    </button>`

  return `
  <div style="min-width:240px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:14px 32px 14px 16px;color:#fff;">
      <div style="font-size:15px;font-weight:700;line-height:1.35;word-break:break-all;">${escapeHtml(p.name)}</div>
      ${p.district ? `<div style="margin-top:3px;font-size:12px;opacity:0.9;">📍 ${escapeHtml(p.district)}</div>` : ''}
    </div>
    <div style="padding:12px 16px;display:flex;flex-direction:column;gap:8px;">
      ${row('🏋️', '器械', p.equip + damaged, 'equipment')}
      ${row('💰', '价格', p.price, 'price')}
      ${row('🌿', '环境', p.environment, 'environment')}
    </div>
    <div style="padding:10px 16px;border-top:1px solid #f1f1f5;">
      <button data-id="${escapeHtml(p.id)}" style="width:100%;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;border-radius:9px;padding:10px 0;font-size:14px;font-weight:600;cursor:pointer;">查看详情 →</button>
    </div>
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
  const fittedRef = useRef(false)
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
        localIdeographFontFamily: 'sans-serif',
      })
      mapRef.current = map
      const m = map

      if (clickToPick && onPick) {
        m.on('click', (e: MapMouseEvent) => onPick(e.lngLat.lng, e.lngLat.lat))
      } else {
        m.on('load', async () => {
          try {
            await loadPinImage(m)
            if (!m.getSource('gyms')) {
              m.addSource('gyms', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] },
                cluster: true,
                clusterRadius: 50,
                clusterMaxZoom: 14,
              })
              // 聚合簇：更大的地图钉
              m.addLayer({
                id: 'gym-clusters',
                type: 'symbol',
                source: 'gyms',
                filter: ['has', 'point_count'],
                layout: {
                  'icon-image': 'gym-pin',
                  'icon-size': 1.35,
                  'icon-allow-overlap': true,
                  'icon-anchor': 'bottom',
                },
              })
              // 单个健身房：普通图钉
              m.addLayer({
                id: 'gym-unclustered',
                type: 'symbol',
                source: 'gyms',
                filter: ['!', ['has', 'point_count']],
                layout: {
                  'icon-image': 'gym-pin',
                  'icon-size': 0.7,
                  'icon-allow-overlap': true,
                  'icon-anchor': 'bottom',
                },
              })
              // 单个健身房名称标签
              m.addLayer({
                id: 'gym-unclustered-label',
                type: 'symbol',
                source: 'gyms',
                filter: ['!', ['has', 'point_count']],
                layout: {
                  'text-field': ['get', 'name'],
                  'text-font': ['Noto Sans Regular'],
                  'text-anchor': 'left',
                  'text-offset': [0.9, 1.1],
                  'text-size': 13,
                  'text-allow-overlap': false,
                },
                paint: {
                  'text-color': '#ffffff',
                  'text-halo-color': '#2563eb',
                  'text-halo-width': 2.5,
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
          popupRef.current = new Popup({ offset: 28, className: 'gym-popup', closeButton: true }).setLngLat(coords).setHTML(buildPopupHTML(props)).addTo(m)
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
        m.on('mouseenter', 'gym-clusters', () => (m.getCanvas().style.cursor = 'pointer'))
        m.on('mouseleave', 'gym-unclustered', () => (m.getCanvas().style.cursor = ''))
        m.on('mouseleave', 'gym-clusters', () => (m.getCanvas().style.cursor = ''))
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
      if (!fittedRef.current && (gyms ?? []).length > 0) {
        const bounds = new LngLatBounds()
        for (const g of gyms ?? []) bounds.extend([g.lng, g.lat])
        map.fitBounds(bounds, { padding: 60, maxZoom: 15 })
        fittedRef.current = true
      }
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
