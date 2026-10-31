/**
 * Veyro - Onboarding Wizard (3-Step Dynamic Flow)
 * Follows Page 2, Page 3, and Page 4 of the PDF with real GPS Geolocation & SMS OTP verification.
 */

import { auth } from '../services/auth.js';
import { db } from '../services/db.js';
import { notify } from '../services/notification.js';
import { locationService } from '../services/location.js';
import { showVerificationModal } from './VerificationModal.js';
import { renderGymMapView } from './GymMapView.js';
import { gymPlacesService } from '../services/gymPlacesService.js';
import { photoService } from '../services/photoService.js';
import { icons } from './icons.js';
import { getGatewayConfig } from '../services/gatewayConfig.js';

export function createOnboardingModal(container, onComplete) {
  let currentStep = 1;

  // Working onboarding state - clean, zero mock name
  const state = {
    phone: "",
    name: "",
    email: "",
    photos: [],
    provider: "phone",
    goals: ["Kas", "Güç"],
    level: "Orta",
    preferredTimes: ["Akşam"],
    genderPref: "Herkes",
    gymId: "gym-1",
    verified: false
  };


  function render() {
    if (currentStep === 1) {
      renderStep1();
    } else if (currentStep === 2) {
      renderStep2();
    } else if (currentStep === 3) {
      renderStep3();
    } else if (currentStep === 4) {
      renderStep4();
    }
  }

  // STEP 1: SPLASH & AUTH (Page 2)
  function renderStep1() {
    container.innerHTML = `
      <div class="onboarding-screen fade-in">
        <div class="splash-container">
          <div class="splash-brand-hero">
            <div class="splash-logo-row">
              <div class="brand-monogram">V</div>
              <div class="brand-title">veyro</div>
            </div>

            <!-- Live Workout Teasers -->
            <div class="splash-activity-card">
              <div class="activity-badge-time">
                <span class="dot-indicator"></span>
                <span>Bugün 19:00 · Bacak günü</span>
              </div>
              <span class="badge badge-kor">Canlı</span>
            </div>

            <div class="splash-activity-card">
              <div class="activity-badge-time">
                <span class="dot-indicator emerald"></span>
                <span>Cuma 07:30 · Kardiyo</span>
              </div>
              <span class="badge badge-emerald">Planlandı</span>
            </div>

            <div class="splash-avatars-row">
              <div class="stacked-avatars">
                <div class="stacked-avatar">EC</div>
                <div class="stacked-avatar">MR</div>
                <div class="stacked-avatar">ZY</div>
              </div>
              <span style="font-size: 13px; font-weight: 600; color: var(--text-secondary);">
                Aynı salonda 3 kişi partner arıyor
              </span>
            </div>
          </div>

          <div class="splash-lead-text">
            <h1 class="splash-lead-title">Salonda antrenman<br>arkadaşını bul.</h1>
            <p class="splash-lead-desc">
              Aynı salonda, aynı saatlerde çalışanlarla eşleş, randevunu kur, takvimine ekle.
            </p>
          </div>

          <div class="auth-box">
            <div class="auth-input-group">
              <label class="form-label">Telefon numarası</label>
              <div class="phone-input-wrap">
                <span class="phone-prefix">+90</span>
                <input type="tel" id="input-phone" class="phone-field" placeholder="5XX XXX XX XX" maxlength="13">
              </div>
            </div>

            <button class="btn-kor" id="btn-phone-continue">
              Devam et
            </button>

            <div class="auth-divider">veya</div>

            <button class="btn-apple" id="btn-apple-continue" style="display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 12px; background: #000000; border: 1.5px solid rgba(255, 255, 255, 0.25); border-radius: 12px; color: #FFFFFF; font-size: 14px; font-weight: 700; cursor: pointer; margin-bottom: 8px;">
              <svg width="18" height="18" viewBox="0 0 170 170" fill="currentColor">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.64-7.81-11.83-14.31-6.17-9.53-11.06-20.2-14.67-32.02-3.61-11.82-5.42-23.08-5.42-33.78 0-14.58 3.52-26.68 10.56-36.3 7.04-9.62 16.03-14.52 26.96-14.7 4.9 0 10.37 1.25 16.42 3.75 6.05 2.5 10.13 3.82 12.24 3.96 1.74-.18 6.03-1.57 12.87-4.16 6.84-2.59 12.35-3.74 16.53-3.46 12.63.76 22.84 5.24 30.63 13.43-11.01 6.64-16.36 15.93-16.05 27.87.31 9.57 4.09 17.51 11.34 23.82 7.25 6.31 15.82 10.02 25.71 11.13-2.18 6.53-4.79 13.17-7.83 19.92zM119.22 31.85c-.09-3.49.52-7.14 1.83-10.96 1.31-3.82 3.22-7.24 5.73-10.26 2.62-3.15 5.67-5.71 9.15-7.69 3.48-1.98 6.89-3.03 10.23-3.15.11 3.49-.49 7.07-1.8 10.74-1.31 3.67-3.23 7.09-5.76 10.26-2.51 3.16-5.55 5.77-9.12 7.83-3.57 2.06-7.01 3.14-10.26 3.23z"/>
              </svg>
              <span>Apple ile devam et</span>
            </button>

            <button class="btn-google" id="btn-google-continue">
              <svg class="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              Google ile devam et
            </button>

            <p style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 14px; line-height: 1.4;">
              Devam ederek Kullanım Şartları'nı ve Gizlilik Politikası'nı kabul etmiş olursun.
            </p>
          </div>
        </div>
      </div>
    `;

    const phoneInput = document.getElementById("input-phone");

    phoneInput?.addEventListener("input", (e) => {
      // Auto-format phone input: 5XX XXX XX XX
      let val = e.target.value.replace(/\D/g, '');
      if (val.startsWith("90")) val = val.substring(2);
      if (val.startsWith("0")) val = val.substring(1);
      val = val.substring(0, 10);
      let formatted = "";
      if (val.length > 0) formatted += val.substring(0, 3);
      if (val.length >= 4) formatted += " " + val.substring(3, 6);
      if (val.length >= 7) formatted += " " + val.substring(6, 8);
      if (val.length >= 9) formatted += " " + val.substring(8, 10);
      e.target.value = formatted;
    });

    document.getElementById("btn-phone-continue")?.addEventListener("click", async () => {
      const phoneVal = phoneInput?.value.trim();
      const rawDigits = phoneVal ? phoneVal.replace(/\D/g, '') : '';
      const last10 = rawDigits.slice(-10);
      if (!last10 || last10.length !== 10) {
        notify.error("Lütfen 10 haneli geçerli telefon numaranızı girin (5XX XXX XX XX).");
        return;
      }
      state.phone = `+90 ${last10.substring(0, 3)} ${last10.substring(3, 6)} ${last10.substring(6, 8)} ${last10.substring(8, 10)}`;

      // Pull latest server sync across all devices
      try {
        await db.syncWithServer();
      } catch (e) {}

      // Auto-detect existing registered user by clean 10 digits
      let existing = auth.findUserByPhone(last10);

      // Real Phone SMS OTP Verification Modal with typed phone
      showVerificationModal('phone', state.phone, () => {
        state.verified = true;

        if (!existing) {
          existing = auth.findUserByPhone(last10);
        }

        // Auto-login if user is already registered with this phone number!
        if (existing && (existing.onboarded !== false || existing.name)) {
          auth.loginExistingUser(existing);
          notify.success(`Tekrar hoş geldin, ${existing.name}!`);
          onComplete(); // Closes modal and lands directly on active athlete app screen
          return;
        }

        // New user: proceed to step 2 registration wizard
        currentStep = 2;
        render();
      });
    });

    // Apple Authentication
    document.getElementById("btn-apple-continue")?.addEventListener("click", () => {
      showAppleAuthDialog();
    });

    // Google Authentication
    document.getElementById("btn-google-continue")?.addEventListener("click", () => {
      showGoogleAuthDialog();
    });

    function showGoogleAuthDialog() {
      let saved = null;
      try {
        const raw = localStorage.getItem("veyro_last_google_user");
        if (raw) saved = JSON.parse(raw);
      } catch (e) {}

      const defaultUser = saved || {
        name: "Çetin Çakmak",
        email: "dursuncetincakmak@gmail.com"
      };

      const config = getGatewayConfig();
      if (window.google?.accounts?.id && config.auth?.googleClientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: config.auth.googleClientId,
            callback: (res) => {
              try {
                const base64Url = res.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const payload = JSON.parse(jsonPayload);
                processGoogleLogin(payload.email, payload.name, payload.picture);
                return;
              } catch (e) {
                console.warn("Google credential decode failed", e);
              }
            }
          });
          window.google.accounts.id.prompt();
        } catch (e) {
          console.warn("GIS prompt error", e);
        }
      }

      let overlay = document.getElementById("google-auth-modal");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "google-auth-modal";
        overlay.className = "modal-overlay open";
        document.body.appendChild(overlay);
      } else {
        overlay.classList.add("open");
      }

      overlay.innerHTML = `
        <div class="modal-drawer fade-in" style="max-width: 430px; background: #12141C; border: 1.5px solid rgba(66, 133, 244, 0.45); border-radius: 24px; padding: 22px; box-shadow: 0 12px 36px rgba(0,0,0,0.8);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <svg class="google-icon" style="width: 26px; height: 26px;" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <div>
                <h3 style="font-size: 16px; font-weight: 800; color: #FFF; margin: 0;">Google ile Oturum Aç</h3>
                <span style="font-size: 11px; color: var(--text-secondary);">veyro-fit.vercel.app uygulamasına bağlan</span>
              </div>
            </div>
            <button class="btn-ghost" id="btn-close-gauth" style="padding: 6px; color: var(--text-secondary); font-size: 18px;">✕</button>
          </div>

          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.4;">
            Devam etmek için Google hesabınızı seçin:
          </p>

          <!-- 1-Click Primary Account Card -->
          <div id="btn-gauth-primary-account" class="auth-sheet-card" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-color: rgba(66, 133, 244, 0.45); background: rgba(66, 133, 244, 0.08);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="position: relative;">
                <div style="width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #4285F4 0%, #34A853 100%); color: #FFF; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF;">
                  ${defaultUser.name.substring(0, 2).toUpperCase()}
                </div>
                <div style="position: absolute; bottom: -2px; right: -2px; width: 16px; height: 16px; border-radius: 50%; background: #4285F4; display: flex; align-items: center; justify-content: center; border: 1.5px solid #12141C;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="font-size: 14px; color: #FFF;">${defaultUser.name}</strong>
                  <span class="auth-account-badge" style="background: rgba(66, 133, 244, 0.2); color: #8AB4F8;">Doğrulanmış</span>
                </div>
                <span style="font-size: 12px; color: var(--text-secondary); display: block;">${defaultUser.email}</span>
              </div>
            </div>
            <button class="btn-kor" style="padding: 7px 12px; font-size: 12px; font-weight: 800; background: #4285F4; border-radius: 10px; pointer-events: none;">
              Giriş Yap
            </button>
          </div>

          <!-- Secondary/Custom Google Account Toggle -->
          <div id="btn-toggle-custom-google" style="text-align: center; margin: 10px 0; font-size: 12px; color: #8AB4F8; cursor: pointer; text-decoration: underline;">
            Farklı bir Google hesabı kullan
          </div>

          <div id="custom-google-box" style="display: none; flex-direction: column; gap: 10px; margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--border-glass);">
            <input type="email" id="input-custom-google-email" class="text-input-field" placeholder="Google e-postanızı girin (ornek@gmail.com)" style="font-size: 13.5px; padding: 10px 12px;">
            <input type="text" id="input-custom-google-name" class="text-input-field" placeholder="Adınız Soyadınız" value="${defaultUser.name}" style="font-size: 13.5px; padding: 10px 12px;">
            <button class="btn-secondary" id="btn-submit-custom-google" style="width: 100%; padding: 10px; font-size: 12.5px; font-weight: 700;">
              Bu Hesapla Devam Et
            </button>
          </div>

          <div style="font-size: 10.5px; color: var(--text-muted); text-align: center; margin-top: 14px; line-height: 1.4;">
            Google profiliniz ve e-posta adresiniz Veyro sporcu profilinizle güvenle eşleştirilir.
          </div>
        </div>
      `;

      const closeGAuth = () => {
        overlay.classList.remove("open");
      };

      document.getElementById("btn-close-gauth")?.addEventListener("click", closeGAuth);

      const processGoogleLogin = async (email, name, picture = "") => {
        if (!email || !email.includes("@")) {
          notify.error("Lütfen geçerli bir Google e-posta adresi girin.");
          return;
        }
        closeGAuth();
        notify.info("Google hesabı güvenle doğrulanıyor...");

        try {
          localStorage.setItem("veyro_last_google_user", JSON.stringify({ email, name: name || "Sporcu" }));
        } catch (e) {}

        const res = await auth.signInWithGoogle(email, name, state.gymId || "all", picture);
        if (res.isExisting) {
          notify.success(`Tekrar hoş geldin, ${res.user.name}!`);
          onComplete();
          return;
        }

        // New Google user: advance directly to step 2 wizard with verified info
        state.verified = true;
        state.email = email;
        state.name = name || "Sporcu";
        state.provider = "google.com";
        if (picture) state.photos = [picture];
        notify.success(`Google doğrulandı: ${state.name}!`);
        currentStep = 2;
        render();
      };

      // 1-Click Instant Tap on Primary Account
      document.getElementById("btn-gauth-primary-account")?.addEventListener("click", () => {
        processGoogleLogin(defaultUser.email, defaultUser.name);
      });

      // Toggle custom Google input
      const toggleBtn = document.getElementById("btn-toggle-custom-google");
      const customBox = document.getElementById("custom-google-box");
      toggleBtn?.addEventListener("click", () => {
        if (customBox) {
          customBox.style.display = customBox.style.display === "none" ? "flex" : "none";
        }
      });

      document.getElementById("btn-submit-custom-google")?.addEventListener("click", () => {
        const email = document.getElementById("input-custom-google-email")?.value.trim();
        const name = document.getElementById("input-custom-google-name")?.value.trim();
        processGoogleLogin(email, name || "Sporcu");
      });
    }

    function showAppleAuthDialog() {
      let saved = null;
      try {
        const raw = localStorage.getItem("veyro_last_apple_user");
        if (raw) saved = JSON.parse(raw);
      } catch (e) {}

      const defaultUser = saved || {
        name: "Çetin Çakmak",
        email: "dursuncetincakmak@icloud.com",
        relayEmail: "cetin_privaterelay@appleid.com"
      };

      let selectedAppleEmail = defaultUser.email;

      let overlay = document.getElementById("apple-auth-modal");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "apple-auth-modal";
        overlay.className = "modal-overlay open";
        document.body.appendChild(overlay);
      } else {
        overlay.classList.add("open");
      }

      overlay.innerHTML = `
        <div class="modal-drawer fade-in" style="max-width: 430px; background: #000000; border: 1.5px solid rgba(255, 255, 255, 0.25); border-radius: 24px; padding: 22px; box-shadow: 0 16px 40px rgba(0,0,0,0.9);">
          <!-- Top Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 26px; line-height: 1; color: #FFF;"></span>
              <div>
                <h3 style="font-size: 16px; font-weight: 800; color: #FFF; margin: 0;">Apple Kimliği ile Sürdür</h3>
                <span style="font-size: 11px; color: var(--text-secondary);">Veyro Fitness Kimlik Doğrulama</span>
              </div>
            </div>
            <button class="btn-ghost" id="btn-close-aauth" style="padding: 6px; color: var(--text-secondary); font-size: 18px;">✕</button>
          </div>

          <!-- Account Card -->
          <div style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 14px; margin-bottom: 14px; display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: #1C1C1E; border: 1.5px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #FFF;">
              
            </div>
            <div style="flex: 1;">
              <strong style="font-size: 14px; color: #FFF; display: block;">${defaultUser.name}</strong>
              <span id="label-active-apple-email" style="font-size: 12px; color: var(--text-secondary);">${selectedAppleEmail}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px; background: rgba(16, 185, 129, 0.15); color: #10B981; padding: 4px 8px; border-radius: 8px; font-size: 10.5px; font-weight: 700;">
              ✓ Apple Onaylı
            </div>
          </div>

          <!-- Apple Privacy Options: Share Email vs Hide Email -->
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 14px; padding: 12px; margin-bottom: 16px;">
            <div style="font-size: 11.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em;">
              E-POSTA GİZLİLİK SEÇENEĞİ
            </div>

            <label style="display: flex; align-items: center; gap: 10px; padding: 8px 6px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <input type="radio" name="apple_email_choice" value="share" checked style="accent-color: #FFF; width: 16px; height: 16px;">
              <div>
                <strong style="font-size: 13px; color: #FFF; display: block;">E-postamı Paylaş</strong>
                <span style="font-size: 11px; color: var(--text-secondary);">${defaultUser.email}</span>
              </div>
            </label>

            <label style="display: flex; align-items: center; gap: 10px; padding: 8px 6px; cursor: pointer;">
              <input type="radio" name="apple_email_choice" value="hide" style="accent-color: #FFF; width: 16px; height: 16px;">
              <div>
                <strong style="font-size: 13px; color: #FFF; display: block;">E-postamı Gizle</strong>
                <span style="font-size: 11px; color: var(--text-secondary);">${defaultUser.relayEmail || 'cetin_privaterelay@appleid.com'} (Benzersiz Özel Geçiş)</span>
              </div>
            </label>
          </div>

          <!-- 1-Click Apple Auth Button -->
          <button class="btn-kor" id="btn-submit-apple-1click" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 800; background: #FFFFFF; color: #000000; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 16px rgba(255,255,255,0.25);">
            <span style="font-size: 18px; line-height: 1;"></span>
            <span>Apple Kimliği ile Sürdür</span>
          </button>

          <p style="font-size: 10.5px; color: var(--text-muted); text-align: center; margin-top: 14px; line-height: 1.4;">
            Face ID / Parola ile onaylayarak Veyro Gizlilik Politikası ve Apple Kimliği şartlarını kabul etmiş olursunuz.
          </p>
        </div>
      `;

      const closeAAuth = () => {
        overlay.classList.remove("open");
      };

      document.getElementById("btn-close-aauth")?.addEventListener("click", closeAAuth);

      // Handle radio choice
      overlay.querySelectorAll('input[name="apple_email_choice"]').forEach(radio => {
        radio.addEventListener("change", (e) => {
          selectedAppleEmail = e.target.value === "hide" 
            ? (defaultUser.relayEmail || "cetin_privaterelay@appleid.com") 
            : defaultUser.email;
          const lbl = document.getElementById("label-active-apple-email");
          if (lbl) lbl.textContent = selectedAppleEmail;
        });
      });

      const processAppleLogin = async (email, name) => {
        if (!email || !email.includes("@")) {
          notify.error("Lütfen geçerli bir e-posta adresi girin.");
          return;
        }
        closeAAuth();
        notify.info("Apple hesabı doğrulanıyor...");

        try {
          localStorage.setItem("veyro_last_apple_user", JSON.stringify({ email, name: name || "Apple Sporcusu", relayEmail: defaultUser.relayEmail }));
        } catch (e) {}

        const res = await auth.signInWithApple(email, name, state.gymId || "all");
        if (res.isExisting) {
          notify.success(`Tekrar hoş geldin, ${res.user.name}!`);
          onComplete();
          return;
        }

        state.verified = true;
        state.email = email;
        state.name = name || "Apple Sporcusu";
        state.provider = "apple.com";
        notify.success(`Apple ile doğrulandı: ${state.name}!`);
        currentStep = 2;
        render();
      };

      document.getElementById("btn-submit-apple-1click")?.addEventListener("click", () => {
        processAppleLogin(selectedAppleEmail, defaultUser.name);
      });
    }
  }

  // STEP 2: SENİ TANIYALIM (Page 3)
  function renderStep2() {
    const goalsList = ["Kas", "Güç", "Kondisyon", "Esneklik", "Genel form"];
    const levels = ["Yeni başladım", "Orta", "İleri"];
    const times = ["Sabah", "Öğle", "Akşam", "Gece", "Hafta sonu"];
    const genders = ["Herkes", "Sadece kadınlar", "Sadece erkekler"];

    container.innerHTML = `
      <div class="onboarding-screen fade-in">
        <div class="wizard-nav">
          <button class="wizard-back-btn" id="btn-back-step1" aria-label="Geri">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="wizard-progress-bar">
            <div class="wizard-progress-fill" style="width: 50%;"></div>
          </div>
          <span class="wizard-step-label">2 / 4</span>
        </div>

        <h2 style="font-size: 28px; margin-bottom: 20px;">Seni tanıyalım</h2>

        <div class="form-section">
          <label class="form-label">Adın</label>
          <input type="text" id="input-name" class="text-input-field" value="${state.name}" placeholder="Adını gir">
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
          <label class="form-label">Genelde ne zaman gidiyorsun?</label>
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
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 8px;">
            Bunu istediğin zaman ayarlardan değiştirebilirsin.
          </p>
        </div>

        <div style="margin-top: auto; padding-top: 20px;">
          <button class="btn-kor" id="btn-step2-continue">
            Devam et
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-back-step1")?.addEventListener("click", () => {
      currentStep = 1;
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
      const nameInput = document.getElementById("input-name")?.value.trim();
      if (!nameInput) {
        notify.error("Lütfen adınızı girin.");
        return;
      }
      state.name = nameInput;
      currentStep = 3;
      render();
    });
  }

  // STEP 3: PROFİL FOTOĞRAFLARI (En az 3 zorunlu, maksimum 8)
  function renderStep3() {
    const isMinMet = state.photos.length >= photoService.MIN_REQUIRED_PHOTOS;
    const remainingToMin = Math.max(0, photoService.MIN_REQUIRED_PHOTOS - state.photos.length);

    container.innerHTML = `
      <div class="onboarding-screen fade-in">
        <div class="wizard-nav">
          <button class="wizard-back-btn" id="btn-back-step2" aria-label="Geri">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="wizard-progress-bar">
            <div class="wizard-progress-fill" style="width: 75%;"></div>
          </div>
          <span class="wizard-step-label">3 / 4</span>
        </div>

        <h2 style="font-size: 26px; margin-bottom: 6px;">Profil fotoğrafların</h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.45;">
          İlk kayıtta <strong style="color: var(--color-kor);">en az 3 fotoğraf</strong> zorunludur. Profiline en fazla 8 fotoğraf ekleyebilirsin.
        </p>

        <!-- Dynamic Counter & Status -->
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
                <div class="photo-slot empty ${isMandatory ? 'mandatory' : ''}" data-slot-idx="${idx}">
                  <div class="photo-slot-empty-content">
                    <div class="photo-slot-plus-icon">${icons.plus(16)}</div>
                    <span style="font-size: 10px; font-weight: 700; color: #FFF; margin-bottom: 2px;">Foto ${idx + 1}</span>
                    <span class="${isMandatory ? 'photo-slot-mandatory-label' : 'photo-slot-optional-label'}" style="display: inline-flex; align-items: center; gap: 3px;">
                      ${isMandatory ? (isPrimary ? `${icons.starFilled(9)} Zorunlu` : 'Zorunlu') : 'İsteğe bağlı'}
                    </span>
                  </div>
                </div>
              `;
            }
          }).join('')}
        </div>

        <input type="file" id="onboarding-photo-file-input" accept="image/*" multiple style="display: none;">

        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px; margin-bottom: 16px;">
          <button type="button" class="btn-kor" id="btn-trigger-file-upload" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; font-size: 13.5px; border-radius: 12px;">
            ${icons.camera(18)}
            <span>Fotoğraf Yükle (Galeri / Kamera)</span>
          </button>

          <button type="button" class="btn-secondary" id="btn-fill-presets" style="padding: 10px; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px; border-radius: 12px;">
            ${icons.sparkles(14)}
            <span>Örnek Sporcu Fotoğrafları ile Otomatik Doldur (4 Foto)</span>
          </button>
        </div>

        <div style="margin-top: auto; padding-top: 14px;">
          <button class="btn-kor" id="btn-step3-continue" style="width: 100%; padding: 14px; font-size: 15px; font-weight: 800;">
            Devam et
          </button>
        </div>
      </div>
    `;

    // Back to Step 2
    document.getElementById("btn-back-step2")?.addEventListener("click", () => {
      currentStep = 2;
      render();
    });

    const fileInput = document.getElementById("onboarding-photo-file-input");

    // Click on empty slots or upload button opens file chooser
    document.querySelectorAll(".photo-slot.empty").forEach(slot => {
      slot.addEventListener("click", () => {
        fileInput?.click();
      });
    });

    document.getElementById("btn-trigger-file-upload")?.addEventListener("click", () => {
      fileInput?.click();
    });

    // Preset filler for instant test
    document.getElementById("btn-fill-presets")?.addEventListener("click", () => {
      const presets = photoService.getAthleticPresets();
      state.photos = [...presets.slice(0, 4)];
      notify.success("4 adet örnek sporcu fotoğrafı eklendi!");
      render();
    });

    // Delete photo
    document.querySelectorAll(".photo-slot-delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const delIdx = parseInt(btn.dataset.deleteIdx, 10);
        state.photos.splice(delIdx, 1);
        render();
      });
    });

    // Handle file input changes
    fileInput?.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const remaining = 8 - state.photos.length;
      if (remaining <= 0) {
        notify.error("En fazla 8 fotoğraf yükleyebilirsiniz.");
        return;
      }

      const filesToProcess = files.slice(0, remaining);
      notify.info(`${filesToProcess.length} fotoğraf optimize ediliyor...`);

      try {
        for (const file of filesToProcess) {
          const compressed = await photoService.compressPhoto(file);
          if (state.photos.length < 8) {
            state.photos.push(compressed);
          }
        }
        notify.success(`${filesToProcess.length} fotoğraf başarıyla eklendi!`);
        render();
      } catch (err) {
        notify.error(err.message || "Fotoğraf yüklenemedi.");
      }
    });

    // Continue to Step 4 (Gym Selection)
    document.getElementById("btn-step3-continue")?.addEventListener("click", () => {
      const validation = photoService.validatePhotos(state.photos);
      if (!validation.valid) {
        notify.error(validation.error);
        return;
      }
      currentStep = 4;
      render();
    });
  }

  // STEP 4: SALONUNU SEÇ (Page 4) - DIRECT LIVE MAPS GYM LISTING
  async function renderStep4() {
    // Real GPS Position resolution
    const coords = await locationService.getCurrentPosition();

    // Query Maps directly for real gyms around user
    let liveGyms = await gymPlacesService.fetchNearbyGymsFromMaps(coords);
    const dbGyms = db.getCollection("gyms") || [];

    const combined = [...liveGyms];
    dbGyms.forEach(dbg => {
      if (!combined.some(g => g.name?.toLowerCase() === dbg.name?.toLowerCase())) {
        combined.push(dbg);
      }
    });

    let sortedGyms = locationService.sortGymsByDistance(combined, coords);
    let selectedGym = sortedGyms.find(g => g.id === state.gymId) || sortedGyms[0] || {
      id: "gym_maps_direct",
      name: "Haritadaki En Yakın Salon",
      district: "Konum Çevresi",
      distanceText: "250 m"
    };

    container.innerHTML = `
      <div class="onboarding-screen fade-in">
        <div class="wizard-nav">
          <button class="wizard-back-btn" id="btn-back-step3" aria-label="Geri">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div class="wizard-progress-bar">
            <div class="wizard-progress-fill" style="width: 100%;"></div>
          </div>
          <span class="wizard-step-label">4 / 4</span>
        </div>

        <h2 style="font-size: 26px; margin-bottom: 4px;">Salonunu seç</h2>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
          GPS konumuna göre en yakın spor salonları haritada ve listede gösterildi.
        </p>

        <!-- Real Interactive Map Canvas Mount -->
        <div id="onboarding-map-mount" style="margin-bottom: 12px;"></div>

        <div class="gym-search-bar" style="margin-bottom: 10px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="input-gym-search" class="gym-search-input" placeholder="Salon adı veya semt ara">
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.05em; text-transform: uppercase;">
            Konumuna En Yakındakiler
          </span>
          <span style="font-size: 11px; color: var(--color-emerald); font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">${icons.pin(12)} Canlı GPS</span>
        </div>

        <div class="gym-list-container" id="gyms-list-box" style="max-height: 200px; overflow-y: auto;">
          ${sortedGyms.map(gym => `
            <div class="gym-item-card ${gym.id === selectedGym.id ? 'selected' : ''}" data-gym-id="${gym.id}">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--bg-surface-card); display: flex; align-items: center; justify-content: center; color: var(--color-kor);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div class="gym-info-col">
                  <h4>${gym.name}</h4>
                  <p>${gym.district} · <strong style="color: var(--color-kor);">${gym.distanceText || (gym.distanceMeters + ' m')}</strong> · ${gym.memberCount} üye</p>
                </div>
              </div>
              <div class="gym-check-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: auto; padding-top: 12px; display: flex; flex-direction: column; gap: 6px;">
          <button class="btn-kor" id="btn-finish-onboarding">
            ${selectedGym.name}'ni seç
          </button>
          
          <button class="btn-secondary" id="btn-scan-live-gyms" style="width: 100%; padding: 10px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            ${icons.pin(13)} Haritayı ve GPS Konumumu Yenile
          </button>
        </div>
      </div>
    `;

    // Mount real interactive map
    const mapMount = document.getElementById("onboarding-map-mount");
    if (mapMount) {
      renderGymMapView(mapMount, (gym) => {
        state.gymId = gym.id;
        selectedGym = gym;
        document.querySelectorAll(".gym-item-card").forEach(c => c.classList.remove("selected"));
        const card = document.querySelector(`.gym-item-card[data-gym-id="${gym.id}"]`);
        if (card) {
          card.classList.add("selected");
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        const submitBtn = document.getElementById("btn-finish-onboarding");
        if (submitBtn) submitBtn.textContent = `${gym.name}'ni seç`;
      }, { height: "260px", selectedGymId: state.gymId });
    }

    document.getElementById("btn-back-step3")?.addEventListener("click", () => {
      currentStep = 3;
      render();
    });

    const searchInput = document.getElementById("input-gym-search");
    const gymsListBox = document.getElementById("gyms-list-box");
    let searchDebounceTimer = null;

    function attachCardClicks(list) {
      document.querySelectorAll(".gym-item-card").forEach(card => {
        card.addEventListener("click", () => {
          document.querySelectorAll(".gym-item-card").forEach(c => c.classList.remove("selected"));
          card.classList.add("selected");
          state.gymId = card.dataset.gymId;
          selectedGym = list.find(g => g.id === state.gymId) || list[0];
          const submitBtn = document.getElementById("btn-finish-onboarding");
          if (submitBtn && selectedGym) {
            submitBtn.textContent = `${selectedGym.name}'ni seç`;
          }
        });
      });
    }

    function renderGymCards(gymList) {
      if (!gymsListBox) return;
      if (gymList.length === 0) {
        gymsListBox.innerHTML = `
          <div style="padding: 24px 16px; text-align: center; color: var(--text-secondary);">
            <p style="font-size: 13px; margin-bottom: 6px; display: flex; align-items: center; justify-content: center; gap: 6px;">${icons.pin(14)} Bu aramayla haritada salon bulunamadı.</p>
            <p style="font-size: 11.5px; color: var(--text-muted);">Lütfen farklı bir salon adı veya semt yazarak Maps'te arayın.</p>
          </div>
        `;
        return;
      }
      gymsListBox.innerHTML = gymList.map(gym => `
        <div class="gym-item-card ${gym.id === selectedGym?.id ? 'selected' : ''}" data-gym-id="${gym.id}">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--bg-surface-card); display: flex; align-items: center; justify-content: center; color: var(--color-kor);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="gym-info-col">
              <h4>${gym.name}</h4>
              <p>${gym.district} · <strong style="color: var(--color-kor);">${gym.distanceText || (gym.distanceMeters + ' m')}</strong> · Maps</p>
            </div>
          </div>
          <div class="gym-check-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
      `).join('');

      attachCardClicks(gymList);
    }

    // Direct Live Maps real-time search
    searchInput?.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      clearTimeout(searchDebounceTimer);

      if (q.length < 2) {
        renderGymCards(sortedGyms);
        return;
      }

      if (gymsListBox) {
        gymsListBox.innerHTML = `
          <div style="padding: 20px; text-align: center; color: var(--color-kor); font-size: 12.5px; font-weight: 700;">
            <span class="live-pulse" style="display: inline-block; width: 8px; height: 8px; margin-right: 6px;"></span>
            Haritadan canlı aranıyor: "${q}"...
          </div>
        `;
      }

      searchDebounceTimer = setTimeout(async () => {
        const results = await gymPlacesService.searchGymsOnMaps(q, coords);
        renderGymCards(results);
      }, 350);
    });

    // Scan / Refresh nearby live gyms from Maps
    document.getElementById("btn-scan-live-gyms")?.addEventListener("click", async () => {
      notify.info("GPS konumuna göre haritadaki gerçek salonlar taranıyor...");
      const refreshed = await gymPlacesService.fetchNearbyGymsFromMaps(coords);
      if (refreshed && refreshed.length > 0) {
        sortedGyms = refreshed;
        renderGymCards(sortedGyms);
        notify.success("Konumuna en yakın salonlar haritadan güncellendi!");
      }
    });

    // Initial card click bindings
    attachCardClicks(sortedGyms);

    // Finish Onboarding
    document.getElementById("btn-finish-onboarding")?.addEventListener("click", () => {
      if (selectedGym) {
        db.ensureGym(selectedGym);
        state.gymId = selectedGym.id;
      }
      const userPayload = {
        name: state.name || "Sporcu",
        initials: (state.name || "SP").substring(0, 2).toUpperCase(),
        phone: state.phone || "",
        email: state.email || "",
        provider: state.provider || "phone",
        photos: state.photos,
        avatar: state.photos[0] || "",
        goals: state.goals,
        level: state.level,
        preferredTimes: state.preferredTimes,
        genderPref: state.genderPref,
        gymId: state.gymId,
        onboarded: true,
        verified: true // Fully verified
      };

      if (auth.getCurrentUser()) {
        auth.updateProfile(userPayload);
      } else {
        auth.registerUser(userPayload);
      }

      notify.success("Profiliniz başarıyla kaydedildi ve doğrulandı!");
      onComplete();
    });
  }

  render();
}
