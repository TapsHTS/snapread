import { useRef, useState } from 'react'
import { FolderOpen, HardDrive, CheckCircle2, RefreshCw } from 'lucide-react'
type Props = { onPick: (h?: any) => void; onInput: (files: File[]) => void; onResume: () => void; canResume: boolean; busy: boolean; count: number; archives: number }
export default function UploadZone({ onPick, onInput, onResume, canResume, busy, count, archives }: Props) {
  const input = useRef<HTMLInputElement>(null), [drag, setDrag] = useState(false)
  const direct = 'showDirectoryPicker' in window
  return <section className={`upload-zone ${drag ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
    onDrop={async e => { e.preventDefault(); setDrag(false); const h = await (e.dataTransfer.items[0] as any)?.getAsFileSystemHandle?.(); if (h?.kind === 'directory') onPick(h) }}>
    <input ref={input} hidden type="file" multiple {...({ webkitdirectory: '' } as any)} onChange={e => onInput(Array.from(e.target.files || []))} />
    <div className="upload-icon"><HardDrive size={23} /></div>
    <div className="upload-copy"><strong>Chargez votre dossier Snapchat</strong><span>Branchez le disque puis choisissez le dossier qui contient les archives (ou un dossier « memories »). Rien n’est copié.</span></div>
    <div className="upload-actions">
      <button className="btn-primary" disabled={busy} onClick={() => (direct ? onPick() : input.current?.click())}><FolderOpen size={16} /> Choisir le dossier</button>
      {canResume && <button className="btn-secondary" disabled={busy} onClick={onResume}><RefreshCw size={16} /> Rouvrir le dernier dossier</button>}
    </div>
    {count > 0 && <div className="import-status"><CheckCircle2 size={15} />{count.toLocaleString('fr-FR')} souvenirs <span>·</span> {archives} archive{archives > 1 ? 's' : ''}</div>}
  </section>
}
