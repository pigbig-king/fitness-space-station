import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { apiFetch } from '@/lib/api'

type Metric = { id: string; type: string; part: string | null; value: number; unit: string; date: string; note: string | null }
type Bmi = { height: number | null; weight: number | null; bmi: number | null; date: string | null }

const TYPES = [
  { value: 'WEIGHT', label: '体重', unit: 'kg' },
  { value: 'BODY_FAT', label: '体脂率', unit: '%' },
  { value: 'CIRCUMFERENCE', label: '围度', unit: 'cm' },
  { value: 'RESTING_HEART_RATE', label: '静息心率', unit: 'bpm' },
]
const PARTS = ['胸', '腰', '臀', '大腿', '臂']
const EMPTY_METRICS: Metric[] = []

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function BodyMetricsPage() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ type: 'WEIGHT', part: '', value: '', date: todayISO(), note: '' })
  const [viewType, setViewType] = useState('WEIGHT')
  const [heightInput, setHeightInput] = useState('')

  const metricsQuery = useQuery({
    queryKey: ['body-metrics'],
    queryFn: () => apiFetch<Metric[]>('/users/me/body-metrics', { token }),
    enabled: Boolean(token),
  })
  const bmiQuery = useQuery({
    queryKey: ['my-bmi'],
    queryFn: () => apiFetch<Bmi>('/users/me/bmi', { token }),
    enabled: Boolean(token),
  })

  const addMutation = useMutation({
    mutationFn: (body: { type: string; part?: string; value: number; unit: string; date: string; note?: string }) =>
      apiFetch('/users/me/body-metrics', { method: 'POST', token, body }),
    onSuccess: () => {
      setForm((p) => ({ ...p, value: '', note: '' }))
      void queryClient.invalidateQueries({ queryKey: ['body-metrics'] })
      void queryClient.invalidateQueries({ queryKey: ['my-bmi'] })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/users/me/body-metrics/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['body-metrics'] })
      void queryClient.invalidateQueries({ queryKey: ['my-bmi'] })
    },
  })
  const heightMutation = useMutation({
    mutationFn: (height: number) => apiFetch('/users/me', { method: 'PATCH', token, body: { height } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-bmi'] })
      setHeightInput('')
    },
  })

  const metrics = metricsQuery.data ?? EMPTY_METRICS
  const currentType = TYPES.find((t) => t.value === form.type)!
  const currentView = TYPES.find((t) => t.value === viewType)!

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = Number(form.value)
    if (!Number.isFinite(value) || value <= 0) return
    addMutation.mutate({
      type: form.type,
      part: form.type === 'CIRCUMFERENCE' ? form.part : undefined,
      value,
      unit: currentType.unit,
      date: form.date,
      note: form.note.trim() || undefined,
    })
  }

  const chartData = useMemo(() => {
    const rows: Record<string, string | number>[] = []
    const list = metrics.filter((m) => m.type === viewType).sort((a, b) => a.date.localeCompare(b.date))
    if (viewType === 'CIRCUMFERENCE') {
      const dates = [...new Set(list.map((m) => m.date))].sort()
      for (const date of dates) {
        const row: Record<string, string | number> = { date }
        for (const p of PARTS) {
          const rec = list.filter((m) => m.date === date && m.part === p).pop()
          if (rec) row[p] = rec.value
        }
        rows.push(row)
      }
    } else {
      for (const m of list) rows.push({ date: m.date, value: m.value })
    }
    return rows
  }, [metrics, viewType])

  const sortedMetrics = [...metrics].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">我的身体数据</h1>

      <div className="mb-6 rounded-lg border p-4">
        <div className="mb-2 font-medium">BMI</div>
        {bmiQuery.data?.bmi != null ? (
          <p>
            BMI <strong>{bmiQuery.data.bmi}</strong>（身高 {bmiQuery.data.height}cm · 体重 {bmiQuery.data.weight}kg · {bmiQuery.data.date}）
          </p>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">设置身高后自动计算 BMI：</span>
            <Input
              type="number"
              placeholder="身高 cm"
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              className="w-32"
            />
            <Button size="sm" disabled={!heightInput} onClick={() => heightMutation.mutate(Number(heightInput))}>
              保存身高
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          指标
          <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, part: '' }))} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {form.type === 'CIRCUMFERENCE' && (
          <label className="flex flex-col gap-1 text-sm">
            部位
            <select value={form.part} onChange={(e) => setForm((p) => ({ ...p, part: e.target.value }))} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              {PARTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm">
          数值（{currentType.unit}）
          <Input type="number" step="0.1" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} className="w-28" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          日期
          <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="h-9 rounded-md border border-input bg-transparent px-2 text-sm" />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          备注
          <Input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="可选" />
        </label>
        <Button type="submit" disabled={!form.value || addMutation.isPending}>
          {addMutation.isPending ? '保存中…' : '添加'}
        </Button>
      </form>

      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm">图表指标：</span>
        {TYPES.map((t) => (
          <Button key={t.value} size="sm" variant={viewType === t.value ? 'secondary' : 'outline'} onClick={() => setViewType(t.value)}>
            {t.label}
          </Button>
        ))}
      </div>

      {chartData.length > 0 ? (
        <div className="mb-6 h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              {viewType === 'CIRCUMFERENCE' ? (
                PARTS.map((p, i) => <Line key={p} type="monotone" dataKey={p} stroke={`hsl(${(i * 60) % 360} 60% 45%)`} connectNulls />)
              ) : (
                <Line type="monotone" dataKey="value" name={currentView.label} stroke="#4f46e5" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">暂无「{currentView.label}」数据。</p>
      )}

      <h2 className="mb-2 font-medium">记录列表（{metrics.length}）</h2>
      <ul className="space-y-2">
        {sortedMetrics.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div>
              <span className="font-medium">
                {TYPES.find((t) => t.value === m.type)?.label ?? m.type}
                {m.part ? `（${m.part}）` : ''}
              </span>
              <span className="ml-2 text-sm">
                {m.value} {m.unit}
              </span>
              {m.note && <span className="ml-2 text-xs text-muted-foreground">· {m.note}</span>}
              <div className="text-xs text-muted-foreground">{m.date}</div>
            </div>
            <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(m.id)}>
              删除
            </Button>
          </li>
        ))}
      </ul>
    </main>
  )
}
