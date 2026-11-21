export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function computeStreak(dates: string[]): { current: number; best: number } {
  const set = new Set(dates.filter(Boolean))
  if (set.size === 0) return { current: 0, best: 0 }

  const sorted = [...set].sort()
  let best = 1
  let run = 1
  for (let i = 1; i < sorted.length; i++) {
    if (addDaysISO(sorted[i - 1], 1) === sorted[i]) run++
    else run = 1
    if (run > best) best = run
  }

  let current = 0
  let cursor = todayISO()
  if (!set.has(cursor)) cursor = addDaysISO(cursor, -1)
  while (set.has(cursor)) {
    current++
    cursor = addDaysISO(cursor, -1)
  }

  return { current, best }
}
