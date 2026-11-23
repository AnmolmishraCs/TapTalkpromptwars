import { send, limited, readJson } from './_util.js'
import { EMOTIONS } from '../public/emotion.js'

const MODEL = () => process.env.GEMINI_TTS_MODEL || 'gemini-3.1-flash-tts-preview'
const VOICE = () => process.env.GEMINI_VOICE || 'Kore'

export default async function handler(req, res) {
  const key = process.env.GEMINI_API_KEY
  if (req.method === 'GET') return send(res, 200, { available: Boolean(key) })
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })
  if (!key) return send(res, 503, { error: 'Natural voice is not set up' })

  let body
  try {
    body = await readJson(req)
  } catch {
    return send(res, 400, { error: 'Bad request' })
  }
  const { text, lang, emotion } = body ?? {}
  if (typeof text !== 'string' || !text.trim() || text.length > 300 || !['en', 'hi'].includes(lang)) {
    return send(res, 400, { error: 'Bad request' })
  }

  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0]
  if (limited(`speak:${ip}`)) return send(res, 429, { error: 'Too many requests' })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL()}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${(EMOTIONS[emotion] ?? EMOTIONS.neutral).style}, reading exactly as written: ${text}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE() } } },
        },
      }),
    })
    if (!upstream.ok) {
      console.error('Gemini TTS error', upstream.status, (await upstream.text()).slice(0, 300))
      return send(res, 502, { error: 'Voice service error' })
    }
    const data = await upstream.json()
    const pcm = (data.candidates?.[0]?.content?.parts ?? []).find(p => p.inlineData?.data)?.inlineData.data
    if (!pcm) return send(res, 502, { error: 'Voice service error' })
    return send(res, 200, { pcm, rate: 24000 })
  } catch (err) {
    console.error('Gemini TTS request failed', err?.name)
    return send(res, 502, { error: 'Voice service error' })
  } finally {
    clearTimeout(timer)
  }
}
