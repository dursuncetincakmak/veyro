/**
 * Veyro - Real Firebase Authentication Service
 * Directly integrates Firebase JS SDK Auth with GoogleAuthProvider & Email/Password
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
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
  authInstance.languageCode = "tr"; // Turkish locale for auth prompts
  
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

/**
 * Real Firebase Email & Password Sign-In
 */
export async function signInWithFirebaseEmail(email, password) {
  try {
    const auth = getFirebaseAuth();
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = cred.user;

    return {
      success: true,
      user: {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || "Sporcu",
        photoURL: fbUser.photoURL || ""
      }
    };
  } catch (error) {
    console.error("Firebase Email Sign-In Error:", error);
    let friendlyMessage = "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.";

    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      friendlyMessage = "E-posta veya şifre hatalı.";
    } else if (error.code === "auth/invalid-email") {
      friendlyMessage = "Geçersiz e-posta formatı.";
    } else if (error.code === "auth/user-disabled") {
      friendlyMessage = "Bu kullanıcı hesabı askıya alınmış.";
    } else if (error.code === "auth/too-many-requests") {
      friendlyMessage = "Çok fazla başarısız deneme yapıldı. Lütfen biraz bekleyin.";
    }

    return {
      success: false,
      error: error.code,
      message: friendlyMessage
    };
  }
}

/**
 * Real Firebase Email & Password Registration
 */
export async function registerWithFirebaseEmail(email, password, displayName = "") {
  try {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = cred.user;

    if (displayName) {
      try {
        await fbUpdateProfile(fbUser, { displayName: displayName.trim() });
      } catch (e) {}
    }

    return {
      success: true,
      user: {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: displayName.trim() || fbUser.displayName || "Sporcu",
        photoURL: fbUser.photoURL || ""
      }
    };
  } catch (error) {
    console.error("Firebase Register Error:", error);
    let friendlyMessage = "Kayıt oluşturulamadı.";

    if (error.code === "auth/email-already-in-use") {
      friendlyMessage = "Bu e-posta adresi ile zaten bir hesap var. Lütfen giriş yapın.";
    } else if (error.code === "auth/weak-password") {
      friendlyMessage = "Şifre çok zayıf. Lütfen en az 6 karakterli güçlü bir şifre girin.";
    } else if (error.code === "auth/invalid-email") {
      friendlyMessage = "Lütfen geçerli bir e-posta adresi yazın.";
    } else if (error.code === "auth/operation-not-allowed") {
      friendlyMessage = "Firebase Console'da Email/Password girişi aktif edilmemiş.";
    }

    return {
      success: false,
      error: error.code,
      message: friendlyMessage
    };
  }
}

/**
 * Real Firebase Password Reset Email
 */
export async function sendFirebasePasswordReset(email) {
  try {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email.trim());
    return {
      success: true,
      message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!"
    };
  } catch (error) {
    console.error("Firebase Password Reset Error:", error);
    let friendlyMessage = "Şifre sıfırlama bağlantısı gönderilemedi.";

    if (error.code === "auth/user-not-found") {
      friendlyMessage = "Bu e-posta adresine kayıtlı bir hesap bulunamadı.";
    } else if (error.code === "auth/invalid-email") {
      friendlyMessage = "Geçersiz e-posta adresi.";
    }

    return {
      success: false,
      error: error.code,
      message: friendlyMessage
    };
  }
}

/**
 * Clean Sign Out from Firebase Auth
 */
export async function signOutFromFirebase() {
  try {
    const auth = getFirebaseAuth();
    if (auth) {
      await fbSignOut(auth);
    }
  } catch (e) {
    // Ignore error if Firebase is not initialized or user already signed out
  }
}
