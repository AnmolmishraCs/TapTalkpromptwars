import test from 'node:test'
import assert from 'node:assert/strict'
import { EMOTIONS, emotionOf } from '../public/emotion.js'
import { search } from '../public/search.js'
import { summarize } from '../public/insights.js'
import { contextPhrases, frequent, partOfDay } from '../public/context.js'
import { mergeLibrary } from '../public/library.js'
import { SITUATIONS } from '../public/phrases.js'

test('emotion is picked from the words', () => {
  assert.equal(emotionOf('I need help'), 'urgent')
  assert.equal(emotionOf('Thank you for your help'), 'happy')
  assert.equal(emotionOf('I am sorry'), 'sad')
  assert.equal(emotionOf('Good night'), 'calm')
  assert.equal(emotionOf('We won!'), 'excited')
  assert.equal(emotionOf('The table is brown'), 'neutral')
  assert.equal(emotionOf('मुझे मदद चाहिए'), 'urgent')
  assert.equal(emotionOf('बहुत धन्यवाद'), 'happy')
})

test('every emotion has voice settings and a style', () => {
  for (const e of Object.values(EMOTIONS)) {
    assert.ok(e.rate > 0.5 && e.rate < 2 && e.pitch > 0.5 && e.pitch < 2 && e.volume > 0 && e.volume <= 1 && e.style)
  }
})

test('search finds phrases by start and by inside text, once each', () => {
  const pools = [
    { source: 'fav', tone: 'sun', items: ['I want water', 'Water please'] },
    { source: 'sym', tone: 'mint', items: [{ text: 'Water', say: 'I want some water' }, 'I want water'] },
  ]
  const hits = search('water', pools)
  assert.equal(hits[0].text, 'Water please')
  assert.equal(new Set(hits.map(h => h.say.toLowerCase())).size, hits.length)
  assert.deepEqual(search('', pools), [])
  assert.deepEqual(search(['zzz'], pools), [])
})

test('insights count messages per day and rank phrases', () => {
  const now = new Date(2026, 10, 22, 15).getTime()
  const day = 86400000
  const log = [
    { t: 'Good morning', at: now - 1000, src: 'typed', emo: 'happy' },
    { t: 'Good morning', at: now - day, src: 'favorite', emo: 'happy' },
    { t: 'I need help now', at: now - 10 * day, src: 'quick', emo: 'urgent' },
  ]
  const s = summarize(log, now)
  assert.equal(s.total, 3)
  assert.equal(s.today, 1)
  assert.equal(s.byDay.reduce((a, d) => a + d.count, 0), 2)
  assert.deepEqual(s.top[0], ['Good morning', 2])
  assert.equal(s.avgWords, 2.7)
})

test('context starters follow the time of day and the most used phrases', () => {
  assert.equal(partOfDay(8), 'morning')
  assert.equal(partOfDay(23), 'night')
  assert.equal(contextPhrases(new Date(2026, 0, 1, 8), 'en')[0], 'Good morning')
  const hist = [{ t: 'A', l: 'en' }, { t: 'A', l: 'en' }, { t: 'B', l: 'en' }, { t: 'C', l: 'hi' }, { t: 'C', l: 'hi' }]
  assert.deepEqual(frequent(hist, 'en'), ['A'])
})

test('importing a library merges it and ignores junk', () => {
  const current = { favs: ['a'], names: [], sits: { extra: { home: ['x'] }, custom: [{ id: 'c1', name: 'Temple', tone: 'sun', phrases: ['p'] }] } }
  const merged = mergeLibrary(current, {
    favs: ['a', 'b', 42, 'x'.repeat(200)],
    sits: { extra: { home: ['x', 'y'], '../bad': ['z'] }, custom: [{ id: 'c1', name: 'Temple', phrases: ['q'] }, { id: 'c2', name: 'Gym', tone: 'nope', phrases: [] }, { name: 'no id' }] },
  })
  assert.deepEqual(merged.favs, ['a', 'b'])
  assert.deepEqual(merged.sits.extra, { home: ['x', 'y'] })
  assert.deepEqual(merged.sits.custom.map(c => [c.id, c.tone]), [['c1', 'sun'], ['c2', 'lilac']])
  assert.deepEqual(merged.sits.custom[0].phrases, ['p', 'q'])
})

test('the library has quick phrases first and many more situations', () => {
  assert.equal(SITUATIONS[0].id, 'quick')
  assert.ok(SITUATIONS.length >= 12)
})
