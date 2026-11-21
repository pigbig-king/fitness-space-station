import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Plan = { id: string; goal: string; level: string; daysPerWeek: number; contentJson: string; createdAt: string }
type DayPlan = { day: number; focus: string; exercises: { name: string; sets: number; reps: string; intensity: string }[] }
type PlanContent = { goal: string; level: string; daysPerWeek: number; days: DayPlan[] }

function parseContent(p: Plan): PlanContent | null {
  try {
    return JSON.parse(p.contentJson) as PlanContent
  } catch {
    return null
  }
}

export default function PlanPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [goal, setGoal] = useState('增肌')
  const [level, setLevel] = useState('初级')
  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [latest, setLatest] = useState<PlanContent | null>(null)

  const plansQuery = useQuery({
    queryKey: ['plans'],
    queryFn: () => apiFetch<Plan[]>('/plans', { token }),
    enabled: Boolean(token),
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      apiFetch<Plan>('/plans/generate', { method: 'POST', token, body: { goal, level, daysPerWeek } }),
    onSuccess: (p) => {
      setLatest(parseContent(p))
      void queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/plans/${id}`, { method: 'DELETE', token }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['plans'] }),
  })

  if (!token) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="mb-3 text-2xl font-semibold">训练助手</h1>
        <p className="mb-4 text-muted-foreground">登录后可生成并保存个性化训练计划</p>
        <Link to="/login" className="text-primary underline">
          去登录
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">训练助手 · 计划生成</h1>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          目标
          <select value={goal} onChange={(e) => setGoal(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option>增肌</option>
            <option>力量</option>
            <option>减脂</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          水平
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option>初级</option>
            <option>中级</option>
            <option>高级</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          每周天数
          <input type="number" min="1" max="7" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Math.min(7, Math.max(1, Number(e.target.value))))} className="h-9 w-24 rounded-md border border-input bg-transparent px-2 text-sm" />
        </label>
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          {generateMutation.isPending ? '生成中…' : '生成计划'}
        </Button>
      </div>

      {latest && (
        <section className="mb-8">
          <h2 className="mb-3 font-medium">当前计划（{latest.goal} · {latest.level} · 每周 {latest.daysPerWeek} 天）</h2>
          <div className="space-y-3">
            {latest.days.map((d) => (
              <div key={d.day} className="rounded-lg border p-3">
                <div className="mb-1 font-medium">
                  第 {d.day} 天 · {d.focus}
                </div>
                <ul className="space-y-1 text-sm">
                  {d.exercises.map((ex, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span>{ex.name}</span>
                      <span className="text-muted-foreground">
                        {ex.sets} 组 × {ex.reps} 次 · {ex.intensity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-medium">已保存的计划（{plansQuery.data?.length ?? 0}）</h2>
        {plansQuery.data && plansQuery.data.length === 0 && <p className="text-sm text-muted-foreground">暂无已保存的计划。</p>}
        <ul className="space-y-2">
          {plansQuery.data?.map((p) => {
            const content = parseContent(p)
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setLatest(content)}
                >
                  <span className="font-medium">
                    {p.goal} · {p.level} · 每周 {p.daysPerWeek} 天
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </button>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(p.id)}>
                  删除
                </Button>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
