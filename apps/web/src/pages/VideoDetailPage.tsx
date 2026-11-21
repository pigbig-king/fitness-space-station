import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import { EngagementPanel } from '@/components/engagement'
import { apiFetch } from '@/lib/api'
import { bilibiliUrlToIframe } from '@/lib/bilibili'

type Category = { id: string; name: string; type: string }
type VideoDetail = {
  id: string
  bvid: string
  title: string
  cover: string | null
  duration: number | null
  description: string | null
  categories: Category[]
  _count: { favorites: number; likes: number; comments: number }
}
type RelatedVideo = { id: string; bvid: string; title: string; cover: string | null }
type RelatedResponse = { items: RelatedVideo[] }

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>()

  const query = useQuery({
    queryKey: ['video', id],
    queryFn: () => apiFetch<VideoDetail>(`/videos/${id}`),
    enabled: Boolean(id),
  })

  const video = query.data
  const firstCategoryId = video?.categories[0]?.id

  const relatedQuery = useQuery({
    queryKey: ['related-videos', id, firstCategoryId],
    queryFn: () => apiFetch<RelatedResponse>(`/videos?category=${firstCategoryId}&pageSize=6&sort=latest`),
    enabled: Boolean(firstCategoryId),
  })

  if (query.isLoading) {
    return <p className="p-8 text-center text-muted-foreground">加载中…</p>
  }
  if (query.isError || !video) {
    return <p className="p-8 text-center text-destructive">视频不存在或加载失败</p>
  }

  const related = (relatedQuery.data?.items ?? []).filter((v) => v.id !== video.id)

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link to="/videos" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← 返回视频库
      </Link>

      <div
        className="video-embed mb-4 aspect-video w-full overflow-hidden rounded-lg bg-black"
        dangerouslySetInnerHTML={{ __html: bilibiliUrlToIframe(video.bvid) }}
      />

      <h1 className="mb-2 text-2xl font-semibold">{video.title}</h1>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {video.duration ? <span>{Math.round(video.duration / 60)} 分钟</span> : null}
        {video.categories.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {video.categories.map((c) => (
              <span key={c.id} className="rounded bg-muted px-2 py-0.5 text-xs">
                {c.name}
              </span>
            ))}
          </span>
        ) : null}
      </div>
      {video.description && (
        <p className="whitespace-pre-wrap text-muted-foreground">{video.description}</p>
      )}

      <div className="mt-6">
        <EngagementPanel
          kind="video"
          id={video.id}
          initialFavorites={video._count.favorites}
          initialLikes={video._count.likes}
        />
      </div>

      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">相关视频</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {related.map((v) => (
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
                    ) : null}
                  </div>
                  <CardContent className="p-3">
                    <div className="line-clamp-2 text-sm font-medium leading-snug">{v.title}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
