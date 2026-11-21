import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Kind = 'video' | 'article'
type MyItem = { id: string; videoId: string | null; articleId: string | null }
type ToggleResult = { count: number }
type Comment = { id: string; content: string; user: { email: string; nickname: string | null } }

export function EngagementPanel({
  kind,
  id,
  initialFavorites,
  initialLikes,
}: {
  kind: Kind
  id: string
  initialFavorites: number
  initialLikes: number
}) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const [favCount, setFavCount] = useState(initialFavorites)
  const [likeCount, setLikeCount] = useState(initialLikes)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [commentText, setCommentText] = useState('')

  const myFavorites = useQuery({
    queryKey: ['my-favorites'],
    queryFn: () => apiFetch<MyItem[]>('/users/me/favorites', { token }),
    enabled: Boolean(token),
  })
  const myLikes = useQuery({
    queryKey: ['my-likes'],
    queryFn: () => apiFetch<MyItem[]>('/users/me/likes', { token }),
    enabled: Boolean(token),
  })

  const favorited =
    myFavorites.data?.some((f) => (kind === 'video' ? f.videoId === id : f.articleId === id)) ?? false
  const liked = myLikes.data?.some((l) => (kind === 'video' ? l.videoId === id : l.articleId === id)) ?? false

  function requireLogin() {
    navigate('/login', { state: { from: location.pathname } })
  }

  const favMutation = useMutation({
    mutationFn: () => apiFetch<ToggleResult>(`/${kind}s/${id}/favorite`, { method: 'POST', token }),
    onSuccess: (data) => {
      setFavCount(data.count)
      void queryClient.invalidateQueries({ queryKey: ['my-favorites'] })
    },
  })

  const likeMutation = useMutation({
    mutationFn: () => apiFetch<ToggleResult>(`/${kind}s/${id}/like`, { method: 'POST', token }),
    onSuccess: (data) => {
      setLikeCount(data.count)
      void queryClient.invalidateQueries({ queryKey: ['my-likes'] })
    },
  })

  const commentsQuery = useQuery({
    queryKey: [`${kind}-comments`, id],
    queryFn: () => apiFetch<Comment[]>(`/${kind}s/${id}/comments`),
  })

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      apiFetch(`/${kind}s/${id}/comments`, { method: 'POST', token, body: { content } }),
    onSuccess: () => {
      setCommentText('')
      void queryClient.invalidateQueries({ queryKey: [`${kind}-comments`, id] })
    },
  })

  const reportMutation = useMutation({
    mutationFn: (reason: string) =>
      apiFetch('/reports', {
        method: 'POST',
        token,
        body: kind === 'video' ? { reason, videoId: id } : { reason, articleId: id },
      }),
    onSuccess: () => {
      setReportOpen(false)
      setReportReason('')
    },
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={favorited ? 'secondary' : 'outline'}
          onClick={() => (token ? favMutation.mutate() : requireLogin())}
        >
          {favorited ? '已收藏' : '收藏'}（{favCount}）
        </Button>
        <Button
          type="button"
          variant={liked ? 'secondary' : 'outline'}
          onClick={() => (token ? likeMutation.mutate() : requireLogin())}
        >
          {liked ? '已点赞' : '点赞'}（{likeCount}）
        </Button>
        <Button type="button" variant="outline" onClick={() => (token ? setReportOpen((v) => !v) : requireLogin())}>
          举报
        </Button>
      </div>

      {reportOpen && (
        <div className="rounded-lg border p-3">
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="请填写举报理由"
            className="w-full rounded-md border border-input bg-transparent p-2 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => reportMutation.mutate(reportReason)}
              disabled={!reportReason.trim() || reportMutation.isPending}
            >
              提交举报
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setReportOpen(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 font-medium">评论（{commentsQuery.data?.length ?? 0}）</h3>
        {token ? (
          <div className="mb-3 flex gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的评论…"
              className="min-h-[60px] flex-1 rounded-md border border-input bg-transparent p-2 text-sm"
            />
            <Button
              type="button"
              onClick={() => commentMutation.mutate(commentText)}
              disabled={!commentText.trim() || commentMutation.isPending}
            >
              发表
            </Button>
          </div>
        ) : (
          <button type="button" className="mb-3 text-sm text-primary underline" onClick={requireLogin}>
            登录后发表评论
          </button>
        )}
        <ul className="space-y-2">
          {commentsQuery.data?.map((c) => (
            <li key={c.id} className="rounded-lg border p-3 text-sm">
              <div className="text-xs text-muted-foreground">{c.user.nickname ?? c.user.email}</div>
              <div className="mt-1 whitespace-pre-wrap">{c.content}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
