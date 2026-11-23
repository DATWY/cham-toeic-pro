/**
 * Neuro-TOEIC Part 4 Studio Pro — IndexedDB Manager
 * High-performance client-side storage for:
 * 1. Audio Waveform Peaks (instant 0ms visual rendering)
 * 2. Voice Shadowing Audio Recordings (Blob storage)
 * 3. SRS Flashcards & Study Telemetry
 */

const DB_NAME = "NeuroToeicPart4DB";
const DB_VERSION = 2;

let dbPromise = null;

export function getDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains("waveforms")) {
        db.createObjectStore("waveforms", { keyPath: "audioUrl" });
      }
      if (!db.objectStoreNames.contains("shadowing")) {
        db.createObjectStore("shadowing", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("flashcards")) {
        db.createObjectStore("flashcards", { keyPath: "id" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      console.warn("IndexedDB error:", req.error);
      resolve(null);
    };
  });

  return dbPromise;
}

/** Waveform Peaks Cache */
export async function getCachedWaveform(audioUrl) {
  try {
    const db = await getDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction("waveforms", "readonly");
      const store = tx.objectStore("waveforms");
      const req = store.get(audioUrl);
      req.onsuccess = () => resolve(req.result ? req.result.peaks : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setCachedWaveform(audioUrl, peaks) {
  try {
    const db = await getDB();
    if (!db) return;
    const tx = db.transaction("waveforms", "readwrite");
    const store = tx.objectStore("waveforms");
    store.put({ audioUrl, peaks, timestamp: Date.now() });
  } catch (err) {
    console.warn("Failed to cache waveform in IDB:", err);
  }
}

/** Shadowing Audio Recording Storage */
export async function saveShadowingRecording(id, blob, metadata = {}) {
  try {
    const db = await getDB();
    if (!db) return;
    const tx = db.transaction("shadowing", "readwrite");
    const store = tx.objectStore("shadowing");
    store.put({ id, blob, ...metadata, createdAt: Date.now() });
  } catch (err) {
    console.warn("Failed to save shadowing recording:", err);
  }
}

export async function getShadowingRecording(id) {
  try {
    const db = await getDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction("shadowing", "readonly");
      const store = tx.objectStore("shadowing");
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function deleteShadowingRecording(id) {
  try {
    const db = await getDB();
    if (!db) return;
    const tx = db.transaction("shadowing", "readwrite");
    const store = tx.objectStore("shadowing");
    store.delete(id);
  } catch (err) {
    console.warn("Failed to delete recording:", err);
  }
}

/** SM-2 Flashcards Store */
export async function getAllFlashcards() {
  try {
    const db = await getDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction("flashcards", "readonly");
      const store = tx.objectStore("flashcards");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function saveFlashcard(card) {
  try {
    const db = await getDB();
    if (!db) return;
    const tx = db.transaction("flashcards", "readwrite");
    const store = tx.objectStore("flashcards");
    store.put(card);
  } catch (err) {
    console.warn("Failed to save flashcard:", err);
  }
}
