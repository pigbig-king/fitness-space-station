import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import ReactMarkdown from 'react-markdown'
import { apiFetch } from '@/lib/api'
import { EVIDENCE_COLORS, EVIDENCE_LABELS, type EvidenceLevel } from '@/lib/evidence'

type Reference = {
  id: string
  title: string
  authors: string | null
  year: number | null
  journal: string | null
  pmid: string | null
  evidenceLevel: EvidenceLevel | null
}

type Article = {
  id: string
  title: string
  content: string
  categories: { id: string; name: string }[]
  references: Reference[]
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()

  const query = useQuery({
    queryKey: ['article', id],
    queryFn: () => apiFetch<Article>(`/articles/${id}`),
    enabled: Boolean(id),
  })

  if (query.isLoading) {
    return <p className="p-8 text-center text-muted-foreground">加载中…</p>
  }
  if (query.isError || !query.data) {
    return <p className="p-8 text-center text-destructive">文章不存在或加载失败</p>
  }

  const article = query.data

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link to="/articles" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← 返回列表
      </Link>

      <h1 className="mb-2 text-2xl font-semibold">{article.title}</h1>
      <div className="mb-5 text-sm text-muted-foreground">
        {article.categories.length > 0 ? article.categories.map((c) => c.name).join(' / ') : '未分类'}
      </div>

      <article className="markdown">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </article>

      <h2 className="mt-8 mb-3 text-lg font-semibold">参考文献</h2>
      {article.references.length === 0 ? (
        <p className="text-muted-foreground">暂无文献</p>
      ) : (
        <ol className="space-y-3">
          {article.references.map((ref, i) => (
            <li key={ref.id} className="rounded-lg border p-3">
              <div className="text-sm">
                [{i + 1}] {ref.title}
                {ref.authors ? ` — ${ref.authors}` : ''}
                {ref.year ? `（${ref.year}）` : ''}
                {ref.journal ? ` · ${ref.journal}` : ''}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {ref.evidenceLevel && (
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${EVIDENCE_COLORS[ref.evidenceLevel]}`}
                  >
                    {EVIDENCE_LABELS[ref.evidenceLevel]}
                  </span>
                )}
                {ref.pmid && <span className="text-xs text-muted-foreground">PMID: {ref.pmid}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
