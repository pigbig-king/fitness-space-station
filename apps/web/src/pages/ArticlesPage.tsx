import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api'

type Article = {
  id: string
  title: string
  summary: string | null
  status: string
  createdAt: string
  categories: { id: string; name: string }[]
  references: { id: string }[]
  tags: { id: string; name: string }[]
  author: { id: string; nickname: string | null }
  _count: { favorites: number; likes: number; comments: number }
}
type ArticleList = { total: number; page: number; pageSize: number; items: Article[] }

export default function ArticlesPage() {
  const [sort, setSort] = useState<'latest' | 'hot'>('latest')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['articles', sort, page],
    queryFn: () => apiFetch<ArticleList>(`/articles?sort=${sort}&page=${page}&pageSize=10`),
  })

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 10))

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← 返回首页
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/articles/new" className="text-sm text-primary hover:underline">
            + 发表文章
          </Link>
          <Link to="/research" className="text-sm text-primary hover:underline">
            PubMed 文献检索 →
          </Link>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">社区</h1>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={sort === 'latest' ? 'secondary' : 'outline'}
            onClick={() => {
              setSort('latest')
              setPage(1)
            }}
          >
            最新
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sort === 'hot' ? 'secondary' : 'outline'}
            onClick={() => {
              setSort('hot')
              setPage(1)
            }}
          >
            最热
          </Button>
        </div>
      </div>

      {query.isLoading && <p className="text-muted-foreground">加载中…</p>}
      {query.isError && <p className="text-destructive">加载失败，请确认后端已启动</p>}

      <ul className="space-y-3">
        {query.data?.items.map((a) => (
          <li key={a.id}>
            <Link
              to={`/articles/${a.id}`}
              className="block rounded-lg border p-4 no-underline transition-shadow hover:shadow-md"
            >
              <div className="font-medium leading-snug">{a.title}</div>
              {a.summary && <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.summary}</div>}
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {a.author?.nickname && <span className="hover:underline">{a.author.nickname}</span>}
                <span>
                  {a.categories.length > 0 ? a.categories.map((c) => c.name).join(' / ') : '未分类'}
                </span>
                <span>
                  ♥ {a._count.favorites} · 👍 {a._count.likes}
                </span>
              </div>
              {a.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.tags.map((t) => (
                    <span key={t.id} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      #{t.name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {query.data && query.data.items.length === 0 && (
        <p className="text-muted-foreground">暂无文章，可点击右上角「发表文章」。</p>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </main>
  )
}
