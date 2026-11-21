import { createEngine } from './predict.js'

const $ = id => document.getElementById(id)
const LANGS = { en: 'English', hi: 'हिन्दी' }
const MODE = ['A', 'B', 'C', 'D'].find(v => v === new URLSearchParams(location.search).get('v')?.toUpperCase()) || 'D'
const T = {
  en: {
    ph: 'What do you want to say?', speak: 'Speak', star: '★ Favorite', del: 'Delete word', wipe: 'Clear', big: 'Big keys',
    recent: 'Spoken before', none: 'Sentences you speak will show up here.', space: 'space',
    favLabel: 'My favorite', favHint: 'Type something, tap ★ Favorite, and it lives here, one tap away.',
  },
  hi: {
    ph: 'आप क्या कहना चाहते हैं?', speak: 'बोलें', star: '★ पसंदीदा', del: 'शब्द हटाएँ', wipe: 'मिटाएँ', big: 'बड़े बटन',
    recent: 'पहले बोले गए', none: 'आप जो बोलेंगे वह यहाँ दिखेगा।', space: 'स्पेस',
    favLabel: 'मेरा पसंदीदा', favHint: 'कुछ लिखें और ★ दबाएँ। वह यहाँ एक टैप पर मिलेगा।',
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

const ta = $('say')
const history = get('taptalk-history', [])
let favorite = get('taptalk-fav', '')
let engine
let lang = 'en'
let prevBefore = ''

const isHi = s => /[\u0900-\u097F]/.test(s)
const mine = () => history.filter(h => isHi(h) === (lang === 'hi'))
const before = () => ta.value.slice(0, ta.selectionStart)

const button = (label, onclick, cls = '', aria = '') => {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = label
  b.className = cls
  b.onclick = onclick
  if (aria) b.setAttribute('aria-label', aria)
  return b
}

const row = (...btns) => {
  const d = document.createElement('div')
  d.className = 'row'
  d.append(...btns)
  return d
}

const span = (cls, text) => {
  const s = document.createElement('span')
  s.className = cls
  s.textContent = text
  return s
}

function renderSugs() {
  prevBefore = before()
  $('sugs').replaceChildren(...engine.suggest(prevBefore).map(s => button(s.label, () => accept(s), 'chip')))
}

function renderRecent() {
  $('recent').replaceChildren(
    ...mine().slice(-6).reverse().map(h => button(h, () => {
      ta.value = h
      ta.focus()
      renderSugs()
    }))
  )
}

function renderFav() {
  $('fav').replaceChildren(span('fav-label', T[lang].favLabel), span('fav-phrase', favorite || T[lang].favHint))
  $('fav').lang = favorite ? (isHi(favorite) ? 'hi' : 'en') : lang
  $('fav').disabled = !favorite
  $('unfav').hidden = !favorite
}

function insert(str) {
  ta.setRangeText(str, ta.selectionStart, ta.selectionEnd, 'end')
  renderSugs()
}

function press(ch) {
  if (/^\s*$|[.?!]\s$/.test(before())) ch = ch.toUpperCase()
  const [top] = engine.suggest(before())
  if (top && !top.insert.toLowerCase().startsWith(ch.toLowerCase())) engine.feedback(false)
  insert(ch)
}

function accept(s) {
  engine.feedback(true)
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
    $('note').textContent = 'This browser cannot speak aloud. Try Chrome or Edge.'
    return
  }
  const u = new SpeechSynthesisUtterance(str)
  u.lang = isHi(str) ? 'hi-IN' : 'en-IN'
  u.onend = u.onerror = () => $('mascot').classList.remove('talk')
  $('mascot').classList.add('talk')
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}

function speak() {
  const said = ta.value.trim()
  if (!said) return
  say(said)
  history.push(said)
  put('taptalk-history', history.slice(-200))
  if (isHi(said) === (lang === 'hi')) engine.learn(said)
  ta.value = ''
  renderSugs()
  renderRecent()
}

function buildKeys() {
  const mark = /^\p{M}$/u
  const key = c => button(mark.test(c) ? '◌' + c : c, () => press(c), 'key')
  $('keys').replaceChildren(
    ...LAYOUT[lang].map(r => row(...r.map(key))),
    row(
      button(T[lang].space, () => press(' '), 'key wide'),
      ...EXTRA[lang].map(key),
      button('⌫', back, 'key', 'Backspace')
    )
  )
}

function setLang(l) {
  lang = l
  const t = T[l]
  ta.lang = l
  ta.placeholder = t.ph
  $('recent').dataset.empty = t.none
  $('speak').textContent = t.speak
  $('star').textContent = t.star
  $('delword').textContent = t.del
  $('wipe').textContent = t.wipe
  $('big').textContent = t.big
  $('rh').textContent = t.recent
  for (const b of document.querySelectorAll('.langs button')) b.setAttribute('aria-pressed', b.dataset.lang === l)
  engine = createEngine(MODE, mine(), l)
  buildKeys()
  renderFav()
  renderRecent()
  renderSugs()
}

$('langs').append(
  ...Object.entries(LANGS).map(([k, v]) => {
    const b = button(v, () => setLang(k))
    b.dataset.lang = k
    return b
  })
)

ta.addEventListener('input', () => {
  const now = before()
  const last = now.slice(-1)
  if (isHi(last) && lang === 'en') return setLang('hi')
  if (/[a-z]/i.test(last) && lang === 'hi') return setLang('en')
  if (now.length === prevBefore.length + 1 && now.startsWith(prevBefore)) {
    const [top] = engine.suggest(prevBefore)
    if (top && !top.insert.toLowerCase().startsWith(last.toLowerCase())) engine.feedback(false)
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
}
$('star').onclick = () => {
  const t = ta.value.trim()
  if (!t) return
  favorite = t
  put('taptalk-fav', favorite)
  renderFav()
}
$('unfav').onclick = () => {
  favorite = ''
  put('taptalk-fav', favorite)
  renderFav()
}
$('fav').onclick = () => favorite && say(favorite)
$('big').onclick = () => {
  const on = $('board').hidden
  $('board').hidden = !on
  $('big').setAttribute('aria-pressed', on)
  ta.setAttribute('inputmode', on ? 'none' : 'text')
}

setLang('en')
if (matchMedia('(pointer:fine)').matches) ta.focus()
