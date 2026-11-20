import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Favorite = {
  id: string
  videoId: string | null
  articleId: string | null
  video: { id: string; title: string } | null
  article: { id: string; title: string } | null
}

export default function FavoritesPage() {
  const { token } = useAuth()
  const query = useQuery({
    queryKey: ['my-favorites'],
    queryFn: () => apiFetch<Favorite[]>('/users/me/favorites', { token }),
    enabled: Boolean(token),
  })

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← 返回首页
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">我的收藏</h1>

      {query.isLoading && <p className="text-muted-foreground">加载中…</p>}
      {query.isError && <p className="text-destructive">加载失败</p>}

      <ul className="space-y-3">
        {query.data?.map((f) => (
          <li key={f.id}>
            {f.video && (
              <Link to={`/videos/${f.video.id}`} className="block rounded-lg border p-3 no-underline hover:shadow-md">
                <span className="text-xs text-muted-foreground">视频</span>
                <div className="font-medium">{f.video.title}</div>
              </Link>
            )}
            {f.article && (
              <Link to={`/articles/${f.article.id}`} className="block rounded-lg border p-3 no-underline hover:shadow-md">
                <span className="text-xs text-muted-foreground">文章</span>
                <div className="font-medium">{f.article.title}</div>
              </Link>
            )}
          </li>
        ))}
      </ul>

      {query.data && query.data.length === 0 && <p className="text-muted-foreground">暂无收藏</p>}
    </main>
  )
}
