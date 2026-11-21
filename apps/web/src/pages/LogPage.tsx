import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type WorkoutRecord = {
  id: string
  date: string
  exercise: string
  sets: number
  reps: number
  weight: number
  rpe: number
}

type Suggestion = { exercise: string; message: string }

const EMPTY_RECORDS: WorkoutRecord[] = []

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function computeSuggestions(records: WorkoutRecord[]): Suggestion[] {
  const sorted = [...records].sort((a, b) => (a.date < b.date ? 1 : -1))
  const latestByExercise = new Map<string, WorkoutRecord>()
  for (const r of sorted) {
    if (!latestByExercise.has(r.exercise)) latestByExercise.set(r.exercise, r)
  }
  const suggestions: Suggestion[] = []
  for (const [exercise, latest] of latestByExercise) {
    if (latest.rpe >= 9) suggestions.push({ exercise, message: '下次保持或减载' })
    else if (latest.rpe <= 7 && latest.sets >= 3) suggestions.push({ exercise, message: '下次可尝试加重 2.5kg' })
  }
  return suggestions
}

export default function LogPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ date: todayISO(), exercise: '', sets: '', reps: '', weight: '', rpe: '' })
  const [error, setError] = useState<string | null>(null)

  const recordsQuery = useQuery({
    queryKey: ['workout-logs'],
    queryFn: () => apiFetch<WorkoutRecord[]>('/workout-logs', { token }),
    enabled: Boolean(token),
  })

  const addMutation = useMutation({
    mutationFn: (body: Omit<WorkoutRecord, 'id'>) => apiFetch('/workout-logs', { method: 'POST', token, body }),
    onSuccess: () => {
      setForm((p) => ({ ...p, exercise: '', sets: '', reps: '', weight: '', rpe: '' }))
      void queryClient.invalidateQueries({ queryKey: ['workout-logs'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/workout-logs/${id}`, { method: 'DELETE', token }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['workout-logs'] }),
  })

  const records = recordsQuery.data ?? EMPTY_RECORDS

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const exercise = form.exercise.trim()
    const sets = Number(form.sets)
    const reps = Number(form.reps)
    const weight = Number(form.weight)
    const rpe = Number(form.rpe)
    if (!exercise) return setError('请填写动作名称')
    if (!Number.isInteger(sets) || sets < 1) return setError('组数需为 ≥1 的整数')
    if (!Number.isInteger(reps) || reps < 1) return setError('次数需为 ≥1 的整数')
    if (!Number.isFinite(weight) || weight < 0) return setError('重量需为 ≥0 的数字')
    if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10) return setError('RPE 需在 1–10 之间')
    setError(null)
    addMutation.mutate({ date: form.date, exercise, sets, reps, weight, rpe })
  }

  const volumeData = useMemo(() => {
    const byDate = new Map<string, number>()
    for (const r of records) {
      byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.sets * r.reps * r.weight)
    }
    return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, volume]) => ({ date, volume }))
  }, [records])

  const { rows: weightData, exercises: exerciseNames } = useMemo(() => {
    const dates = [...new Set(records.map((r) => r.date))].sort()
    const exercises = [...new Set(records.map((r) => r.exercise))]
    const rows = dates.map((date) => {
      const row: Record<string, string | number> = { date }
      for (const ex of exercises) {
        const candidates = records.filter((r) => r.exercise === ex && r.date <= date).sort((a, b) => a.date.localeCompare(b.date))
        if (candidates.length) row[ex] = candidates[candidates.length - 1].weight
      }
      return row
    })
    return { rows, exercises }
  }, [records])

  const suggestions = computeSuggestions(records)
  const sorted = [...records].sort((a, b) => (a.date < b.date ? 1 : -1))

  if (!token) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-center">
        <h1 className="mb-3 text-2xl font-semibold">训练记录</h1>
        <p className="mb-4 text-muted-foreground">登录后可云端保存训练记录并查看统计图表</p>
        <Link to="/login" className="text-primary underline">
          去登录
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">训练记录</h1>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          日期
          <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm" />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          动作
          <Input value={form.exercise} onChange={(e) => setForm((p) => ({ ...p, exercise: e.target.value }))} placeholder="如 深蹲" />
        </label>
        <label className="flex w-20 flex-col gap-1 text-sm">
          组数
          <Input type="number" min="1" step="1" value={form.sets} onChange={(e) => setForm((p) => ({ ...p, sets: e.target.value }))} />
        </label>
        <label className="flex w-20 flex-col gap-1 text-sm">
          次数
          <Input type="number" min="1" step="1" value={form.reps} onChange={(e) => setForm((p) => ({ ...p, reps: e.target.value }))} />
        </label>
        <label className="flex w-24 flex-col gap-1 text-sm">
          重量(kg)
          <Input type="number" min="0" step="0.5" value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))} />
        </label>
        <label className="flex w-24 flex-col gap-1 text-sm">
          RPE
          <Input type="number" min="1" max="10" step="0.5" value={form.rpe} onChange={(e) => setForm((p) => ({ ...p, rpe: e.target.value }))} />
        </label>
        <Button type="submit" disabled={addMutation.isPending}>
          {addMutation.isPending ? '添加中…' : '添加记录'}
        </Button>
      </form>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <section className="mb-6">
        <h2 className="mb-2 font-medium">建议</h2>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无建议，添加记录后会根据最近一次训练的 RPE 给出建议。</p>
        ) : (
          <ul className="space-y-1">
            {suggestions.map((s) => (
              <li key={s.exercise} className="rounded bg-muted px-3 py-2 text-sm">
                <strong>{s.exercise}</strong>：{s.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      {records.length > 0 && (
        <section className="mb-6 space-y-6">
          <div>
            <h2 className="mb-2 font-medium">训练总量趋势（组 × 次 × 重量）</h2>
            <div className="h-56 w-full">
              <ResponsiveContainer>
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="volume" name="总量" stroke="#4f46e5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {weightData.length > 0 && (
            <div>
              <h2 className="mb-2 font-medium">各动作重量进步（kg）</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    {exerciseNames.slice(0, 6).map((ex, i) => (
                      <Line key={ex} type="monotone" dataKey={ex} stroke={`hsl(${(i * 60) % 360} 60% 45%)`} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 font-medium">记录列表（{records.length}）</h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无训练记录。</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <strong>{r.exercise}</strong>
                  <div className="text-sm text-muted-foreground">
                    {r.sets} 组 × {r.reps} 次 · {r.weight}kg · RPE {r.rpe}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.date}</div>
                </div>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(r.id)}>
                  删除
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
