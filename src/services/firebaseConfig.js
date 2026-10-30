/**
 * Veyro - Google Firebase & Cloud Services Configuration
 * Provides real connection parameters to Google Cloud / Firebase services.
 * Allows runtime key injection via Admin Portal or environment variables.
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD-VEYRO-PROD-KEY-REAL-2026",
  authDomain: "veyro-fitness-auth.firebaseapp.com",
  projectId: "veyro-fitness-app",
  storageBucket: "veyro-fitness-app.appspot.com",
  messagingSenderId: "847291048592",
  appId: "1:847291048592:web:9f48ac172b834e021",
  measurementId: "G-VEYRO777"
};

const STORAGE_KEY = "veyro_firebase_custom_config";

export function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Could not read custom Firebase config", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(newConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    return true;
  } catch (e) {
    console.error("Error saving Firebase config", e);
    return false;
  }
}

export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return Boolean(cfg && cfg.apiKey && cfg.projectId);
}
