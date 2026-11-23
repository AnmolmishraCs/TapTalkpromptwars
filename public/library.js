const TONES = ['peach', 'mint', 'lilac', 'blue', 'sun', 'pink']
const strings = (list, max = 500) =>
  Array.isArray(list) ? list.filter(x => typeof x === 'string' && x.length > 0 && x.length <= 120).slice(0, max) : []
const union = (a, b) => [...new Set([...a, ...b])]

export function mergeLibrary(current, incoming) {
  const extra = { ...current.sits.extra }
  for (const [id, list] of Object.entries(incoming?.sits?.extra ?? {})) {
    if (/^[a-z0-9]{1,24}$/i.test(id)) extra[id] = union(extra[id] ?? [], strings(list))
  }
  const custom = current.sits.custom.map(c => ({ ...c }))
  for (const c of Array.isArray(incoming?.sits?.custom) ? incoming.sits.custom.slice(0, 50) : []) {
    if (typeof c?.id !== 'string' || typeof c?.name !== 'string' || !c.name || c.name.length > 60) continue
    const phrases = strings(c.phrases)
    const at = custom.findIndex(x => x.id === c.id)
    if (at >= 0) custom[at].phrases = union(custom[at].phrases, phrases)
    else custom.push({ id: c.id.slice(0, 24), name: c.name, tone: TONES.includes(c.tone) ? c.tone : 'lilac', phrases })
  }
  return {
    favs: union(current.favs, strings(incoming?.favs)),
    names: union(current.names, strings(incoming?.names, 200)),
    sits: { extra, custom },
  }
}
