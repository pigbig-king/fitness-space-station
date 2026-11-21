import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Category = { id: string; name: string; type: string }
type Reference = { id: string; title: string; summaryZh: string | null }

export default function ArticleCreatePage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED')
  const [tagText, setTagText] = useState('')
  const [referenceIds, setReferenceIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<Category[]>('/categories'),
  })
  const referencesQuery = useQuery({
    queryKey: ['references'],
    queryFn: () => apiFetch<Reference[]>('/references'),
  })

  function toggleReference(id: string) {
    setReferenceIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const tagNames = tagText
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
      const article = await apiFetch<{ id: string }>('/articles', {
        method: 'POST',
        token,
        body: {
          title: title.trim(),
          content: content.trim(),
          status,
          categoryIds: categoryId ? [categoryId] : [],
          tagNames,
          referenceIds,
        },
      })
      navigate(`/articles/${article.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link to="/articles" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← 返回列表
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">发表文章</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">标题</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章标题" />
        </div>

        <div>
          <label className="mb-1 block text-sm">正文（Markdown）</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="支持 Markdown 语法，如 # 标题、- 列表…"
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
          <div className="flex-1">
            <label className="mb-1 block text-sm">标签（用逗号分隔）</label>
            <Input
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              placeholder="如：增肌, 深蹲, 营养"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm">关联文献</label>
          {referencesQuery.data && referencesQuery.data.length > 0 ? (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
              {referencesQuery.data.map((r) => (
                <label key={r.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={referenceIds.includes(r.id)}
                    onChange={() => toggleReference(r.id)}
                    className="mt-0.5"
                  />
                  <span className="line-clamp-2">{r.title}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              暂无文献，可先到 <Link to="/research" className="text-primary underline">PubMed 检索</Link> 导入。
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting || !title.trim() || !content.trim()}>
          {submitting ? '发表中…' : '发表'}
        </Button>
      </form>
    </main>
  )
}
