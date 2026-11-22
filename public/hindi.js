import { toDevanagari, toRoman } from './translit.js'

export function hindiSuggest({ hi, hr }, before) {
  const partial = before.match(/[A-Za-z']+$/)?.[0] ?? ''
  if (!partial) return hi.suggest(before).map(s => ({ label: s.label, replace: 0, text: s.insert, raw: s.insert, e: hi }))
  const context = toRoman(before.slice(0, before.length - partial.length)) + partial
  const seen = new Set()
  return hr
    .suggest(context)
    .map(s => {
      const text = toDevanagari(partial + s.insert)
      return { label: text.trim(), replace: partial.length, text, raw: s.insert, e: hr }
    })
    .filter(i => !seen.has(i.text) && seen.add(i.text))
}

export function convertTail(before) {
  const m = /([A-Za-z']+)([\s.,?!]+)$/.exec(before)
  return m ? { len: m[0].length, text: toDevanagari(m[1]) + m[2] } : null
}
