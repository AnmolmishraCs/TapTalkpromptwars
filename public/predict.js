import { EN, HI } from './phrases.js'
import { EN_WORDS, HI_WORDS } from './words.js'

const BASE = { en: EN_WORDS, hi: HI_WORDS.map(w => w[0]), hr: HI_WORDS.map(w => w[1]) }

export const CORPUS = { en: EN, hi: HI.map(p => p[0]), hr: HI.map(p => p[1]) }

export const TASKS = {
  en: [
    { name: 'Go home', final: 'I want to go home after dinner.' },
    { name: 'Wait', final: 'Can you wait five minutes? I need to finish this.' },
    { name: 'Unusual', final: 'The pigeon on the balcony keeps staring at me.' },
    { name: 'Change of mind', final: 'I want to visit my cousin tomorrow.', detour: 'I want to eat pizza' },
    { name: 'Ignore all', final: 'Zebras mumble quietly in my kitchen.', accept: false },
  ],
  hi: [
    { name: 'Go home', final: 'मुझे खाने के बाद घर जाना है।' },
    { name: 'Wait', final: 'क्या आप पाँच मिनट रुक सकते हैं? मुझे यह खत्म करना है।' },
    { name: 'Unusual', final: 'बालकनी पर कबूतर मुझे घूर रहा है।' },
    { name: 'Change of mind', final: 'मुझे अपने चचेरे भाई से मिलना है।', detour: 'मुझे पिज़्ज़ा खाना है' },
    { name: 'Ignore all', final: 'ज़ेबरा रसोई में चुपचाप बड़बड़ाते हैं।', accept: false },
  ],
}

const SEED = {
  en: [
    'I want to go home after school',
    'Can you wait a minute',
    'I need to finish this report',
    'I want to go outside with you',
  ],
  hi: [
    'मुझे स्कूल के बाद घर जाना है',
    'क्या आप एक मिनट रुक सकते हैं',
    'मुझे यह रिपोर्ट पूरी करनी है',
    'मुझे आपके साथ बाहर जाना है',
  ],
}

const tokens = s => s.toLowerCase().match(/[\p{L}\p{M}']+/gu) || []
const clamp = n => Math.min(1, Math.max(0, n))

function build(sents, base) {
  const uni = new Map()
  const bi = new Map()
  for (const [s, w] of sents) {
    let prev
    for (const t of tokens(s)) {
      uni.set(t, (uni.get(t) || 0) + w)
      if (prev) {
        const next = bi.get(prev) || new Map()
        next.set(t, (next.get(t) || 0) + w)
        bi.set(prev, next)
      }
      prev = t
    }
  }
  base.forEach((w, i) => uni.set(w, (uni.get(w) || 0) + 0.4 / (1 + i / 80)))
  return { uni, bi }
}

const top = (map, keep = () => true) =>
  [...map].filter(([w]) => keep(w)).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w)

function words(text, { uni, bi, forms }) {
  const last = /\S$/.test(text) ? text.match(/\S+$/)[0].toLowerCase() : ''
  const starter = !last && /^\s*$|[.?!।]\s*$/.test(text)
  const pick = last
    ? top(uni, w => w.startsWith(last) && w !== last)
    : top(bi.get(starter ? undefined : tokens(text).pop()) || uni)
  return pick.map(w => {
    let word = forms.get(w) || w.replace(/^i\b/, 'I')
    if (starter) word = word[0].toUpperCase() + word.slice(1)
    return { insert: (last ? word.slice(last.length) : word) + ' ', label: word, kind: 'word', strong: false }
  })
}

const at = (hay, tail) => {
  for (let i = hay.indexOf(tail); i >= 0; i = hay.indexOf(tail, i + 1)) {
    if (i === 0 || hay[i - 1] === ' ') return i
  }
  return -1
}

function phrases(text, sents) {
  const toks = text.match(/\S+\s*/g) || []
  const out = []
  for (const [s, w] of sents) {
    const low = s.toLowerCase()
    for (let k = Math.min(3, toks.length); k > 0; k--) {
      const tail = toks.slice(-k).join('').toLowerCase()
      if (tail.trim().length < 2) continue
      const i = at(low, tail)
      const insert = i < 0 ? '' : s.slice(i + tail.length)
      if (insert.trim()) {
        const partial = /\S$/.test(text) && !insert.startsWith(' ') ? text.match(/\S+$/)[0] : ''
        out.push({ insert, label: partial + insert.trim(), kind: 'phrase', strong: tail.trim().length >= 6, score: w * tail.length })
        break
      }
    }
  }
  const merged = new Map()
  for (const o of out) {
    const seen = merged.get(o.insert)
    if (seen) seen.score += o.score
    else merged.set(o.insert, o)
  }
  return [...merged.values()].sort((a, b) => b.score - a.score)
}

export function createEngine(mode = 'B', past = [], lang = 'en', names = []) {
  const personal = mode === 'C' || mode === 'D'
  let trust = 0.5
  let sents
  let index
  const rebuild = () => {
    sents = [...CORPUS[lang].map(s => [s, 1]), ...names.map(n => [n, 3]), ...(personal ? past.map(s => [s, 3]) : [])]
    const forms = new Map(names.flatMap(n => n.match(/[\p{L}\p{M}']+/gu) || []).map(w => [w.toLowerCase(), w]))
    index = { ...build(sents, BASE[lang]), forms }
  }
  rebuild()

  return {
    get trust() {
      return trust
    },
    learn(sentence) {
      if (!personal) return
      past.push(sentence)
      rebuild()
    },
    feedback(accepted) {
      trust = clamp(trust + (accepted ? 0.2 : -0.04))
    },
    suggest(text) {
      const words3 = words(text, index)
      const phrases2 = mode === 'A' ? [] : phrases(text, sents).slice(0, 2)
      let out = [...words3, ...phrases2]
      if (mode === 'D') {
        if (trust < 0.2) out = out.filter(s => s.strong)
        else if (trust < 0.5) out = out.filter(s => s.kind === 'phrase')
      }
      const seen = new Set()
      return out
        .filter(s => !seen.has(s.insert) && !seen.has(s.label) && seen.add(s.insert) && seen.add(s.label))
        .slice(0, mode === 'D' && trust < 0.2 ? 1 : 5)
    },
  }
}

export function simulate(engine, { final, detour = '', accept = true }) {
  const r = { keys: 0, taps: 0, accepted: 0, ignored: 0, corrections: 0 }
  let text = ''

  const type = target => {
    while (text.length < target.length) {
      const sugs = engine.suggest(text)
      const rest = target.slice(text.length).toLowerCase()
      const hit = accept
        ? sugs
            .filter(s => s.insert.trim().length > 1 && rest.startsWith(s.insert.toLowerCase()))
            .sort((a, b) => b.insert.length - a.insert.length)[0]
        : null
      if (hit) {
        text += target.slice(text.length, text.length + hit.insert.length)
        r.taps++
        r.accepted++
        engine.feedback(true)
        continue
      }
      if (sugs.length && !sugs[0].insert.toLowerCase().startsWith(rest[0])) {
        r.ignored++
        engine.feedback(false)
      }
      text += target[text.length]
      r.keys++
    }
  }

  if (detour) {
    type(detour)
    let keep = 0
    while (keep < detour.length && detour[keep] === final[keep]) keep++
    r.keys += detour.length - keep
    r.corrections += detour.length - keep
    text = detour.slice(0, keep)
  }
  type(final)
  return r
}

export function bench(lang = 'en', seed = SEED[lang]) {
  const tasks = TASKS[lang]
  const base = tasks.map(t => simulate(createEngine('A', [], lang), { ...t, accept: false }).keys)
  return Object.fromEntries(
    ['A', 'B', 'C', 'D'].map(mode => {
      const engine = createEngine(mode, [...seed], lang)
      const rows = tasks.map((t, i) => {
        const r = simulate(engine, t)
        engine.learn(t.final)
        return { ...r, effort: r.keys + r.taps, saved: base[i] - r.keys - r.taps }
      })
      return [mode, rows]
    })
  )
}
