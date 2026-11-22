import test from 'node:test'
import assert from 'node:assert/strict'
import { createEngine, simulate, bench, TASKS } from '../public/predict.js'

test('A completes a partial word', () => {
  const sugs = createEngine('A').suggest('hun')
  assert.ok(sugs.some(s => s.insert === 'gry '))
})

test('A never shows phrase predictions', () => {
  assert.ok(createEngine('A').suggest('I want to go h').every(s => s.kind === 'word'))
})

test('B completes a phrase', () => {
  const sugs = createEngine('B').suggest('Please turn o')
  assert.ok(sugs.some(s => s.kind === 'phrase' && s.insert === 'n the light'))
})

test('B completes from the middle of a sentence', () => {
  const sugs = createEngine('B').suggest('So I want to go h')
  assert.ok(sugs.some(s => s.insert === 'ome'))
})

test('C ranks the user history first', () => {
  const engine = createEngine('C', ['I want to go home after dinner'])
  assert.ok(engine.suggest('I want to go home a').some(s => s.insert === 'fter dinner'))
})

test('D goes quiet after repeated ignored suggestions', () => {
  const engine = createEngine('D')
  for (let i = 0; i < 15; i++) engine.feedback(false)
  assert.deepEqual(engine.suggest('hun'), [])
})

test('D trusts suggestions again after accepts', () => {
  const engine = createEngine('D')
  for (let i = 0; i < 15; i++) engine.feedback(false)
  engine.feedback(true)
  engine.feedback(true)
  assert.ok(engine.trust >= 0.4)
})

test('prediction saves actions when it fits', () => {
  const sentence = 'I want to go home'
  const r = simulate(createEngine('B'), { final: sentence })
  assert.ok(r.keys + r.taps < sentence.length)
})

test('ignoring every suggestion costs one key per letter', () => {
  const sentence = 'Zebras mumble quietly.'
  const r = simulate(createEngine('B'), { final: sentence, accept: false })
  assert.equal(r.keys, sentence.length)
  assert.equal(r.taps, 0)
})

test('changing your mind counts the corrections', () => {
  const r = simulate(createEngine('B'), { final: 'I want to go outside', detour: 'I want to eat' })
  assert.equal(r.corrections, 3)
})

test('benchmark covers every version and task', () => {
  const res = bench()
  assert.deepEqual(Object.keys(res), ['A', 'B', 'C', 'D'])
  assert.ok(Object.values(res).every(rows => rows.length === TASKS.en.length))
})

test('Hindi completes a word', () => {
  assert.ok(createEngine('A', [], 'hi').suggest('भू').some(s => s.insert === 'ख '))
})

test('Hindi completes a phrase', () => {
  assert.ok(createEngine('B', [], 'hi').suggest('मुझे घर').some(s => s.insert === ' जाना है'))
})

test('Hindi benchmark covers every version and task', () => {
  const res = bench('hi')
  assert.ok(Object.values(res).every(rows => rows.length === TASKS.hi.length))
})

test('personal names are suggested with their own spelling', () => {
  const sugs = createEngine('B', [], 'en', ['Riya']).suggest('call Ri')
  assert.ok(sugs.some(s => s.insert === 'ya '))
})

test('Roman Hindi gets its own suggestions', () => {
  const sugs = createEngine('B', [], 'hr').suggest('mujhe gh')
  assert.ok(sugs.some(s => s.insert === 'ar jaana hai'))
})

test('typing a word gives two or three word completions', () => {
  const sugs = createEngine('C').suggest('ho').filter(s => s.kind === 'word')
  assert.ok(sugs.length >= 2 && sugs.length <= 3)
  assert.ok(sugs.every(s => s.label.startsWith('ho')))
})

test('words outside the phrase list are still completed', () => {
  assert.ok(createEngine('C').suggest('pla').filter(s => s.kind === 'word').length >= 2)
  assert.ok(createEngine('C', [], 'hr').suggest('dos').some(s => s.label === 'dost'))
})
