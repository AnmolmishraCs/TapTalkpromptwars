import test from 'node:test'
import assert from 'node:assert/strict'
import handler, { parseCompletions } from '../api/ai.js'

const call = async (method, body) => {
  const res = {
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v
    },
    end(data) {
      this.body = data ? JSON.parse(data) : null
    },
  }
  await handler({ method, body, headers: {}, socket: { remoteAddress: '1.2.3.4' } }, res)
  return res
}

const withKey = async fn => {
  process.env.GEMINI_API_KEY = 'test-key'
  const realFetch = globalThis.fetch
  try {
    await fn()
  } finally {
    delete process.env.GEMINI_API_KEY
    globalThis.fetch = realFetch
  }
}

test('parseCompletions cleans, dedupes and caps the model output', () => {
  const out = parseCompletions('["ome","ome"," now\\nplease","x".repeat(5)]'.replace('"x".repeat(5)', '"ospital"'), 'go h')
  assert.deepEqual(out, ['ome', ' now please', 'ospital'])
})

test('parseCompletions strips repeated text and survives junk', () => {
  assert.deepEqual(parseCompletions('["go home now"]', 'go '), ['home now'])
  assert.deepEqual(parseCompletions('not json at all'), [])
  assert.deepEqual(parseCompletions('{"a":1}'), [])
})

test('GET reports whether AI is set up', async () => {
  assert.equal((await call('GET')).body.available, false)
  await withKey(async () => assert.equal((await call('GET')).body.available, true))
})

test('POST without a key is unavailable', async () => {
  assert.equal((await call('POST', { text: 'hi', lang: 'en' })).statusCode, 503)
})

test('POST rejects bad input', async () => {
  await withKey(async () => {
    assert.equal((await call('POST', { text: '', lang: 'en' })).statusCode, 400)
    assert.equal((await call('POST', { text: 'hi', lang: 'fr' })).statusCode, 400)
    assert.equal((await call('POST', { text: 'x'.repeat(301), lang: 'en' })).statusCode, 400)
    assert.equal((await call('POST', { text: 'hi', lang: 'en', recent: Array(6).fill('a') })).statusCode, 400)
  })
})

test('POST returns suggestions and keeps the key on the server', async () => {
  await withKey(async () => {
    let seen
    globalThis.fetch = async (url, init) => {
      seen = { url, init }
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '["ome"," home now"]' }] } }] }) }
    }
    const res = await call('POST', { text: 'I want to go h', lang: 'en', recent: ['Good morning'] })
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.body.suggestions, ['ome', ' home now'])
    assert.equal(seen.init.headers['x-goog-api-key'], 'test-key')
    assert.ok(!JSON.stringify(res.body).includes('test-key'))
  })
})

test('upstream failure becomes a clean 502', async () => {
  await withKey(async () => {
    globalThis.fetch = async () => ({ ok: false, status: 500, text: async () => 'boom' })
    const res = await call('POST', { text: 'hi', lang: 'en' })
    assert.equal(res.statusCode, 502)
    assert.ok(!JSON.stringify(res.body).includes('boom'))
  })
})
