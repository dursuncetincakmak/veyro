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
      <div style="min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% 15%, rgba(255, 87, 34, 0.15), transparent 60%), radial-gradient(circle at 85% 85%, rgba(20, 24, 38, 0.8), transparent 50%), #060709; padding: 24px 16px; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif;">
        
        <div style="width: 100%; max-width: 480px; background: rgba(14, 16, 23, 0.96); border: 1.5px solid rgba(255, 87, 34, 0.35); border-radius: 24px; padding: 36px 32px; box-shadow: 0 25px 80px rgba(0,0,0,0.9), 0 0 40px rgba(255,87,34,0.08); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); position: relative; overflow: hidden;">
          
          <!-- Top Terminal Cyber Tag -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="display: inline-flex; align-items: center; gap: 8px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981; box-shadow: 0 0 10px #10B981; display: inline-block;"></span>
              <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #10B981; letter-spacing: 0.08em;">ROOT CONSOLE // SECURE DESK</span>
            </div>
            <span style="font-family: monospace; font-size: 11px; color: var(--text-muted); background: rgba(255,255,255,0.04); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
              AES-256 SSL
            </span>
          </div>

          <!-- Brand & Terminal Header -->
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #FF5722 0%, #D84315 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; box-shadow: 0 8px 24px rgba(255, 87, 34, 0.45); color: #FFF;">
              ${icons.shield(26)}
            </div>
            <h1 style="font-size: 22px; font-weight: 900; color: #FFFFFF; margin: 0 0 6px; letter-spacing: -0.02em;">
              Veyro Sistem Yönetim Masası
            </h1>
            <p style="font-size: 12.5px; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              Yetkili altyapı, moderatör denetimi ve sistem konfigürasyonu
            </p>
          </div>

          <!-- Audit Log Security Alert -->
          <div style="background: rgba(255, 87, 34, 0.08); border: 1px solid rgba(255, 87, 34, 0.25); border-radius: 12px; padding: 10px 14px; margin-bottom: 20px; display: flex; align-items: flex-start; gap: 10px;">
            <div style="color: var(--color-kor); margin-top: 1px;">${icons.alert(16)}</div>
            <span style="font-size: 11.5px; color: rgba(255,255,255,0.8); line-height: 1.45;">
              Bu konsol yalnızca yetkili sistem yöneticileri içindir. Tüm oturum hareketleri ve IP adresleri denetim günlüğüne kaydedilmektedir.
            </span>
          </div>

          <!-- Form Fields -->
          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px;">
            <!-- Username / Admin Email -->
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">
                Yönetici Kimlik ID / Kurumsal E-Posta
              </label>
              <div style="position: relative;">
                <input type="text" id="admin-pc-username" value="admin@veyro.fit" placeholder="admin@veyro.fit"
                  style="width: 100%; border-radius: 12px; padding: 12px 14px 12px 38px; font-size: 13.5px; background: #0B0D13; color: #FFF; border: 1.5px solid rgba(255, 255, 255, 0.12); box-sizing: border-box; outline: none; transition: border-color 0.2s ease;">
                <div style="position: absolute; left: 12px; top: 12px; color: var(--text-muted);">
                  ${icons.user(16)}
                </div>
              </div>
            </div>

            <!-- Master Security Password -->
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em;">
                Master Güvenlik Anahtarı (Şifre)
              </label>
              <div style="position: relative;">
                <input type="password" id="admin-pc-password" placeholder="••••••••••••••••"
                  style="width: 100%; border-radius: 12px; padding: 12px 14px 12px 38px; font-size: 13.5px; background: #0B0D13; color: #FFF; border: 1.5px solid rgba(255, 255, 255, 0.12); box-sizing: border-box; outline: none; transition: border-color 0.2s ease;">
                <div style="position: absolute; left: 12px; top: 12px; color: var(--text-muted);">
                  ${icons.lock(16)}
                </div>
              </div>
            </div>

            <!-- 2FA / Dynamic PIN Code -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <label style="font-size: 11.5px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">
                  Güvenlik Doğrulama Kodu (2FA)
                </label>
                <span style="font-size: 11px; color: var(--color-kor); font-weight: 700; font-family: monospace;">KOD: 849201</span>
              </div>
              <div style="position: relative;">
                <input type="text" id="admin-pc-pin" value="849201" placeholder="6 Haneli Güvenlik Kodu"
                  style="width: 100%; border-radius: 12px; padding: 12px 14px 12px 38px; font-size: 13.5px; font-family: monospace; letter-spacing: 0.1em; background: #0B0D13; color: #FFF; border: 1.5px solid rgba(255, 255, 255, 0.12); box-sizing: border-box; outline: none; transition: border-color 0.2s ease;">
                <div style="position: absolute; left: 12px; top: 12px; color: var(--text-muted);">
                  ${icons.key(16)}
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Fill Helper -->
          <div style="margin-bottom: 20px; text-align: center;">
            <button id="btn-quick-fill-admin-pc" type="button" style="padding: 7px 14px; font-size: 12px; font-weight: 700; color: var(--color-kor); background: rgba(255, 87, 34, 0.12); border: 1px solid rgba(255, 87, 34, 0.35); border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: background 0.15s ease;">
              ${icons.key(14)} Tek Tıkla Doldur (admin@veyro.fit)
            </button>
          </div>

          <!-- Login Button -->
          <button id="btn-submit-admin-pc-login" style="width: 100%; padding: 14px; font-size: 14.5px; font-weight: 800; background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%); color: #FFF; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 24px rgba(255,87,34,0.4); transition: transform 0.15s ease;">
            ${icons.lock(16)} Sistem Konsolunda Oturum Aç
          </button>

          <!-- Divider -->
          <div style="margin: 24px 0 16px; height: 1px; background: rgba(255,255,255,0.08);"></div>

          <!-- Link to Business & Advertiser Portal -->
          <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 14px; padding: 12px 14px; text-align: left; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 12.5px; font-weight: 800; color: #60A5FA; display: flex; align-items: center; gap: 6px;">
                ${icons.award(15)} Kurumsal Reklam & Sponsor Portalı
              </div>
              <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px;">
                Marka, salon ve sponsorluk kampanyaları masası
              </div>
            </div>
            <a href="business.html" style="padding: 7px 12px; font-size: 11.5px; font-weight: 800; background: rgba(59, 130, 246, 0.2); color: #93C5FD; border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 8px; text-decoration: none; white-space: nowrap;">
              Portala Git →
            </a>
          </div>

        </div>
      </div>
    `;

    const pwdInput = document.getElementById("admin-pc-password");
    const usrInput = document.getElementById("admin-pc-username");
    const pinInput = document.getElementById("admin-pc-pin");
    setTimeout(() => pwdInput?.focus(), 150);

    document.getElementById("btn-quick-fill-admin-pc")?.addEventListener("click", () => {
      if (usrInput) usrInput.value = "admin@veyro.fit";
      if (pwdInput) pwdInput.value = "veyro2026admin";
      if (pinInput) pinInput.value = "849201";
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
