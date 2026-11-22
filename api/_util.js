const hits = new Map()

export const send = (res, code, body) => {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(JSON.stringify(body))
}

export const limited = ip => {
  const now = Date.now()
  if (hits.size > 1000) hits.clear()
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 40
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') return JSON.parse(req.body)
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 8192) throw new Error('too large')
  }
  return JSON.parse(raw)
}

