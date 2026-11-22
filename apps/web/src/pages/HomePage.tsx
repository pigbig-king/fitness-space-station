import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
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

const LEGEND = [
  { name: '蜀山区', color: '#e11d48' },
  { name: '庐阳区', color: '#f59e0b' },
  { name: '包河区', color: '#10b981' },
  { name: '瑶海区', color: '#3b82f6' },
  { name: '政务区', color: '#8b5cf6' },
  { name: '其他', color: '#4f46e5' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [q, setQ] = useState('')
  const [listOpen, setListOpen] = useState(true)

  const query = useQuery({
    queryKey: ['gyms', city, district, q],
    queryFn: () => {
      const params = new URLSearchParams()
      if (city) params.set('city', city)
      if (district) params.set('district', district)
      if (q) params.set('q', q)
      params.set('pageSize', '100')
      return apiFetch<GymList>(`/gyms?${params.toString()}`)
    },
  })

  const gyms = query.data?.items ?? []

  return (
    <main className="relative h-[calc(100vh-56px)] w-full">
      {/* 满屏地图 */}
      <div className="absolute inset-0">
        <GymMap
          gyms={gyms.map((g) => ({
            id: g.id,
            name: g.name,
            lat: g.lat,
            lng: g.lng,
            district: g.district,
            price: g.price,
            environment: g.environment,
            equipment: g.equipment,
          }))}
          onSelect={(id, section) => navigate(`/gyms/${id}${section ? `#${section}` : ''}`)}
        />
      </div>

      {/* 顶部搜索栏 */}
      <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-24px)] flex-wrap items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-md">
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="城市，如 合肥" className="w-24" />
        <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="区域" className="w-24" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索健身房名称" className="w-36" />
        <Button size="sm" variant="outline" onClick={() => setListOpen((v) => !v)}>
          {listOpen ? '收起列表' : '展开列表'}
        </Button>
        <Button size="sm" onClick={() => navigate('/gyms/new')}>
          + 提交健身房
        </Button>
      </div>

      {/* 图例 */}
      <div className="absolute right-3 top-3 z-10 rounded-lg border bg-background/95 p-2 shadow-md">
        <div className="mb-1 text-xs font-medium">分区图例</div>
        {LEGEND.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            {d.name}
          </div>
        ))}
      </div>

      {/* 左侧列表 */}
      {listOpen && (
        <div className="absolute bottom-3 left-3 top-16 z-10 flex w-72 flex-col overflow-hidden rounded-lg border bg-background/95 shadow-md">
          <div className="border-b px-3 py-2 text-sm font-medium">健身房（{gyms.length}）</div>
          <ul className="flex-1 space-y-2 overflow-y-auto p-2">
            {gyms.map((g) => (
              <li key={g.id}>
                <Link to={`/gyms/${g.id}`} className="block rounded-lg border p-2 no-underline hover:bg-muted">
                  <div className="truncate text-sm font-medium">{g.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {g.city}
                    {g.district ? ` · ${g.district}` : ''}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {g.equipment.map((e) => e.name).slice(0, 4).join('、') || '暂无器械'}
                  </div>
                </Link>
              </li>
            ))}
            {gyms.length === 0 && <p className="p-2 text-sm text-muted-foreground">暂无健身房</p>}
          </ul>
        </div>
      )}
    </main>
  )
}
