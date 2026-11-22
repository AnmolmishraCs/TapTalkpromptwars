import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import aiHandler from './api/ai.js'
import speakHandler from './api/speak.js'

const root = fileURLToPath(new URL('./public', import.meta.url))
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
}
const secure = {
  'Content-Security-Policy': "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

const notFound = res => {
  res.writeHead(404, secure)
  res.end('Not found')
}

createServer(async (req, res) => {
  let path = ''
  try {
    path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  } catch {}
  if (path === '/api/ai') return aiHandler(req, res)
  if (path === '/api/speak') return speakHandler(req, res)
  const file = normalize(join(root, path === '/' ? 'index.html' : path))
  const type = types[extname(file)]
  if (req.method !== 'GET' || !type || !file.startsWith(root + sep)) return notFound(res)
  try {
    const body = await readFile(file)
    res.writeHead(200, { ...secure, 'Content-Type': type, 'Cache-Control': 'no-cache' })
    res.end(body)
  } catch {
    notFound(res)
  }
}).listen(process.env.PORT || 8080)
