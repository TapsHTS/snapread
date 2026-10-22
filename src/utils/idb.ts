let db: Promise<IDBDatabase> | null = null
const open = () => (db ??= new Promise((res, rej) => {
  const r = indexedDB.open('memories-reader', 1)
  r.onupgradeneeded = () => r.result.createObjectStore('kv')
  r.onsuccess = () => res(r.result)
  r.onerror = () => rej(r.error)
}))
export const kvGet = async <T = any>(k: string): Promise<T | undefined> => {
  const d = await open()
  return new Promise((res, rej) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error) })
}
export const kvSet = async (k: string, v: unknown): Promise<void> => {
  const d = await open()
  return new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error) })
}
