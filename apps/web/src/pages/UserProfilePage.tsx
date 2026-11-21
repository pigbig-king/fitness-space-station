import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'
import { apiFetch } from '@/lib/api'

type PublicProfile = {
  id: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
  createdAt: string
  articleCount: number
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()

  const query = useQuery({
    queryKey: ['user', id],
    queryFn: () => apiFetch<PublicProfile>(`/users/${id}`),
    enabled: Boolean(id),
  })

  if (query.isLoading) {
    return <p className="p-8 text-center text-muted-foreground">加载中…</p>
  }
  if (query.isError || !query.data) {
    return <p className="p-8 text-center text-destructive">用户不存在</p>
  }

  const user = query.data

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xl">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            user.nickname?.[0] ?? '用'
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{user.nickname ?? '未设置昵称'}</h1>
          <p className="text-sm text-muted-foreground">已发布文章 {user.articleCount} 篇</p>
        </div>
      </div>
      {user.bio && <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{user.bio}</p>}
      <p className="mt-8 text-sm text-muted-foreground">文章列表（后续版本展示）</p>
    </main>
  )
}
