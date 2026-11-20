import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Comment = {
  id: string
  content: string
  user: { email: string }
  video: { id: string; title: string } | null
  article: { id: string; title: string } | null
}

export default function CommentManager() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const commentsQuery = useQuery({
    queryKey: ['admin-comments'],
    queryFn: () => apiFetch<Comment[]>('/comments', { token }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/comments/${id}`, { method: 'DELETE', token }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-comments'] }),
  })

  return (
    <ul className="space-y-2">
      {commentsQuery.data?.map((c) => (
        <li key={c.id} className="rounded-lg border p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              {c.user.email}
              {c.video ? ` · 视频「${c.video.title}」` : ''}
              {c.article ? ` · 文章「${c.article.title}」` : ''}
            </div>
            <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(c.id)}>
              删除
            </Button>
          </div>
          <div className="mt-1 whitespace-pre-wrap text-sm">{c.content}</div>
        </li>
      ))}
      {commentsQuery.data && commentsQuery.data.length === 0 && (
        <p className="text-muted-foreground">暂无评论</p>
      )}
    </ul>
  )
}
