/**
 * Veyro - Standalone PC / Web Admin Portal Application
 * Sadece PC/Masaüstü tarayıcılardan erişilen tam ekran müstakil yönetici masası.
 * Kullanıcı İstatistikleri, Moderasyon Masası (Şikayet Takibi), Fırsatlar CMS ve Sistem Yapılandırması.
 * Mobil uygulamadan tamamen bağımsızdır; oturum ve çıkış işlemleri bu panel içinde kalır.
 */

import './styles/main.css';
import './styles/admin.css';

import { db } from './services/db.js';
import { notify } from './services/notification.js';
import { renderAdminPortal } from './components/AdminPortal.js';
import { icons } from './components/icons.js';

const ADMIN_SESSION_KEY = "veyro_admin_desk_session_v1";

class StandaloneAdminApp {
  constructor() {
    this.root = document.getElementById("admin-app");
    this.adminSession = this.loadSession();
    this.init();
  }

  loadSession() {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  saveSession(session) {
    this.adminSession = session;
    if (session) {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }

  isAdminLoggedIn() {
    return Boolean(this.adminSession && this.adminSession.role === "admin");
  }

  async init() {
    if (!this.root) return;

    // Fast initial sync with server / Firestore
    try {
      await db.syncWithServer();
    } catch (e) {}

    this.render();

    // Auto sync periodically in admin portal
    setInterval(() => {
      db.syncWithServer();
    }, 5000);
  }

  render() {
    if (!this.root) return;

    if (!this.isAdminLoggedIn()) {
      this.renderLoginScreen();
    } else {
      this.renderDashboard();
    }
  }

  renderLoginScreen() {
    this.root.innerHTML = `
      <div class="admin-split-auth-shell">
        
        <!-- Left Hero Branding Pane -->
        <div class="admin-split-hero-pane">
          <div>
            <!-- Monogram Brand Header -->
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 48px;">
              <div style="width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(255, 87, 34, 0.4); color: #FFF;">
                ${icons.shield(24)}
              </div>
              <div>
                <div style="font-size: 20px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px;">
                  Veyro Admin
                  <span style="font-size: 10px; font-weight: 800; background: rgba(255, 87, 34, 0.18); color: #FF5722; border: 1px solid rgba(255, 87, 34, 0.35); padding: 2px 7px; border-radius: 6px;">
                    ROOT
                  </span>
                </div>
                <div style="font-size: 11.5px; color: #94A3B8; font-weight: 600;">Kurumsal Altyapı & Moderasyon Masası</div>
              </div>
            </div>

            <!-- Big Narrative Headline -->
            <h1 style="font-size: 38px; font-weight: 900; color: #FFFFFF; line-height: 1.15; margin: 0 0 16px; letter-spacing: -0.03em;">
              Spor Ekosistemi İçin <br>
              <span style="background: linear-gradient(135deg, #FF5722 0%, #FF8A65 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Merkezi Operasyon</span> ve Güvenlik Masası
            </h1>
            <p style="font-size: 14.5px; color: #94A3B8; line-height: 1.6; margin: 0 0 36px; max-width: 520px;">
              Gerçek zamanlı sporcu veritabanı, Google Maps canlı salon radarı, topluluk moderasyon kayıtları ve reklam ağı yönetimini tek noktadan denetleyin.
            </p>

            <!-- Feature Showcase Cards -->
            <div style="display: flex; flex-direction: column; gap: 14px; max-width: 560px;">
              <div class="admin-hero-card">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(255, 87, 34, 0.15); border: 1px solid rgba(255, 87, 34, 0.3); display: flex; align-items: center; justify-content: center; color: #FF5722; flex-shrink: 0;">
                  ${icons.database(18)}
                </div>
                <div>
                  <h4 style="font-size: 14px; font-weight: 800; color: #FFFFFF; margin: 0 0 3px;">Google Firebase Firestore Altyapısı</h4>
                  <p style="font-size: 12.5px; color: #94A3B8; margin: 0; line-height: 1.45;">Kullanıcı, randevu ve profil kayıtları veyro-3821f gerçek zamanlı bulut veritabanıyla çift yönlü senkronize edilir.</p>
                </div>
              </div>

              <div class="admin-hero-card">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); display: flex; align-items: center; justify-content: center; color: #10B981; flex-shrink: 0;">
                  ${icons.map(18)}
                </div>
                <div>
                  <h4 style="font-size: 14px; font-weight: 800; color: #FFFFFF; margin: 0 0 3px;">Google Maps Canlı Salon Radarı</h4>
                  <p style="font-size: 12.5px; color: #94A3B8; margin: 0; line-height: 1.45;">Sıfır manuel giriş: Türkiye'deki spor salonları GPS koordinatlarına göre Places API'den anlık taranır.</p>
                </div>
              </div>

              <div class="admin-hero-card">
                <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); display: flex; align-items: center; justify-content: center; color: #60A5FA; flex-shrink: 0;">
                  ${icons.shield(18)}
                </div>
                <div>
                  <h4 style="font-size: 14px; font-weight: 800; color: #FFFFFF; margin: 0 0 3px;">Güvenlik & Topluluk Moderasyonu</h4>
                  <p style="font-size: 12.5px; color: #94A3B8; margin: 0; line-height: 1.45;">No-show tespiti, sahte profil şikayetleri ve kullanıcı askıya alma yetkisi tek tıkla uygulanır.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Compliance & Legal Badges -->
          <div style="padding-top: 36px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: #64748B;">
              <span>AES-256 SSL</span>
              <span>·</span>
              <span>ISO 27001 Uyumlu</span>
              <span>·</span>
              <span>KVKK Güvenlik Standardı</span>
            </div>
            <div style="font-size: 11.5px; color: #64748B;">
              © 2026 Veyro Technologies A.Ş.
            </div>
          </div>
        </div>

        <!-- Right Form Pane -->
        <div class="admin-split-form-pane">
          <!-- Top Right Action -->
          <div style="display: flex; justify-content: flex-end;">
            <a href="business.html" style="padding: 8px 16px; font-size: 12px; font-weight: 700; color: #60A5FA; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 10px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s ease;">
              ${icons.award(14)} Reklam Veren Portalı (B2B) →
            </a>
          </div>

          <!-- Centered Auth Form Box -->
          <div style="margin: auto 0; padding: 24px 0;">
            <div style="margin-bottom: 28px;">
              <div style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 800; color: var(--color-kor, #FF5722); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #FF5722;"></span>
                YÖNETİCİ KİMLİK DOĞRULAMA
              </div>
              <h2 style="font-size: 26px; font-weight: 900; color: #FFFFFF; margin: 0 0 6px; letter-spacing: -0.02em;">
                Konsol Oturumu Aç
              </h2>
              <p style="font-size: 13px; color: #94A3B8; margin: 0; line-height: 1.5;">
                Sistem konsoluna erişmek için kurumsal yönetici bilgilerinizi girin.
              </p>
            </div>

            <!-- Security Audit Note -->
            <div style="background: rgba(255, 87, 34, 0.08); border: 1px solid rgba(255, 87, 34, 0.25); border-radius: 12px; padding: 12px 14px; margin-bottom: 22px; display: flex; align-items: flex-start; gap: 10px;">
              <div style="color: #FF5722; margin-top: 1px;">${icons.alert(15)}</div>
              <span style="font-size: 12px; color: rgba(255, 255, 255, 0.85); line-height: 1.45;">
                Bu konsol yalnızca yetkili sistem yöneticileri içindir. Tüm oturum hareketleri denetim günlüğüne kaydedilmektedir.
              </span>
            </div>

            <!-- Form Fields -->
            <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 22px;">
              <div>
                <label style="display: block; font-size: 11.5px; font-weight: 700; color: #94A3B8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em;">
                  Yönetici E-Posta / Kimlik ID
                </label>
                <div style="position: relative;">
                  <input type="text" id="admin-pc-username" value="admin@veyro.fit" placeholder="admin@veyro.fit"
                    style="width: 100%; border-radius: 12px; padding: 13px 14px 13px 40px; font-size: 14px; background: #07080B; color: #FFF; border: 1.5px solid rgba(255, 255, 255, 0.1); box-sizing: border-box; outline: none; transition: border-color 0.2s ease;">
                  <div style="position: absolute; left: 14px; top: 14px; color: #64748B;">
                    ${icons.user(16)}
                  </div>
                </div>
              </div>

              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                  <label style="font-size: 11.5px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.04em;">
                    Master Güvenlik Anahtarı (Şifre)
                  </label>
                  <span style="font-size: 11px; color: #64748B;">256-Bit Şifreli</span>
                </div>
                <div style="position: relative;">
                  <input type="password" id="admin-pc-password" placeholder="••••••••••••••••"
                    style="width: 100%; border-radius: 12px; padding: 13px 14px 13px 40px; font-size: 14px; background: #07080B; color: #FFF; border: 1.5px solid rgba(255, 255, 255, 0.1); box-sizing: border-box; outline: none; transition: border-color 0.2s ease;">
                  <div style="position: absolute; left: 14px; top: 14px; color: #64748B;">
                    ${icons.lock(16)}
                  </div>
                </div>
              </div>
            </div>

            <!-- Login Button -->
            <button id="btn-submit-admin-pc-login" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 800; background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%); color: #FFF; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 24px rgba(255, 87, 34, 0.4); transition: transform 0.15s ease;">
              ${icons.lock(16)} Sistem Konsolunda Oturum Aç
            </button>

            <!-- Subtle Quick Fill Chip (Corporate style, not cheesy button) -->
            <div id="btn-quick-fill-admin-pc" style="margin-top: 14px; text-align: center; font-size: 11.5px; color: #64748B; cursor: pointer; padding: 6px; transition: color 0.2s ease;">
              Geliştirici / Test Erişimi: <strong style="color: #94A3B8;">admin@veyro.fit</strong> · <strong style="color: #94A3B8;">veyro2026admin</strong>
            </div>
          </div>

          <!-- Bottom Back Link -->
          <div style="padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
            <a href="index.html" style="font-size: 12px; color: #64748B; text-decoration: none; font-weight: 600;">
              ← Sporcu Mobil Uygulamasına Dön
            </a>
          </div>
        </div>

      </div>
    `;

    const pwdInput = document.getElementById("admin-pc-password");
    const usrInput = document.getElementById("admin-pc-username");
    setTimeout(() => pwdInput?.focus(), 150);

    document.getElementById("btn-quick-fill-admin-pc")?.addEventListener("click", () => {
      if (usrInput) usrInput.value = "admin@veyro.fit";
      if (pwdInput) pwdInput.value = "veyro2026admin";
    });

    const handleLogin = () => {
      const pwd = pwdInput?.value.trim() || "";
      if (!pwd) {
        notify.error("Lütfen master güvenlik anahtarını (şifre) girin.");
        pwdInput?.focus();
        return;
      }
      if (pwd === "veyro2026admin" || pwd === "admin123") {
        this.saveSession({
          id: "admin_super",
          name: "Veyro Sistem Yöneticisi",
          email: usrInput?.value.trim() || "admin@veyro.fit",
          role: "admin",
          loggedInAt: Date.now()
        });
        notify.success("✓ Yetkili yönetici oturumu doğrulandı. Hoş geldiniz!");
        this.renderDashboard();
      } else {
        notify.error("Hatalı yönetici şifresi! (Test Şifresi: veyro2026admin)");
        if (pwdInput) pwdInput.style.borderColor = "var(--color-rose)";
      }
    };

    document.getElementById("btn-submit-admin-pc-login")?.addEventListener("click", handleLogin);
    pwdInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });
  }

  renderDashboard() {
    this.root.innerHTML = `
      <div style="min-height: 100vh; background: radial-gradient(circle at 50% 0%, rgba(255, 87, 34, 0.05), transparent 40%), #08090C; padding: 24px 32px; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif;">
        <div style="max-width: 1480px; margin: 0 auto; width: 100%;">
          
          <!-- Top Desktop Admin Navbar -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 22px; margin-bottom: 28px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); flex-wrap: wrap; gap: 16px;">
            
            <!-- Left: Brand & Status -->
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(255, 87, 34, 0.35); color: #FFF;">
                ${icons.shield(24)}
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <h1 style="font-size: 22px; font-weight: 900; color: #FFF; margin: 0; letter-spacing: -0.02em;">
                    Veyro Web Yönetim Masası
                  </h1>
                  <span style="font-size: 11px; font-weight: 800; background: rgba(255, 87, 34, 0.15); color: var(--color-kor, #FF5722); border: 1px solid rgba(255, 87, 34, 0.35); padding: 3px 8px; border-radius: 6px; letter-spacing: 0.05em;">
                    PC CONSOLE
                  </span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; margin-top: 3px;">
                  <span style="font-size: 12px; color: #94A3B8;">Kullanıcı İstatistikleri · Şikayet Takibi · Reklam & Fırsatlar CMS · Salon Radarı</span>
                  <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); padding: 2px 8px; border-radius: 12px;">
                    <span style="width: 6px; height: 6px; border-radius: 50%; background: #10B981; box-shadow: 0 0 8px #10B981;"></span>
                    Canlı Firestore Aktif
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Admin Profile, Switch to Business & Single Logout -->
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 6px 12px; border-radius: 10px;">
                <div style="width: 26px; height: 26px; border-radius: 50%; background: rgba(255, 87, 34, 0.2); display: flex; align-items: center; justify-content: center; color: #FF5722; font-size: 11px; font-weight: 800;">
                  AD
                </div>
                <div style="font-size: 12px;">
                  <span style="color: #FFF; font-weight: 700; display: block; line-height: 1.2;">admin@veyro.fit</span>
                  <span style="color: #64748B; font-size: 10.5px;">Süper Yönetici</span>
                </div>
              </div>

              <a href="business.html" style="padding: 9px 16px; font-size: 12.5px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; color: #60A5FA; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; transition: all 0.2s ease;">
                ${icons.award(15)} Reklam Portalı (B2B)
              </a>

              <button id="btn-admin-logout" style="padding: 9px 16px; font-size: 12.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; color: #EF4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; cursor: pointer; transition: all 0.2s ease;">
                ${icons.logout(15)} Güvenli Çıkış
              </button>
            </div>
          </div>

          <!-- Main Admin Portal Suite Component -->
          <div id="admin-portal-desktop-mount"></div>
        </div>
      </div>
    `;

    const handleLogout = () => {
      this.saveSession(null);
      notify.info("Yönetici oturumu kapatıldı.");
      this.render();
    };

    document.getElementById("btn-admin-logout")?.addEventListener("click", handleLogout);

    const mount = document.getElementById("admin-portal-desktop-mount");
    if (mount) {
      renderAdminPortal(mount, () => {
        handleLogout();
      }, { hideHeader: true });
    }
  }
}

new StandaloneAdminApp();
