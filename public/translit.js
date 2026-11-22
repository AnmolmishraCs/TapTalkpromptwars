import { HI } from './phrases.js'
import { HI_WORDS } from './words.js'

const tok = s => s.toLowerCase().match(/[\p{L}\p{M}']+/gu) || []

const DICT = new Map(Object.entries({
  main: 'मैं', hain: 'हैं', hoon: 'हूँ', nahi: 'नहीं', phone: 'फ़ोन', doctor: 'डॉक्टर',
  tv: 'टीवी', school: 'स्कूल', ok: 'ओके', mobile: 'मोबाइल', hospital: 'हॉस्पिटल',
}))
for (const [deva, roman] of [...HI, ...HI_WORDS]) {
  const a = tok(deva)
  const b = tok(roman)
  if (a.length === b.length) b.forEach((w, i) => DICT.set(w, a[i]))
}

const CONS = [
  ['chh', 'छ'], ['kh', 'ख'], ['gh', 'घ'], ['ch', 'च'], ['jh', 'झ'], ['th', 'थ'], ['dh', 'ध'], ['ph', 'फ'],
  ['bh', 'भ'], ['sh', 'श'], ['k', 'क'], ['g', 'ग'], ['j', 'ज'], ['t', 'त'], ['d', 'द'], ['n', 'न'],
  ['p', 'प'], ['b', 'ब'], ['m', 'म'], ['y', 'य'], ['r', 'र'], ['l', 'ल'], ['v', 'व'], ['w', 'व'],
  ['s', 'स'], ['h', 'ह'], ['f', 'फ़'], ['z', 'ज़'], ['q', 'क'], ['c', 'क'], ['x', 'क्स'],
]
const VOWELS = [
  ['aa', 'आ', 'ा'], ['ee', 'ई', 'ी'], ['oo', 'ऊ', 'ू'], ['ai', 'ऐ', 'ै'], ['au', 'औ', 'ौ'],
  ['a', 'अ', ''], ['i', 'इ', 'ि'], ['u', 'उ', 'ु'], ['e', 'ए', 'े'], ['o', 'ओ', 'ो'],
]

function byRules(w) {
  let out = ''
  let afterConsonant = false
  let i = 0
  while (i < w.length) {
    const rest = w.slice(i)
    const v = VOWELS.find(([k]) => rest.startsWith(k))
    if (v) {
      const last = i + v[0].length === w.length
      out += afterConsonant ? (v[0] === 'a' && last && out.length > 1 ? 'ा' : v[2]) : v[1]
      afterConsonant = false
      i += v[0].length
      continue
    }
    const c = CONS.find(([k]) => rest.startsWith(k))
    if (!c) {
      out += w[i++]
      afterConsonant = false
      continue
    }
    out += (afterConsonant ? '्' : '') + c[1]
    afterConsonant = true
    i += c[0].length
  }
  return out
}

export const toDevanagari = text =>
  text.replace(/[A-Za-z']+/g, w => DICT.get(w.toLowerCase()) ?? byRules(w.toLowerCase()))

const ROMAN = new Map()
for (const [deva, roman] of [...HI, ...HI_WORDS]) {
  const a = tok(deva)
  const b = tok(roman)
  if (a.length === b.length) a.forEach((w, i) => ROMAN.set(w, b[i]))
}

export const toRoman = text => text.replace(/[\p{L}\p{M}]+/gu, w => ROMAN.get(w) ?? w)
