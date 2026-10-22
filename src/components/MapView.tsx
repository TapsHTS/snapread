import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { GeoPoint } from '../types'

type Props = { points: GeoPoint[]; onClose: () => void; onDay: (day: string, type: 'PHOTO' | 'VIDEO') => void }

export default function MapView({ points, onClose, onDay }: Props) {
  const el = useRef<HTMLDivElement>(null), cb = useRef(onDay)
  cb.current = onDay
  useEffect(() => {
    let dead = false, map: L.Map | undefined
    ;(async () => {
      ;(window as any).L = L // le plugin de regroupement attend le global L
      await import('leaflet.markercluster')
      if (dead || !el.current) return
      map = L.map(el.current, { preferCanvas: true }).setView([46.6, 2.4], 5)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map)
      const group = (L as any).markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 60, showCoverageOnHover: false })
      for (const p of points) {
        const mk = L.circleMarker([p.lat, p.lng], { radius: 8, weight: 2, color: '#0f0f11', fillColor: p.mediaType === 'VIDEO' ? '#ff2a4d' : '#0099ff', fillOpacity: 0.95 })
        mk.on('click', () => {
          const box = document.createElement('div'), b = document.createElement('button')
          const d = new Date(p.date.replace(/^(\S+)\s+(\S+)\s*UTC$/i, '$1T$2Z'))
          box.innerHTML = `<strong>${format(d, 'd MMMM yyyy · HH:mm', { locale: fr })}</strong><br>${p.mediaType === 'VIDEO' ? 'Vidéo' : 'Photo'}<br>`
          b.textContent = 'Voir ce jour dans la bibliothèque'; b.style.cssText = 'margin-top:8px;padding:6px 10px;border:0;border-radius:99px;background:#fffc00;font-weight:700'
          b.onclick = () => cb.current(p.day, p.mediaType)
          box.append(b)
          L.popup().setLatLng(mk.getLatLng()).setContent(box).openOn(map!)
        })
        group.addLayer(mk)
      }
      map.addLayer(group)
      if (points.length) map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 14 })
    })()
    return () => { dead = true; map?.remove() }
  }, [points])
  return <div className="map-overlay"><div ref={el} className="map-view" />
    <button className="close-btn" style={{ position: 'absolute', top: 14, right: 14, zIndex: 1000 }} onClick={onClose} aria-label="Fermer la carte"><X size={21} /></button></div>
}
