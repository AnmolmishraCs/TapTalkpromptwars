import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/speak.js'

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
  await handler({ method, body, headers: {}, socket: { remoteAddress: '9.9.9.9' } }, res)
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

test('GET reports whether natural voice is set up', async () => {
  assert.equal((await call('GET')).body.available, false)
  await withKey(async () => assert.equal((await call('GET')).body.available, true))
})

test('POST without a key is unavailable, and bad input is rejected', async () => {
  assert.equal((await call('POST', { text: 'hi', lang: 'en' })).statusCode, 503)
  await withKey(async () => {
    assert.equal((await call('POST', { text: '  ', lang: 'en' })).statusCode, 400)
    assert.equal((await call('POST', { text: 'hi', lang: 'fr' })).statusCode, 400)
    assert.equal((await call('POST', { text: 'x'.repeat(301), lang: 'en' })).statusCode, 400)
  })
})

test('POST returns audio and keeps the key on the server', async () => {
  await withKey(async () => {
    let seen
    globalThis.fetch = async (url, init) => {
      seen = { url, init }
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ inlineData: { data: 'AAAA' } }] } }] }) }
    }
    const res = await call('POST', { text: 'Hello there', lang: 'en' })
    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.body, { pcm: 'AAAA', rate: 24000 })
    assert.equal(seen.init.headers['x-goog-api-key'], 'test-key')
    assert.ok(JSON.parse(seen.init.body).generationConfig.responseModalities.includes('AUDIO'))
  })
})

test('a missing or failed audio reply becomes a clean 502', async () => {
  await withKey(async () => {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ candidates: [] }) })
    assert.equal((await call('POST', { text: 'hi', lang: 'en' })).statusCode, 502)
    globalThis.fetch = async () => ({ ok: false, status: 500, text: async () => 'boom' })
    const res = await call('POST', { text: 'hi', lang: 'en' })
    assert.equal(res.statusCode, 502)
    assert.ok(!JSON.stringify(res.body).includes('boom'))
  })
})
