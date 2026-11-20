import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
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

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>()

  const query = useQuery({
    queryKey: ['video', id],
    queryFn: () => apiFetch<VideoDetail>(`/videos/${id}`),
    enabled: Boolean(id),
  })

  if (query.isLoading) {
    return <p className="p-8 text-center text-muted-foreground">加载中…</p>
  }
  if (query.isError || !query.data) {
    return <p className="p-8 text-center text-destructive">视频不存在或加载失败</p>
  }

  const video = query.data

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
      <div className="mb-3 text-sm text-muted-foreground">
        {video.duration ? `${Math.round(video.duration / 60)} 分钟` : ''}
        {video.categories.length > 0 ? ` · ${video.categories.map((c) => c.name).join(' / ')}` : ''}
      </div>
      {video.description && <p className="whitespace-pre-wrap text-muted-foreground">{video.description}</p>}

      <div className="mt-6">
        <EngagementPanel
          kind="video"
          id={video.id}
          initialFavorites={video._count.favorites}
          initialLikes={video._count.likes}
        />
      </div>
    </main>
  )
}
