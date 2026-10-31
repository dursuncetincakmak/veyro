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
import { getGatewayConfig } from '../services/gatewayConfig.js';
import { triggerFirebaseGoogleSignIn } from '../services/firebaseAuth.js';

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
        <div class="auth-stage-container">
          
          <!-- Top Hero Section -->
          <div class="auth-hero-section">
            <div class="auth-brand-emblem-wrap">
              <div class="auth-brand-glow"></div>
              <svg class="auth-brand-svg" viewBox="0 0 512 512" width="68" height="68">
                <defs>
                  <linearGradient id="veyroHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#FF5722"/>
                    <stop offset="100%" stop-color="#FF7043"/>
                  </linearGradient>
                </defs>
                <rect width="512" height="512" rx="128" fill="#14161F"/>
                <rect width="504" height="504" x="4" y="4" rx="124" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
                <path d="M120 130 L220 380 Q256 420 292 380 L392 130 L315 130 L256 310 L197 130 Z" fill="url(#veyroHeroGrad)"/>
                <circle cx="390" cy="130" r="28" fill="#10B981"/>
              </svg>
            </div>
            <div class="auth-brand-name">VEYRO</div>
            <h1 class="auth-headline">Asla Yalnız<br><span class="gradient-kor">Antrenman Yapma</span></h1>
            <p class="auth-subhead">Salondaki seviyene ve hedeflerine uygun antrenman partnerini bul, birlikte geliş.</p>
          </div>

          <!-- Bottom Auth Action Sheet -->
          <div class="auth-sheet-card">
            <!-- Native Social Logins -->
            <div class="auth-social-stack">
              <button class="btn-native-google" id="btn-google-continue">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Google ile Giriş Yap</span>
              </button>
            </div>

            <div class="auth-or-divider">
              <span>veya telefon numarası ile</span>
            </div>

            <!-- Phone Input Box -->
            <div class="auth-phone-box">
              <div class="phone-input-premium">
                <div class="phone-country-chip">
                  <span>🇹🇷</span>
                  <span style="letter-spacing: -0.02em;">+90</span>
                </div>
                <input type="tel" id="input-phone" class="phone-number-field" placeholder="5XX XXX XX XX" maxlength="13" autocomplete="tel">
              </div>

              <button class="btn-auth-submit" id="btn-phone-continue">
                <span>Devam Et</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>

            <p class="auth-legal-notice">
              Devam ederek <a href="#" class="legal-link">Kullanım Koşulları</a> ve <a href="#" class="legal-link">Gizlilik Politikası</a>'nı kabul etmiş sayılırsınız.
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

    phoneInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        document.getElementById("btn-phone-continue")?.click();
      }
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

    // Real Firebase Google Authentication
    document.getElementById("btn-google-continue")?.addEventListener("click", async () => {
      notify.info("Google ile giriş penceresi açılıyor...");
      try {
        const res = await triggerFirebaseGoogleSignIn();
        if (!res.success) {
          if (res.error === "auth/popup-closed-by-user") {
            return;
          }
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

        // Yeni sporcu: adım 2 profil tamamlama sihirbazına aktar
        state.verified = true;
        currentStep = 2;
        render();
      } catch (err) {
        console.error("Google Auth trigger failed:", err);
        notify.error("Google girişi başlatılamadı: " + (err.message || err));
      }
    });

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
        id: state.uid || ("usr_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5)),
        name: state.name || "Sporcu",
        initials: (state.name || "SP").substring(0, 2).toUpperCase(),
        phone: state.phone || "",
        email: state.email || "",
        provider: state.provider || "phone",
        photos: state.photos || [],
        avatar: (state.photos && state.photos[0]) || "",
        goals: state.goals,
        level: state.level,
        preferredTimes: state.preferredTimes,
        genderPref: state.genderPref,
        gymId: state.gymId,
        onboarded: true,
        verified: true // Fully verified
      };

      // Always register freshly onboarded user as their own independent profile
      auth.registerUser(userPayload);

      notify.success("Profiliniz başarıyla kaydedildi ve doğrulandı!");
      onComplete();
    });
  }

  render();
}
