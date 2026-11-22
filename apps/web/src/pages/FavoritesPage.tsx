import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Favorite = {
  id: string
  listId: string | null
  video: { id: string; title: string } | null
  article: { id: string; title: string } | null
}
type FavoriteList = { id: string; name: string; _count: { favorites: number } }

export default function FavoritesPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')

  const listsQuery = useQuery({
    queryKey: ['favorite-lists'],
    queryFn: () => apiFetch<FavoriteList[]>('/favorite-lists', { token }),
    enabled: Boolean(token),
  })
  const favsQuery = useQuery({
    queryKey: ['my-favorites'],
    queryFn: () => apiFetch<Favorite[]>('/users/me/favorites', { token }),
    enabled: Boolean(token),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['favorite-lists'] })
    void queryClient.invalidateQueries({ queryKey: ['my-favorites'] })
  }

  const createMutation = useMutation({
    mutationFn: (name: string) => apiFetch('/favorite-lists', { method: 'POST', token, body: { name } }),
    onSuccess: () => {
      setNewName('')
      invalidate()
    },
  })
  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => apiFetch(`/favorite-lists/${id}`, { method: 'PATCH', token, body: { name } }),
    onSuccess: () => {
      setRenamingId(null)
      invalidate()
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/favorite-lists/${id}`, { method: 'DELETE', token }),
    onSuccess: () => invalidate(),
  })
  const moveMutation = useMutation({
    mutationFn: ({ id, listId }: { id: string; listId: string | null }) =>
      apiFetch(`/favorites/${id}/move`, { method: 'POST', token, body: { listId } }),
    onSuccess: () => invalidate(),
  })

  const lists = listsQuery.data ?? []
  const favs = favsQuery.data ?? []

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← 返回首页
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">我的收藏</h1>

      <div className="mb-4 flex gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="新收藏夹名称" className="max-w-xs" />
        <Button disabled={!newName.trim() || createMutation.isPending} onClick={() => createMutation.mutate(newName.trim())}>
          新建收藏夹
        </Button>
      </div>

      {lists.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 font-medium">收藏夹</h2>
          <ul className="space-y-2">
            {lists.map((l) => (
              <li key={l.id} className="flex items-center gap-2 rounded-lg border p-3">
                {renamingId === l.id ? (
                  <>
                    <Input value={renameText} onChange={(e) => setRenameText(e.target.value)} className="flex-1" />
                    <Button size="sm" onClick={() => renameMutation.mutate({ id: l.id, name: renameText.trim() })} disabled={!renameText.trim()}>
                      保存
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                      取消
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{l.name}</span>
                    <span className="text-sm text-muted-foreground">{l._count.favorites} 条</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRenamingId(l.id)
                        setRenameText(l.name)
                      }}
                    >
                      重命名
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(l.id)}>
                      删除
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mb-2 font-medium">全部收藏（{favs.length}）</h2>
      {favs.length === 0 ? (
        <p className="text-muted-foreground">暂无收藏。</p>
      ) : (
        <ul className="space-y-2">
          {favs.map((f) => {
            const target = f.video ?? f.article
            const link = f.video ? `/videos/${f.video.id}` : `/articles/${f.article!.id}`
            const kind = f.video ? '视频' : '文章'
            return (
              <li key={f.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Link to={link} className="min-w-0 flex-1 no-underline">
                  <span className="text-xs text-muted-foreground">{kind}</span>
                  <div className="truncate font-medium">{target?.title}</div>
                </Link>
                <select
                  value={f.listId ?? ''}
                  onChange={(e) => moveMutation.mutate({ id: f.id, listId: e.target.value || null })}
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  <option value="">未分组</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
