/**
 * Veyro - Real Firebase Authentication Service
 * Directly integrates Firebase JS SDK Auth with GoogleAuthProvider
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  onAuthStateChanged,
  signOut as fbSignOut
} from "firebase/auth";
import { getFirebaseConfig } from "./firebaseConfig.js";

let authInstance = null;
let googleProvider = null;

export function getFirebaseAuth() {
  if (authInstance) return authInstance;

  const config = getFirebaseConfig();
  const app = getApps().length === 0 ? initializeApp(config) : getApp();
  authInstance = getAuth(app);
  authInstance.languageCode = "tr"; // Turkish locale for Google sign in prompt
  
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: "select_account"
  });

  return authInstance;
}

/**
 * Trigger Real Google Sign-In with Firebase
 * Opens official Google Account Selector popup
 */
export async function triggerFirebaseGoogleSignIn() {
  try {
    const auth = getFirebaseAuth();
    if (!googleProvider) {
      googleProvider = new GoogleAuthProvider();
    }
    
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    
    return {
      success: true,
      user: {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || "Sporcu",
        photoURL: fbUser.photoURL || "",
        phoneNumber: fbUser.phoneNumber || ""
      }
    };
  } catch (error) {
    console.error("Firebase Google Auth Error:", error);

    let friendlyMessage = "Google ile giriş yapılırken bir sorun oluştu.";
    
    if (error.code === "auth/popup-closed-by-user") {
      friendlyMessage = "Google giriş penceresi kapatıldı.";
    } else if (error.code === "auth/unauthorized-domain") {
      friendlyMessage = `Bu alan adı (${window.location.hostname}) Firebase Authentication > Settings > Authorized Domains listesine eklenmelidir.`;
    } else if (error.code === "auth/operation-not-allowed") {
      friendlyMessage = "Firebase Console'da Google Sign-In henüz aktif edilmemiş! Lütfen Firebase Console > Authentication > Sign-in method > Google'ı 'Enable' yapıp kaydedin.";
    } else if (error.code === "auth/popup-blocked") {
      friendlyMessage = "Giriş açılır penceresi tarayıcınız tarafından engellendi. Lütfen açılır pencerelere izin verin.";
    } else if (error.message) {
      friendlyMessage = error.message;
    }

    return {
      success: false,
      error: error.code || "unknown_error",
      message: friendlyMessage
    };
  }
}
