const DAY = 86400000

export function summarize(log, now = Date.now(), days = 7) {
  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)
  const byDay = Array.from({ length: days }, (_, i) => ({ start: midnight.getTime() - (days - 1 - i) * DAY, count: 0 }))
  const count = (map, key) => map.set(key, (map.get(key) || 0) + 1)
  const phrases = new Map()
  const emotions = new Map()
  const sources = new Map()
  let words = 0
  for (const e of log) {
    const day = byDay.find(d => e.at >= d.start && e.at < d.start + DAY)
    if (day) day.count++
    count(phrases, e.t)
    count(emotions, e.emo)
    count(sources, e.src)
    words += e.t.trim().split(/\s+/).length
  }
  const top = (map, n) => [...map].sort((a, b) => b[1] - a[1]).slice(0, n)
  return {
    total: log.length,
    today: byDay.at(-1).count,
    byDay,
    top: top(phrases, 5),
    emotions: top(emotions, 4),
    sources: top(sources, 6),
    avgWords: log.length ? Math.round((words / log.length) * 10) / 10 : 0,
  }
}
