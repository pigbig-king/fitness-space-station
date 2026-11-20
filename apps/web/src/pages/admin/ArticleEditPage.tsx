import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Category = { id: string; name: string; type: string }
type Article = {
  id: string
  title: string
  content: string
  status: string
  categories: Category[]
}

export default function ArticleEditPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['article', id],
    queryFn: () => apiFetch<Article>(`/articles/${id}`),
    enabled: Boolean(id),
  })

  if (query.isLoading) return <p className="p-8 text-center text-muted-foreground">加载中…</p>
  if (query.isError || !query.data) return <p className="p-8 text-center text-destructive">文章不存在</p>

  return <EditForm article={query.data} token={token} onDone={() => navigate('/admin')} />
}

function EditForm({
  article,
  token,
  onDone,
}: {
  article: Article
  token: string | null
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(article.title)
  const [content, setContent] = useState(article.content)
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>(article.status as 'PUBLISHED' | 'DRAFT')
  const [categoryId, setCategoryId] = useState(article.categories[0]?.id ?? '')
  const [error, setError] = useState<string | null>(null)

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<Category[]>('/categories'),
  })

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/articles/${article.id}`, {
        method: 'PATCH',
        token,
        body: {
          title: title.trim(),
          content: content.trim(),
          status,
          categoryIds: categoryId ? [categoryId] : [],
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-articles'] })
      onDone()
    },
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  })

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link to="/admin" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← 返回后台
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">编辑文章</h1>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">标题</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm">正文（Markdown）</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] w-full rounded-md border border-input bg-transparent p-3 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm">分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">未分类</option>
              {categoriesQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'PUBLISHED' | 'DRAFT')}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="PUBLISHED">发布</option>
              <option value="DRAFT">草稿</option>
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !title.trim() || !content.trim()}>
          {mutation.isPending ? '保存中…' : '保存'}
        </Button>
      </div>
    </main>
  )
}
