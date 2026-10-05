// Photo album stored in IndexedDB (kept out of the localStorage save to keep it small).
// Everything fails soft: without IndexedDB (e.g. some private modes) the album is just empty.

export type PhotoKind = 'hatched' | 'evolved' | 'birthday' | 'photo';

export interface Photo {
  id: string;
  petId: string;
  petName: string;
  t: number;
  kind: PhotoKind;
  /** Extra caption data: stage for "evolved", age in days for "birthday". */
  detail?: string;
  /** Framed JPEG thumbnail as a data URL. */
  image: string;
}

const DB = 'pocketpals-album';
const STORE = 'photos';

function open(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('petId', 'petId');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function addPhoto(photo: Photo): Promise<boolean> {
  const db = await open();
  if (!db) return false;
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(photo);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => resolve(false);
  });
}

export async function listPhotos(petId?: string): Promise<Photo[]> {
  const db = await open();
  if (!db) return [];
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = petId ? store.index('petId').getAll(petId) : store.getAll();
    req.onsuccess = () => resolve((req.result as Photo[]).sort((a, b) => b.t - a.t));
    req.onerror = () => resolve([]);
  });
}

export async function clearPhotos(): Promise<void> {
  const db = await open();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
