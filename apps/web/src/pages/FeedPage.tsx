import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type FeedItem = {
  type: 'article'
  id: string
  title: string
  summary: string | null
  authorId: string | null
  authorName: string
  authorAvatar: string | null
  createdAt: string
}
type Feed = { total: number; page: number; pageSize: number; items: FeedItem[]; empty?: boolean }

export default function FeedPage() {
  const { token } = useAuth()
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['feed', page],
    queryFn: () => apiFetch<Feed>(`/feed?page=${page}`, { token }),
    enabled: Boolean(token),
  })

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 20))

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">动态</h1>

      {query.isLoading && <p className="text-muted-foreground">加载中…</p>}
      {query.isError && <p className="text-destructive">加载失败</p>}

      {query.data?.empty && (
        <div className="rounded-lg border p-6 text-center">
          <p className="mb-2 text-muted-foreground">你还没有关注任何人，动态流为空。</p>
          <p className="text-sm text-muted-foreground">
            去 <Link to="/discover" className="text-primary underline">发现页</Link> 或社区看看，关注感兴趣的作者吧。
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {query.data?.items.map((item) => (
          <li key={item.id}>
            <Link to={`/articles/${item.id}`} className="block rounded-lg border p-4 no-underline transition-shadow hover:shadow-md">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-muted text-sm">
                  {item.authorAvatar ? <img src={item.authorAvatar} alt="" className="h-7 w-7 rounded-full object-cover" /> : (item.authorName?.[0] ?? '用')}
                </span>
                <span className="text-sm font-medium">{item.authorName || '匿名'}</span>
              </div>
              <div className="font-medium leading-snug">{item.title}</div>
              {item.summary && <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.summary}</div>}
              <div className="mt-1 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</div>
            </Link>
          </li>
        ))}
      </ul>

      {query.data && !query.data.empty && query.data.items.length === 0 && (
        <p className="text-muted-foreground">暂无动态。</p>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            下一页
          </Button>
        </div>
      )}
    </main>
  )
}
