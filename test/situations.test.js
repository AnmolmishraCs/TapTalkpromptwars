import test from 'node:test'
import assert from 'node:assert/strict'
import { SITUATIONS } from '../public/phrases.js'

test('every situation has a name and phrases in both languages', () => {
  const ids = new Set()
  for (const s of SITUATIONS) {
    assert.ok(s.id && s.en && s.hi, s.id)
    assert.ok(!ids.has(s.id), `duplicate ${s.id}`)
    ids.add(s.id)
    assert.ok(s.p.en.length >= 6 && s.p.hi.length >= 6, s.id)
    assert.ok(s.p.hi.every(t => /[\u0900-\u097F]/.test(t)), `${s.id} Hindi phrases use Devanagari`)
  }
})

test('there is a situation for home, work and getting help', () => {
  const ids = SITUATIONS.map(s => s.id)
  for (const id of ['home', 'work', 'help']) assert.ok(ids.includes(id), id)
})
