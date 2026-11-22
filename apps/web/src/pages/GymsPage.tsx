import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Input } from '@/components/ui/input'
import GymMap from '@/components/GymMap'
import { apiFetch } from '@/lib/api'

type Gym = {
  id: string
  name: string
  address: string
  city: string
  district: string | null
  lat: number
  lng: number
  price: string | null
  environment: string | null
  equipment: { name: string; quantity: number; status: string }[]
  _count: { checkIns: number; reviews: number }
}
type GymList = { total: number; items: Gym[] }

export default function GymsPage() {
  const navigate = useNavigate()
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [q, setQ] = useState('')

  const query = useQuery({
    queryKey: ['gyms', city, district, q],
    queryFn: () => {
      const params = new URLSearchParams()
      if (city) params.set('city', city)
      if (district) params.set('district', district)
      if (q) params.set('q', q)
      params.set('pageSize', '50')
      return apiFetch<GymList>(`/gyms?${params.toString()}`)
    },
  })

  const gyms = query.data?.items ?? []

  return (
    <main className="mx-auto max-w-6xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">健身房地图</h1>
        <Link to="/gyms/new" className="text-sm text-primary hover:underline">
          + 提交健身房
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="城市，如 北京" className="w-32" />
        <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="区域（可选）" className="w-32" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索名称" className="w-40" />
      </div>

      <div className="flex flex-col gap-3 lg:h-[70vh] lg:flex-row">
        <div className="h-64 shrink-0 overflow-hidden rounded-lg border lg:h-auto lg:min-w-0 lg:flex-1">
          <GymMap
            gyms={gyms.map((g) => ({ id: g.id, name: g.name, lat: g.lat, lng: g.lng, price: g.price, environment: g.environment, equipment: g.equipment }))}
            onSelect={(id, section) => navigate(`/gyms/${id}${section ? `#${section}` : ''}`)}
          />
        </div>
        <ul className="max-h-80 space-y-2 overflow-y-auto lg:max-h-none lg:w-72 lg:shrink-0">
          {gyms.map((g) => (
            <li key={g.id}>
              <Link to={`/gyms/${g.id}`} className="block rounded-lg border p-3 no-underline hover:shadow-sm">
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-muted-foreground">
                  {g.city}
                  {g.district ? ` · ${g.district}` : ''}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  器械：{g.equipment.map((e) => `${e.name}×${e.quantity}`).join('、') || '暂无'}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  打卡 {g._count.checkIns} · 评价 {g._count.reviews}
                </div>
              </Link>
            </li>
          ))}
          {gyms.length === 0 && <p className="text-sm text-muted-foreground">暂无健身房，去提交一个吧。</p>}
        </ul>
      </div>
    </main>
  )
}
