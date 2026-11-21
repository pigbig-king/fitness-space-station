import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

type ArticleHit = { id: string; title: string; summary: string; authorName: string }
type VideoHit = { id: string; title: string; description: string; bvid: string }
type SearchResult = { articles: ArticleHit[]; videos: VideoHit[] }
type SearchType = 'all' | 'articles' | 'videos'

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  const [type, setType] = useState<SearchType>('all')

  const query = useQuery({
    queryKey: ['search', q, type],
    queryFn: () => apiFetch<SearchResult>(`/search?q=${encodeURIComponent(q)}&type=${type}`),
    enabled: Boolean(q),
  })

  const showArticles = type === 'all' || type === 'articles'
  const showVideos = type === 'all' || type === 'videos'

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">搜索「{q}」</h1>

      <div className="mb-5 flex gap-1">
        {(['all', 'articles', 'videos'] as SearchType[]).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={type === t ? 'secondary' : 'outline'}
            onClick={() => setType(t)}
          >
            {t === 'all' ? '全部' : t === 'articles' ? '文章' : '视频'}
          </Button>
        ))}
      </div>

      {query.isLoading && <p className="text-muted-foreground">搜索中…</p>}
      {query.isError && <p className="text-destructive">搜索失败，请确认后端已启动</p>}

      {showArticles && query.data && query.data.articles.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">文章</h2>
          <ul className="space-y-2">
            {query.data.articles.map((a) => (
              <li key={a.id}>
                <Link to={`/articles/${a.id}`} className="block rounded-lg border p-3 no-underline hover:shadow-sm">
                  <div className="font-medium">{a.title}</div>
                  {a.summary && <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.summary}</div>}
                  {a.authorName && <div className="mt-1 text-xs text-muted-foreground">{a.authorName}</div>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showVideos && query.data && query.data.videos.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">视频</h2>
          <ul className="space-y-2">
            {query.data.videos.map((v) => (
              <li key={v.id}>
                <Link to={`/videos/${v.id}`} className="block rounded-lg border p-3 no-underline hover:shadow-sm">
                  <div className="font-medium">{v.title}</div>
                  {v.description && <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{v.description}</div>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {query.data &&
        query.data.articles.length === 0 &&
        query.data.videos.length === 0 &&
        !query.isLoading && <p className="text-muted-foreground">没有找到相关结果。</p>}
    </main>
  )
}
