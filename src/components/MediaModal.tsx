import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Calendar, Download, FolderOpen } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { FileRef, SnapMemory } from '../types'

function useUrl(ref?: FileRef) {
  const [u, setU] = useState<string>()
  useEffect(() => {
    setU(undefined)
    if (!ref) return
    let live = true, url = ''
    ref.getFile().then(f => { if (live) { url = URL.createObjectURL(f); setU(url) } }).catch(() => {})
    return () => { live = false; if (url) URL.revokeObjectURL(url) }
  }, [ref])
  return u
}

type Props = { items: SnapMemory[]; memory: SnapMemory | null; onClose: () => void; onNavigate: (d: number) => void }
export default function MediaModal({ items, memory, onClose, onNavigate }: Props) {
  const src = useUrl(memory?.file), over = useUrl(memory?.overlay)
  useEffect(() => {
    if (!memory) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowRight') onNavigate(1); if (e.key === 'ArrowLeft') onNavigate(-1) }
    window.addEventListener('keydown', h); document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [memory, onClose, onNavigate])
  if (!memory) return null
  const index = items.findIndex(m => m.id === memory.id)
  return <div className="modal-backdrop" onClick={onClose} role="presentation"><div className="modal-shell" onClick={e => e.stopPropagation()}>
    <div className="viewer"><button className="close-btn" onClick={onClose}><X size={21} /></button>
      <button className="nav-arrow left" onClick={() => onNavigate(-1)} disabled={index <= 0}><ChevronLeft /></button>
      {src && <div className="viewer-stack">
        {memory.mediaType === 'VIDEO' ? <video key={src} className="viewer-media" src={src} controls autoPlay /> : <img className="viewer-media" src={src} alt="Souvenir" />}
        {over && <img className="viewer-overlay" src={over} alt="" />}
      </div>}
      <button className="nav-arrow right" onClick={() => onNavigate(1)} disabled={index >= items.length - 1}><ChevronRight /></button>
      <div className="viewer-counter">{(index + 1).toLocaleString('fr-FR')} / {items.length.toLocaleString('fr-FR')}</div>
    </div>
    <aside className="metadata-panel"><div className="meta-title"><div><span className="eyebrow">DÉTAILS DU SOUVENIR</span><h2>{memory.mediaType === 'VIDEO' ? 'Vidéo' : 'Photo'} Snapchat</h2></div><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>
      <div className="meta-row"><Calendar size={17} /><div><span>Date</span><strong>{format(memory.date, 'EEEE d MMMM yyyy', { locale: fr })}</strong></div></div>
      <div className="meta-row"><FolderOpen size={17} /><div><span>Archive</span><strong className="break-word">{memory.source}</strong></div></div>
      <div className="meta-row"><Download size={17} /><div><span>Fichier</span><strong className="break-word">{memory.name}</strong></div></div>
      <div className="privacy-note">Les fichiers sont lus depuis votre disque : rien n’est envoyé à un serveur.</div>
    </aside></div></div>
}
