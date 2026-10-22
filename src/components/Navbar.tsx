import { Search, Camera, MapPin } from 'lucide-react'
type Props = { query: string; setQuery: (v: string) => void; type: string; setType: (v: string) => void; map: boolean; setMap: (v: boolean) => void; canMap: boolean; searchOpen: boolean }
export default function Navbar({ query, setQuery, type, setType, map, setMap, canMap, searchOpen }: Props) {
  return <header className={`navbar ${searchOpen ? 'search-open' : ''}`}>
    <a className="brand" href="#" aria-label="Memories Reader"><span className="brand-icon"><Camera size={20} /></span><span>memories<span className="brand-light"> reader</span></span></a>
    <div className="searchbox"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher par date : 2022-06, juin 2022, samedi…" /><kbd>⌘ K</kbd></div>
    <div className="nav-actions"><div className="type-switch">{['Tous', 'Photos', 'Vidéos'].map((label, i) => <button key={label} className={type === ['all', 'PHOTO', 'VIDEO'][i] ? 'selected' : ''} onClick={() => setType(['all', 'PHOTO', 'VIDEO'][i])}>{label}</button>)}</div>
      <button className={`filter-button ${map ? 'active' : ''}`} disabled={!canMap} title={canMap ? 'Voir les souvenirs sur la carte' : 'Chargez un dossier contenant memories_history.json'} onClick={() => setMap(!map)}><MapPin size={16} /> Carte</button></div>
  </header>
}
