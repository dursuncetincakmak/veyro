/**
 * Veyro - Google Firebase & Cloud Services Configuration
 * Provides real connection parameters to Google Cloud / Firebase services.
 * Allows runtime key injection via Admin Portal or environment variables.
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCBlc3jDpGxAX3F4g6vWBQUon27j-DbY24",
  authDomain: "veyro-3821f.firebaseapp.com",
  projectId: "veyro-3821f",
  storageBucket: "veyro-3821f.firebasestorage.app",
  messagingSenderId: "584226349981",
  appId: "1:584226349981:web:758cf4064cc918069a0574",
  measurementId: "G-H82DNCWG8L"
};

const STORAGE_KEY = "veyro_firebase_custom_config";

export function getFirebaseConfig() {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(saved) };
      }
    }
  } catch (e) {
    console.warn("Could not read custom Firebase config", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(newConfig) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      return true;
    }
  } catch (e) {
    console.error("Error saving Firebase config", e);
  }
  return false;
}

export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return Boolean(cfg && cfg.apiKey && cfg.projectId);
}
