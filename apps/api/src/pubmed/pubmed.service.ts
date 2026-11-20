import { Injectable } from '@nestjs/common'

type ESearchResponse = { esearchresult?: { idlist?: string[] } }
type ESummaryItem = { title?: string; source?: string; fulljournalname?: string; pubdate?: string }
type ESummaryResponse = { result?: Record<string, ESummaryItem> }

const TOOL = 'fitness-space-station'
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

@Injectable()
export class PubmedService {
  async search(q: string) {
    const term = (q ?? '').trim()
    if (!term) return []

    const esearchUrl =
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi' +
      `?db=pubmed&retmode=json&term=${encodeURIComponent(term)}&tool=${TOOL}`
    const esearchData = await this.fetchJson<ESearchResponse>(esearchUrl)
    const pmids = esearchData?.esearchresult?.idlist ?? []
    if (pmids.length === 0) return []

    const topPmids = pmids.slice(0, 20)
    const esummaryUrl =
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi' +
      `?db=pubmed&retmode=json&id=${topPmids.join(',')}&tool=${TOOL}`
    const esummaryData = await this.fetchJson<ESummaryResponse>(esummaryUrl)
    const result = esummaryData?.result ?? {}

    const items: { pmid: string; title: string; journal: string; pubdate: string }[] = []
    for (const pmid of topPmids) {
      const item = result[pmid]
      if (!item) continue
      items.push({
        pmid,
        title: item.title ?? '',
        journal: item.fulljournalname ?? item.source ?? '',
        pubdate: item.pubdate ?? '',
      })
    }
    return items
  }

  private async fetchJson<T>(url: string): Promise<T | null> {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (!res.ok) return null
      return (await res.json()) as T
    } catch {
      return null
    }
  }
}
