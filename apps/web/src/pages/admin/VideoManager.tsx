import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Video = { id: string; bvid: string; title: string; status: string }

export default function VideoManager() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [bvid, setBvid] = useState('')

  const videosQuery = useQuery({
    queryKey: ['admin-videos'],
    queryFn: () => apiFetch<{ items: Video[] }>('/videos?pageSize=50'),
  })

  const createMutation = useMutation({
    mutationFn: (bvid: string) => apiFetch('/videos', { method: 'POST', token, body: { bvid } }),
    onSuccess: () => {
      setBvid('')
      void queryClient.invalidateQueries({ queryKey: ['admin-videos'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/videos/${id}`, { method: 'PATCH', token, body: { status } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-videos'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/videos/${id}`, { method: 'DELETE', token }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-videos'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          value={bvid}
          onChange={(e) => setBvid(e.target.value)}
          placeholder="粘贴 B 站 bvid，如 BV1GJ411x7h7"
          className="flex-1"
        />
        <Button onClick={() => createMutation.mutate(bvid)} disabled={!bvid.trim() || createMutation.isPending}>
          录入视频
        </Button>
      </div>

      <ul className="space-y-2">
        {videosQuery.data?.items.map((v) => (
          <li key={v.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{v.title}</div>
              <div className="text-xs text-muted-foreground">
                {v.bvid} · {v.status === 'PUBLISHED' ? '已发布' : '草稿'}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  statusMutation.mutate({ id: v.id, status: v.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })
                }
              >
                {v.status === 'PUBLISHED' ? '下架' : '发布'}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(v.id)}>
                删除
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
