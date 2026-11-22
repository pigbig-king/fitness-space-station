import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch, uploadImage } from '@/lib/api'

type PublicProfile = {
  id: string
  nickname: string | null
  avatarUrl: string | null
  bio: string | null
  createdAt: string
  articleCount: number
  followerCount: number
  followingCount: number
}
type FollowingItem = { following: { id: string; nickname: string | null; avatarUrl: string | null } }

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user, token } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['user', id],
    queryFn: () => apiFetch<PublicProfile>(`/users/${id}`),
    enabled: Boolean(id),
  })

  const myFollowing = useQuery({
    queryKey: ['my-following'],
    queryFn: () => apiFetch<FollowingItem[]>('/users/me/following', { token }),
    enabled: Boolean(token),
  })

  const followMutation = useMutation({
    mutationFn: () => apiFetch(`/users/${id}/follow`, { method: 'POST', token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', id] })
      void queryClient.invalidateQueries({ queryKey: ['my-following'] })
    },
  })

  const messageMutation = useMutation({
    mutationFn: () => apiFetch<{ id: string }>('/conversations', { method: 'POST', token, body: { userId: id } }),
    onSuccess: (conv) => navigate(`/messages?conversation=${conv.id}`),
  })

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !token) return
    setUploading(true)
    setUploadError(null)
    try {
      const url = await uploadImage(file, token)
      await apiFetch('/users/me', { method: 'PATCH', token, body: { avatarUrl: url } })
      await queryClient.invalidateQueries({ queryKey: ['user', id] })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

  if (query.isLoading) {
    return <p className="p-8 text-center text-muted-foreground">加载中…</p>
  }
  if (query.isError || !query.data) {
    return <p className="p-8 text-center text-destructive">用户不存在</p>
  }

  const profile = query.data
  const isSelf = user?.id === profile.id
  const following = myFollowing.data?.some((f) => f.following.id === profile.id) ?? false

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-2xl">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            (profile.nickname?.[0] ?? '用').toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold">{profile.nickname ?? '未设置昵称'}</h1>
          <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
            <span>文章 {profile.articleCount}</span>
            <span>关注者 {profile.followerCount}</span>
            <span>关注 {profile.followingCount}</span>
          </div>
        </div>
        {!isSelf && (
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant={following ? 'secondary' : 'default'}
              onClick={() => (token ? followMutation.mutate() : undefined)}
              disabled={!token || followMutation.isPending}
            >
              {following ? '已关注' : '关注'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => (token ? messageMutation.mutate() : navigate('/login'))}
              disabled={!token || messageMutation.isPending}
            >
              发私信
            </Button>
          </div>
        )}
      </div>

      {profile.bio && <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{profile.bio}</p>}

      {isSelf && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link to="/me/favorites">
            <Button size="sm" variant="outline">
              我的收藏
            </Button>
          </Link>
          <Link to="/articles/new">
            <Button size="sm" variant="outline">
              发表文章
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? '上传中…' : '更换头像'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleAvatarChange(e)}
          />
        </div>
      )}
      {uploadError && <p className="mt-2 text-sm text-destructive">{uploadError}</p>}

      <p className="mt-8 text-sm text-muted-foreground">TA 的文章列表（后续版本展示）</p>
    </main>
  )
}
