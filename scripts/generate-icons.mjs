// Generates simple, original ListenShelf PNG icons with Node's built-in zlib.
// No image library, build-time network request, or external files required.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const table = Array.from({ length: 256 }, (_, value) => {
  let n = value
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1
  return n >>> 0
})
const crc32 = (buffer) => {
  let value = 0xffffffff
  for (const byte of buffer) value = table[(value ^ byte) & 255] ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const header = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const check = Buffer.alloc(4)
  check.writeUInt32BE(crc32(Buffer.concat([header, data])))
  return Buffer.concat([length, header, data, check])
}
const insidePolygon = (x, y, points) => {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i]
    const [xj, yj] = points[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
function roundedRectangle(x, y, left, top, right, bottom, radius) {
  const cx = Math.max(left + radius, Math.min(x, right - radius))
  const cy = Math.max(top + radius, Math.min(y, bottom - radius))
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2
}
function pixel(x, y) {
  const distance = Math.hypot(x - .49, y - .48)
  let color = [15, 42, 48, 255]
  if (distance < .47) {
    const glow = (1 - distance / .47) * .4
    color = [Math.round(16 + glow * 16), Math.round(46 + glow * 48), Math.round(50 + glow * 36), 255]
  }
  // Single mint headband and two ear pads surround a white open-book motif.
  const ring = Math.abs(Math.hypot(x - .5, y - .495) - .265) < .029 && y < .50
  if (ring ||
      roundedRectangle(x, y, .205, .455, .314, .757, .035) ||
      roundedRectangle(x, y, .686, .455, .795, .757, .035)) color = [174, 235, 213, 255]
  if (insidePolygon(x, y, [[.35,.525],[.48,.585],[.48,.795],[.35,.731]]) ||
      insidePolygon(x, y, [[.52,.585],[.65,.525],[.65,.731],[.52,.795]])) color = [244, 251, 244, 255]
  if (x > .491 && x < .509 && y > .575 && y < .805) color = [94, 155, 148, 255]
  return color
}
function makePng(size) {
  const stride = 1 + size * 4
  const raw = Buffer.alloc(size * stride)
  for (let y = 0; y < size; y++) {
    const row = y * stride
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const color = pixel((x + .5) / size, (y + .5) / size)
      const offset = row + 1 + x * 4
      raw[offset] = color[0]
      raw[offset + 1] = color[1]
      raw[offset + 2] = color[2]
      raw[offset + 3] = color[3]
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // RGBA
  header[9] = 6
  const bytes = Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return bytes
}
mkdirSync('public', { recursive: true })
for (const size of [192, 512]) writeFileSync(join('public', `icon-${size}.png`), makePng(size))
writeFileSync(join('public', 'apple-touch-icon.png'), makePng(180))
console.log('Generated ListenShelf home-screen icons: 180, 192, 512')
