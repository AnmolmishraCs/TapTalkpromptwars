export function search(queries, pools, limit = 30) {
  const qs = (Array.isArray(queries) ? queries : [queries]).map(q => q.trim().toLowerCase()).filter(Boolean)
  if (!qs.length) return []
  const seen = new Set()
  const hits = []
  for (const { source, tone, items } of pools) {
    for (const item of items) {
      const text = typeof item === 'string' ? item : item.text
      const say = typeof item === 'string' ? item : item.say
      const hay = `${text} ${say}`.toLowerCase()
      const key = say.toLowerCase()
      const rank = qs.some(q => text.toLowerCase().startsWith(q)) ? 0 : qs.some(q => hay.includes(q)) ? 1 : 2
      if (rank < 2 && !seen.has(key)) {
        seen.add(key)
        hits.push({ text, say, source, tone, rank })
      }
    }
  }
  return hits.sort((a, b) => a.rank - b.rank).slice(0, limit)
}
