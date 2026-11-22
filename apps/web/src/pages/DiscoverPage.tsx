import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type VideoHit = { id: string; title: string; cover: string | null; _count?: { likes: number; favorites: number; comments: number } }
type ArticleHit = { id: string; title: string; summary: string | null; author: { nickname: string | null } | null; _count?: { likes: number; favorites: number; comments: number } }
type Recommend = { videos: VideoHit[]; articles: ArticleHit[] }

function VideoCard({ v }: { v: VideoHit }) {
  return (
    <Link to={`/videos/${v.id}`} className="block no-underline">
      <div className="overflow-hidden rounded-lg border">
        <div className="aspect-video w-full bg-muted">
          {v.cover ? (
            <img src={v.cover.replace(/^http:\/\//, 'https://')} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="line-clamp-2 p-2 text-sm font-medium">{v.title}</div>
      </div>
    </Link>
  )
}

function ArticleCard({ a }: { a: ArticleHit }) {
  return (
    <Link to={`/articles/${a.id}`} className="block rounded-lg border p-3 no-underline hover:shadow-sm">
      <div className="font-medium leading-snug">{a.title}</div>
      {a.summary && <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.summary}</div>}
      {a.author?.nickname && <div className="mt-1 text-xs text-muted-foreground">{a.author.nickname}</div>}
    </Link>
  )
}

export default function DiscoverPage() {
  const { token } = useAuth()

  const hotQuery = useQuery({
    queryKey: ['recommend-hot'],
    queryFn: () => apiFetch<Recommend>('/recommend/hot'),
  })
  const forYouQuery = useQuery({
    queryKey: ['recommend-for-you'],
    queryFn: () => apiFetch<Recommend>('/recommend/for-you', { token }),
    enabled: Boolean(token),
  })

  const hot = hotQuery.data
  const forYou = forYouQuery.data

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">发现</h1>

      {token && (
        <section className="mb-8">
          <h2 className="mb-3 font-medium">为你推荐</h2>
          {forYou && forYou.articles.length === 0 && forYou.videos.length === 0 && (
            <p className="text-sm text-muted-foreground">暂无个性化推荐，去收藏或点赞一些内容吧。</p>
          )}
          {forYou && forYou.videos.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {forYou.videos.map((v) => (
                <VideoCard key={v.id} v={v} />
              ))}
            </div>
          )}
          {forYou && forYou.articles.length > 0 && (
            <ul className="space-y-2">
              {forYou.articles.map((a) => (
                <li key={a.id}>
                  <ArticleCard a={a} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 font-medium">热门</h2>
        {hot && hot.videos.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {hot.videos.map((v) => (
              <VideoCard key={v.id} v={v} />
            ))}
          </div>
        )}
        {hot && hot.articles.length > 0 && (
          <ul className="space-y-2">
            {hot.articles.map((a) => (
              <li key={a.id}>
                <ArticleCard a={a} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
