import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, CalendarDays, Image as ImageIcon, Video, Clock3, X, SlidersHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Navbar from './components/Navbar'
import UploadZone from './components/UploadZone'
import MediaGrid, { type Group } from './components/MediaGrid'
import MediaModal from './components/MediaModal'
import MapView from './components/MapView'
import { walk, fromFileList, buildMemories, readGeo, type Entry } from './utils/scan'
import { kvGet, kvSet } from './utils/idb'
import type { GeoPoint, SnapMemory } from './types'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const n = (x: number) => x.toLocaleString('fr-FR')

export default function App() {
  const [memories, setMemories] = useState<SnapMemory[]>([]), [query, setQuery] = useState(''), [type, setType] = useState('all'),
    [selected, setSelected] = useState<SnapMemory | null>(null), [from, setFrom] = useState(''), [to, setTo] = useState(''),
    [showFilters, setShowFilters] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [saved, setSaved] = useState<any>(null),
    [points, setPoints] = useState<GeoPoint[]>([]), [showMap, setShowMap] = useState(false)
  useEffect(() => { kvGet('root').then(setSaved).catch(() => {}) }, [])

  const finish = async (entries: Entry[]) => {
    const ms = buildMemories(entries), a = new Set(ms.map(m => m.source)).size
    const j = entries.find(e => e.name === 'memories_history.json')
    let geo = { points: [] as GeoPoint[], total: 0 }
    try { if (j) geo = await readGeo(await j.ref.getFile()) } catch { /* JSON illisible */ }
    setMemories(ms); setSelected(null); setPoints(geo.points); setShowMap(false)
    setNotice(ms.length
      ? `${n(ms.length)} souvenirs trouvés dans ${a} archive${a > 1 ? 's' : ''}` + (geo.total ? ` · JSON : ${n(geo.total)} souvenirs, ${n(geo.points.length)} géolocalisés.` : ' · JSON introuvable : carte indisponible.')
      : 'Aucun fichier « AAAA-MM-JJ_…-main.jpg/mp4 » trouvé dans ce dossier.')
    setTimeout(() => setNotice(''), 8000)
  }
  const scanHandle = async (h: any) => {
    setBusy(true); setNotice('Analyse du dossier…')
    try {
      const out: Entry[] = []
      await walk(h, h.name, out, c => setNotice(`Analyse… ${n(c)} fichiers`))
      await finish(out)
      kvSet('root', h).then(() => setSaved(h)).catch(() => {})
    } catch { setNotice('Impossible de lire ce dossier.') } finally { setBusy(false) }
  }
  const pick = async (h?: any) => { try { await scanHandle(h ?? await (window as any).showDirectoryPicker({ mode: 'read' })) } catch { /* sélection annulée */ } }
  const resume = async () => { if (saved && (await saved.requestPermission({ mode: 'read' })) === 'granted') await scanHandle(saved); else setNotice('Accès au dossier refusé.') }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase(), f = from ? new Date(`${from}T00:00:00`) : null, t = to ? new Date(`${to}T23:59:59`) : null
    return memories.filter(m => (type === 'all' || m.mediaType === type) && (!f || m.date >= f) && (!t || m.date <= t) && (!q || m.text.includes(q)))
      .sort((a, b) => +b.date - +a.date || a.name.localeCompare(b.name))
  }, [memories, type, from, to, query])

  const groups = useMemo(() => {
    const g = new Map<string, SnapMemory[]>()
    for (const m of filtered) { const k = cap(format(m.date, 'MMMM yyyy', { locale: fr })); (g.get(k) ?? g.set(k, []).get(k)!).push(m) }
    const out: Group[] = [...g].map(([label, items]) => ({ label, items }))
    if (!query && !from && !to && type === 'all') {
      const t = new Date(), day = filtered.filter(m => m.date.getDate() === t.getDate() && m.date.getMonth() === t.getMonth() && m.date.getFullYear() < t.getFullYear())
      if (day.length) out.unshift({ label: 'Un jour comme aujourd’hui', items: day })
    }
    return out
  }, [filtered, query, from, to, type])

  const stats = useMemo(() => ({
    photos: memories.filter(m => m.mediaType === 'PHOTO').length, videos: memories.filter(m => m.mediaType === 'VIDEO').length,
    years: new Set(memories.map(m => m.date.getFullYear())).size, archives: new Set(memories.map(m => m.source)).size,
  }), [memories])

  const mapPoints = useMemo(() => points.filter(p => type === 'all' || p.mediaType === type), [points, type])
  const onDay = (day: string, t: 'PHOTO' | 'VIDEO') => { setFrom(day); setTo(day); setType(t); setQuery(''); setShowFilters(true); setShowMap(false); window.scrollTo({ top: 0 }) }

  const onNavigate = useCallback((d: number) => {
    if (!selected) return
    const next = filtered[filtered.findIndex(m => m.id === selected.id) + d]
    if (next) setSelected(next)
  }, [selected, filtered])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.querySelector<HTMLInputElement>('.searchbox input')?.focus() } }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [])

  return <div className="app-shell"><Navbar query={query} setQuery={setQuery} type={type} setType={setType} map={showMap} setMap={setShowMap} canMap={points.length > 0} />
    <main className="main-content">
      <div className="hero"><div><div className="eyebrow"><span className="yellow-dot" /> VOTRE ARCHIVE, EN PRIVÉ</div><h1>Votre photothèque.<br /><span>Directement depuis le disque.</span></h1><p>Parcourez des milliers de souvenirs Snapchat, sans rien téléverser.</p></div>
        <div className="hero-art"><div className="art-card art-back"><CalendarDays size={22} /><span>Un jour comme aujourd’hui</span></div><div className="art-card art-front"><div className="art-yellow"><Archive size={27} /></div><strong>{n(memories.length)}</strong><span>souvenirs indexés</span></div><div className="art-spark">✳</div></div></div>
      <UploadZone onPick={pick} onInput={a => finish(fromFileList(a))} onResume={resume} canResume={!!saved} busy={busy} count={memories.length} archives={stats.archives} />
      {notice && <div className="notice">{notice}</div>}
      <section className="stats-row">
        <div className="stat-card"><div className="stat-icon yellow"><Archive size={18} /></div><div><strong>{n(memories.length)}</strong><span>Total souvenirs</span></div></div>
        <div className="stat-card"><div className="stat-icon red"><ImageIcon size={18} /></div><div><strong>{n(stats.photos)}</strong><span>Photos</span></div></div>
        <div className="stat-card"><div className="stat-icon blue"><Video size={18} /></div><div><strong>{n(stats.videos)}</strong><span>Vidéos</span></div></div>
        <div className="stat-card"><div className="stat-icon purple"><Clock3 size={18} /></div><div><strong>{stats.years}</strong><span>Années couvertes</span></div></div>
      </section>
      <div className="library-header"><div><div className="library-title"><h2>Votre bibliothèque</h2><span className="count-pill">{n(filtered.length)}</span></div><p>{stats.archives ? `${stats.archives} archive${stats.archives > 1 ? 's' : ''} chargée${stats.archives > 1 ? 's' : ''}` : 'Chargez votre dossier Snapchat pour commencer'}</p></div>
        <button className={`filter-button ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={16} /> Filtres {showFilters ? '−' : '+'}</button></div>
      {showFilters && <div className="filter-panel"><label>Du <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>Au <input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>{(from || to) && <button className="clear-filters" onClick={() => { setFrom(''); setTo('') }}><X size={14} /> Effacer les filtres</button>}</div>}
      <div className="results-caption">{n(filtered.length)} résultat{filtered.length !== 1 ? 's' : ''} {query && <>pour <strong>« {query} »</strong></>}</div>
      {filtered.length ? <MediaGrid groups={groups} onOpen={setSelected} />
        : <div className="empty-state"><div className="empty-icon"><ImageIcon size={28} /></div><h3>Aucun souvenir à afficher</h3><p>Chargez votre dossier Snapchat ou modifiez la recherche.</p></div>}
      <footer><span className="footer-mark">●</span> Vos souvenirs restent sur votre disque. <span className="footer-separator">·</span> Memories Reader</footer>
    </main>
    {showMap && <MapView points={mapPoints} onClose={() => setShowMap(false)} onDay={onDay} />}
    <MediaModal items={filtered} memory={selected} onClose={() => setSelected(null)} onNavigate={onNavigate} />
  </div>
}
