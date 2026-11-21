import test from 'node:test'
import assert from 'node:assert/strict'
import { toDevanagari } from '../public/translit.js'
import { HI } from '../public/phrases.js'

const tok = s => s.toLowerCase().match(/[\p{L}\p{M}']+/gu) || []

test('every Hindi phrase pair is word-for-word aligned', () => {
  for (const [deva, roman] of HI) assert.equal(tok(deva).length, tok(roman).length, roman)
})

test('known Roman Hindi becomes Devanagari', () => {
  assert.equal(toDevanagari('mujhe ghar jaana hai'), 'मुझे घर जाना है')
})

test('unknown names are transliterated by rules', () => {
  assert.equal(toDevanagari('Riya'), 'रिया')
})

test('Devanagari and punctuation pass through', () => {
  assert.equal(toDevanagari('मुझे घर जाना है?'), 'मुझे घर जाना है?')
})
