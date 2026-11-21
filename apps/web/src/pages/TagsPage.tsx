import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { apiFetch } from '@/lib/api'

type Article = {
  id: string
  title: string
  summary: string | null
  tags: { id: string; name: string }[]
  author: { id: string; nickname: string | null }
}

export default function TagsPage() {
  const { name } = useParams<{ name: string }>()

  const query = useQuery({
    queryKey: ['tag-articles', name],
    queryFn: () => apiFetch<Article[]>(`/tags/${encodeURIComponent(name ?? '')}`),
    enabled: Boolean(name),
  })

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link to="/articles" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← 返回社区
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">#{name}</h1>

      {query.isLoading && <p className="text-muted-foreground">加载中…</p>}
      {query.isError && <p className="text-destructive">加载失败</p>}

      <ul className="space-y-3">
        {query.data?.map((a) => (
          <li key={a.id}>
            <Link to={`/articles/${a.id}`} className="block rounded-lg border p-4 no-underline hover:shadow-md">
              <div className="font-medium">{a.title}</div>
              {a.summary && <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.summary}</div>}
              <div className="mt-1 text-sm text-muted-foreground">
                {a.author?.nickname ?? '匿名'}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {query.data && query.data.length === 0 && <p className="text-muted-foreground">该标签下暂无文章。</p>}
    </main>
  )
}
