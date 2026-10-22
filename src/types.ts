export type MediaType = 'PHOTO' | 'VIDEO' | 'UNKNOWN'
export interface FileRef { getFile(): Promise<File> }
export interface SnapMemory {
  id: string
  date: Date
  rawDate: string
  mediaType: MediaType
  file: FileRef
  overlay?: FileRef
  name: string
  source: string
  text: string
}
export interface GeoPoint { id: string; lat: number; lng: number; date: string; day: string; mediaType: 'PHOTO' | 'VIDEO' }
