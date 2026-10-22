import type { ReactNode } from 'react'
import { Image as ImageIcon, Video, MapPin, Search } from 'lucide-react'
type Props = { type: string; setType: (v: string) => void; map: boolean; setMap: (v: boolean) => void; canMap: boolean; search: boolean; setSearch: (v: boolean) => void }
export default function BottomNav({ type, setType, map, setMap, canMap, search, setSearch }: Props) {
  const go = (t: string) => { setType(t); setMap(false) }
  const tab = (on: boolean, label: string, icon: ReactNode, click: () => void, disabled = false) =>
    <button className={`tab ${on ? 'active' : ''}`} disabled={disabled} onClick={click} aria-label={label}>{icon}<span>{label}</span></button>
  return <nav className="bottom-nav" aria-label="Navigation principale">
    {tab(!map && type === 'all', 'Tout', <img src="./icons/icon-192.png" alt="" />, () => go('all'))}
    {tab(!map && type === 'PHOTO', 'Photos', <ImageIcon size={22} />, () => go('PHOTO'))}
    {tab(!map && type === 'VIDEO', 'Vidéos', <Video size={22} />, () => go('VIDEO'))}
    {tab(map, 'Carte', <MapPin size={22} />, () => setMap(!map), !canMap)}
    {tab(search, 'Recherche', <Search size={22} />, () => { setSearch(!search); if (!search) setMap(false) })}
  </nav>
}
