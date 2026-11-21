import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Article = { id: string; title: string; status: string; author: { nickname: string | null } | null }
type ArticleList = { items: Article[] }
type Comment = { id: string; content: string; user: { nickname: string | null; email: string } }

export default function ModerationManager() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const articlesQuery = useQuery({
    queryKey: ['moderation-articles'],
    queryFn: () => apiFetch<ArticleList>('/articles?pageSize=50', { token }),
    enabled: Boolean(token),
  })
  const commentsQuery = useQuery({
    queryKey: ['admin-comments'],
    queryFn: () => apiFetch<Comment[]>('/comments', { token }),
    enabled: Boolean(token),
  })

  const drafts = articlesQuery.data?.items.filter((a) => a.status === 'DRAFT') ?? []

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/articles/${id}`, { method: 'PATCH', token, body: { status: 'PUBLISHED' } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['moderation-articles'] }),
  })
  const rejectArticle = useMutation({
    mutationFn: (id: string) => apiFetch(`/articles/${id}`, { method: 'DELETE', token }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['moderation-articles'] }),
  })
  const deleteComment = useMutation({
    mutationFn: (id: string) => apiFetch(`/comments/${id}`, { method: 'DELETE', token }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-comments'] }),
  })

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-2 font-medium">待审文章（{drafts.length}）</h3>
        {drafts.length === 0 && <p className="text-sm text-muted-foreground">暂无待审文章</p>}
        <ul className="space-y-2">
          {drafts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.author?.nickname ?? '未知作者'}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={() => publishMutation.mutate(a.id)}>
                  通过
                </Button>
                <Button size="sm" variant="destructive" onClick={() => rejectArticle.mutate(a.id)}>
                  驳回
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 font-medium">评论（{commentsQuery.data?.length ?? 0}）</h3>
        <ul className="space-y-2">
          {commentsQuery.data?.map((c) => (
            <li key={c.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">{c.user.nickname ?? c.user.email}</div>
                <Button size="sm" variant="destructive" onClick={() => deleteComment.mutate(c.id)}>
                  删除
                </Button>
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm">{c.content}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
