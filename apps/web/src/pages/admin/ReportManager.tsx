import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Report = {
  id: string
  reason: string
  videoId: string | null
  articleId: string | null
  commentId: string | null
  user: { email: string }
  video: { id: string; title: string } | null
  article: { id: string; title: string } | null
}

export default function ReportManager() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const reportsQuery = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => apiFetch<Report[]>('/reports', { token }),
  })

  const resolveMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/reports/${id}/resolve`, { method: 'POST', token }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  })

  const deleteContentMutation = useMutation({
    mutationFn: async (r: Report) => {
      if (r.videoId) await apiFetch(`/videos/${r.videoId}`, { method: 'DELETE', token })
      if (r.articleId) await apiFetch(`/articles/${r.articleId}`, { method: 'DELETE', token })
      if (r.commentId) await apiFetch(`/comments/${r.commentId}`, { method: 'DELETE', token })
      await apiFetch(`/reports/${r.id}/resolve`, { method: 'POST', token })
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
  })

  return (
    <ul className="space-y-3">
      {reportsQuery.data?.map((r) => (
        <li key={r.id} className="rounded-lg border p-3">
          <div className="text-sm">
            <span className="text-muted-foreground">{r.user.email} 举报了 </span>
            {r.video && <span>视频「{r.video.title}」</span>}
            {r.article && <span>文章「{r.article.title}」</span>}
            {r.commentId && <span>一条评论</span>}
          </div>
          <div className="mt-1 text-sm">理由：{r.reason}</div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => resolveMutation.mutate(r.id)}>
              忽略
            </Button>
            <Button size="sm" variant="destructive" onClick={() => deleteContentMutation.mutate(r)}>
              删除被举报内容
            </Button>
          </div>
        </li>
      ))}
      {reportsQuery.data && reportsQuery.data.length === 0 && (
        <p className="text-muted-foreground">暂无举报</p>
      )}
    </ul>
  )
}
