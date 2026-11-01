/**
 * Veyro - Google Cloud Firestore Realtime Sync Service
 * Pure REST API implementation: Zero bundle bloat, zero native dependencies.
 * Includes intelligent Circuit Breaker to prevent 429 quota exhaustion or request spamming.
 * Works seamlessly across Web, PWA, Capacitor iOS/Android, and Node.js environments.
 */

import { getFirebaseConfig } from './firebaseConfig.js';

const COOLDOWN_KEY = 'veyro_firestore_cooldown';
let rateLimitCooldownUntil = 0;

export function isFirestoreRateLimited() {
  try {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(COOLDOWN_KEY);
      if (stored && Number(stored) > Date.now()) return true;
    }
  } catch (e) {}
  return Date.now() < rateLimitCooldownUntil;
}

function handleFirestoreResponse(status) {
  if (status === 429 || status === 403) {
    // Cool down for 3 minutes on rate limit or project quota reached
    rateLimitCooldownUntil = Date.now() + 180000;
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(COOLDOWN_KEY, String(rateLimitCooldownUntil));
      }
    } catch (e) {}
    console.warn(`[FirestoreSync] Cloud quota/rate limit reached (status ${status}). Cloud sync paused for 3 minutes. Local real-time sync active.`);
    return false;
  }
  return true;
}

function getFirestoreBaseUrl() {
  const cfg = getFirebaseConfig();
  if (!cfg || !cfg.projectId) return null;
  return `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents`;
}

function getApiKey() {
  const cfg = getFirebaseConfig();
  return cfg?.apiKey || '';
}

// Convert JavaScript primitive or object to Firestore typed value
export function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Convert Firestore typed value back to plain JavaScript value
export function fromFirestoreValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in val) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

export function toFirestoreDoc(data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && !k.startsWith('_')) {
      fields[k] = toFirestoreValue(v);
    }
  }
  return { fields };
}

export function fromFirestoreDoc(doc) {
  if (!doc || !doc.fields) return null;
  const obj = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    obj[k] = fromFirestoreValue(v);
  }
  if (doc.name) {
    const parts = doc.name.split('/');
    obj._docId = parts[parts.length - 1];
    if (!obj.id) obj.id = obj._docId;
  }
  return obj;
}

/**
 * Fetch all documents in a collection
 */
export async function getFirestoreCollection(collectionName, pageSize = 300) {
  if (isFirestoreRateLimited()) return [];
  const baseUrl = getFirestoreBaseUrl();
  const apiKey = getApiKey();
  if (!baseUrl || !apiKey) return [];

  try {
    const url = `${baseUrl}/${collectionName}?pageSize=${pageSize}&key=${apiKey}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      handleFirestoreResponse(res.status);
      return [];
    }
    const data = await res.json();
    if (!data.documents || !Array.isArray(data.documents)) return [];
    return data.documents.map(fromFirestoreDoc).filter(Boolean);
  } catch (err) {
    return [];
  }
}

/**
 * Save or update a document in a collection
 */
export async function saveFirestoreDoc(collectionName, docId, data) {
  if (isFirestoreRateLimited()) return false;
  const baseUrl = getFirestoreBaseUrl();
  const apiKey = getApiKey();
  if (!baseUrl || !apiKey || !docId) return false;

  try {
    const cleanId = encodeURIComponent(String(docId).replace(/[\/\\]/g, '_'));
    const url = `${baseUrl}/${collectionName}/${cleanId}?key=${apiKey}`;
    const docData = toFirestoreDoc({ ...data, id: docId });
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(docData)
    });
    if (!res.ok) {
      handleFirestoreResponse(res.status);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Delete a document from a collection
 */
export async function deleteFirestoreDoc(collectionName, docId) {
  if (isFirestoreRateLimited()) return false;
  const baseUrl = getFirestoreBaseUrl();
  const apiKey = getApiKey();
  if (!baseUrl || !apiKey || !docId) return false;

  try {
    const cleanId = encodeURIComponent(String(docId).replace(/[\/\\]/g, '_'));
    const url = `${baseUrl}/${collectionName}/${cleanId}?key=${apiKey}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
      handleFirestoreResponse(res.status);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}
