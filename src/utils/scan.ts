import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { FileRef, GeoPoint, SnapMemory } from '../types'

// Noms Snapchat : 2022-05-19_<UUID>-main.jpg|mp4 et 2022-05-19_<UUID>-overlay.png
const RE = /^(\d{4}-\d{2}-\d{2})_([0-9A-Fa-f-]{36})-(main|overlay)\.(\w+)$/
export interface Entry { name: string; ref: FileRef; path: string }

/** Parcourt récursivement un dossier (File System Access API) sans lire les fichiers : seulement les noms. */
export async function walk(dir: any, path: string, out: Entry[], onCount?: (n: number) => void): Promise<void> {
  for await (const [name, h] of dir.entries()) {
    if (h.kind === 'directory') await walk(h, `${path}/${name}`, out, onCount)
    else if (RE.test(name) || name === 'memories_history.json') { out.push({ name, ref: { getFile: () => h.getFile() }, path }); if (out.length % 500 === 0) onCount?.(out.length) }
  }
}

/** Repli Firefox/Safari : <input webkitdirectory>. */
export const fromFileList = (files: File[]): Entry[] =>
  files.filter(f => RE.test(f.name) || f.name === 'memories_history.json').map(f => ({ name: f.name, ref: { getFile: async () => f }, path: (f.webkitRelativePath || '').split('/').slice(0, -1).join('/') }))

const archiveOf = (path: string) => {
  const p = path.split('/').filter(Boolean), i = p.lastIndexOf('memories')
  return (i > 0 ? p[i - 1] : p[p.length - 1]) || '—'
}

/** Associe main + overlay par UUID ; les doublons entre archives sont fusionnés. */
export function buildMemories(entries: Entry[]): SnapMemory[] {
  const by = new Map<string, Partial<SnapMemory>>()
  for (const e of entries) {
    const x = RE.exec(e.name); if (!x) continue
    const [, d, uuid, kind, ext] = x
    const id = uuid.toLowerCase(), c = by.get(id) ?? {}
    if (kind === 'main' && !c.file) Object.assign(c, { file: e.ref, name: e.name, rawDate: d, source: archiveOf(e.path), mediaType: /^(mp4|mov|m4v|webm)$/i.test(ext) ? 'VIDEO' : 'PHOTO' })
    if (kind === 'overlay' && !c.overlay) c.overlay = e.ref
    by.set(id, c)
  }
  const out: SnapMemory[] = []
  for (const [id, c] of by) {
    if (!c.file) continue
    const date = new Date(`${c.rawDate}T12:00:00`)
    out.push({
      id, date, rawDate: c.rawDate!, mediaType: c.mediaType!, file: c.file, overlay: c.overlay, name: c.name!, source: c.source!,
      text: `${c.rawDate} ${format(date, 'd MMMM yyyy EEEE', { locale: fr })} ${c.mediaType === 'VIDEO' ? 'vidéo video' : 'photo'} ${c.source}`.toLowerCase(),
    })
  }
  return out
}

/** memories_history.json : date + heure UTC et GPS de chaque souvenir (aucun identifiant de fichier). */
export async function readGeo(f: File): Promise<{ points: GeoPoint[]; total: number }> {
  const list = JSON.parse(await f.text())?.['Saved Media']
  if (!Array.isArray(list)) return { points: [], total: 0 }
  const points: GeoPoint[] = []
  list.forEach((e: any, i: number) => {
    const m = String(e?.Location ?? '').match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
    if (!m) return
    const lat = parseFloat(m[1]), lng = parseFloat(m[2])
    if (!lat && !lng) return // 0,0 = pas de position
    const date = String(e.Date ?? '')
    points.push({ id: String(i), lat, lng, date, day: date.slice(0, 10), mediaType: /^vid/i.test(String(e['Media Type'])) ? 'VIDEO' : 'PHOTO' })
  })
  return { points, total: list.length }
}
