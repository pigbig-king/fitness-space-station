import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api'

type Category = { id: string; name: string; type: string }
type VideoItem = {
  id: string
  bvid: string
  title: string
  cover: string | null
  duration: number | null
  categories: Category[]
}
type VideoListResponse = { total: number; page: number; pageSize: number; items: VideoItem[] }

const TYPE_LABEL: Record<string, string> = {
  bodyPart: '部位',
  equipment: '器械',
  goal: '目标',
  topic: '主题',
}

export default function VideosPage() {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<'latest' | 'hot'>('latest')
  const [page, setPage] = useState(1)

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<Category[]>('/categories'),
  })

  const videosQuery = useQuery({
    queryKey: ['videos', category, search, sort, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (search) params.set('q', search)
      params.set('sort', sort)
      params.set('page', String(page))
      params.set('pageSize', '18')
      return apiFetch<VideoListResponse>(`/videos?${params.toString()}`)
    },
  })

  const grouped = new Map<string, Category[]>()
  for (const c of categoriesQuery.data ?? []) {
    const list = grouped.get(c.type) ?? []
    list.push(c)
    grouped.set(c.type, list)
  }

  const totalPages = Math.max(1, Math.ceil((videosQuery.data?.total ?? 0) / 18))

  return (
    <main className="mx-auto max-w-5xl p-6">
      <Link to="/" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← 返回首页
      </Link>
      <h1 className="mb-4 text-2xl font-semibold">动作视频库</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setSearch(q)
              setPage(1)
            }
          }}
          placeholder="搜索视频标题"
          className="max-w-xs"
        />
        <Button
          type="button"
          onClick={() => {
            setSearch(q)
            setPage(1)
          }}
        >
          搜索
        </Button>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setPage(1)
          }}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">全部分类</option>
          {[...grouped.entries()].map(([type, list]) => (
            <optgroup key={type} label={TYPE_LABEL[type] ?? type}>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="ml-auto flex gap-1">
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

      {videosQuery.isLoading && <p className="text-muted-foreground">加载中…</p>}
      {videosQuery.isError && <p className="text-destructive">加载失败，请确认后端已启动</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videosQuery.data?.items.map((v) => (
          <Link key={v.id} to={`/videos/${v.id}`} className="no-underline">
            <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
              <div className="aspect-video w-full bg-muted">
                {v.cover ? (
                  <img
                    src={v.cover.replace(/^http:\/\//, 'https://')}
                    alt={v.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">无封面</div>
                )}
              </div>
              <CardContent className="space-y-1 p-4">
                <div className="line-clamp-2 font-medium leading-snug">{v.title}</div>
                <div className="text-sm text-muted-foreground">
                  {v.duration ? `${Math.round(v.duration / 60)} 分钟` : ''}
                  {v.categories.length > 0 ? ` · ${v.categories.map((c) => c.name).join(' / ')}` : ''}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {videosQuery.data && videosQuery.data.items.length === 0 && (
        <p className="text-muted-foreground">暂无视频，可先用管理员接口录入。</p>
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
