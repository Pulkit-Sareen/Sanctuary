export type VoiceDraftPayload = {
  updatedAt: number
  segmentDurationsSec: number[]
  /** One blob per completed segment (same order as durations). */
  blobs: Blob[]
}

const DB_NAME = 'sanctuary-app'
const STORE = 'drafts'
const KEY = 'voice-recording-latest'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

export async function saveVoiceDraft(payload: VoiceDraftPayload): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(payload, KEY)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error ?? new Error('Draft save failed'))
    }
  })
}

export async function loadVoiceDraft(): Promise<VoiceDraftPayload | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(KEY)
    req.onsuccess = () => {
      db.close()
      resolve((req.result as VoiceDraftPayload | undefined) ?? null)
    }
    req.onerror = () => {
      db.close()
      reject(req.error ?? new Error('Draft load failed'))
    }
  })
}

