/**
 * Veyro - Ultra Premium Mobile Onboarding & Authentication
 * Faithful 1:1 Implementation of Mobile Design (Splash, Login, Register, Forgot Password)
 * Integrated with Real Firebase Auth (Google OAuth & Email/Password) & GPS Live Gyms
 */

import { auth } from '../services/auth.js';
import { db } from '../services/db.js';
import { notify } from '../services/notification.js';
import { locationService } from '../services/location.js';
import { gymPlacesService } from '../services/gymPlacesService.js';
import { photoService } from '../services/photoService.js';
import { icons } from './icons.js';
import {
  triggerFirebaseGoogleSignIn,
  signInWithFirebaseEmail,
  registerWithFirebaseEmail,
  sendFirebasePasswordReset
} from '../services/firebaseAuth.js';

export function createOnboardingModal(container, onComplete) {
  // Navigation states: 'splash' | 'login' | 'register' | 'forgot' | 'wizard_step2' | 'wizard_step3' | 'wizard_step4'
  let currentScreen = 'splash';

  // Working athlete registration state
  const state = {
    uid: "",
    name: "",
    email: "",
    phone: "",
    provider: "email",
    photos: [],
    goals: ["Kas", "Güç"],
    level: "Orta",
    preferredTimes: ["Akşam"],
    genderPref: "Herkes",
    gymId: "",
    verified: true
  };

  function renderLogoBadge() {
    return `
      <div class="auth-logo-badge">
        <svg class="auth-logo-svg" viewBox="0 0 512 512" width="58" height="58">
          <defs>
            <linearGradient id="veyroMonogramGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FF5722"/>
              <stop offset="100%" stop-color="#FF7043"/>
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="128" fill="#14161F"/>
          <rect width="504" height="504" x="4" y="4" rx="124" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
          <path d="M120 130 L220 380 Q256 420 292 380 L392 130 L315 130 L256 310 L197 130 Z" fill="url(#veyroMonogramGrad)"/>
          <circle cx="390" cy="130" r="28" fill="#00E5FF"/>
        </svg>
        <div class="auth-logo-text">VEYRO</div>
      </div>
    `;
  }

  function render() {
    if (currentScreen === 'splash') {
      renderSplashScreen();
    } else if (currentScreen === 'login') {
      renderLoginScreen();
    } else if (currentScreen === 'register') {
      renderRegisterScreen();
    } else if (currentScreen === 'forgot') {
      renderForgotPasswordScreen();
    } else if (currentScreen === 'wizard_step2') {
      renderWizardStep2();
    } else if (currentScreen === 'wizard_step3') {
      renderWizardStep3();
    } else if (currentScreen === 'wizard_step4') {
      renderWizardStep4();
    }
  }

  // =========================================================================
  // SCREEN 1: SPLASH SCREEN (Karşılama Ekranı)
  // =========================================================================
  function renderSplashScreen() {
    container.innerHTML = `
      <div class="onboarding-screen fade-in">
        <div class="auth-stage-container">
          <div class="splash-screen-wrap" id="splash-interactive-wrap">
            
            <!-- Top Curved Header Frame -->
            <div class="splash-top-frame">
              ${renderLogoBadge()}
              <div class="splash-headline-sub">Sporun En Güzel Yanı:</div>
              <div class="splash-headline-main">Arkadaşlık!</div>
            </div>

            <!-- Bottom Curved Footer Frame -->
            <div class="splash-bottom-frame">
              <div class="splash-progress-track">
                <div class="splash-progress-bar"></div>
              </div>
              <div class="splash-slogan-text">Daha Aktif, Daha Mutlu...</div>
              <div class="splash-tap-hint">
                <span>Başlamak için dokunun</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    const goToAuth = () => {
      currentScreen = 'login';
      render();
    };

    const wrap = document.getElementById("splash-interactive-wrap");
    wrap?.addEventListener("click", goToAuth);

    // Auto-advance after 2.8 seconds
    const splashTimer = setTimeout(() => {
      if (currentScreen === 'splash') {
        goToAuth();
      }
    }, 2800);

    wrap?.addEventListener("click", () => clearTimeout(splashTimer));
  }

  // =========================================================================
  // SCREEN 2: LOGIN ("Tekrar Hoş Geldin!")
  // =========================================================================
  function renderLoginScreen() {
    container.innerHTML = `
      <div class="onboarding-screen fade-in">
        <div class="auth-stage-container">
          <div class="auth-panel-shell">
            
            <!-- Header Block -->
            <div class="auth-header-block">
              ${renderLogoBadge()}
              <h3 class="auth-main-title">Tekrar Hoş Geldin!</h3>
              <p class="auth-main-subtitle">Hesabına giriş yap ve spor arkadaşlarını bul.</p>
            </div>

            <!-- Form Card -->
            <div class="auth-form-card">
              <!-- Email Input -->
              <div class="auth-input-pill">
                <div class="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <input type="email" id="login-input-email" class="auth-input-native" placeholder="E-posta adresin" autocomplete="email" value="${state.email}">
              </div>

              <!-- Password Input -->
              <div class="auth-input-pill">
                <div class="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <input type="password" id="login-input-password" class="auth-input-native" placeholder="Şifre" autocomplete="current-password">
                <button type="button" class="auth-eye-toggle" id="btn-toggle-login-pwd" aria-label="Şifreyi Göster">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>

              <!-- Options Bar: Remember Me & Forgot Password -->
              <div class="auth-options-bar">
                <label class="auth-checkbox-label">
                  <input type="checkbox" id="chk-remember-me" class="auth-checkbox-native" checked>
                  <span>Beni hatırla</span>
                </label>
                <span class="auth-link-kor" id="link-forgot-password">Şifremi Unuttum?</span>
              </div>

              <!-- Primary Submit Button -->
              <button class="btn-auth-vibrant" id="btn-submit-login">
                <span>→ Giriş Yap</span>
              </button>

              <!-- Line Divider -->
              <div class="auth-line-divider">
                <span>veya</span>
              </div>

              <!-- Social Google Pill Button -->
              <button class="btn-auth-social" id="btn-google-login">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Google ile Giriş Yap</span>
              </button>
            </div>

            <!-- Footer Switch -->
            <div class="auth-switch-footer">
              Hesabın yok mu? <span class="auth-switch-link" id="link-to-register">Kayıt Ol</span>
            </div>

          </div>
        </div>
      </div>
    `;

    // Eye toggle for password
    const pwdInput = document.getElementById("login-input-password");
    document.getElementById("btn-toggle-login-pwd")?.addEventListener("click", () => {
      if (pwdInput) {
        pwdInput.type = pwdInput.type === "password" ? "text" : "password";
      }
    });

    // Forgot password transition
    document.getElementById("link-forgot-password")?.addEventListener("click", () => {
      currentScreen = 'forgot';
      render();
    });

    // Switch to Register
    document.getElementById("link-to-register")?.addEventListener("click", () => {
      currentScreen = 'register';
      render();
    });

    // Email/Password Submit
    document.getElementById("btn-submit-login")?.addEventListener("click", async () => {
      const email = document.getElementById("login-input-email")?.value.trim();
      const password = pwdInput?.value.trim();

      if (!email || !email.includes("@")) {
        notify.error("Lütfen geçerli bir e-posta adresi girin.");
        return;
      }
      if (!password || password.length < 6) {
        notify.error("Lütfen en az 6 karakterli şifrenizi girin.");
        return;
      }

      notify.info("Giriş yapılıyor...");
      const res = await signInWithFirebaseEmail(email, password);
      if (!res.success) {
        notify.error(res.message);
        return;
      }

      state.uid = res.user.uid;
      state.email = res.user.email;
      state.name = res.user.displayName;
      state.provider = "email";

      // Check if user exists in local database
      const existing = auth.findUserByEmail(email);
      if (existing && existing.onboarded) {
        auth.loginExistingUser(existing);
        notify.success(`Tekrar hoş geldin, ${existing.name}!`);
        onComplete();
        return;
      }

      // If athlete hasn't completed their fitness profile yet, proceed to wizard
      notify.success("Giriş başarılı! Lütfen sporcu profilini tamamla.");
      currentScreen = 'wizard_step2';
      render();
    });

    // Google Sign-In
    document.getElementById("btn-google-login")?.addEventListener("click", async () => {
      notify.info("Google ile giriş penceresi açılıyor...");
      const res = await triggerFirebaseGoogleSignIn();
      if (!res.success) {
        if (res.error === "auth/popup-closed-by-user") return;
        notify.error(res.message);
        return;
      }

      const { email, displayName, photoURL, uid } = res.user;
      state.uid = uid;
      state.email = email;
      state.name = displayName;
      state.provider = "google.com";
      if (photoURL) state.photos = [photoURL];

      const authRes = await auth.signInWithGoogle(email, displayName, state.gymId || "all", photoURL, uid);
      if (authRes.isExisting) {
        notify.success(`Tekrar hoş geldin, ${authRes.user.name}!`);
        onComplete();
        return;
      }

      // New user via Google: proceed to wizard
      notify.success(`Google ile bağlandı: ${displayName}!`);
      currentScreen = 'wizard_step2';
      render();
    });
  }

  // =========================================================================
  // SCREEN 3: REGISTER ("Hesap Oluştur")
  // =========================================================================
  function renderRegisterScreen() {
    container.innerHTML = `
      <div class="onboarding-screen fade-in">
        <div class="auth-stage-container">
          <div class="auth-panel-shell with-register-bg">
            
            <!-- Header Block -->
            <div class="auth-header-block">
              ${renderLogoBadge()}
              <h3 class="auth-main-title">Hesap Oluştur</h3>
              <p class="auth-main-subtitle">Spor dünyasına katıl, yeni arkadaşlıklar kur.</p>
            </div>

            <!-- Form Card -->
            <div class="auth-form-card">
              <!-- Name Input -->
              <div class="auth-input-pill">
                <div class="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <input type="text" id="reg-input-name" class="auth-input-native" placeholder="Adın Soyadın" value="${state.name}">
              </div>

              <!-- Email Input -->
              <div class="auth-input-pill">
                <div class="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <input type="email" id="reg-input-email" class="auth-input-native" placeholder="E-posta adresin" autocomplete="email" value="${state.email}">
              </div>

              <!-- Password Input -->
              <div class="auth-input-pill">
                <div class="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <input type="password" id="reg-input-password" class="auth-input-native" placeholder="Şifre" autocomplete="new-password">
                <button type="button" class="auth-eye-toggle" id="btn-toggle-reg-pwd" aria-label="Şifreyi Göster">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>

              <!-- Password Repeat Input -->
              <div class="auth-input-pill">
                <div class="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <input type="password" id="reg-input-password-repeat" class="auth-input-native" placeholder="Şifreyi Tekrarla" autocomplete="new-password">
                <button type="button" class="auth-eye-toggle" id="btn-toggle-reg-pwd-rep" aria-label="Şifreyi Göster">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
              </div>

              <!-- Terms Checkbox -->
              <div style="margin: 4px 2px 8px;">
                <label class="auth-checkbox-label" style="align-items: flex-start; line-height: 1.4;">
                  <input type="checkbox" id="chk-terms" class="auth-checkbox-native" checked style="margin-top: 2px;">
                  <span style="font-size: 12px; color: rgba(255,255,255,0.75);">
                    Kullanım Koşulları'nı ve Gizlilik Politikası'nı kabul ediyorum.
                  </span>
                </label>
              </div>

              <!-- Submit Button -->
              <button class="btn-auth-vibrant" id="btn-submit-register">
                <span>Kayıt Ol ></span>
              </button>

              <!-- Line Divider -->
              <div class="auth-line-divider">
                <span>veya</span>
              </div>

              <!-- Social Google Button -->
              <button class="btn-auth-social" id="btn-google-register">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Google ile Kayıt Ol</span>
              </button>
            </div>

            <!-- Footer Switch -->
            <div class="auth-switch-footer">
              Zaten bir hesabın var mı? <span class="auth-switch-link" id="link-to-login">Giriş Yap</span>
            </div>

          </div>
        </div>
      </div>
    `;

    // Eye toggles
    const pwdInput = document.getElementById("reg-input-password");
    const pwdRepInput = document.getElementById("reg-input-password-repeat");
    document.getElementById("btn-toggle-reg-pwd")?.addEventListener("click", () => {
      if (pwdInput) pwdInput.type = pwdInput.type === "password" ? "text" : "password";
    });
    document.getElementById("btn-toggle-reg-pwd-rep")?.addEventListener("click", () => {
      if (pwdRepInput) pwdRepInput.type = pwdRepInput.type === "password" ? "text" : "password";
    });

    // Switch to Login
    document.getElementById("link-to-login")?.addEventListener("click", () => {
      currentScreen = 'login';
      render();
    });

    // Submit Register
    document.getElementById("btn-submit-register")?.addEventListener("click", async () => {
      const name = document.getElementById("reg-input-name")?.value.trim();
      const email = document.getElementById("reg-input-email")?.value.trim();
      const password = pwdInput?.value.trim();
      const passwordRepeat = pwdRepInput?.value.trim();
      const termsAccepted = document.getElementById("chk-terms")?.checked;

      if (!name) {
        notify.error("Lütfen adınızı ve soyadınızı girin.");
        return;
      }
      if (!email || !email.includes("@")) {
        notify.error("Lütfen geçerli bir e-posta adresi girin.");
        return;
      }
      if (!password || password.length < 6) {
        notify.error("Şifre en az 6 karakter olmalıdır.");
        return;
      }
      if (password !== passwordRepeat) {
        notify.error("Girdiğiniz şifreler birbiriyle uyuşmuyor.");
        return;
      }
      if (!termsAccepted) {
        notify.error("Lütfen Kullanım Koşulları ve Gizlilik Politikası'nı kabul edin.");
        return;
      }

      notify.info("Hesabınız oluşturuluyor...");
      const res = await registerWithFirebaseEmail(email, password, name);
      if (!res.success) {
        notify.error(res.message);
        return;
      }

      state.uid = res.user.uid;
      state.email = res.user.email;
      state.name = name;
      state.provider = "email";

      notify.success(`Hesabın oluşturuldu, ${name}! Şimdi profilini özelleştirelim.`);
      currentScreen = 'wizard_step2';
      render();
    });

    // Google Register
    document.getElementById("btn-google-register")?.addEventListener("click", async () => {
      notify.info("Google ile kayıt penceresi açılıyor...");
      const res = await triggerFirebaseGoogleSignIn();
      if (!res.success) {
        if (res.error === "auth/popup-closed-by-user") return;
        notify.error(res.message);
        return;
      }

      const { email, displayName, photoURL, uid } = res.user;
      state.uid = uid;
      state.email = email;
      state.name = displayName;
      state.provider = "google.com";
      if (photoURL) state.photos = [photoURL];

      const authRes = await auth.signInWithGoogle(email, displayName, state.gymId || "all", photoURL, uid);
      if (authRes.isExisting) {
        notify.success(`Tekrar hoş geldin, ${authRes.user.name}!`);
        onComplete();
        return;
      }

      notify.success(`Google ile bağlandı: ${displayName}!`);
      currentScreen = 'wizard_step2';
      render();
    });
  }

  // =========================================================================
  // SCREEN 4: FORGOT PASSWORD ("Şifremi Unuttum")
  // =========================================================================
  function renderForgotPasswordScreen() {
    container.innerHTML = `
      <div class="onboarding-screen fade-in">
        <div class="auth-stage-container">
          <div class="auth-panel-shell" style="justify-content: center; gap: 32px;">
            
            <div class="auth-header-block">
              ${renderLogoBadge()}

              <!-- Glowing Circular Padlock Hero Badge -->
              <div class="auth-lock-hero-badge">
                <svg class="auth-lock-inner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="3" ry="3"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  <circle cx="12" cy="16" r="1.5" fill="currentColor"></circle>
                </svg>
              </div>

              <h3 class="auth-main-title">Şifremi Unuttum</h3>
              <p class="auth-main-subtitle">E-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim.</p>
            </div>

            <!-- Form Card -->
            <div class="auth-form-card">
              <div class="auth-input-pill">
                <div class="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <input type="email" id="forgot-input-email" class="auth-input-native" placeholder="E-posta adresin" autocomplete="email" value="${state.email}">
              </div>

              <button class="btn-auth-vibrant" id="btn-submit-forgot">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                <span>Bağlantı Gönder</span>
              </button>
            </div>

            <!-- Back to Login -->
            <div class="auth-switch-footer" style="margin-top: 0;">
              <span class="auth-switch-link" id="link-back-login" style="display: inline-flex; align-items: center; gap: 6px;">
                ← Girişe Dön
              </span>
            </div>

          </div>
        </div>
      </div>
    `;

    document.getElementById("link-back-login")?.addEventListener("click", () => {
      currentScreen = 'login';
      render();
    });

    document.getElementById("btn-submit-forgot")?.addEventListener("click", async () => {
      const email = document.getElementById("forgot-input-email")?.value.trim();
      if (!email || !email.includes("@")) {
        notify.error("Lütfen geçerli bir e-posta adresi yazın.");
        return;
      }

      notify.info("Sıfırlama bağlantısı gönderiliyor...");
      const res = await sendFirebasePasswordReset(email);
      if (res.success) {
        notify.success(res.message);
        setTimeout(() => {
          currentScreen = 'login';
          render();
        }, 1500);
      } else {
        notify.error(res.message);
      }
    });
  }

  // =========================================================================
  // WIZARD STEP 2: SENİ TANIYALIM (Hedefler, Seviye, Tercihler)
  // =========================================================================
  function renderWizardStep2() {
    const goalsList = ["Kas", "Güç", "Kondisyon", "Esneklik", "Genel form"];
    const levels = ["Yeni başladım", "Orta", "İleri"];
    const times = ["Sabah", "Öğle", "Akşam", "Gece", "Hafta sonu"];
    const genders = ["Herkes", "Sadece kadınlar", "Sadece erkekler"];

    container.innerHTML = `
      <div class="onboarding-screen fade-in" style="padding: max(40px, calc(env(safe-area-inset-top, 0px) + 20px)) 20px 24px;">
        <div class="wizard-nav">
          <button class="wizard-back-btn" id="btn-back-to-auth" aria-label="Geri">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="wizard-progress-bar">
            <div class="wizard-progress-fill" style="width: 35%;"></div>
          </div>
          <span class="wizard-step-label">1 / 3</span>
        </div>

        <h2 style="font-size: 26px; font-weight: 900; color: #FFF; margin: 0 0 8px;">Seni tanıyalım</h2>
        <p style="font-size: 13.5px; color: var(--text-secondary); margin: 0 0 24px;">Antrenman partnerlerinle en doğru eşleşme için tercihlerini belirle.</p>

        <div class="form-section">
          <label class="form-label">Adın</label>
          <input type="text" id="wizard-input-name" class="text-input-field" value="${state.name}" placeholder="Adını gir">
        </div>

        <div class="form-section">
          <label class="form-label">Hedefin <span class="form-label-sub">(birden fazla seçebilirsin)</span></label>
          <div class="chips-grid" id="goals-chips">
            ${goalsList.map(g => `
              <button type="button" class="chip-btn ${state.goals.includes(g) ? 'selected' : ''}" data-val="${g}">${g}</button>
            `).join('')}
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Seviyen</label>
          <div class="segmented-control" id="level-selector">
            ${levels.map(l => `
              <div class="segmented-option ${state.level === l ? 'selected' : ''}" data-val="${l}">${l}</div>
            `).join('')}
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Genelde ne zaman spor yapıyorsun?</label>
          <div class="chips-grid" id="times-chips">
            ${times.map(t => `
              <button type="button" class="chip-btn ${state.preferredTimes.includes(t) ? 'selected' : ''}" data-val="${t}">${t}</button>
            `).join('')}
          </div>
        </div>

        <div class="form-section">
          <label class="form-label">Kimlerle eşleşmek istersin?</label>
          <div class="chips-grid" id="gender-chips">
            ${genders.map(gend => `
              <button type="button" class="chip-btn ${state.genderPref === gend ? 'selected' : ''}" data-val="${gend}">${gend}</button>
            `).join('')}
          </div>
        </div>

        <div style="margin-top: auto; padding-top: 20px;">
          <button class="btn-auth-vibrant" id="btn-step2-continue">
            <span>Devam Et ></span>
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-back-to-auth")?.addEventListener("click", () => {
      currentScreen = 'login';
      render();
    });

    // Goals toggle
    document.querySelectorAll("#goals-chips .chip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.val;
        if (state.goals.includes(val)) {
          state.goals = state.goals.filter(g => g !== val);
          btn.classList.remove("selected");
        } else {
          state.goals.push(val);
          btn.classList.add("selected");
        }
      });
    });

    // Level select
    document.querySelectorAll("#level-selector .segmented-option").forEach(opt => {
      opt.addEventListener("click", () => {
        document.querySelectorAll("#level-selector .segmented-option").forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
        state.level = opt.dataset.val;
      });
    });

    // Times toggle
    document.querySelectorAll("#times-chips .chip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.val;
        if (state.preferredTimes.includes(val)) {
          state.preferredTimes = state.preferredTimes.filter(t => t !== val);
          btn.classList.remove("selected");
        } else {
          state.preferredTimes.push(val);
          btn.classList.add("selected");
        }
      });
    });

    // Gender select
    document.querySelectorAll("#gender-chips .chip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#gender-chips .chip-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.genderPref = btn.dataset.val;
      });
    });

    document.getElementById("btn-step2-continue")?.addEventListener("click", () => {
      const nameInput = document.getElementById("wizard-input-name")?.value.trim();
      if (!nameInput) {
        notify.error("Lütfen adınızı girin.");
        return;
      }
      state.name = nameInput;
      currentScreen = 'wizard_step3';
      render();
    });
  }

  // =========================================================================
  // WIZARD STEP 3: PROFİL FOTOĞRAFLARI (En az 3 zorunlu, maksimum 8)
  // =========================================================================
  function renderWizardStep3() {
    const isMinMet = state.photos.length >= photoService.MIN_REQUIRED_PHOTOS;
    const remainingToMin = Math.max(0, photoService.MIN_REQUIRED_PHOTOS - state.photos.length);

    container.innerHTML = `
      <div class="onboarding-screen fade-in" style="padding: max(40px, calc(env(safe-area-inset-top, 0px) + 20px)) 20px 24px;">
        <div class="wizard-nav">
          <button class="wizard-back-btn" id="btn-back-step2" aria-label="Geri">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="wizard-progress-bar">
            <div class="wizard-progress-fill" style="width: 70%;"></div>
          </div>
          <span class="wizard-step-label">2 / 3</span>
        </div>

        <h2 style="font-size: 26px; font-weight: 900; color: #FFF; margin: 0 0 6px;">Profil fotoğrafların</h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.45;">
          İlk kayıtta <strong style="color: var(--color-kor);">en az 3 fotoğraf</strong> zorunludur. Profiline en fazla 8 fotoğraf ekleyebilirsin.
        </p>

        <!-- Status Pill -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; background: var(--bg-surface-elevated); padding: 10px 14px; border-radius: 14px; border: 1px solid var(--border-glass-bright);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 13px; font-weight: 700; color: #FFF;">Yüklenen Fotoğraflar</span>
            <span style="font-size: 11px; color: var(--text-muted);">(${state.photos.length}/8)</span>
          </div>
          <span class="badge ${isMinMet ? 'badge-emerald' : 'badge-kor'}" style="font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
            ${isMinMet ? `${icons.checkCircle(12)} Zorunlu 3 foto tamam` : `${icons.alert(12)} ${remainingToMin} zorunlu foto daha`}
          </span>
        </div>

        <!-- 8-Photo Interactive Grid -->
        <div class="profile-photos-grid">
          ${Array.from({ length: 8 }).map((_, idx) => {
            const photo = state.photos[idx];
            const isMandatory = idx < 3;
            const isPrimary = idx === 0;

            if (photo) {
              return `
                <div class="photo-slot filled ${isPrimary ? 'primary-main' : ''}" data-index="${idx}">
                  <img src="${photo}" alt="Fotoğraf ${idx + 1}" />
                  <button type="button" class="photo-slot-delete-btn" data-delete-idx="${idx}" title="Fotoğrafı Kaldır">${icons.close(12)}</button>
                  <div class="photo-slot-number-badge">${isPrimary ? `${icons.starFilled(10)} Ana` : (idx + 1)}</div>
                </div>
              `;
            } else {
              return `
                <div class="photo-slot ${isMandatory ? 'mandatory-empty' : ''}" data-empty-idx="${idx}">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${isMandatory ? 'var(--color-kor)' : 'var(--text-muted)'}" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span style="font-size: 10px; font-weight: 700; color: ${isMandatory ? 'var(--color-kor)' : 'var(--text-muted)'}; margin-top: 4px;">
                    ${isMandatory ? `Zorunlu ${idx + 1}` : 'Ekle'}
                  </span>
                </div>
              `;
            }
          }).join('')}
        </div>

        <input type="file" id="onboarding-file-picker" accept="image/*" style="display: none;" />

        <div style="margin-top: auto; padding-top: 20px;">
          <button class="btn-auth-vibrant" id="btn-step3-continue" ${!isMinMet ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
            <span>${isMinMet ? 'Salonunu Seç >' : `En Az 3 Fotoğraf Yükle (${state.photos.length}/3)`}</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-back-step2")?.addEventListener("click", () => {
      currentScreen = 'wizard_step2';
      render();
    });

    const fileInput = document.getElementById("onboarding-file-picker");

    document.querySelectorAll(".photo-slot[data-empty-idx]").forEach(slot => {
      slot.addEventListener("click", () => {
        fileInput?.click();
      });
    });

    document.querySelectorAll(".photo-slot-delete-btn").forEach(delBtn => {
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const delIdx = parseInt(delBtn.dataset.deleteIdx, 10);
        state.photos.splice(delIdx, 1);
        renderWizardStep3();
      });
    });

    fileInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        notify.info("Fotoğraf sıkıştırılıyor...");
        const optimized = await photoService.compressImage(file);
        if (state.photos.length < photoService.MAX_PHOTOS) {
          state.photos.push(optimized);
          notify.success(`Fotoğraf eklendi (${state.photos.length}/${photoService.MAX_PHOTOS})`);
          renderWizardStep3();
        } else {
          notify.error(`En fazla ${photoService.MAX_PHOTOS} fotoğraf yükleyebilirsiniz.`);
        }
      } catch (err) {
        notify.error("Fotoğraf yüklenemedi: " + (err.message || err));
      }
      fileInput.value = "";
    });

    document.getElementById("btn-step3-continue")?.addEventListener("click", () => {
      if (state.photos.length < photoService.MIN_REQUIRED_PHOTOS) {
        notify.error(`Kayıt olmak için en az ${photoService.MIN_REQUIRED_PHOTOS} fotoğraf yüklemeniz zorunludur.`);
        return;
      }
      currentScreen = 'wizard_step4';
      render();
    });
  }

  // =========================================================================
  // WIZARD STEP 4: SALON SEÇİMİ (GPS Canlı Harita)
  // =========================================================================
  async function renderWizardStep4() {
    container.innerHTML = `
      <div class="onboarding-screen fade-in" style="padding: max(40px, calc(env(safe-area-inset-top, 0px) + 20px)) 20px 24px;">
        <div class="wizard-nav">
          <button class="wizard-back-btn" id="btn-back-step3" aria-label="Geri">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="wizard-progress-bar">
            <div class="wizard-progress-fill" style="width: 100%;"></div>
          </div>
          <span class="wizard-step-label">3 / 3</span>
        </div>

        <h2 style="font-size: 26px; font-weight: 900; color: #FFF; margin: 0 0 6px;">Antrenman salonun</h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
          GPS konumuna göre haritadaki gerçek spor salonları listelendi. Gittiğin salonu seç:
        </p>

        <!-- Search Input Box -->
        <div class="auth-input-pill" style="margin-bottom: 14px;">
          <div class="auth-input-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input type="text" id="input-gym-search" class="auth-input-native" placeholder="Haritada salon ara (örn: Macfit, Kadıköy)">
        </div>

        <!-- Gyms List Stack -->
        <div class="gyms-list-stack" id="gyms-list-container">
          <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">
            <span class="live-pulse" style="display: inline-block; width: 8px; height: 8px; margin-right: 6px;"></span>
            Konumuna en yakın salonlar taranıyor...
          </div>
        </div>

        <div style="margin-top: auto; padding-top: 16px;">
          <button class="btn-auth-vibrant" id="btn-finish-onboarding">
            <span>Aramıza Katıl 🚀</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-back-step3")?.addEventListener("click", () => {
      currentScreen = 'wizard_step3';
      render();
    });

    const coords = await locationService.getCurrentCoords();
    let gymList = await gymPlacesService.fetchNearbyGymsFromMaps(coords);
    let selectedGym = gymList[0] || null;
    if (selectedGym) state.gymId = selectedGym.id;

    const gymsListBox = document.getElementById("gyms-list-container");
    const searchInput = document.getElementById("input-gym-search");

    function renderGymCards(list) {
      if (!gymsListBox) return;
      if (!list || list.length === 0) {
        gymsListBox.innerHTML = `
          <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 12.5px;">
            Aramanıza uygun spor salonu bulunamadı.
          </div>
        `;
        return;
      }

      gymsListBox.innerHTML = list.map(gym => `
        <div class="gym-select-card ${selectedGym?.id === gym.id ? 'selected' : ''}" data-gym-id="${gym.id}">
          <div style="display: flex; align-items: center;">
            <div class="gym-pin-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="gym-info-col">
              <h4>${gym.name}</h4>
              <p>${gym.district} · <strong style="color: var(--color-kor);">${gym.distanceText || (gym.distanceMeters + ' m')}</strong></p>
            </div>
          </div>
          <div class="gym-check-circle">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
      `).join('');

      gymsListBox.querySelectorAll(".gym-select-card").forEach(card => {
        card.addEventListener("click", () => {
          const gId = card.dataset.gymId;
          selectedGym = list.find(g => g.id === gId) || selectedGym;
          state.gymId = selectedGym.id;
          renderGymCards(list);
        });
      });
    }

    renderGymCards(gymList);

    // Search filter
    let debounceTimer;
    searchInput?.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      clearTimeout(debounceTimer);
      if (q.length < 2) {
        renderGymCards(gymList);
        return;
      }
      debounceTimer = setTimeout(async () => {
        const results = await gymPlacesService.searchGymsOnMaps(q, coords);
        renderGymCards(results);
      }, 300);
    });

    // Complete Onboarding & Save Unique Profile
    document.getElementById("btn-finish-onboarding")?.addEventListener("click", () => {
      if (selectedGym) {
        db.ensureGym(selectedGym);
        state.gymId = selectedGym.id;
      }

      const userPayload = {
        id: state.uid || ("usr_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5)),
        name: state.name || "Sporcu",
        initials: (state.name || "SP").substring(0, 2).toUpperCase(),
        phone: state.phone || "",
        email: state.email || "",
        provider: state.provider || "email",
        photos: state.photos || [],
        avatar: (state.photos && state.photos[0]) || "",
        goals: state.goals,
        level: state.level,
        preferredTimes: state.preferredTimes,
        genderPref: state.genderPref,
        gymId: state.gymId || (selectedGym?.id || "gym-all"),
        onboarded: true,
        verified: true,
        createdAt: Date.now()
      };

      auth.registerUser(userPayload);
      notify.success("Profiliniz başarıyla oluşturuldu! Veyro dünyasına hoş geldiniz.");
      onComplete();
    });
  }

  // Start with Splash Screen
  render();
}
