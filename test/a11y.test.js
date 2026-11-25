import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../public/style.css', import.meta.url), 'utf8')
const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')
const full = hex => (hex.length === 4 ? `#${[...hex.slice(1)].map(c => c + c).join('')}` : hex)
const vars = Object.fromEntries([...css.matchAll(/--([\w-]+):(#[0-9a-f]{3,6})\b/gi)].map(m => [m[1], full(m[2])]))

const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

test('text colors meet WCAG AA contrast (4.5:1) on every background they are used on', () => {
  for (const tone of ['peach', 'mint', 'lilac', 'blue', 'sun', 'pink']) assert.ok(ratio(vars.ink, vars[tone]) >= 7, `ink on ${tone}`)
  assert.ok(ratio(vars.ink, '#ffffff') >= 7)
  assert.ok(ratio('#ffffff', vars.ink) >= 7)
  assert.ok(ratio(vars.muted, '#ffffff') >= 4.5, 'muted on white')
  assert.ok(ratio(vars.muted, vars.bg) >= 4.5, 'muted on page background')
  assert.ok(ratio(vars.hitink, vars.hit) >= 4.5, 'speaking text')
})

test('text-field borders meet WCAG 1.4.11 non-text contrast (3:1)', () => {
  assert.ok(ratio(vars.field, '#ffffff') >= 3)
  assert.ok(ratio(vars.field, vars.bg) >= 3)
})

test('the page has a language, title, main landmark, skip link and allows zoom', () => {
  assert.match(html, /<html lang="en"/)
  assert.match(html, /<title>[^<]+<\/title>/)
  assert.match(html, /<main /)
  assert.match(html, /class="skip" href="#main"/)
  assert.ok(!/user-scalable=no|maximum-scale/.test(html))
})

test('decorative icons are hidden from screen readers', () => {
  for (const tag of html.match(/<svg[^>]*>/g)) assert.ok(tag.includes('aria-hidden="true"'), tag)
})

test('keyboard focus has a visible style and reduced motion is respected', () => {
  assert.match(css, /:focus-visible\{outline:3px solid/)
  assert.match(css, /prefers-reduced-motion:reduce/)
})
