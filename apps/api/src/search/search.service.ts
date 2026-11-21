import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export type ArticleDoc = {
  id: string
  title: string
  summary: string
  content: string
  tags: string
  authorName: string
  referenceSummaryZh: string
}

export type VideoDoc = {
  id: string
  title: string
  description: string
  bvid: string
}

@Injectable()
export class SearchService {
  private host: string | null = null
  private apiKey: string | null = null

  constructor(configService: ConfigService) {
    this.host = configService.get<string>('MEILI_URL') ?? null
    this.apiKey = configService.get<string>('MEILI_MASTER_KEY') ?? null
  }

  private async request(method: string, path: string, body?: unknown): Promise<any> {
    if (!this.host || !this.apiKey) return null
    try {
      const res = await fetch(`${this.host}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) return null
      const text = await res.text()
      return text ? JSON.parse(text) : null
    } catch {
      return null
    }
  }

  async indexArticle(doc: ArticleDoc) {
    await this.request('POST', '/indexes/articles/documents?primaryKey=id', [doc])
  }

  async indexVideo(doc: VideoDoc) {
    await this.request('POST', '/indexes/videos/documents?primaryKey=id', [doc])
  }

  async deleteArticle(id: string) {
    await this.request('DELETE', `/indexes/articles/documents/${id}`)
  }

  async deleteVideo(id: string) {
    await this.request('DELETE', `/indexes/videos/documents/${id}`)
  }

  async search(q: string, type?: string) {
    const result: { articles: ArticleDoc[]; videos: VideoDoc[] } = { articles: [], videos: [] }
    if (!q) return result

    if (!type || type === 'all' || type === 'articles') {
      const r = await this.request('POST', '/indexes/articles/search', { q, limit: 20 })
      result.articles = (r?.hits ?? []) as ArticleDoc[]
    }
    if (!type || type === 'all' || type === 'videos') {
      const r = await this.request('POST', '/indexes/videos/search', { q, limit: 20 })
      result.videos = (r?.hits ?? []) as VideoDoc[]
    }
    return result
  }
}
