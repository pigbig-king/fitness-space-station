import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type User = { id: string; nickname: string | null; avatarUrl: string | null }
type Conversation = { id: string; other: User; lastMessage: { content: string; createdAt: string } | null; unreadCount: number }
type Message = { id: string; content: string; createdAt: string; sender: User; read: boolean }
type ConversationDetail = { other: User; messages: Message[] }

export default function MessagesPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()
  const activeId = params.get('conversation')
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiFetch<Conversation[]>('/conversations', { token }),
    enabled: Boolean(token),
    refetchInterval: 15000,
  })

  const activeQuery = useQuery({
    queryKey: ['conversation', activeId],
    queryFn: () => apiFetch<ConversationDetail>(`/conversations/${activeId}/messages`, { token }),
    enabled: Boolean(token && activeId),
    refetchInterval: 5000,
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => apiFetch(`/conversations/${activeId}/messages`, { method: 'POST', token, body: { content } }),
    onSuccess: () => {
      setText('')
      void queryClient.invalidateQueries({ queryKey: ['conversation', activeId] })
      void queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  const active = activeQuery.data

  return (
    <main className="mx-auto flex h-[calc(100vh-56px)] max-w-4xl p-3">
      <aside className="w-40 shrink-0 overflow-y-auto border-r pr-2 sm:w-60">
        <h2 className="mb-2 px-2 font-medium">会话</h2>
        {conversationsQuery.data?.length === 0 && <p className="px-2 text-sm text-muted-foreground">暂无会话</p>}
        <ul className="space-y-1">
          {conversationsQuery.data?.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setParams({ conversation: c.id })}
                className={`w-full rounded-lg p-2 text-left hover:bg-muted ${activeId === c.id ? 'bg-muted' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted text-sm">
                    {c.other.avatarUrl ? <img src={c.other.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : (c.other.nickname?.[0] ?? '用')}
                  </span>
                  <span className="flex-1 truncate font-medium">{c.other.nickname ?? '匿名'}</span>
                  {c.unreadCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                {c.lastMessage && <div className="mt-1 truncate text-xs text-muted-foreground">{c.lastMessage.content}</div>}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        {!active ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">选择一个会话开始聊天</div>
        ) : (
          <>
            <div className="border-b px-3 py-2 font-medium">{active.other.nickname ?? '匿名'}</div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {active.messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender.id !== active.other.id ? 'justify-end' : ''}`}>
                  <div className={`max-w-[75%] rounded-lg p-2 text-sm ${m.sender.id !== active.other.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2 border-t p-3">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && text.trim()) sendMutation.mutate(text.trim())
                }}
                placeholder="输入消息…"
              />
              <Button disabled={!text.trim() || sendMutation.isPending} onClick={() => sendMutation.mutate(text.trim())}>
                发送
              </Button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
