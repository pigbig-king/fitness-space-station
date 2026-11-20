import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Article = { id: string; title: string; status: string }

export default function ArticleManager() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const articlesQuery = useQuery({
    queryKey: ['admin-articles'],
    queryFn: () => apiFetch<Article[]>('/articles'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/articles/${id}`, { method: 'PATCH', token, body: { status } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-articles'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/articles/${id}`, { method: 'DELETE', token }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-articles'] }),
  })

  return (
    <div className="space-y-4">
      <div>
        <Link to="/articles/new">
          <Button size="sm">+ 新建文章</Button>
        </Link>
      </div>

      <ul className="space-y-2">
        {articlesQuery.data?.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{a.title}</div>
              <div className="text-xs text-muted-foreground">
                {a.status === 'PUBLISHED' ? '已发布' : '草稿'}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link to={`/admin/articles/${a.id}/edit`}>
                <Button size="sm" variant="outline">
                  编辑
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  statusMutation.mutate({ id: a.id, status: a.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })
                }
              >
                {a.status === 'PUBLISHED' ? '下架' : '发布'}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(a.id)}>
                删除
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
