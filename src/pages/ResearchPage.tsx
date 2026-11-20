import { useState } from 'react'

type PaperSummary = {
  pmid: string
  title: string
  journal: string
  pubdate: string
}

type ESearchResponse = {
  esearchresult?: {
    idlist?: string[]
  }
}

type ESummaryItem = {
  title?: string
  source?: string
  fulljournalname?: string
  pubdate?: string
}

type ESummaryResponse = {
  result?: Record<string, ESummaryItem>
}

const ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi'
const ESUMMARY_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi'
const TOOL = 'fitness-space-station'

function buildUrl(base: string, params: Record<string, string>): string {
  const search = new URLSearchParams(params)
  return `${base}?${search.toString()}`
}

export default function ResearchPage() {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<PaperSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch() {
    const term = keyword.trim()
    if (!term || loading) return

    setLoading(true)
    setError(null)
    setResults([])

    try {
      // 第一步：esearch 检索关键词，拿到 PMID 列表
      const esearchRes = await fetch(
        buildUrl(ESEARCH_URL, { db: 'pubmed', retmode: 'json', term, tool: TOOL }),
      )
      if (!esearchRes.ok) throw new Error(`esearch 请求失败：HTTP ${esearchRes.status}`)
      const esearchRaw = await esearchRes.text()
      console.log('esearch 原始响应:', esearchRaw)
      const esearchData = JSON.parse(esearchRaw) as ESearchResponse

      const pmids = esearchData.esearchresult?.idlist ?? []
      if (pmids.length === 0) {
        setResults([])
        return
      }

      const topPmids = pmids.slice(0, 3)

      // 第二步：esummary 按 PMID 批量取标题、期刊、发布日期
      const esummaryRes = await fetch(
        buildUrl(ESUMMARY_URL, {
          db: 'pubmed',
          retmode: 'json',
          id: topPmids.join(','),
          tool: TOOL,
        }),
      )
      if (!esummaryRes.ok) throw new Error(`esummary 请求失败：HTTP ${esummaryRes.status}`)
      const esummaryRaw = await esummaryRes.text()
      console.log('esummary 原始响应:', esummaryRaw)
      const esummaryData = JSON.parse(esummaryRaw) as ESummaryResponse

      const resultMap = esummaryData.result ?? {}
      const summaries = topPmids
        .map((pmid) => {
          const item = resultMap[pmid]
          if (!item) return null
          return {
            pmid,
            title: item.title ?? '',
            journal: item.fulljournalname ?? item.source ?? '',
            pubdate: item.pubdate ?? '',
          }
        })
        .filter((x): x is PaperSummary => x !== null)

      setResults(summaries)
    } catch (err) {
      console.error('PubMed 查询失败:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', margin: '0 0 1rem' }}>科研文献检索</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSearch()
        }}
        style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}
      >
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="输入关键词，如 resistance training"
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          查询
        </button>
      </form>

      {loading && <p>查询中…</p>}
      {error && <p style={{ color: '#c62828' }}>出错了：{error}</p>}

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {results.map((r) => (
          <li
            key={r.pmid}
            style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem' }}
          >
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{r.title}</h3>
            <p style={{ margin: '0.5rem 0 0', color: '#555' }}>
              {r.journal} · {r.pubdate}
            </p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#888' }}>
              PMID: {r.pmid}
            </p>
          </li>
        ))}
      </ul>

      {!loading && !error && results.length === 0 && (
        <p style={{ color: '#888' }}>暂无结果，请输入关键词开始查询。</p>
      )}
    </main>
  )
}
