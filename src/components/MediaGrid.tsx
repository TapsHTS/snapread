import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { CalendarDays, Play, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getThumb } from '../utils/thumbs'
import type { SnapMemory } from '../types'

export type Group = { label: string; items: SnapMemory[] }
type Row = { head: true; label: string; n: number } | { head: false; items: SnapMemory[] }
const GAP = 13, HEAD = 60

function Card({ m, onOpen }: { m: SnapMemory; onOpen: (m: SnapMemory) => void }) {
  const [src, setSrc] = useState<string>(), [bad, setBad] = useState(false)
  useEffect(() => {
    let live = true
    getThumb(m, () => live).then(u => live && setSrc(u)).catch(() => live && setBad(true))
    return () => { live = false }
  }, [m])
  const video = m.mediaType === 'VIDEO'
  return <article className="memory-card" onClick={() => onOpen(m)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && onOpen(m)}>
    <div className="thumb">
      {src ? <img src={src} alt="" /> : <div className="thumb-placeholder"><div className="placeholder-orb">{bad ? '!' : video ? <Play size={22} /> : <ImageIcon size={22} />}</div></div>}
      <span className={`media-badge ${video ? 'video' : ''}`}>{video ? <Play size={11} fill="currentColor" /> : <ImageIcon size={11} />} {video ? 'VIDEO' : 'PHOTO'}</span>
      <span className="date-overlay">{format(m.date, 'd MMM yyyy', { locale: fr })}</span>
    </div>
  </article>
}

export default function MediaGrid({ groups, onOpen }: { groups: Group[]; onOpen: (m: SnapMemory) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(1200), [top, setTop] = useState(0)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(box.current!)
    return () => ro.disconnect()
  }, [])
  useLayoutEffect(() => { const t = box.current!.getBoundingClientRect().top + window.scrollY; if (Math.abs(t - top) > 1) setTop(t) })

  const cols = Math.max(2, Math.floor((w + GAP) / (190 + GAP)))
  const rowH = Math.round(((w - GAP * (cols - 1)) / cols) * 1.15) + 2 + GAP
  const rows = useMemo(() => {
    const r: Row[] = []
    for (const g of groups) {
      r.push({ head: true, label: g.label, n: g.items.length })
      for (let i = 0; i < g.items.length; i += cols) r.push({ head: false, items: g.items.slice(i, i + cols) })
    }
    return r
  }, [groups, cols])

  const v = useWindowVirtualizer({ count: rows.length, estimateSize: i => (rows[i].head ? HEAD : rowH), overscan: 5, scrollMargin: top })
  useEffect(() => { v.measure() }, [rows, rowH])

  return <div ref={box} className="timeline" style={{ display: 'block', position: 'relative', height: v.getTotalSize() }}>
    {v.getVirtualItems().map(vi => {
      const r = rows[vi.index]
      return <div key={vi.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: vi.size, transform: `translateY(${vi.start - top}px)` }}>
        {r.head
          ? <div className="section-heading"><div><CalendarDays size={17} /><h2>{r.label}</h2></div><span>{r.n.toLocaleString('fr-FR')} souvenir{r.n > 1 ? 's' : ''}</span></div>
          : <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: GAP }}>{r.items.map(m => <Card key={m.id} m={m} onOpen={onOpen} />)}</div>}
      </div>
    })}
  </div>
}
