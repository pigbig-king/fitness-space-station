import { useState, type CSSProperties, type FormEvent } from 'react'

type WorkoutRecord = {
  id: string
  date: string
  exercise: string
  sets: number
  reps: number
  weight: number
  rpe: number
}

type Suggestion = {
  exercise: string
  message: string
}

type FormState = {
  exercise: string
  sets: string
  reps: string
  weight: string
  rpe: string
}

const STORAGE_KEY = 'fitness-space-station.log'
const EMPTY_FORM: FormState = { exercise: '', sets: '', reps: '', weight: '', rpe: '' }

const inputStyle: CSSProperties = {
  padding: '0.5rem',
  fontSize: '1rem',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  fontSize: '0.9rem',
  flex: '1 1 120px',
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function loadRecords(): WorkoutRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as WorkoutRecord[]) : []
  } catch {
    return []
  }
}

function saveRecords(records: WorkoutRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function sortRecords(records: WorkoutRecord[]): WorkoutRecord[] {
  return [...records].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.id < b.id ? 1 : -1
  })
}

function computeSuggestions(records: WorkoutRecord[]): Suggestion[] {
  const sorted = sortRecords(records)
  const latestByExercise = new Map<string, WorkoutRecord>()
  for (const r of sorted) {
    if (!latestByExercise.has(r.exercise)) latestByExercise.set(r.exercise, r)
  }

  const suggestions: Suggestion[] = []
  for (const [exercise, latest] of latestByExercise) {
    if (latest.rpe >= 9) {
      suggestions.push({ exercise, message: '下次保持或减载' })
    } else if (latest.rpe <= 7 && latest.sets >= 3) {
      suggestions.push({ exercise, message: '下次可尝试加重 2.5kg' })
    }
  }
  return suggestions
}

export default function LogPage() {
  const [records, setRecords] = useState<WorkoutRecord[]>(() => loadRecords())
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const exercise = form.exercise.trim()
    const sets = Number(form.sets)
    const reps = Number(form.reps)
    const weight = Number(form.weight)
    const rpe = Number(form.rpe)

    if (!exercise) {
      setError('请填写动作名称')
      return
    }
    if (!Number.isInteger(sets) || sets < 1) {
      setError('组数需为 ≥1 的整数')
      return
    }
    if (!Number.isInteger(reps) || reps < 1) {
      setError('次数需为 ≥1 的整数')
      return
    }
    if (!Number.isFinite(weight) || weight < 0) {
      setError('重量需为 ≥0 的数字')
      return
    }
    if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10) {
      setError('RPE 需在 1–10 之间')
      return
    }

    const record: WorkoutRecord = {
      id: newId(),
      date: todayISO(),
      exercise,
      sets,
      reps,
      weight,
      rpe,
    }
    const next = [record, ...records]
    setRecords(next)
    saveRecords(next)
    setForm(EMPTY_FORM)
    setError(null)
  }

  function handleDelete(id: string) {
    const next = records.filter((r) => r.id !== id)
    setRecords(next)
    saveRecords(next)
  }

  const sorted = sortRecords(records)
  const suggestions = computeSuggestions(records)

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', margin: '0 0 1rem' }}>训练记录</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1rem 0' }}
      >
        <label style={labelStyle}>
          动作
          <input
            value={form.exercise}
            onChange={(e) => setForm((p) => ({ ...p, exercise: e.target.value }))}
            placeholder="如 深蹲"
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          组数
          <input
            value={form.sets}
            onChange={(e) => setForm((p) => ({ ...p, sets: e.target.value }))}
            type="number"
            min="1"
            step="1"
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          次数
          <input
            value={form.reps}
            onChange={(e) => setForm((p) => ({ ...p, reps: e.target.value }))}
            type="number"
            min="1"
            step="1"
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          重量 (kg)
          <input
            value={form.weight}
            onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
            type="number"
            min="0"
            step="0.5"
            style={inputStyle}
          />
        </label>
        <label style={labelStyle}>
          RPE
          <input
            value={form.rpe}
            onChange={(e) => setForm((p) => ({ ...p, rpe: e.target.value }))}
            type="number"
            min="1"
            max="10"
            step="0.5"
            style={inputStyle}
          />
        </label>
        <button
          type="submit"
          style={{ padding: '0.5rem 1rem', cursor: 'pointer', alignSelf: 'flex-end' }}
        >
          添加记录
        </button>
      </form>

      {error && <p style={{ color: '#c62828' }}>{error}</p>}

      <section style={{ margin: '1.5rem 0' }}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>建议</h2>
        {suggestions.length === 0 ? (
          <p style={{ color: '#888' }}>暂无建议，添加记录后会根据最近一次训练的 RPE 给出建议。</p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {suggestions.map((s) => (
              <li
                key={s.exercise}
                style={{ background: '#f4f6fb', borderRadius: '6px', padding: '0.6rem 0.8rem' }}
              >
                <strong>{s.exercise}</strong>：{s.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>记录列表</h2>
        {sorted.length === 0 ? (
          <p style={{ color: '#888' }}>暂无训练记录。</p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {sorted.map((r) => (
              <li
                key={r.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  padding: '0.8rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <strong>{r.exercise}</strong>
                  <div style={{ color: '#555' }}>
                    {r.sets} 组 × {r.reps} 次 · {r.weight}kg · RPE {r.rpe}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>{r.date}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(r.id)}
                  style={{ padding: '0.3rem 0.7rem', cursor: 'pointer' }}
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
