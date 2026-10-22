import { kvGet, kvSet } from './idb'
import type { SnapMemory } from '../types'

const W = 360
let active = 0
const waiting: (() => void)[] = []
const slot = () => new Promise<void>(r => { const go = () => { active++; r() }; active < 4 ? go() : waiting.push(go) })
const release = () => { active--; waiting.shift()?.() }
const urls = new Map<string, string>()

async function render(m: SnapMemory): Promise<Blob> {
  const file = await m.file.getFile()
  const c = document.createElement('canvas'), g = c.getContext('2d')!
  if (m.mediaType === 'VIDEO') {
    const url = URL.createObjectURL(file), v = document.createElement('video')
    v.muted = true; v.preload = 'auto'; v.src = url
    await new Promise<void>((ok, ko) => { v.onloadeddata = () => ok(); v.onerror = () => ko(new Error('video')) })
    v.currentTime = Math.min(0.5, (v.duration || 1) / 2)
    await new Promise<void>(ok => { v.onseeked = () => ok(); setTimeout(ok, 3000) })
    c.width = W; c.height = Math.round(W * v.videoHeight / v.videoWidth)
    g.drawImage(v, 0, 0, c.width, c.height)
    URL.revokeObjectURL(url)
  } else {
    const b = await createImageBitmap(file, { resizeWidth: W, resizeQuality: 'medium' })
    c.width = b.width; c.height = b.height; g.drawImage(b, 0, 0); b.close()
  }
  if (m.overlay) try { const o = await createImageBitmap(await m.overlay.getFile()); g.drawImage(o, 0, 0, c.width, c.height); o.close() } catch { /* overlay facultatif */ }
  return new Promise((ok, ko) => c.toBlob(b => (b ? ok(b) : ko(new Error('blob'))), 'image/webp', 0.8))
}

/** Miniature en cache (IndexedDB) ; générée par lots de 4 seulement si la carte est encore visible. */
export async function getThumb(m: SnapMemory, live: () => boolean): Promise<string> {
  const hit = urls.get(m.id)
  if (hit) return hit
  let blob = await kvGet<Blob>('t:' + m.id)
  if (!blob) {
    await slot()
    try {
      if (!live()) throw new Error('cancelled')
      blob = await render(m)
      kvSet('t:' + m.id, blob).catch(() => {})
    } finally { release() }
  }
  const u = URL.createObjectURL(blob)
  urls.set(m.id, u)
  return u
}
