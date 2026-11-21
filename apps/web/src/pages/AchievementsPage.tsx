import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Streak = { current: number; best: number }
type Achievement = { id: string; code: string; name: string; description: string; icon: string | null; unlocked: boolean; unlockedAt: string | null }
type LeaderRow = { userId: string; nickname: string | null; avatarUrl: string | null; streak: number; volume: number; posts: number }
type Leaderboard = { items: LeaderRow[]; myRank: number | null; myRow: LeaderRow | null }

const LEADER_TABS = [
  { value: 'streak', label: '打卡天数' },
  { value: 'volume', label: '训练总量' },
  { value: 'posts', label: '发文数' },
]

export default function AchievementsPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState('streak')

  const streakQuery = useQuery({
    queryKey: ['my-streak'],
    queryFn: () => apiFetch<Streak>('/users/me/streak', { token }),
    enabled: Boolean(token),
  })
  const achievementsQuery = useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => apiFetch<Achievement[]>('/users/me/achievements', { token }),
    enabled: Boolean(token),
  })
  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard', tab],
    queryFn: () => apiFetch<Leaderboard>(`/leaderboard?type=${tab}`),
  })

  const unlocked = achievementsQuery.data?.filter((a) => a.unlocked) ?? []

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">激励</h1>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-4 text-center">
          <div className="text-3xl font-bold">{streakQuery.data?.current ?? 0}</div>
          <div className="text-sm text-muted-foreground">当前连续训练（天）</div>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <div className="text-3xl font-bold">{streakQuery.data?.best ?? 0}</div>
          <div className="text-sm text-muted-foreground">历史最长连续（天）</div>
        </div>
      </div>

      <h2 className="mb-3 font-medium">成就徽章（{unlocked.length}/{achievementsQuery.data?.length ?? 0}）</h2>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {achievementsQuery.data?.map((a) => (
          <div key={a.id} className={`rounded-lg border p-3 text-center ${a.unlocked ? '' : 'opacity-40'}`}>
            <div className="text-3xl">{a.icon ?? '🏅'}</div>
            <div className="mt-1 text-sm font-medium">{a.name}</div>
            <div className="text-xs text-muted-foreground">{a.description}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 font-medium">排行榜</h2>
      <div className="mb-3 flex gap-1">
        {LEADER_TABS.map((t) => (
          <Button key={t.value} size="sm" variant={tab === t.value ? 'secondary' : 'outline'} onClick={() => setTab(t.value)}>
            {t.label}
          </Button>
        ))}
      </div>
      <ol className="space-y-2">
        {leaderboardQuery.data?.items.map((r, i) => (
          <li key={r.userId} className="flex items-center gap-3 rounded-lg border p-3">
            <span className="w-6 text-center font-semibold text-muted-foreground">{i + 1}</span>
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted text-sm">
              {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : (r.nickname?.[0] ?? '用')}
            </span>
            <span className="flex-1 font-medium">{r.nickname ?? '匿名'}</span>
            <span className="text-sm text-muted-foreground">
              {tab === 'streak' && `${r.streak} 天`}
              {tab === 'volume' && `${r.volume}`}
              {tab === 'posts' && `${r.posts} 篇`}
            </span>
          </li>
        ))}
      </ol>
      {leaderboardQuery.data?.myRank != null && (
        <p className="mt-3 text-sm text-muted-foreground">我的排名：第 {leaderboardQuery.data.myRank} 名</p>
      )}
    </main>
  )
}
