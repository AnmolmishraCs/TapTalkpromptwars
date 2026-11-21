export const CORPUS = {
  en: [
    'I want to go home', 'I want to eat', 'I want some water', 'I want to talk to you',
    'I want to watch a movie', 'I need help', 'I need to use the bathroom',
    'I need to finish my homework', 'I am hungry', 'I am tired', 'I am in pain',
    'I am sorry', 'I am ready to go', 'I feel sick', 'I feel happy', 'I do not understand',
    'I love you', 'I would like to go outside', 'I will be there in five minutes',
    'Can you help me please', 'Can you wait a minute', 'Can you call my mother',
    'Can we go to the park', 'Can I have some tea please', 'Please turn on the light',
    'Please turn off the TV', 'Please say that again', 'Please speak slowly',
    'Please give me my phone', 'Thank you very much', 'How are you today', 'What time is it',
    'Where is the doctor', 'Good morning', 'Good night', 'See you tomorrow', 'Yes please',
    'No thank you', 'Let me think for a moment', 'That is very funny',
  ],
  hi: [
    'मुझे घर जाना है', 'मुझे खाना खाना है', 'मुझे पानी चाहिए', 'मुझे आपसे बात करनी है',
    'मुझे फ़िल्म देखनी है', 'मुझे मदद चाहिए', 'मुझे शौचालय जाना है',
    'मुझे अपना होमवर्क पूरा करना है', 'मुझे भूख लगी है', 'मुझे थकान लग रही है',
    'मुझे दर्द हो रहा है', 'मुझे माफ़ कीजिए', 'चलिए, मैं तैयार हूँ', 'मुझे बीमार लग रहा है',
    'मैं खुश हूँ', 'मुझे समझ नहीं आया', 'मुझे आपसे बहुत प्यार है', 'मुझे बाहर जाना है',
    'पाँच मिनट में मिलते हैं', 'क्या आप मेरी मदद कर सकते हैं', 'क्या आप एक मिनट रुक सकते हैं',
    'क्या आप मेरी माँ को फ़ोन कर सकते हैं', 'क्या हम पार्क चल सकते हैं',
    'क्या मुझे चाय मिल सकती है', 'कृपया लाइट जला दीजिए', 'कृपया टीवी बंद कर दीजिए',
    'कृपया दोबारा कहिए', 'कृपया धीरे बोलिए', 'कृपया मेरा फ़ोन दीजिए', 'बहुत धन्यवाद',
    'आप कैसे हैं', 'क्या समय हुआ है', 'डॉक्टर कहाँ हैं', 'सुप्रभात', 'शुभ रात्रि',
    'कल मिलते हैं', 'हाँ कृपया', 'नहीं धन्यवाद', 'मुझे एक पल सोचने दीजिए', 'यह बहुत मज़ेदार है',
  ],
}

export const TASKS = {
  en: [
    { name: 'Go home', final: 'I want to go home after dinner.' },
    { name: 'Wait', final: 'Can you wait five minutes? I need to finish this.' },
    { name: 'Unusual', final: 'The pigeon on the balcony keeps staring at me.' },
    { name: 'Change of mind', final: 'I want to go outside.', detour: 'I want to eat pizza' },
    { name: 'Ignore all', final: 'Zebras mumble quietly in my kitchen.', accept: false },
  ],
  hi: [
    { name: 'Go home', final: 'मुझे खाने के बाद घर जाना है।' },
    { name: 'Wait', final: 'क्या आप पाँच मिनट रुक सकते हैं? मुझे यह खत्म करना है।' },
    { name: 'Unusual', final: 'बालकनी पर कबूतर मुझे घूर रहा है।' },
    { name: 'Change of mind', final: 'मुझे बाहर जाना है।', detour: 'मुझे पिज़्ज़ा खाना है' },
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

function build(sents) {
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
  return { uni, bi }
}

const top = (map, keep = () => true) =>
  [...map].filter(([w]) => keep(w)).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w)

function words(text, { uni, bi }) {
  const last = /\S$/.test(text) ? text.match(/\S+$/)[0].toLowerCase() : ''
  const starter = !last && /^\s*$|[.?!।]\s*$/.test(text)
  const pick = last
    ? top(uni, w => w.startsWith(last) && w !== last)
    : top(bi.get(starter ? undefined : tokens(text).pop()) || uni)
  return pick.map(w => {
    let word = w.replace(/^i\b/, 'I')
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
        out.push({ insert, label: '…' + insert.trim(), kind: 'phrase', strong: tail.trim().length >= 6, score: w * tail.length })
        break
      }
    }
  }
  return out.sort((a, b) => b.score - a.score)
}

export function createEngine(mode = 'B', past = [], lang = 'en') {
  const personal = mode === 'C' || mode === 'D'
  let trust = 0.5
  let sents
  let index
  const rebuild = () => {
    sents = [...CORPUS[lang].map(s => [s, 1]), ...(personal ? past.map(s => [s, 3]) : [])]
    index = build(sents)
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
      const w = words(text, index)
      let out = mode === 'A' ? w : [...phrases(text, sents), ...w]
      if (mode === 'D') {
        if (trust < 0.2) out = out.filter(s => s.strong)
        else if (trust < 0.5) out = out.filter(s => s.kind === 'phrase')
      }
      const seen = new Set()
      return out.filter(s => !seen.has(s.insert) && seen.add(s.insert)).slice(0, mode === 'D' && trust < 0.2 ? 1 : 3)
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
