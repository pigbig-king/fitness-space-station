import { LngLatBounds, Map, Marker, Popup, setWorkerUrl, type MapMouseEvent, type StyleSpecification } from 'maplibre-gl'
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

function gymProps(g: GymMarker): Record<string, string> {
  return {
    id: g.id,
    name: g.name,
    district: g.district ?? '',
    price: g.price ?? '暂无',
    environment: g.environment ?? '暂无',
    equip: g.equipment.length ? g.equipment.map((e) => `${e.name}×${e.quantity}`).join('、') : '暂无',
    damaged: String(g.equipment.filter((e) => e.status !== 'NORMAL').length),
  }
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
  const markersRef = useRef<Marker[]>([])
  const onSelectRef = useRef(onSelect)
  const prevSignatureRef = useRef('')
  const fittedRef = useRef(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

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

      if (clickToPick && onPick) {
        map.on('click', (e: MapMouseEvent) => onPick(e.lngLat.lng, e.lngLat.lat))
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
    const map = mapRef.current
    if (!map || clickToPick || !gyms) return

    const signature = gyms.map((g) => `${g.id}:${g.lng},${g.lat}`).join('|')
    if (signature === prevSignatureRef.current) return
    prevSignatureRef.current = signature

    for (const m of markersRef.current) m.remove()
    markersRef.current = []

    for (const g of gyms) {
      const el = document.createElement('div')
      el.style.position = 'relative'
      el.style.cursor = 'pointer'
      el.style.width = '24px'
      el.style.height = '34px'

      const img = document.createElement('img')
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pinSvg())
      img.alt = ''
      img.style.width = '24px'
      img.style.height = '34px'
      img.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))'

      const label = document.createElement('span')
      label.textContent = g.name
      label.style.position = 'absolute'
      label.style.left = '28px'
      label.style.top = '50%'
      label.style.transform = 'translateY(-50%)'
      label.style.whiteSpace = 'nowrap'
      label.style.background = 'rgba(255,255,255,0.94)'
      label.style.border = '1px solid rgba(15,23,42,0.1)'
      label.style.borderRadius = '9999px'
      label.style.padding = '3px 10px'
      label.style.fontSize = '12px'
      label.style.fontWeight = '500'
      label.style.color = '#1f2937'
      label.style.boxShadow = '0 1px 4px rgba(0,0,0,0.12)'

      el.appendChild(img)
      el.appendChild(label)

      el.addEventListener('click', () => {
        popupRef.current?.remove()
        popupRef.current = new Popup({ offset: 24 }).setLngLat([g.lng, g.lat]).setHTML(buildPopupHTML(gymProps(g))).addTo(map)
        popupRef.current.getElement()?.addEventListener('click', (ev: MouseEvent) => {
          const target = (ev.target as HTMLElement).closest('[data-id]')
          if (!target) return
          const id = target.getAttribute('data-id')
          const section = target.getAttribute('data-section') || undefined
          if (id) onSelectRef.current?.(id, section)
        })
      })

      const marker = new Marker({ element: el, anchor: 'bottom' }).setLngLat([g.lng, g.lat])
      marker.addTo(map)
      markersRef.current.push(marker)
    }

    if (!fittedRef.current && gyms.length > 0) {
      const bounds = new LngLatBounds()
      for (const g of gyms) bounds.extend([g.lng, g.lat])
      map.fitBounds(bounds, { padding: 60, maxZoom: 15 })
      fittedRef.current = true
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
