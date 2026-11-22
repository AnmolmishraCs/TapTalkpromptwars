import test from 'node:test'
import assert from 'node:assert/strict'
import { reorder } from '../public/order.js'
import { SYMBOLS } from '../public/symbols.js'
import { toRoman } from '../public/translit.js'
import { hindiSuggest, convertTail } from '../public/hindi.js'
import { createEngine } from '../public/predict.js'

test('reorder moves a card and keeps the rest in place', () => {
  assert.deepEqual(reorder(['a', 'b', 'c', 'd'], [2, 0, 1]), ['c', 'a', 'b', 'd'])
  assert.deepEqual(reorder(['a', 'b', 'c'], [0, 1, 2]), ['a', 'b', 'c'])
})

test('symbols have unique ids, drawings and phrases in both languages', () => {
  assert.equal(new Set(SYMBOLS.map(s => s.id)).size, SYMBOLS.length)
  for (const s of SYMBOLS) {
    assert.ok(s.d.length > 10 && s.en && s.say.en, s.id)
    assert.ok(/[\u0900-\u097F]/.test(s.hi) && /[\u0900-\u097F]/.test(s.say.hi), s.id)
  }
})

test('Devanagari goes back to Roman for known words', () => {
  assert.equal(toRoman('मुझे घर'), 'mujhe ghar')
})

test('Roman Hindi typing gets Devanagari suggestions that replace the typed part', () => {
  const engines = { hi: createEngine('C', [], 'hi'), hr: createEngine('C', [], 'hr') }
  const found = hindiSuggest(engines, 'मुझे gh').find(i => i.text === 'घर जाना है')
  assert.ok(found)
  assert.equal(found.replace, 2)
})

test('finished Roman words are converted when a space is typed', () => {
  assert.deepEqual(convertTail('mujhe '), { len: 6, text: 'मुझे ' })
  assert.equal(convertTail('मुझे '), null)
  assert.equal(convertTail('mujhe'), null)
})
