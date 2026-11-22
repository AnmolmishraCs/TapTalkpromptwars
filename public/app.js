import { createEngine } from './predict.js'
import { toDevanagari, toRoman } from './translit.js'
import { hindiSuggest, convertTail } from './hindi.js'
import { SITUATIONS } from './phrases.js'
import { SYMBOLS } from './symbols.js'
import { reorder } from './order.js'

const $ = id => document.getElementById(id)
const MODE = ['A', 'B', 'C', 'D'].find(v => v === new URLSearchParams(location.search).get('v')?.toUpperCase()) || 'C'
const LANGS = { en: 'English', hi: 'हिन्दी' }
const PAGES = { talk: 0, sits: 1, syms: 2, favs: 3, words: 4 }
const TONE = { home: 'peach', work: 'blue', help: 'pink', doctor: 'mint', out: 'sun', school: 'lilac', people: 'mint' }
const T = {
  en: {
    ph: 'What do you want to say?', speak: 'Speak', del: 'Delete word', wipe: 'Clear', big: 'Big keys', space: 'space',
    tabs: ['Talk', 'Situations', 'Symbols', 'Favorites', 'Words'], recent: 'Spoken before', none: 'Sentences you speak will show up here.',
    hint: 'Tap ★ to keep a phrase here for one-tap speaking.', more: 'More', add: '+ Add',
    favs: 'Favorites', favsSub: 'Tap to speak. Hold a card and drag to change the order.',
    sits: 'Situations', sitsSub: 'Tap a phrase to speak it. Add your own phrases to any situation, or make a new one.',
    newSit: '+ New situation', addSit: 'New situation', editSit: 'Rename situation', addPhrase: 'Add a phrase', editPhrase: 'Edit phrase',
    syms: 'Symbols', symsSub: 'Tap a picture to speak it.',
    words: 'My words', wordsSub: 'Names and words that matter to you. Tap one to add it to your sentence. Hold and drag to reorder.',
    now: 'Just now', earlier: 'Earlier', again: 'Speak', edit: 'Edit', fav: '★ Favorite', faved: '★ Saved',
    addFav: 'Add a favorite', editFav: 'Edit favorite', addWord: 'Add a word', editWord: 'Edit word',
    save: 'Save', remove: 'Delete', cancel: 'Cancel', starAdd: 'Add to favorites', starDel: 'Remove from favorites',
    deleted: 'Deleted', undo: 'Undo', voiceOff: 'This browser cannot speak aloud. Try Chrome or Edge.',
    select: 'Select', selected: 'selected', all: 'All', moveTop: 'Move to top', done: 'Done', voiceLabel: 'Natural voice',
    vAsk: 'Turn on natural voice?', vBody: 'The text you speak is sent to Google Gemini to make a more natural voice. TapTalk does not store it. Turn it off any time with the speaker button. If it fails, the phone voice is used.',
    aiLabel: 'AI suggestions', aiAsk: 'Turn on AI suggestions?', aiYes: 'Turn on', aiNo: 'Not now',
    aiBody: 'What you type is sent to Google Gemini so it can suggest better completions. TapTalk does not store it. Turn it off any time with the AI button.',
    aiFail: 'AI is unavailable right now. Built-in suggestions are still working.',
  },
  hi: {
    ph: 'आप क्या कहना चाहते हैं?', speak: 'बोलें', del: 'शब्द हटाएँ', wipe: 'मिटाएँ', big: 'बड़े बटन', space: 'स्पेस',
    tabs: ['बातचीत', 'स्थितियाँ', 'प्रतीक', 'पसंदीदा', 'शब्द'], recent: 'पहले बोले गए', none: 'आप जो बोलेंगे वह यहाँ दिखेगा।',
    hint: 'एक टैप में बोलने के लिए किसी वाक्य पर ★ दबाएँ।', more: 'और', add: '+ जोड़ें',
    favs: 'पसंदीदा', favsSub: 'बोलने के लिए टैप करें। क्रम बदलने के लिए कार्ड को दबाकर खींचें।',
    sits: 'स्थितियाँ', sitsSub: 'बोलने के लिए वाक्य पर टैप करें। किसी भी स्थिति में अपने वाक्य जोड़ें, या नई स्थिति बनाएँ।',
    newSit: '+ नई स्थिति', addSit: 'नई स्थिति', editSit: 'स्थिति का नाम बदलें', addPhrase: 'वाक्य जोड़ें', editPhrase: 'वाक्य बदलें',
    syms: 'प्रतीक', symsSub: 'बोलने के लिए चित्र पर टैप करें।',
    words: 'मेरे शब्द', wordsSub: 'नाम और ज़रूरी शब्द। वाक्य में जोड़ने के लिए टैप करें। क्रम बदलने के लिए दबाकर खींचें।',
    now: 'अभी', earlier: 'पहले', again: 'बोलें', edit: 'बदलें', fav: '★ पसंदीदा', faved: '★ जोड़ा गया',
    addFav: 'पसंदीदा जोड़ें', editFav: 'पसंदीदा बदलें', addWord: 'शब्द जोड़ें', editWord: 'शब्द बदलें',
    save: 'सहेजें', remove: 'हटाएँ', cancel: 'रद्द करें', starAdd: 'पसंदीदा में जोड़ें', starDel: 'पसंदीदा से हटाएँ',
    deleted: 'हटाया गया', undo: 'वापस लाएँ', voiceOff: 'यह ब्राउज़र बोल नहीं सकता। Chrome या Edge आज़माएँ।',
    select: 'चुनें', selected: 'चुने गए', all: 'सभी', moveTop: 'ऊपर ले जाएँ', done: 'हो गया', voiceLabel: 'प्राकृतिक आवाज़',
    vAsk: 'प्राकृतिक आवाज़ चालू करें?', vBody: 'आप जो बोलते हैं वह ज़्यादा प्राकृतिक आवाज़ बनाने के लिए Google Gemini को भेजा जाता है। TapTalk इसे सहेजता नहीं है। स्पीकर बटन से कभी भी बंद कर सकते हैं। न चले तो फ़ोन की आवाज़ इस्तेमाल होती है।',
    aiLabel: 'AI सुझाव', aiAsk: 'AI सुझाव चालू करें?', aiYes: 'चालू करें', aiNo: 'अभी नहीं',
    aiBody: 'आप जो लिखते हैं वह बेहतर सुझावों के लिए Google Gemini को भेजा जाता है। TapTalk इसे सहेजता नहीं है। AI बटन से कभी भी बंद कर सकते हैं।',
    aiFail: 'AI अभी उपलब्ध नहीं है। सामान्य सुझाव काम कर रहे हैं।',
  },
}
const LAYOUT = {
  en: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map(r => [...r]),
  hi: [
    'अ आ इ ई उ ऊ ए ऐ ओ', 'औ ऋ ा ि ी ु ू े ै', 'ो ौ ं ँ ः ् ़ ृ',
    'क ख ग घ ङ च छ ज झ', 'ञ ट ठ ड ढ ण त थ द', 'ध न प फ ब भ म य र', 'ल व श ष स ह क्ष त्र ज्ञ',
  ].map(r => r.split(' ')),
}
const EXTRA = { en: [',', '.', '?', "'"], hi: [',', '।', '?'] }
const ICON = {
  pencil: '<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M13 7l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
  word: '<path d="M9 5h11a2 2 0 012 2v10a2 2 0 01-2 2H9L2 12z"/><path d="M12 9l5 6M17 9l-5 6"/>',
  clear: '<circle cx="12" cy="12" r="9"/><path d="M8 8l8 8M16 8l-8 8"/>',
  keys: '<rect x="2" y="6" width="20" height="13" rx="3"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 15h10"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 010 7M19.5 5.5a9 9 0 010 13" fill="none"/>',
  select: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12l3 3 5-6"/>',
  top: '<path d="M5 4h14M12 20V9M7 14l5-5 5 5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
}
const svg = inner => `<svg viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`
const SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>'

const get = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
const put = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

const isDeva = s => /[\u0900-\u097F]/.test(s)
const toEntry = h => (typeof h === 'string' ? { t: h, at: 0, l: isDeva(h) ? 'hi' : 'en' } : h)

const ta = $('say')
const pager = $('pager')
const history = get('taptalk-history', []).map(toEntry)
const favs = get('taptalk-favs', [])
const names = get('taptalk-names', [])
const sits = get('taptalk-sits', {})
sits.extra ??= {}
sits.custom ??= []
const oldFav = get('taptalk-fav', '')
if (oldFav && !favs.length) favs.push(oldFav)
const saveHistory = () => put('taptalk-history', history.slice(-200))
const saveFavs = () => put('taptalk-favs', favs)
const saveNames = () => put('taptalk-names', names)
const saveSits = () => put('taptalk-sits', sits)

let engines
let lang = 'en'
let big = false
let open = ''
let sit = SITUATIONS[0].id
let prevBefore = ''
let aiOn = false
let aiSeq = 0
let aiTimer = 0
let aiWarned = false
let aiCache = { text: '', items: [] }
let voiceOn = false
let audioCtx
let source
let curPage = 0
let speakId = 0
let speaking = null
let toastTimer = 0

let kbWas = false
const refocus = () => kbWas && ta.focus({ preventScroll: true })
const before = () => ta.value.slice(0, ta.selectionStart)
const pastFor = code => {
  if (code === 'en') return history.filter(h => h.l === 'en').map(h => h.t)
  const hi = history.filter(h => h.l === 'hi').map(h => h.t)
  return code === 'hi' ? hi : hi.map(toRoman)
}
const namesFor = code => (code === 'en' ? names.filter(n => !isDeva(n)) : code === 'hi' ? names.filter(isDeva) : names.map(toRoman))

function build() {
  const make = code => createEngine(MODE, pastFor(code), code, namesFor(code))
  engines = lang === 'en' ? { en: make('en') } : { hi: make('hi'), hr: make('hr') }
}

const items = b =>
  lang === 'en'
    ? engines.en.suggest(b).map(s => ({ label: s.label, replace: 0, text: s.insert, raw: s.insert, e: engines.en }))
    : hindiSuggest(engines, b)

const el = (tag, cls = '', text = '') => {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (text) e.textContent = text
  return e
}

const button = (label, onclick, cls = '', aria = '') => {
  const b = el('button', cls, label)
  b.type = 'button'
  b.onclick = onclick
  if (aria) b.setAttribute('aria-label', aria)
  return b
}

const icon = (fn, cls, name, aria) => {
  const b = button('', fn, cls, aria)
  b.innerHTML = svg(ICON[name])
  return b
}

const row = (...btns) => {
  const d = el('div', 'row')
  d.append(...btns)
  return d
}

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

function go(i) {
  pager.children[i].inert = false
  pager.scrollTo({ left: i * pager.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
}

function sync() {
  const page = Math.round(pager.scrollLeft / pager.clientWidth)
  if (page !== curPage) {
    curPage = page
    ta.blur()
    endSel()
  }
  ;[...$('tabs').children].forEach((b, i) => (i === page ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')))
  ;[...pager.children].forEach((s, i) => (s.inert = i !== page))
}

function ago(at) {
  if (!at) return T[lang].earlier
  const s = (Date.now() - at) / 1000
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  if (s < 60) return T[lang].now
  if (s < 3600) return rtf.format(-Math.floor(s / 60), 'minute')
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), 'hour')
  return rtf.format(-Math.floor(s / 86400), 'day')
}

function toast(message, undo) {
  $('tmsg').textContent = message
  $('tundo').textContent = T[lang].undo
  $('tundo').onclick = () => {
    undo()
    $('toast').hidden = true
  }
  $('toast').hidden = false
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => ($('toast').hidden = true), 6000)
}

function removeAt(list, i, save) {
  if (i < 0) return
  const [item] = list.splice(i, 1)
  save()
  build()
  renderAll()
  toast(T[lang].deleted, () => {
    list.splice(i, 0, item)
    save()
    build()
    renderAll()
  })
}

function stopWave() {
  if (speaking) {
    speaking.host?.classList.remove('speaking')
    speaking.wave?.remove()
    speaking = null
  }
  $('mascot').classList.remove('talking')
}

function pickVoice(tag) {
  const base = tag.slice(0, 2).toLowerCase()
  const score = v =>
    (v.lang.replace('_', '-').toLowerCase() === tag.toLowerCase() ? 4 : 0) +
    (/google|neural|natural|online|enhanced|premium|wavenet/i.test(v.name) ? 3 : 0) +
    (v.localService ? 0 : 1)
  return speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith(base)).sort((a, b) => score(b) - score(a))[0]
}

function deviceSpeak(text, hindi, id) {
  const u = new SpeechSynthesisUtterance(text)
  u.lang = hindi ? 'hi-IN' : 'en-IN'
  const voice = pickVoice(u.lang)
  if (voice) u.voice = voice
  u.rate = hindi ? 0.9 : 0.95
  u.onend = u.onerror = () => id === speakId && stopWave()
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}

async function natural(text, l, id) {
  const r = await fetch('/api/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang: l }),
  })
  if (!r.ok) throw new Error(String(r.status))
  const { pcm, rate } = await r.json()
  if (id !== speakId) return
  const bytes = Uint8Array.from(atob(pcm), c => c.charCodeAt(0))
  const samples = new Int16Array(bytes.buffer, 0, bytes.length >> 1)
  const buffer = audioCtx.createBuffer(1, samples.length, rate || 24000)
  buffer.getChannelData(0).set(Float32Array.from(samples, v => v / 32768))
  source = audioCtx.createBufferSource()
  source.buffer = buffer
  source.connect(audioCtx.destination)
  source.onended = () => id === speakId && stopWave()
  await audioCtx.resume()
  source.start()
}

function say(str, host) {
  stopWave()
  try {
    source?.stop()
  } catch {}
  const id = ++speakId
  const hindi = lang === 'hi' || isDeva(str)
  const text = hindi ? toDevanagari(str) : str
  setTimeout(() => id === speakId && stopWave(), 4000 + str.length * 150)
  const wave = el('span', 'wave')
  wave.append(el('i'), el('i'), el('i'))
  if (host) {
    host.classList.add('speaking')
    host.append(wave)
  }
  speaking = { host, wave }
  $('mascot').classList.add('talking')
  if (voiceOn) {
    audioCtx ??= new AudioContext()
    audioCtx.resume()
    natural(text, hindi ? 'hi' : 'en', id).catch(() => {
      if (id !== speakId) return
      if ('speechSynthesis' in window) deviceSpeak(text, hindi, id)
      else stopWave()
    })
    return
  }
  if (!('speechSynthesis' in window)) {
    $('note').textContent = T[lang].voiceOff
    stopWave()
    return
  }
  deviceSpeak(text, hindi, id)
}

const labelFor = (text, insert) => (/\S$/.test(text) && !insert.startsWith(' ') ? text.match(/\S+$/)[0] : '') + insert.trim()

function aiItems(b) {
  const hindi = lang === 'hi'
  const partial = hindi ? b.match(/[A-Za-z']+$/)?.[0] ?? '' : ''
  const converted = hindi ? toDevanagari(b) : b
  const lead = partial ? toDevanagari(partial) : ''
  return aiCache.items.slice(0, 2).map(c => ({ label: labelFor(converted, c), replace: partial.length, text: lead + c }))
}

function renderSugs() {
  prevBefore = before()
  const ai = aiOn && aiCache.text === prevBefore ? aiItems(prevBefore) : []
  const taken = new Set(ai.map(i => i.label))
  const local = items(prevBefore).filter(i => !taken.has(i.label))
  $('sugs').replaceChildren(
    ...ai.map(i => button(i.label, () => accept(i), 'chip ai-chip')),
    ...local.map(i => button(i.label, () => accept(i), 'chip'))
  )
  const on = favs.includes(ta.value.trim())
  $('star').setAttribute('aria-pressed', on)
  $('star').setAttribute('aria-label', on ? T[lang].starDel : T[lang].starAdd)
  askAI(prevBefore)
}

function askAI(text) {
  clearTimeout(aiTimer)
  if (!aiOn || text.trim().length < 2 || aiCache.text === text) return
  const seq = ++aiSeq
  aiTimer = setTimeout(async () => {
    try {
      const r = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: (lang === 'hi' ? toDevanagari(text) : text).slice(-300),
          lang,
          recent: history.filter(h => h.l === lang).slice(-5).map(h => h.t.slice(0, 120)),
        }),
      })
      if (r.status === 503) {
        $('ai').hidden = true
        return setAI(false)
      }
      if (!r.ok) throw new Error(String(r.status))
      const { suggestions } = await r.json()
      if (seq !== aiSeq || before() !== text) return
      aiCache = { text, items: suggestions }
      renderSugs()
    } catch {
      if (!aiWarned) {
        aiWarned = true
        $('note').textContent = T[lang].aiFail
      }
    }
  }, 500)
}

function setAI(on) {
  aiOn = on
  put('taptalk-ai', on)
  $('ai').setAttribute('aria-pressed', on)
  if (!on) $('note').textContent = ''
  renderSugs()
}

function confirmAI(prefix = 'ai') {
  const t = T[lang]
  $('aititle').textContent = t[`${prefix}Ask`]
  $('aibody').textContent = t[`${prefix}Body`]
  $('aiyes').textContent = t.aiYes
  $('aino').textContent = t.aiNo
  $('aidlg').returnValue = ''
  $('aidlg').showModal()
  return new Promise(resolve => $('aidlg').addEventListener('close', () => resolve($('aidlg').returnValue === 'yes'), { once: true }))
}

async function probe(path) {
  try {
    const r = await fetch(path)
    return r.ok && (await r.json()).available === true
  } catch {
    return false
  }
}

function setVoice(on) {
  voiceOn = on
  put('taptalk-voice', on)
  $('voice').setAttribute('aria-pressed', on)
}

async function probeAI() {
  const [ai, voice] = await Promise.all([probe('/api/ai'), probe('/api/speak')])
  $('ai').hidden = !ai
  $('voice').hidden = !voice
  if (ai && get('taptalk-ai', false)) setAI(true)
  if (voice && get('taptalk-voice', false)) setVoice(true)
}

function favRow() {
  if (!favs.length) {
    $('favrow').replaceChildren(el('div', 'favcard hint', T[lang].hint))
    return
  }
  const cards = favs.slice(0, 5).map((f, i) => {
    const b = button('', () => say(f, b), 'favcard sun')
    b.dataset.i = i
    b.lang = isDeva(f) ? 'hi' : 'en'
    b.append(el('span', 'clamp', f))
    return b
  })
  if (favs.length > 5) cards.push(button(T[lang].more, () => go(PAGES.favs), 'favcard more'))
  $('favrow').replaceChildren(...cards)
}

const sel = { kind: '', picked: new Set() }
const histRows = () => history.filter(h => h.l === lang).slice(-30).reverse()
const curSit = () => allSits().find(s => s.id === sit) ?? allSits()[0]
const KINDS = {
  favs: { list: () => favs, save: saveFavs, top: true },
  names: { list: () => names, save: saveNames, top: true },
  sits: { list: () => ownOf(curSit()), save: saveSits, top: true },
  hist: { list: () => history, save: saveHistory, top: false },
}
const visible = kind => (kind === 'hist' ? histRows() : KINDS[kind].list())

function selUI() {
  $('selbar').hidden = !sel.kind
  document.body.classList.toggle('selecting', Boolean(sel.kind))
  if (sel.kind) {
    $('selcount').textContent = `${sel.picked.size} ${T[lang].selected}`
    $('seltop').hidden = !KINDS[sel.kind].top
  }
  for (const b of document.querySelectorAll('.selbtn')) b.setAttribute('aria-pressed', b.dataset.kind === sel.kind)
}

function startSel(kind) {
  if (sel.kind === kind) return endSel()
  sel.kind = kind
  sel.picked.clear()
  selUI()
  renderAll()
}

function endSel() {
  if (!sel.kind) return
  sel.kind = ''
  sel.picked.clear()
  selUI()
  renderAll()
}

function pick(item) {
  if (sel.picked.has(item)) sel.picked.delete(item)
  else sel.picked.add(item)
  selUI()
  renderAll()
}

const checkbox = () => {
  const c = el('span', 'check')
  c.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'
  return c
}

function card(text, tone, tap, i, ops, kind) {
  const selecting = Boolean(kind) && sel.kind === kind
  const picked = selecting && sel.picked.has(text)
  const w = el('div', `card${ops && !selecting ? '' : ' noedit'}${selecting ? ' selecting' : ''}${picked ? ' picked' : ''}`)
  if (i !== undefined && !selecting) w.dataset.i = i
  const b = button('', () => (selecting ? pick(text) : tap(b)), `card-say ${tone}`)
  b.lang = isDeva(text) ? 'hi' : 'en'
  if (selecting) b.append(checkbox())
  b.append(el('span', 'clamp', text))
  w.append(b)
  if (ops && !selecting) w.append(icon(ops.edit, 'icon pencil', 'pencil', T[lang].edit), icon(ops.del, 'icon trash', 'trash', T[lang].remove))
  return w
}

const addCard = tap => {
  const w = el('div', 'card')
  w.append(button(T[lang].add, tap, 'card-say add'))
  return w
}
const adder = tap => (sel.kind ? [] : [addCard(tap)])

const allSits = () => [...SITUATIONS, ...sits.custom]
const sitLabel = s => s[lang] ?? s.name
const ownOf = s => (s.p ? (sits.extra[s.id] ??= []) : s.phrases)

function sitPage() {
  const all = allSits()
  const cur = all.find(s => s.id === sit) ?? all[0]
  sit = cur.id
  const tone = TONE[cur.id] ?? 'lilac'
  const nav = all.map(s => {
    const b = button(sitLabel(s), () => {
      sit = s.id
      if (sel.kind === 'sits') sel.picked.clear()
      sitPage()
      selUI()
    }, `sitbtn dot-${TONE[s.id] ?? 'lilac'}`)
    b.setAttribute('aria-pressed', s.id === sit)
    return b
  })
  nav.push(button(T[lang].newSit, () => editSit(null), 'sitbtn add'))
  $('sitnav').replaceChildren(...nav)
  $('sith').textContent = sitLabel(cur)
  $('sitedit').hidden = !cur.name
  $('sitdel').hidden = !cur.name
  $('sitedit').setAttribute('aria-label', T[lang].editSit)
  $('sitdel').setAttribute('aria-label', T[lang].remove)
  const own = ownOf(cur)
  const builtIn = cur.p?.[lang] ?? []
  $('sitgrid').replaceChildren(
    ...builtIn.map(t => card(t, tone, host => say(t, host))),
    ...own.map((t, j) => card(t, tone, host => say(t, host), j, { edit: () => editPhrase(own, j), del: () => removeAt(own, j, saveSits) }, 'sits')),
    ...adder(() => editPhrase(own, -1))
  )
}

function symPage() {
  $('symgrid').replaceChildren(...SYMBOLS.map(s => {
    const b = button('', () => say(s.say[lang], b), 'sym mint')
    b.lang = lang
    const pic = el('span', 'symic')
    pic.innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">${s.d}</svg>`
    b.append(pic, el('span', 'symcap', s[lang]))
    return b
  }))
}

function pages() {
  const favCards = favs.map((f, i) => card(f, 'sun', host => say(f, host), i, { edit: () => editFav(i), del: () => removeAt(favs, i, saveFavs) }, 'favs'))
  if (favCards.length >= 5) favCards.splice(5, 0, el('div', 'sep'))
  $('favgrid').replaceChildren(...favCards, ...adder(() => editFav(-1)))
  $('namegrid').replaceChildren(
    ...names.map((w, i) => card(w, 'lilac', () => {
      insert(w + ' ')
      go(PAGES.talk)
    }, i, { edit: () => editWord(i), del: () => removeAt(names, i, saveNames) }, 'names')),
    ...adder(() => editWord(-1))
  )
  symPage()
}

function renderHistory() {
  const selecting = sel.kind === 'hist'
  $('hlist').dataset.empty = T[lang].none
  $('hlist').replaceChildren(...histRows().map(h => {
    const key = `${h.at}|${h.t}`
    const picked = selecting && sel.picked.has(h)
    const li = el('li', selecting ? 'selecting' : '')
    const b = button('', () => {
      if (selecting) return pick(h)
      open = open === key ? '' : key
      renderHistory()
    }, `h-main${picked ? ' picked' : ''}`)
    b.lang = isDeva(h.t) ? 'hi' : 'en'
    b.setAttribute('aria-expanded', open === key)
    if (selecting) b.append(checkbox())
    b.append(el('span', 'h-text', h.t), el('span', 'h-meta', ago(h.at)))
    li.append(b)
    if (!selecting) li.append(icon(() => removeAt(history, history.indexOf(h), saveHistory), 'mini h-del', 'trash', T[lang].remove))
    if (open === key && !selecting) {
      const a = el('div', 'h-actions')
      a.append(
        button(T[lang].again, () => say(h.t, b)),
        button(T[lang].edit, () => {
          ta.value = h.t
          go(PAGES.talk)
          renderSugs()
        }),
        button(favs.includes(h.t) ? T[lang].faved : T[lang].fav, () => toggleFav(h.t))
      )
      li.append(a)
    }
    return li
  }))
}

function renderAll() {
  favRow()
  pages()
  sitPage()
  renderHistory()
  renderSugs()
}

function toggleFav(t) {
  const i = favs.indexOf(t)
  if (i < 0) favs.push(t)
  else favs.splice(i, 1)
  saveFavs()
  renderAll()
}

function insert(str) {
  ta.setRangeText(str, ta.selectionStart, ta.selectionEnd, 'end')
  renderSugs()
}

function press(ch) {
  if (/^\s*$|[.?!।]\s$/.test(before())) ch = ch.toUpperCase()
  const [top] = items(before())
  if (top && !top.raw.toLowerCase().startsWith(ch.toLowerCase())) top.e.feedback(false)
  insert(ch)
}

function accept(it) {
  it.e?.feedback(true)
  const end = ta.selectionEnd
  ta.setRangeText(it.text, ta.selectionStart - it.replace, end, 'end')
  renderSugs()
  ta.focus({ preventScroll: true })
}

function back() {
  const s = ta.selectionStart
  if (s !== ta.selectionEnd) ta.setRangeText('', s, ta.selectionEnd, 'end')
  else if (s > 0) ta.setRangeText('', s - 1, s, 'end')
  renderSugs()
}

function delWord() {
  const s = ta.selectionStart
  ta.setRangeText('', before().replace(/\S+\s*$/, '').length, s, 'end')
  renderSugs()
  refocus()
}

function speak() {
  let said = ta.value.trim()
  if (!said) return
  if (lang === 'hi') said = toDevanagari(said)
  say(said, $('speak'))
  history.push({ t: said, at: Date.now(), l: lang })
  saveHistory()
  if (lang === 'hi') {
    engines.hi.learn(said)
    engines.hr.learn(toRoman(said))
  } else engines.en.learn(said)
  ta.value = ''
  open = ''
  renderSugs()
  renderHistory()
  refocus()
}

function buildKeys() {
  const mark = /^\p{M}$/u
  const key = c => button(mark.test(c) ? '◌' + c : c, () => press(c), 'key')
  $('keys').replaceChildren(
    ...LAYOUT[lang].map(r => row(...r.map(key))),
    row(button(T[lang].space, () => press(' '), 'key wide'), ...EXTRA[lang].map(key), button('⌫', back, 'key', 'Backspace'))
  )
}

const dlg = $('dlg')
function ask(title, value, canDelete) {
  const t = T[lang]
  $('dtitle').textContent = title
  $('dtext').value = value
  $('dtext').lang = lang
  $('dsave').textContent = t.save
  $('ddel').textContent = t.remove
  $('dcancel').textContent = t.cancel
  $('ddel').hidden = !canDelete
  dlg.returnValue = ''
  dlg.showModal()
  return new Promise(resolve =>
    dlg.addEventListener('close', () => {
      const v = $('dtext').value.trim()
      if (dlg.returnValue === 'save' && v) resolve({ action: 'save', value: lang === 'hi' ? toDevanagari(v) : v })
      else if (dlg.returnValue === 'delete') resolve({ action: 'delete' })
      else resolve(null)
    }, { once: true })
  )
}

async function edit(list, save, title, i) {
  const r = await ask(title, i < 0 ? '' : list[i], i >= 0)
  if (!r) return
  if (r.action === 'delete') list.splice(i, 1)
  else if (i < 0) {
    if (!list.includes(r.value)) list.push(r.value)
  } else list[i] = r.value
  save()
  build()
  renderAll()
}
const editFav = i => edit(favs, saveFavs, T[lang][i < 0 ? 'addFav' : 'editFav'], i)
const editWord = i => edit(names, saveNames, T[lang][i < 0 ? 'addWord' : 'editWord'], i)
const editPhrase = (own, j) => edit(own, saveSits, T[lang][j < 0 ? 'addPhrase' : 'editPhrase'], j)

async function editSit(cur) {
  const r = await ask(T[lang][cur ? 'editSit' : 'addSit'], cur ? cur.name : '', false)
  if (!r) return
  if (cur) cur.name = r.value
  else {
    const s = { id: `c${Date.now()}`, name: r.value, phrases: [] }
    sits.custom.push(s)
    sit = s.id
  }
  saveSits()
  renderAll()
}

function sortable(root, get) {
  let timer = 0
  let start = null
  let drag = null
  let held = 0
  const cards = () => [...root.querySelectorAll('[data-i]')]
  const finish = () => {
    clearTimeout(timer)
    start = null
    if (!drag) return
    drag.classList.remove('lifted')
    const order = cards().map(c => Number(c.dataset.i))
    drag = null
    held = Date.now()
    const { list, save } = get()
    list.splice(0, list.length, ...reorder(list, order))
    save()
    renderAll()
  }
  root.addEventListener('contextmenu', e => {
    if (e.target.closest('[data-i]')) e.preventDefault()
  })
  root.addEventListener('pointerdown', e => {
    const card = e.target.closest('[data-i]')
    if (!card || e.target.closest('.icon') || e.button > 0) return
    start = { x: e.clientX, y: e.clientY }
    timer = setTimeout(() => {
      drag = card
      card.classList.add('lifted')
      root.setPointerCapture?.(e.pointerId)
      navigator.vibrate?.(15)
    }, 350)
  })
  root.addEventListener('pointermove', e => {
    if (!drag) {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) {
        clearTimeout(timer)
        start = null
      }
      return
    }
    const over = document.elementsFromPoint(e.clientX, e.clientY).map(n => n.closest('[data-i]')).find(c => c && c !== drag && root.contains(c))
    if (!over) return
    const all = cards()
    if (all.indexOf(drag) < all.indexOf(over)) over.after(drag)
    else over.before(drag)
  })
  root.addEventListener('pointerup', finish)
  root.addEventListener('pointercancel', finish)
  root.addEventListener('touchmove', e => {
    if (drag) e.preventDefault()
  }, { passive: false })
  root.addEventListener('click', e => {
    if (Date.now() - held < 400) {
      e.stopPropagation()
      e.preventDefault()
    }
  }, true)
}

function setLang(l) {
  lang = l
  const t = T[l]
  ta.lang = l
  ta.placeholder = t.ph
  $('speak').querySelector('.lbl').textContent = t.speak
  for (const [id, label] of [['delword', t.del], ['wipe', t.wipe], ['big', t.big], ['voice', t.voiceLabel], ['ai', t.aiLabel]]) {
    $(id).setAttribute('aria-label', label)
    $(id).title = label
  }
  for (const b of document.querySelectorAll('.selbtn')) b.querySelector('.lbl').textContent = t.select
  $('selall').textContent = t.all
  $('seltop').querySelector('.lbl').textContent = t.moveTop
  $('seldel').querySelector('.lbl').textContent = t.remove
  $('seldone').setAttribute('aria-label', t.done)
  selUI()
  $('rh').textContent = t.recent
  $('sh').textContent = t.sits
  $('ss').textContent = t.sitsSub
  $('yh').textContent = t.syms
  $('ys').textContent = t.symsSub
  $('fh').textContent = t.favs
  $('fs').textContent = t.favsSub
  $('nh').textContent = t.words
  $('ns').textContent = t.wordsSub
  ;[...$('tabs').children].forEach((b, i) => (b.textContent = t.tabs[i]))
  for (const b of document.querySelectorAll('.langs button')) b.setAttribute('aria-pressed', b.dataset.lang === l)
  build()
  buildKeys()
  renderAll()
}

$('sitedit').innerHTML = svg(ICON.pencil)
$('sitdel').innerHTML = svg(ICON.trash)
$('sitedit').onclick = () => editSit(allSits().find(s => s.id === sit))
$('sitdel').onclick = () => removeAt(sits.custom, sits.custom.findIndex(s => s.id === sit), saveSits)
$('speak').innerHTML = svg(ICON.speaker) + '<span class="lbl"></span>'
$('delword').innerHTML = svg(ICON.word)
$('wipe').innerHTML = svg(ICON.clear)
$('big').innerHTML = svg(ICON.keys)
$('voice').innerHTML = svg(ICON.speaker)
for (const b of document.querySelectorAll('.selbtn')) {
  b.innerHTML = svg(ICON.select) + '<span class="lbl"></span>'
  b.onclick = () => startSel(b.dataset.kind)
}
$('seltop').innerHTML = svg(ICON.top) + '<span class="lbl"></span>'
$('seldel').innerHTML = svg(ICON.trash) + '<span class="lbl"></span>'
$('seldone').innerHTML = svg(ICON.close)
$('seldone').onclick = endSel
$('selall').onclick = () => {
  const all = visible(sel.kind)
  if (sel.picked.size === all.length) sel.picked.clear()
  else all.forEach(x => sel.picked.add(x))
  selUI()
  renderAll()
}
$('seltop').onclick = () => {
  const k = KINDS[sel.kind]
  const list = k.list()
  list.splice(0, list.length, ...list.filter(x => sel.picked.has(x)), ...list.filter(x => !sel.picked.has(x)))
  k.save()
  build()
  endSel()
}
$('seldel').onclick = () => {
  if (!sel.picked.size) return
  const k = KINDS[sel.kind]
  const list = k.list()
  const snapshot = [...list]
  list.splice(0, list.length, ...list.filter(x => !sel.picked.has(x)))
  k.save()
  build()
  endSel()
  toast(T[lang].deleted, () => {
    list.splice(0, list.length, ...snapshot)
    k.save()
    build()
    renderAll()
  })
}
$('voice').onclick = async () => {
  if (voiceOn) return setVoice(false)
  if (!get('taptalk-voice-ok', false)) {
    if (!(await confirmAI('v'))) return
    put('taptalk-voice-ok', true)
  }
  setVoice(true)
}
$('ai').innerHTML = SPARK + '<span>AI</span>'
$('ai').onclick = async () => {
  if (aiOn) return setAI(false)
  if (!get('taptalk-ai-ok', false)) {
    if (!(await confirmAI())) return
    put('taptalk-ai-ok', true)
  }
  setAI(true)
}

$('tabs').append(...[0, 1, 2, 3, 4].map(i => button('', () => go(i))))
$('langs').append(...Object.entries(LANGS).map(([k, v]) => {
  const b = button(v, () => setLang(k))
  b.dataset.lang = k
  return b
}))

pager.addEventListener('scroll', () => requestAnimationFrame(sync))

ta.addEventListener('input', () => {
  let now = before()
  if (now.length === prevBefore.length + 1 && now.startsWith(prevBefore)) {
    const [top] = items(prevBefore)
    if (top && !top.raw.toLowerCase().startsWith(now.slice(-1).toLowerCase())) top.e.feedback(false)
  }
  if (lang === 'hi') {
    const tail = convertTail(now)
    if (tail && now.slice(-tail.len) !== prevBefore.slice(-tail.len)) {
      const s = ta.selectionStart
      ta.setRangeText(tail.text, s - tail.len, s, 'end')
      now = before()
    }
  }
  renderSugs()
})
ta.addEventListener('click', renderSugs)
ta.addEventListener('keyup', renderSugs)
ta.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    speak()
  }
})

$('speak').onclick = speak
$('delword').onclick = delWord
$('wipe').onclick = () => {
  ta.value = ''
  renderSugs()
  refocus()
}
$('star').onclick = () => {
  const t = lang === 'hi' ? toDevanagari(ta.value.trim()) : ta.value.trim()
  if (t) toggleFav(t)
  refocus()
}
$('big').onclick = () => {
  big = !big
  $('board').hidden = !big
  $('app').classList.toggle('keys', big)
  $('big').setAttribute('aria-pressed', big)
  ta.setAttribute('inputmode', big ? 'none' : 'text')
  ta.blur()
  ta.focus({ preventScroll: true })
  renderSugs()
}

sortable($('favgrid'), () => ({ list: favs, save: saveFavs }))
sortable($('favrow'), () => ({ list: favs, save: saveFavs }))
sortable($('namegrid'), () => ({ list: names, save: saveNames }))
sortable($('sitgrid'), () => ({ list: ownOf(allSits().find(s => s.id === sit)), save: saveSits }))

document.addEventListener('pointerdown', e => {
  if (e.target.closest('button')) navigator.vibrate?.(8)
}, true)
document.addEventListener('pointerdown', () => {
  kbWas = document.activeElement === ta
}, true)
for (const q of ['.tools', '.actions', '#sugs', '#board']) document.querySelector(q).addEventListener('mousedown', e => e.preventDefault())

const fit = () => {
  const h = window.visualViewport?.height ?? innerHeight
  document.documentElement.style.setProperty('--vh', `${h}px`)
  $('app').classList.toggle('short', h < 540)
}
window.visualViewport?.addEventListener('resize', fit)
window.visualViewport?.addEventListener('scroll', () => scrollTo(0, 0))
fit()

setInterval(renderHistory, 60000)
setLang('en')
sync()
probeAI()
if (matchMedia('(pointer:fine)').matches) ta.focus()
