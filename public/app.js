import { createEngine, bench, TASKS } from './predict.js'

const $ = id => document.getElementById(id)
const MODES = { A: 'Words', B: 'Phrases', C: 'Personal', D: 'Adaptive' }
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

const load = () => {
  try {
    return JSON.parse(localStorage.getItem('taptalk-history')) || []
  } catch {
    return []
  }
}
const save = list => {
  try {
    localStorage.setItem('taptalk-history', JSON.stringify(list.slice(-200)))
  } catch {}
}

function fresh() {
  return { start: 0, keys: 0, taps: 0, corrections: 0, accepted: 0, ignored: 0 }
}

const history = load()
let engine
let text = ''
let m = fresh()

const begin = () => {
  m.start ||= performance.now()
}

const button = (label, onclick, cls = '', aria = '') => {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = label
  b.className = cls
  b.onclick = onclick
  if (aria) b.setAttribute('aria-label', aria)
  return b
}

function render() {
  const caret = document.createElement('span')
  caret.className = 'caret'
  $('say').replaceChildren(text, caret)
  $('say').classList.toggle('empty', !text)
  $('sugs').replaceChildren(...engine.suggest(text).map(s => button(s.label, () => accept(s))))
  $('recent').replaceChildren(
    ...history.slice(-6).reverse().map(h => button(h, () => {
      begin()
      m.taps++
      text = h
      render()
    }))
  )
}

function press(ch) {
  begin()
  if (/^\s*$|[.?!]\s$/.test(text)) ch = ch.toUpperCase()
  const [top] = engine.suggest(text)
  if (top && !top.insert.toLowerCase().startsWith(ch.toLowerCase())) {
    m.ignored++
    engine.feedback(false)
  }
  text += ch
  m.keys++
  render()
}

function accept(s) {
  begin()
  text += s.insert
  m.taps++
  m.accepted++
  engine.feedback(true)
  render()
}

function back() {
  if (!text) return
  begin()
  m.keys++
  m.corrections++
  text = text.slice(0, -1)
  render()
}

function delWord() {
  if (!text) return
  begin()
  m.taps++
  m.corrections++
  text = text.replace(/\S+\s*$/, '')
  render()
}

function wipe() {
  if (!text) return
  begin()
  m.taps++
  m.corrections++
  text = ''
  render()
}

function speak() {
  const said = text.trim()
  if (!said) return
  const secs = ((performance.now() - m.start) / 1000).toFixed(1)
  const diff = said.length - m.keys - m.taps
  $('stats').textContent =
    `Spoken in ${secs}s: ${m.keys} keys, ${m.taps} taps, ${m.corrections} corrections, ` +
    `${m.accepted} accepted, ${m.ignored} ignored. ` +
    `${diff >= 0 ? diff + ' fewer' : -diff + ' more'} actions than typing every letter.`
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(said)
    u.onend = u.onerror = () => $('mascot').classList.remove('talk')
    $('mascot').classList.add('talk')
    speechSynthesis.cancel()
    speechSynthesis.speak(u)
  } else {
    $('stats').textContent = 'This browser cannot speak aloud. Try Chrome or Edge.'
  }
  history.push(said)
  save(history)
  engine.learn(said)
  text = ''
  m = fresh()
  render()
}

function setMode(x) {
  engine = createEngine(x, [...history])
  document.body.dataset.mode = x
  for (const b of document.querySelectorAll('.modes button')) {
    b.setAttribute('aria-pressed', b.dataset.mode === x)
  }
  render()
}

$('modes').append(
  ...Object.entries(MODES).map(([k, v]) => {
    const b = button('', () => setMode(k), '', `Version ${k}: ${v}`)
    const letter = document.createElement('b')
    letter.textContent = k
    b.append(letter, v)
    b.dataset.mode = k
    return b
  })
)

const row = (...btns) => {
  const d = document.createElement('div')
  d.className = 'row'
  d.append(...btns)
  return d
}
$('keys').append(
  ...ROWS.map(r => row(...[...r].map(c => button(c, () => press(c), 'key')))),
  row(
    button('space', () => press(' '), 'key wide', 'Space'),
    ...[',', '.', '?', "'"].map(c => button(c, () => press(c), 'key')),
    button('⌫', back, 'key', 'Backspace')
  )
)

$('speak').onclick = speak
$('delword').onclick = delWord
$('wipe').onclick = wipe

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.target.closest('button') && (e.key === 'Enter' || e.key === ' ')) return
  if (e.key === 'Enter') speak()
  else if (e.key === 'Backspace') back()
  else if (e.key.length === 1) press(e.key)
  else return
  e.preventDefault()
})

const delta = n => (n > 0 ? `−${n}` : n < 0 ? `+${-n}` : '±0')

$('run').onclick = () => {
  const res = bench()
  const ks = Object.keys(MODES)
  const head = ks.map(k => `<th scope="col">${k} ${MODES[k]}</th>`).join('')
  const rows = TASKS.map((t, i) =>
    `<tr><th scope="row">${t.name}</th>${ks.map(k => `<td>${res[k][i].effort} (${delta(res[k][i].saved)})</td>`).join('')}</tr>`
  ).join('')
  const total = ks.map(k => {
    const effort = res[k].reduce((a, r) => a + r.effort, 0)
    const saved = res[k].reduce((a, r) => a + r.saved, 0)
    return `<td>${effort} (${delta(saved)})</td>`
  }).join('')
  $('bench').innerHTML =
    `<div class="tablewrap"><table><caption>Actions per task, and the change versus typing every letter</caption>` +
    `<thead><tr><th scope="col">Task</th>${head}</tr></thead><tbody>${rows}<tr><th scope="row">Total</th>${total}</tr></tbody></table></div>`
}

setMode('B')
$('say').focus()
