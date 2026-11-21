import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type PubmedItem = {
  pmid: string
  title: string
  journal: string
  pubdate: string
}

export default function ResearchPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [items, setItems] = useState<PubmedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)
  const [imported, setImported] = useState<Set<string>>(new Set())

  async function handleSearch() {
    const term = keyword.trim()
    if (!term || loading) return

    setLoading(true)
    setError(null)
    setItems([])
    try {
      const results = await apiFetch<PubmedItem[]>(`/pubmed/search?q=${encodeURIComponent(term)}`)
      setItems(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleImport(pmid: string) {
    if (!token) {
      navigate('/login', { state: { from: '/research' } })
      return
    }
    setImporting(pmid)
    setError(null)
    try {
      await apiFetch('/references', { method: 'POST', token, body: { pmid } })
      setImported((s) => new Set(s).add(pmid))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setImporting(null)
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link to="/articles" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← 返回文章列表
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">PubMed 文献检索</h1>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          void handleSearch()
        }}
        className="mb-4 flex gap-2"
      >
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="输入关键词，如 resistance training"
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? '检索中…' : '检索'}
        </Button>
      </form>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <ul className="space-y-3">
        {items.map((item) => {
          const done = imported.has(item.pmid)
          return (
            <li key={item.pmid} className="rounded-lg border p-4">
              <div className="font-medium leading-snug">{item.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {item.journal} · {item.pubdate}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>PMID: {item.pmid}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={done || importing === item.pmid}
                  onClick={() => void handleImport(item.pmid)}
                  className="ml-auto"
                >
                  {done ? '已导入' : importing === item.pmid ? '导入中…' : '导入为文献'}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {!loading && !error && items.length === 0 && (
        <p className="text-muted-foreground">暂无结果，输入关键词开始检索。</p>
      )}
    </main>
  )
}
