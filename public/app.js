import { createEngine } from './predict.js'
import { toDevanagari } from './translit.js'
import { SITUATIONS } from './phrases.js'

const $ = id => document.getElementById(id)
const MODE = ['A', 'B', 'C', 'D'].find(v => v === new URLSearchParams(location.search).get('v')?.toUpperCase()) || 'C'
const LANGS = { en: 'English', hi: 'हिन्दी' }
const T = {
  en: {
    ph: 'What do you want to say?', speak: 'Speak', del: 'Delete word', wipe: 'Clear', big: 'Big keys', space: 'space',
    tabs: ['Talk', 'Situations', 'Favorites', 'My words'], recent: 'Spoken before', none: 'Sentences you speak will show up here.',
    hint: 'Tap ★ to keep a phrase here for one-tap speaking.', more: 'More', add: '+ Add',
    favs: 'Favorites', favsSub: 'Tap a phrase to speak it.',
    sits: 'Situations', sitsSub: 'Tap a phrase to speak it. Add your own phrases to any situation, or make a new one.',
    newSit: '+ New situation', addSit: 'New situation', editSit: 'Rename situation', addPhrase: 'Add a phrase', editPhrase: 'Edit phrase',
    words: 'My words', wordsSub: 'Names and words that matter to you. Tap one to add it to your sentence.',
    now: 'Just now', earlier: 'Earlier', again: 'Speak', edit: 'Edit', fav: '★ Favorite', faved: '★ Saved',
    addFav: 'Add a favorite', editFav: 'Edit favorite', addWord: 'Add a word', editWord: 'Edit word',
    save: 'Save', remove: 'Delete', cancel: 'Cancel', starAdd: 'Add to favorites', starDel: 'Remove from favorites',
    voiceOff: 'This browser cannot speak aloud. Try Chrome or Edge.',
    aiLabel: 'AI suggestions', aiAsk: 'Turn on AI suggestions?', aiYes: 'Turn on', aiNo: 'Not now',
    aiBody: 'What you type is sent to Google Gemini so it can suggest better completions. TapTalk does not store it. Turn it off any time with the AI button.',
    aiFail: 'AI is unavailable right now. Built-in suggestions are still working.',
  },
  hi: {
    ph: 'आप क्या कहना चाहते हैं?', speak: 'बोलें', del: 'शब्द हटाएँ', wipe: 'मिटाएँ', big: 'बड़े बटन', space: 'स्पेस',
    tabs: ['बातचीत', 'स्थितियाँ', 'पसंदीदा', 'मेरे शब्द'], recent: 'पहले बोले गए', none: 'आप जो बोलेंगे वह यहाँ दिखेगा।',
    hint: 'एक टैप में बोलने के लिए किसी वाक्य पर ★ दबाएँ।', more: 'और', add: '+ जोड़ें',
    favs: 'पसंदीदा', favsSub: 'बोलने के लिए वाक्य पर टैप करें।',
    sits: 'स्थितियाँ', sitsSub: 'बोलने के लिए वाक्य पर टैप करें। किसी भी स्थिति में अपने वाक्य जोड़ें, या नई स्थिति बनाएँ।',
    newSit: '+ नई स्थिति', addSit: 'नई स्थिति', editSit: 'स्थिति का नाम बदलें', addPhrase: 'वाक्य जोड़ें', editPhrase: 'वाक्य बदलें',
    words: 'मेरे शब्द', wordsSub: 'नाम और ज़रूरी शब्द। वाक्य में जोड़ने के लिए टैप करें।',
    now: 'अभी', earlier: 'पहले', again: 'बोलें', edit: 'बदलें', fav: '★ पसंदीदा', faved: '★ जोड़ा गया',
    addFav: 'पसंदीदा जोड़ें', editFav: 'पसंदीदा बदलें', addWord: 'शब्द जोड़ें', editWord: 'शब्द बदलें',
    save: 'सहेजें', remove: 'हटाएँ', cancel: 'रद्द करें', starAdd: 'पसंदीदा में जोड़ें', starDel: 'पसंदीदा से हटाएँ',
    voiceOff: 'यह ब्राउज़र बोल नहीं सकता। Chrome या Edge आज़माएँ।',
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
const SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z"/></svg>'
const PENCIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>'

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
const latin = s => /[a-z]/i.test(s)
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

const before = () => ta.value.slice(0, ta.selectionStart)
const pastFor = code => history.filter(h => (code === 'en' ? h.l === 'en' : h.l === 'hi' && isDeva(h.t) === (code === 'hi'))).map(h => h.t)
const namesFor = code => names.filter(n => (code === 'hi' ? isDeva(n) : !isDeva(n)))

function build() {
  const make = code => createEngine(MODE, pastFor(code), code, namesFor(code))
  engines = lang === 'en' ? { en: make('en') } : { hi: make('hi'), hr: make('hr') }
}

function eng(text) {
  if (lang === 'en') return engines.en
  if (latin(text)) return engines.hr
  if (isDeva(text)) return engines.hi
  const last = history.findLast(h => h.l === 'hi')
  return (last ? !isDeva(last.t) : !big) ? engines.hr : engines.hi
}

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

const labelFor = (text, insert) => (/\S$/.test(text) && !insert.startsWith(' ') ? text.match(/\S+$/)[0] : '') + insert.trim()

function renderSugs() {
  prevBefore = before()
  const items = aiOn && aiCache.text === prevBefore ? aiCache.items.slice(0, 2) : []
  const taken = new Set(items.map(i => labelFor(prevBefore, i)))
  const local = eng(prevBefore).suggest(prevBefore).filter(s => !taken.has(s.label)).map(s => button(s.label, () => accept(s), 'chip'))
  const ai = items.map(i => button(labelFor(prevBefore, i), () => {
    insert(i)
    ta.focus({ preventScroll: true })
  }, 'chip ai-chip'))
  $('sugs').replaceChildren(...ai, ...local)
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
        body: JSON.stringify({ text: text.slice(-300), lang, recent: history.filter(h => h.l === lang).slice(-5).map(h => h.t.slice(0, 120)) }),
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

function confirmAI() {
  const t = T[lang]
  $('aititle').textContent = t.aiAsk
  $('aibody').textContent = t.aiBody
  $('aiyes').textContent = t.aiYes
  $('aino').textContent = t.aiNo
  $('aidlg').returnValue = ''
  $('aidlg').showModal()
  return new Promise(resolve => $('aidlg').addEventListener('close', () => resolve($('aidlg').returnValue === 'yes'), { once: true }))
}

async function probeAI() {
  try {
    const r = await fetch('/api/ai')
    if (!r.ok || !(await r.json()).available) return
  } catch {
    return
  }
  $('ai').hidden = false
  if (get('taptalk-ai', false)) setAI(true)
}

function favRow() {
  if (!favs.length) {
    $('favrow').replaceChildren(el('div', 'favcard hint', T[lang].hint))
    return
  }
  const cards = favs.slice(0, 3).map((f, i) => {
    const b = button('', () => say(f), `favcard c${i % 5}`)
    b.lang = isDeva(f) ? 'hi' : 'en'
    b.append(el('span', 'clamp', f))
    return b
  })
  if (favs.length > 3) cards.push(button(T[lang].more, () => go(2), 'more'))
  $('favrow').replaceChildren(...cards)
}

const card = (text, i, tap, edit) => {
  const w = el('div', edit ? 'card' : 'card noedit')
  const b = button('', tap, `card-say c${i % 5}`)
  b.lang = isDeva(text) ? 'hi' : 'en'
  b.append(el('span', 'clamp', text))
  w.append(b)
  if (edit) {
    const p = button('', edit, 'icon pencil', T[lang].edit)
    p.innerHTML = PENCIL
    w.append(p)
  }
  return w
}

const addCard = tap => {
  const w = el('div', 'card')
  w.append(button(T[lang].add, tap, 'card-say add'))
  return w
}

function pages() {
  $('favgrid').replaceChildren(...favs.map((f, i) => card(f, i, () => say(f), () => editFav(i))), addCard(() => editFav(-1)))
  $('namegrid').replaceChildren(
    ...names.map((w, i) => card(w, i, () => {
      insert(w + ' ')
      go(0)
    }, () => editWord(i))),
    addCard(() => editWord(-1))
  )
}

function renderHistory() {
  const items = history.filter(h => h.l === lang).slice(-30).reverse()
  $('hlist').dataset.empty = T[lang].none
  $('hlist').replaceChildren(...items.map(h => {
    const key = `${h.at}|${h.t}`
    const li = el('li')
    const b = button('', () => {
      open = open === key ? '' : key
      renderHistory()
    }, 'h-main')
    b.lang = isDeva(h.t) ? 'hi' : 'en'
    b.setAttribute('aria-expanded', open === key)
    b.append(el('span', 'h-text', h.t), el('span', 'h-meta', ago(h.at)))
    li.append(b)
    if (open === key) {
      const a = el('div', 'h-actions')
      a.append(
        button(T[lang].again, () => say(h.t)),
        button(T[lang].edit, () => {
          ta.value = h.t
          go(0)
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
  put('taptalk-favs', favs)
  renderAll()
}

function insert(str) {
  ta.setRangeText(str, ta.selectionStart, ta.selectionEnd, 'end')
  renderSugs()
}

function press(ch) {
  if (/^\s*$|[.?!]\s$/.test(before())) ch = ch.toUpperCase()
  const [top] = eng(before()).suggest(before())
  if (top && !top.insert.toLowerCase().startsWith(ch.toLowerCase())) eng(before()).feedback(false)
  insert(ch)
}

function accept(s) {
  eng(before()).feedback(true)
  insert(s.insert)
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
}

function say(str) {
  if (!('speechSynthesis' in window)) {
    $('note').textContent = T[lang].voiceOff
    return
  }
  const hindi = lang === 'hi' || isDeva(str)
  const u = new SpeechSynthesisUtterance(hindi ? toDevanagari(str) : str)
  u.lang = hindi ? 'hi-IN' : 'en-IN'
  u.onend = u.onerror = () => $('mascot').classList.remove('talking')
  $('mascot').classList.add('talking')
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}

function speak() {
  const said = ta.value.trim()
  if (!said) return
  say(said)
  history.push({ t: said, at: Date.now(), l: lang })
  put('taptalk-history', history.slice(-200))
  eng(said).learn(said)
  ta.value = ''
  renderSugs()
  renderHistory()
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
      if (dlg.returnValue === 'save' && v) resolve({ action: 'save', value: v })
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
const editFav = i => edit(favs, () => put('taptalk-favs', favs), T[lang][i < 0 ? 'addFav' : 'editFav'], i)
const editWord = i => edit(names, () => put('taptalk-names', names), T[lang][i < 0 ? 'addWord' : 'editWord'], i)

const allSits = () => [...SITUATIONS, ...sits.custom]
const sitLabel = s => s[lang] ?? s.name
const mineFor = s => (s.phrases ??= sits.extra[s.id] ?? (sits.extra[s.id] = []))

function sitPage() {
  const all = allSits()
  const cur = all.find(s => s.id === sit) ?? all[0]
  sit = cur.id
  const nav = all.map((s, i) => {
    const b = button(sitLabel(s), () => {
      sit = s.id
      sitPage()
    }, `sitbtn c${i % 5}`)
    b.setAttribute('aria-pressed', s.id === sit)
    return b
  })
  nav.push(button(T[lang].newSit, () => editSit(null), 'sitbtn add'))
  $('sitnav').replaceChildren(...nav)
  $('sith').textContent = sitLabel(cur)
  $('sitedit').hidden = !cur.name
  $('sitedit').setAttribute('aria-label', T[lang].editSit)
  const own = cur.p ? (sits.extra[cur.id] ??= []) : cur.phrases
  const builtIn = cur.p?.[lang] ?? []
  $('sitgrid').replaceChildren(
    ...builtIn.map((t, i) => card(t, i, () => say(t))),
    ...own.map((t, j) => card(t, builtIn.length + j, () => say(t), () => editPhrase(cur, own, j))),
    addCard(() => editPhrase(cur, own, -1))
  )
}

const editPhrase = (cur, own, j) => edit(own, () => put('taptalk-sits', sits), T[lang][j < 0 ? 'addPhrase' : 'editPhrase'], j)

async function editSit(cur) {
  const r = await ask(T[lang][cur ? 'editSit' : 'addSit'], cur ? cur.name : '', Boolean(cur))
  if (!r) return
  if (r.action === 'delete') {
    sits.custom = sits.custom.filter(s => s !== cur)
    sit = SITUATIONS[0].id
  } else if (cur) cur.name = r.value
  else {
    const s = { id: `c${Date.now()}`, name: r.value, phrases: [] }
    sits.custom.push(s)
    sit = s.id
  }
  put('taptalk-sits', sits)
  renderAll()
}

function setLang(l) {
  lang = l
  const t = T[l]
  ta.lang = l
  ta.placeholder = t.ph
  $('speak').textContent = t.speak
  $('delword').textContent = t.del
  $('wipe').textContent = t.wipe
  $('big').textContent = t.big
  $('ai').setAttribute('aria-label', t.aiLabel)
  $('rh').textContent = t.recent
  $('sh').textContent = t.sits
  $('ss').textContent = t.sitsSub
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

$('ai').innerHTML = SPARK + '<span>AI</span>'
$('ai').onclick = async () => {
  if (aiOn) return setAI(false)
  if (!get('taptalk-ai-ok', false)) {
    if (!(await confirmAI())) return
    put('taptalk-ai-ok', true)
  }
  setAI(true)
}

$('tabs').append(...[0, 1, 2, 3].map(i => button('', () => go(i))))
$('langs').append(...Object.entries(LANGS).map(([k, v]) => {
  const b = button(v, () => setLang(k))
  b.dataset.lang = k
  return b
}))

pager.addEventListener('scroll', () => requestAnimationFrame(sync))

ta.addEventListener('input', () => {
  const now = before()
  if (now.length === prevBefore.length + 1 && now.startsWith(prevBefore)) {
    const [top] = eng(prevBefore).suggest(prevBefore)
    if (top && !top.insert.toLowerCase().startsWith(now.slice(-1).toLowerCase())) eng(prevBefore).feedback(false)
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

$('sitedit').onclick = () => editSit(allSits().find(s => s.id === sit))
$('speak').onclick = speak
$('delword').onclick = delWord
$('wipe').onclick = () => {
  ta.value = ''
  renderSugs()
}
$('star').onclick = () => {
  const t = ta.value.trim()
  if (t) toggleFav(t)
}
$('big').onclick = () => {
  big = !big
  $('board').hidden = !big
  $('big').setAttribute('aria-pressed', big)
  $('app').classList.toggle('keys', big)
  ta.setAttribute('inputmode', big ? 'none' : 'text')
  renderSugs()
}

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
