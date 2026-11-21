import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('./public', import.meta.url))
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }
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
  const file = normalize(join(root, path === '/' ? 'index.html' : path))
  const type = types[extname(file)]
  if (req.method !== 'GET' || !type || !file.startsWith(root + sep)) return notFound(res)
  try {
    const body = await readFile(file)
    res.writeHead(200, { ...secure, 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-cache' })
    res.end(body)
  } catch {
    notFound(res)
  }
}).listen(process.env.PORT || 8080)
