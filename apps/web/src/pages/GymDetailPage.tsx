import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import GymMap from '@/components/GymMap'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Review = { id: string; rating: number; comment: string | null; createdAt: string; user: { id: string; nickname: string | null; avatarUrl: string | null } }
type GymDetail = {
  id: string
  name: string
  address: string
  city: string
  district: string | null
  lat: number
  lng: number
  description: string | null
  price: string | null
  hours: string | null
  phone: string | null
  images: string[]
  equipment: { name: string; quantity: number }[]
  reviews: Review[]
  _count: { checkIns: number; reviews: number }
  avgRating: number | null
  myCheckIn: boolean | null
  myReview: { rating: number; comment: string | null } | null
}

export default function GymDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const query = useQuery({
    queryKey: ['gym', id],
    queryFn: () => apiFetch<GymDetail>(`/gyms/${id}`, { token }),
    enabled: Boolean(id),
  })

  const checkInMutation = useMutation({
    mutationFn: () => apiFetch(`/gyms/${id}/check-in`, { method: 'POST', token }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['gym', id] }),
  })
  const reviewMutation = useMutation({
    mutationFn: () => apiFetch(`/gyms/${id}/review`, { method: 'POST', token, body: { rating, comment: comment.trim() || undefined } }),
    onSuccess: () => {
      setComment('')
      void queryClient.invalidateQueries({ queryKey: ['gym', id] })
    },
  })

  if (query.isLoading) return <p className="p-8 text-center text-muted-foreground">加载中…</p>
  if (query.isError || !query.data) return <p className="p-8 text-center text-destructive">健身房不存在</p>

  const gym = query.data

  return (
    <main className="mx-auto max-w-4xl p-4">
      <Link to="/gyms" className="mb-3 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← 返回地图
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">{gym.name}</h1>
      <div className="mb-2 text-sm text-muted-foreground">
        {gym.city}
        {gym.district ? ` · ${gym.district}` : ''} · {gym.address}
      </div>
      <div className="mb-3 flex flex-wrap gap-3 text-sm">
        {gym.price && <span>价格：{gym.price}</span>}
        {gym.hours && <span>营业：{gym.hours}</span>}
        {gym.phone && <span>电话：{gym.phone}</span>}
        {gym.avgRating != null && <span>评分：{gym.avgRating}（{gym._count.reviews} 条）</span>}
        <span>打卡：{gym._count.checkIns}</span>
      </div>

      <div className="mb-4 h-56 overflow-hidden rounded-lg border">
        <GymMap gyms={[{ id: gym.id, name: gym.name, lat: gym.lat, lng: gym.lng, equipment: gym.equipment }]} />
      </div>

      <div className="mb-4">
        <h2 className="mb-2 font-medium">器械清单</h2>
        {gym.equipment.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无器械信息</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {gym.equipment.map((e, i) => (
              <span key={i} className="rounded bg-muted px-2 py-1 text-sm">
                {e.name} × {e.quantity}
              </span>
            ))}
          </div>
        )}
      </div>

      {gym.description && <p className="mb-4 whitespace-pre-wrap text-muted-foreground">{gym.description}</p>}

      {gym.images.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {gym.images.map((url) => (
            <img key={url} src={url} alt="" className="h-24 w-32 rounded object-cover" />
          ))}
        </div>
      )}

      <div className="mb-6 flex gap-2">
        <Button
          variant={gym.myCheckIn ? 'secondary' : 'default'}
          onClick={() => (token ? checkInMutation.mutate() : undefined)}
          disabled={!token}
        >
          {gym.myCheckIn ? '已打卡（点击取消）' : '打卡'}
        </Button>
      </div>

      <div className="mb-6 rounded-lg border p-4">
        <h2 className="mb-2 font-medium">评分评价</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm">
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} 星
              </option>
            ))}
          </select>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="写下你的评价（可选）"
            className="h-9 flex-1 rounded-md border border-input bg-transparent px-2 text-sm"
          />
          <Button size="sm" disabled={!token || reviewMutation.isPending} onClick={() => reviewMutation.mutate()}>
            提交评价
          </Button>
        </div>
      </div>

      <h2 className="mb-2 font-medium">评价列表</h2>
      {gym.reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无评价</p>
      ) : (
        <ul className="space-y-2">
          {gym.reviews.map((r) => (
            <li key={r.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.user.nickname ?? '匿名'}</span>
                <span className="text-muted-foreground">★ {r.rating}</span>
              </div>
              {r.comment && <div className="mt-1 whitespace-pre-wrap">{r.comment}</div>}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
