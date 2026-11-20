import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { apiFetch } from '@/lib/api'

type Article = {
  id: string
  title: string
  status: string
  createdAt: string
  categories: { id: string; name: string }[]
  references: { id: string }[]
}

export default function ArticlesPage() {
  const query = useQuery({
    queryKey: ['articles'],
    queryFn: () => apiFetch<Article[]>('/articles'),
  })

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← 返回首页
        </Link>
        <Link to="/research" className="text-sm text-primary hover:underline">
          PubMed 文献检索 →
        </Link>
      </div>
      <h1 className="mb-4 text-2xl font-semibold">科研证据</h1>

      {query.isLoading && <p className="text-muted-foreground">加载中…</p>}
      {query.isError && <p className="text-destructive">加载失败，请确认后端已启动</p>}

      <ul className="space-y-3">
        {query.data?.map((a) => (
          <li key={a.id}>
            <Link
              to={`/articles/${a.id}`}
              className="block rounded-lg border p-4 no-underline transition-shadow hover:shadow-md"
            >
              <div className="font-medium leading-snug">{a.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {a.categories.length > 0 ? a.categories.map((c) => c.name).join(' / ') : '未分类'}
                {a.references.length > 0 ? ` · ${a.references.length} 篇文献` : ''}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {query.data && query.data.length === 0 && (
        <p className="text-muted-foreground">暂无文章，可先用管理员接口录入。</p>
      )}
    </main>
  )
}
