/**
 * Veyro Business - Müşteri & Reklam Veren Portalı
 * Markalar, Spor Salonları ve Sponsorlar İçin Kampanya Yönetim ve İstatistik Masası
 */

import './styles/main.css';
import './styles/business.css';

import { db } from './services/db.js';
import { notify } from './services/notification.js';
import { icons } from './components/icons.js';

const BIZ_SESSION_KEY = "veyro_biz_session_adv";

class VeyroBusinessApp {
  constructor() {
    this.root = document.getElementById("business-app");
    this.currentAdv = this.loadSession();
    this.activeTab = "kpis"; // 'kpis' | 'campaigns' | 'preview' | 'billing'
    this.selectedCampaignForPreview = null;
    this.authTab = "login"; // 'login' | 'register'
    this.init();
  }

  loadSession() {
    try {
      const raw = localStorage.getItem(BIZ_SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  saveSession(adv) {
    this.currentAdv = adv;
    if (adv) {
      localStorage.setItem(BIZ_SESSION_KEY, JSON.stringify(adv));
    } else {
      localStorage.removeItem(BIZ_SESSION_KEY);
    }
  }

  async init() {
    if (!this.root) return;
    try {
      await db.syncWithServer();
    } catch (e) {}

    this.render();

    // Auto-refresh when DB changes
    db.subscribe("campaigns", () => {
      this.refreshData();
    });
    db.subscribe("advertisers", () => {
      this.refreshData();
    });
  }

  refreshData() {
    if (this.currentAdv) {
      const updated = db.getAdvertiserById(this.currentAdv.id);
      if (updated) this.currentAdv = updated;
      this.render();
    }
  }

  render() {
    if (!this.root) return;

    if (!this.currentAdv) {
      this.renderAuthScreen();
    } else {
      this.renderDashboard();
    }
  }

  // ==========================================
  // AUTHENTICATION SCREEN (ENTERPRISE B2B LOGIN & REGISTER)
  // ==========================================
  renderAuthScreen() {
    this.root.innerHTML = `
      <div class="biz-shell" style="display: flex; align-items: center; justify-content: center; padding: 40px 16px; min-height: 100vh; background: radial-gradient(circle at 50% 10%, rgba(59, 130, 246, 0.12), transparent 55%), radial-gradient(circle at 85% 85%, rgba(18, 22, 36, 0.8), transparent 50%), #08090D; font-family: 'Plus Jakarta Sans', sans-serif;">
        <div style="width: 100%; max-width: 500px; background: rgba(14, 17, 26, 0.96); border: 1.5px solid rgba(59, 130, 246, 0.3); border-radius: 24px; padding: 36px 32px; box-shadow: 0 25px 80px rgba(0,0,0,0.9), 0 0 50px rgba(59, 130, 246, 0.08); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); position: relative; overflow: hidden;">
          
          <!-- Top Badge -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; margin-bottom: 22px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="display: inline-flex; align-items: center; gap: 8px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #3B82F6; box-shadow: 0 0 10px #3B82F6; display: inline-block;"></span>
              <span style="font-family: monospace; font-size: 11px; font-weight: 700; color: #60A5FA; letter-spacing: 0.08em;">B2B REKLAM VE SPONSORLUK MASASI</span>
            </div>
            <span style="font-family: monospace; font-size: 11px; color: #94A3B8; background: rgba(255,255,255,0.04); padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
              ENTERPRISE
            </span>
          </div>

          <!-- Brand Header -->
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; box-shadow: 0 8px 24px rgba(59,130,246,0.35); color: #FFF;">
              ${icons.award(26)}
            </div>
            <h1 style="font-size: 24px; font-weight: 900; color: #FFF; margin: 0 0 6px; letter-spacing: -0.02em;">
              Veyro Business
            </h1>
            <p style="font-size: 13px; color: #94A3B8; margin: 0; line-height: 1.5;">
              Spor salonları, takviye markaları ve kurumsal reklam yönetimi
            </p>
          </div>

          <!-- Auth Mode Tabs (Giriş Yap vs Yeni Marka) -->
          <div style="display: flex; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 4px; margin-bottom: 22px;">
            <button id="tab-btn-biz-login" style="flex: 1; padding: 9px; font-size: 12.5px; font-weight: 800; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s ease; ${this.authTab === 'login' ? 'background: #3B82F6; color: #FFF; box-shadow: 0 2px 8px rgba(59,130,246,0.3);' : 'background: transparent; color: #94A3B8;'}">
              Kurumsal Giriş
            </button>
            <button id="tab-btn-biz-register" style="flex: 1; padding: 9px; font-size: 12.5px; font-weight: 800; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s ease; ${this.authTab === 'register' ? 'background: #3B82F6; color: #FFF; box-shadow: 0 2px 8px rgba(59,130,246,0.3);' : 'background: transparent; color: #94A3B8;'}">
              Yeni Marka Kaydı
            </button>
          </div>

          <!-- Form Area -->
          ${this.authTab === 'login' ? `
            <!-- LOGIN FORM -->
            <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
              <div>
                <label style="font-size: 11.5px; font-weight: 700; color: #94A3B8; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em;">
                  Kurumsal E-Posta
                </label>
                <div style="position: relative;">
                  <input type="email" id="input-login-email" value="reklam@hardline.com.tr" placeholder="reklam@sirketiniz.com" style="width: 100%; border-radius: 12px; padding: 12px 14px 12px 38px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1.5px solid rgba(255,255,255,0.1); box-sizing: border-box; outline: none; transition: border-color 0.2s ease;">
                  <div style="position: absolute; left: 12px; top: 12px; color: #64748B;">
                    ${icons.mail(16)}
                  </div>
                </div>
              </div>

              <div>
                <label style="font-size: 11.5px; font-weight: 700; color: #94A3B8; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em;">
                  Portal Şifresi
                </label>
                <div style="position: relative;">
                  <input type="password" id="input-login-password" value="veyro2026" placeholder="••••••••••••" style="width: 100%; border-radius: 12px; padding: 12px 14px 12px 38px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1.5px solid rgba(255,255,255,0.1); box-sizing: border-box; outline: none; transition: border-color 0.2s ease;">
                  <div style="position: absolute; left: 12px; top: 12px; color: #64748B;">
                    ${icons.lock(16)}
                  </div>
                </div>
              </div>

              <!-- Quick Demo Fill -->
              <div style="text-align: center; margin: 4px 0;">
                <button id="btn-quick-fill-biz" type="button" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 6px 12px; font-size: 11.5px; font-weight: 700; color: #60A5FA; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
                  ${icons.key(13)} Demo Giriş Bilgilerini Doldur (Hardline Nutrition)
                </button>
              </div>

              <button id="btn-submit-login-adv" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 800; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #FFF; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 24px rgba(59,130,246,0.35); transition: transform 0.15s ease;">
                ${icons.lock(16)} Portala Giriş Yap
              </button>
            </div>
          ` : `
            <!-- REGISTER FORM -->
            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
              <div>
                <label style="font-size: 11.5px; font-weight: 700; color: #94A3B8; display: block; margin-bottom: 5px; text-transform: uppercase;">
                  Marka / Şirket Adı
                </label>
                <input type="text" id="input-reg-brand" placeholder="Örn: BigJoy Nutrition veya Kadıköy Gym" style="width: 100%; border-radius: 10px; padding: 11px 14px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1px solid rgba(255,255,255,0.12); box-sizing: border-box; outline: none;">
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="font-size: 11.5px; font-weight: 700; color: #94A3B8; display: block; margin-bottom: 5px; text-transform: uppercase;">
                    Yetkili İsim Soyisim
                  </label>
                  <input type="text" id="input-reg-contact" placeholder="Adınız Soyadınız" style="width: 100%; border-radius: 10px; padding: 11px 14px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1px solid rgba(255,255,255,0.12); box-sizing: border-box; outline: none;">
                </div>
                <div>
                  <label style="font-size: 11.5px; font-weight: 700; color: #94A3B8; display: block; margin-bottom: 5px; text-transform: uppercase;">
                    Sektör
                  </label>
                  <select id="input-reg-sector" style="width: 100%; border-radius: 10px; padding: 11px 14px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1px solid rgba(255,255,255,0.12); box-sizing: border-box; outline: none;">
                    <option value="Supplement & Besin Takviyesi">Supplement & Takviye</option>
                    <option value="Spor Salonu Zinciri">Spor Salonu / Kulüp</option>
                    <option value="Spor Giyim & Ekipman">Spor Giyim / Ayakkabı</option>
                    <option value="Sağlıklı Beslenme & Diyet">Sağlıklı Yemek / Diyet</option>
                    <option value="Personal Coaching">Personal Trainer / Antrenör</option>
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="font-size: 11.5px; font-weight: 700; color: #94A3B8; display: block; margin-bottom: 5px; text-transform: uppercase;">
                    Kurumsal E-Posta
                  </label>
                  <input type="email" id="input-reg-email" placeholder="reklam@sirketiniz.com" style="width: 100%; border-radius: 10px; padding: 11px 14px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1px solid rgba(255,255,255,0.12); box-sizing: border-box; outline: none;">
                </div>
                <div>
                  <label style="font-size: 11.5px; font-weight: 700; color: #94A3B8; display: block; margin-bottom: 5px; text-transform: uppercase;">
                    Kurumsal Telefon
                  </label>
                  <input type="tel" id="input-reg-phone" placeholder="05XX XXX XX XX" style="width: 100%; border-radius: 10px; padding: 11px 14px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1px solid rgba(255,255,255,0.12); box-sizing: border-box; outline: none;">
                </div>
              </div>

              <button id="btn-submit-reg-adv" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 800; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #FFF; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 24px rgba(59,130,246,0.35); margin-top: 6px;">
                ${icons.rocket(16)} Kurumsal Hesap Aç (10.000 ₺ Hoş Geldin Kredisi)
              </button>
            </div>
          `}

          <!-- Bottom Navigation Links -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px;">
            <a href="admin.html" style="color: var(--color-kor, #FF5722); text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
              ${icons.shield(14)} Sistem Yöneticisi Girişi →
            </a>
            <a href="index.html" style="color: #64748B; text-decoration: none; font-weight: 600;">
              ← Sporcu Uygulamasına Dön
            </a>
          </div>

        </div>
      </div>
    `;

    // Tab Switches
    document.getElementById("tab-btn-biz-login")?.addEventListener("click", () => {
      this.authTab = "login";
      this.renderAuthScreen();
    });
    document.getElementById("tab-btn-biz-register")?.addEventListener("click", () => {
      this.authTab = "register";
      this.renderAuthScreen();
    });

    // Quick fill for demo
    document.getElementById("btn-quick-fill-biz")?.addEventListener("click", () => {
      const emailInput = document.getElementById("input-login-email");
      const pwdInput = document.getElementById("input-login-password");
      if (emailInput) emailInput.value = "reklam@hardline.com.tr";
      if (pwdInput) pwdInput.value = "veyro2026";
    });

    // Login Handler
    const handleLogin = () => {
      const email = document.getElementById("input-login-email")?.value.trim().toLowerCase();
      const pwd = document.getElementById("input-login-password")?.value.trim();

      if (!email) {
        notify.error("Lütfen kurumsal e-posta adresinizi girin.");
        return;
      }

      // Check registered advertisers
      const advertisers = db.getAdvertisers();
      let matched = advertisers.find(a => a.email?.toLowerCase() === email || a.brandName?.toLowerCase() === email);

      if (!matched) {
        // If not found in default list, try matching common domains or create a session
        if (email.includes("hardline")) {
          matched = advertisers.find(a => a.id === "adv-1") || advertisers[0];
        } else if (email.includes("macfit")) {
          matched = advertisers.find(a => a.id === "adv-2") || advertisers[0];
        } else if (email.includes("underarmour")) {
          matched = advertisers.find(a => a.id === "adv-3") || advertisers[0];
        } else {
          // Create on-the-fly advertiser for seamless testing with any valid email
          const brandNameFromEmail = email.split("@")[0].toUpperCase();
          matched = {
            id: "adv-" + Date.now(),
            brandName: brandNameFromEmail + " Fitness",
            contactName: "Kurumsal Temsilci",
            email: email,
            phone: "0850 123 45 67",
            sector: "Spor Giyim & Ekipman",
            balance: 15000,
            status: "approved",
            createdAt: new Date().toISOString().split("T")[0]
          };
          db.saveAdvertiser(matched);
        }
      }

      if (matched) {
        this.saveSession(matched);
        notify.success(`✓ Hoş geldiniz! ${matched.brandName} kurumsal reklam paneline giriş yapıldı.`);
        this.render();
      }
    };

    document.getElementById("btn-submit-login-adv")?.addEventListener("click", handleLogin);
    document.getElementById("input-login-password")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleLogin();
    });

    // Registration Handler
    document.getElementById("btn-submit-reg-adv")?.addEventListener("click", () => {
      const brand = document.getElementById("input-reg-brand")?.value.trim();
      const contact = document.getElementById("input-reg-contact")?.value.trim();
      const sector = document.getElementById("input-reg-sector")?.value;
      const email = document.getElementById("input-reg-email")?.value.trim();
      const phone = document.getElementById("input-reg-phone")?.value.trim();

      if (!brand || !email) {
        notify.error("Lütfen marka adını ve kurumsal e-posta adresinizi girin.");
        return;
      }

      const newAdv = {
        id: "adv-" + Date.now(),
        brandName: brand,
        contactName: contact || "Yetkili Temsilci",
        email: email,
        phone: phone || "",
        sector: sector,
        balance: 10000, // Hoş geldin 10.000 TL test kredisi
        status: "approved",
        createdAt: new Date().toISOString().split("T")[0]
      };

      db.saveAdvertiser(newAdv);
      this.saveSession(newAdv);
      notify.success(`✓ Tebrikler! ${brand} kurumsal reklam hesabı oluşturuldu (10.000 ₺ test kredisi yüklendi).`);
      this.render();
    });
  }

  // ==========================================
  // ADVERTISER MAIN DASHBOARD
  // ==========================================
  renderDashboard() {
    const adv = this.currentAdv;
    const campaigns = db.getCampaigns(adv.id);
    const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
    const totalSpent = campaigns.reduce((acc, c) => acc + (c.spent || 0), 0);
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

    this.root.innerHTML = `
      <div class="biz-shell">
        <!-- Top Executive Navbar -->
        <header class="biz-navbar">
          <div class="biz-brand">
            <div class="biz-logo-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
            <div>
              <div style="font-size: 16px; font-weight: 900; color: #FFF; display: flex; align-items: center; gap: 8px;">
                ${adv.brandName}
                <span style="font-size: 11px; font-weight: 700; color: #60A5FA; background: rgba(59,130,246,0.15); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(59,130,246,0.3);">
                  ${adv.sector}
                </span>
              </div>
              <div style="font-size: 11.5px; color: var(--text-secondary);">Veyro Business Reklam Masası · Yetkili: ${adv.contactName}</div>
            </div>
          </div>

          <div class="biz-nav-actions">
            <!-- Balance Indicator -->
            <div class="biz-balance-badge">
              <span style="color: var(--text-muted); font-size: 11px;">Cüzdan:</span>
              <span>${Number(adv.balance || 0).toLocaleString("tr-TR")} ₺</span>
            </div>

            <button id="btn-top-up-quick" style="padding: 8px 14px; font-size: 12.5px; font-weight: 800; background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              ${icons.flame(14)} + Bakiye Yükle
            </button>

            <button id="btn-create-campaign-modal" style="padding: 8px 16px; font-size: 12.5px; font-weight: 800; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #FFF; border: none; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 16px rgba(59,130,246,0.3);">
              ${icons.rocket(14)} + Yeni Kampanya
            </button>

            <a href="admin.html" style="padding: 8px 14px; font-size: 12px; font-weight: 700; color: var(--color-kor, #FF5722); background: rgba(255, 87, 34, 0.1); border: 1px solid rgba(255, 87, 34, 0.3); border-radius: 10px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
              ${icons.shield(14)} Sistem Yöneticisi Masası
            </a>

            <button id="btn-biz-logout" style="padding: 8px 14px; font-size: 12px; font-weight: 700; color: #EF4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
              ${icons.logout(14)} Güvenli Çıkış
            </button>
          </div>
        </header>

        <!-- Main Body Container -->
        <main class="biz-container">
          
          <!-- Navigation Tabs -->
          <div class="biz-tabs">
            <button class="biz-tab-btn ${this.activeTab === 'kpis' ? 'active' : ''}" data-tab="kpis">
              ${icons.chart(15)} Canlı Performans & Metrikler
            </button>
            <button class="biz-tab-btn ${this.activeTab === 'campaigns' ? 'active' : ''}" data-tab="campaigns">
              ${icons.award(15)} Kampanyalarım (${campaigns.length})
            </button>
            <button class="biz-tab-btn ${this.activeTab === 'preview' ? 'active' : ''}" data-tab="preview">
              ${icons.phone(15)} Mobil Fırsat Simülatörü
            </button>
            <button class="biz-tab-btn ${this.activeTab === 'billing' ? 'active' : ''}" data-tab="billing">
              ${icons.creditCard(15)} Reklam Kredisi & Faturalar
            </button>
          </div>

          <!-- Dynamic View Body -->
          <div id="biz-tab-mount">
            ${this.renderActiveTabContent({ adv, campaigns, totalImpressions, totalClicks, totalSpent, avgCTR })}
          </div>

        </main>
      </div>

      <!-- Campaign Creation Modal Mount -->
      <div id="biz-modal-overlay" style="display: none;"></div>
    `;

    // Event Listeners
    this.root.querySelectorAll(".biz-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeTab = btn.dataset.tab;
        this.render();
      });
    });

    document.getElementById("btn-biz-logout")?.addEventListener("click", () => {
      this.saveSession(null);
      notify.info("Reklam veren oturumu kapatıldı.");
      this.render();
    });

    document.getElementById("btn-top-up-quick")?.addEventListener("click", () => {
      this.activeTab = "billing";
      this.render();
    });

    document.getElementById("btn-create-campaign-modal")?.addEventListener("click", () => {
      this.openCampaignModal();
    });

    this.attachTabSpecificListeners();
  }

  // ==========================================
  // TAB CONTENT RENDERERS
  // ==========================================
  renderActiveTabContent(data) {
    if (this.activeTab === "kpis") {
      return this.renderKpiTab(data);
    } else if (this.activeTab === "campaigns") {
      return this.renderCampaignsTab(data);
    } else if (this.activeTab === "preview") {
      return this.renderPreviewTab(data);
    } else if (this.activeTab === "billing") {
      return this.renderBillingTab(data);
    }
    return "";
  }

  // 1. KPI Tab
  renderKpiTab({ adv, campaigns, totalImpressions, totalClicks, totalSpent, avgCTR }) {
    return `
      <!-- KPI Grid -->
      <div class="biz-kpi-grid">
        <div class="biz-kpi-card">
          <span class="biz-kpi-title">Toplam Gösterim</span>
          <span class="biz-kpi-value">${totalImpressions.toLocaleString("tr-TR")}</span>
          <span class="biz-kpi-trend" style="color: #10B981;">
            ${icons.flame(14)} Sporcu Fırsatlar ve Keşfet Alanında
          </span>
        </div>

        <div class="biz-kpi-card">
          <span class="biz-kpi-title">Toplam Tıklama / Kupon</span>
          <span class="biz-kpi-value">${totalClicks.toLocaleString("tr-TR")}</span>
          <span class="biz-kpi-trend" style="color: #60A5FA;">
            ${icons.rocket(14)} Doğrudan Mağaza Yönlendirmesi
          </span>
        </div>

        <div class="biz-kpi-card">
          <span class="biz-kpi-title">Tıklama Oranı (CTR)</span>
          <span class="biz-kpi-value">%${avgCTR}</span>
          <span class="biz-kpi-trend" style="color: #10B981;">
            Sektör Ortalamasının %42 Üzerinde
          </span>
        </div>

        <div class="biz-kpi-card">
          <span class="biz-kpi-title">Harcanan Reklam Bütçesi</span>
          <span class="biz-kpi-value">${Number(totalSpent).toLocaleString("tr-TR")} ₺</span>
          <span class="biz-kpi-trend" style="color: var(--text-secondary);">
            Kalan Bakiye: ${Number(adv.balance || 0).toLocaleString("tr-TR")} ₺
          </span>
        </div>
      </div>

      <!-- Audience & Live Impact Insights -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; flex-wrap: wrap;">
        <div class="biz-card">
          <h3 style="font-size: 16px; font-weight: 800; color: #FFF; margin: 0 0 16px; display: flex; align-items: center; gap: 8px;">
            ${icons.dumbbell(16)} Sporcu Hedef Kitle Kırılımı (Veyro Demografi)
          </h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
            Reklamlarınız, salona giden ve aktif partner arayan sporcuların ilgi alanlarına göre optimize edilmektedir.
          </p>

          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 700; margin-bottom: 6px;">
                <span>Kas & Hipertrofi / Ağırlık Sporcuları</span>
                <span style="color: var(--color-kor);">%54 (Yüksek Dönüşüm)</span>
              </div>
              <div style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.06); overflow: hidden;">
                <div style="width: 54%; height: 100%; background: linear-gradient(90deg, #FF5722, #FF9800); border-radius: 4px;"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 700; margin-bottom: 6px;">
                <span>Definasyon & Kilo Verme / Kardiyo</span>
                <span style="color: #60A5FA;">%28</span>
              </div>
              <div style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.06); overflow: hidden;">
                <div style="width: 28%; height: 100%; background: #3B82F6; border-radius: 4px;"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 700; margin-bottom: 6px;">
                <span>CrossFit, Güç & Fonksiyonel Atletizm</span>
                <span style="color: #10B981;">%18</span>
              </div>
              <div style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.06); overflow: hidden;">
                <div style="width: 18%; height: 100%; background: #10B981; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="biz-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: #FFF; margin: 0 0 12px;">
              🚀 Hızlı Kampanya Aksiyonu
            </h3>
            <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">
              Veyro mobil uygulamasında <strong>Fırsatlar</strong> sekmesinde kupon kodunuzu yayınlayarak salon üyelerini anında web sitenize veya şubenize çekin.
            </p>
          </div>
          
          <button id="btn-quick-create-from-kpi" style="width: 100%; padding: 13px; font-size: 13.5px; font-weight: 800; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #FFF; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
            ${icons.rocket(15)} Yeni Kampanya Başlat
          </button>
        </div>
      </div>
    `;
  }

  // 2. Campaigns Tab
  renderCampaignsTab({ adv, campaigns }) {
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 900; color: #FFF; margin: 0 0 4px;">Aktif ve Geçmiş Kampanyalarınız</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Sporculara sunulan indirim, üyelik ve sponsorluk kampanyaları.</p>
        </div>
        <button id="btn-create-campaign-tab" style="padding: 10px 18px; font-size: 13px; font-weight: 800; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #FFF; border: none; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
          ${icons.rocket(15)} + Yeni Kampanya Başlat
        </button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${campaigns.length === 0 ? `
          <div class="biz-card" style="text-align: center; padding: 48px 20px;">
            <div style="font-size: 32px; margin-bottom: 12px;">📢</div>
            <h3 style="font-size: 18px; font-weight: 800; color: #FFF; margin: 0 0 8px;">Henüz aktif reklam kampanyanız bulunmuyor</h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">İlk kampanyanızı oluşturarak Veyro sporcularına özel fırsat sunun.</p>
            <button id="btn-create-campaign-empty" style="padding: 11px 22px; font-size: 13.5px; font-weight: 800; background: #3B82F6; color: #FFF; border: none; border-radius: 10px; cursor: pointer;">
              İlk Kampanyanızı Başlatın
            </button>
          </div>
        ` : campaigns.map(c => `
          <div class="biz-card" style="display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 72px; height: 72px; border-radius: 14px; overflow: hidden; background: #1B1E2B; flex-shrink: 0; border: 1px solid var(--biz-border);">
                <img src="${c.bannerUrl || 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=200&q=80'}" style="width: 100%; height: 100%; object-fit: cover;" alt="${c.title}">
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <h3 style="font-size: 16.5px; font-weight: 800; color: #FFF; margin: 0;">${c.title}</h3>
                  <span class="biz-status-badge ${c.status}">
                    ${c.status === 'active' ? '● Yayında' : (c.status === 'pending' ? '⏳ Onay Bekliyor' : '⏸ Duraklatıldı')}
                  </span>
                </div>
                <p style="font-size: 12.5px; color: var(--text-secondary); margin: 0 0 6px; max-width: 520px; line-height: 1.4;">
                  ${c.description}
                </p>
                <div style="display: flex; align-items: center; gap: 14px; font-size: 12px; color: var(--text-muted);">
                  <span>Hedef: <strong style="color: #FFF;">${c.targetAudience}</strong></span>
                  <span>Kupon: <code style="color: var(--color-kor); background: rgba(255,87,34,0.1); padding: 2px 6px; border-radius: 4px; font-weight: 800;">${c.code}</code></span>
                  <span>Bitiş: ${c.validUntil || '31 Aralık 2026'}</span>
                </div>
              </div>
            </div>

            <!-- Stats & Action Buttons -->
            <div style="display: flex; align-items: center; gap: 20px;">
              <div style="text-align: right;">
                <div style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Performans</div>
                <div style="font-size: 15px; font-weight: 800; color: #FFF;">
                  ${(c.impressions || 0).toLocaleString("tr-TR")} <span style="font-size: 11px; color: var(--text-muted);">gösterim</span>
                </div>
                <div style="font-size: 12px; color: #10B981; font-weight: 700;">
                  ${(c.clicks || 0).toLocaleString("tr-TR")} tıklama (${Number(c.spent || 0).toLocaleString("tr-TR")} ₺)
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 8px;">
                <button class="btn-toggle-camp-status" data-id="${c.id}" data-current="${c.status}" style="padding: 8px 12px; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.06); border: 1px solid var(--biz-border); color: #FFF; border-radius: 8px; cursor: pointer;">
                  ${c.status === 'active' ? 'Duraklat' : 'Yayına Al'}
                </button>
                <button class="btn-preview-camp" data-id="${c.id}" style="padding: 8px 12px; font-size: 12px; font-weight: 700; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); color: #60A5FA; border-radius: 8px; cursor: pointer;">
                  Önizle
                </button>
                <button class="btn-delete-camp" data-id="${c.id}" style="padding: 8px 10px; font-size: 12px; font-weight: 700; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: var(--color-rose); border-radius: 8px; cursor: pointer;">
                  Sil
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 3. Live Mobile Simulator Tab
  renderPreviewTab({ adv, campaigns }) {
    const selected = this.selectedCampaignForPreview || campaigns[0] || {
      brandName: adv.brandName,
      title: "%20 Protein & BCAA İndirimi",
      description: "Tüm izole protein tozu ve amino asit siparişlerinizde sepet anında %20 indirim.",
      code: "VEYROFIT20",
      validUntil: "31 Aralık 2026",
      badge: "SPONSOR"
    };

    return `
      <div style="display: grid; grid-template-columns: 1fr 380px; gap: 28px; align-items: start; flex-wrap: wrap;">
        <div>
          <h2 style="font-size: 20px; font-weight: 900; color: #FFF; margin: 0 0 6px;">Canlı Mobil Fırsat Simülatörü</h2>
          <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5;">
            Sporcuların telefon ekranında <strong>Fırsatlar</strong> sekmesinde kuponunuzun ve sponsorluğunuzun nasıl görüneceğini gerçek zamanlı olarak test edin.
          </p>

          <div class="biz-card">
            <h4 style="font-size: 14px; font-weight: 800; color: #FFF; margin: 0 0 12px;">Önizlenecek Kampanyayı Seçin:</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${campaigns.map(c => `
                <button class="btn-select-preview-camp" data-id="${c.id}" style="text-align: left; padding: 12px 16px; border-radius: 12px; background: ${selected.id === c.id ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${selected.id === c.id ? 'var(--biz-primary)' : 'var(--biz-border)'}; color: #FFF; cursor: pointer; display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div style="font-size: 14px; font-weight: 800;">${c.title}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">Kupon Kodu: ${c.code} · Durum: ${c.status}</div>
                  </div>
                  <span style="color: ${selected.id === c.id ? '#60A5FA' : 'var(--text-muted)'}; font-size: 12px; font-weight: 700;">
                    ${selected.id === c.id ? '✓ Seçili' : 'Önizle'}
                  </span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Phone Frame Simulation -->
        <div class="biz-sim-frame">
          <div class="biz-sim-notch"></div>
          
          <div style="padding: 12px 14px 6px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 14px; font-weight: 900; color: #FFF; display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--color-kor); font-size: 16px;">V</span> veyro
            </div>
            <span style="font-size: 10px; font-weight: 800; color: var(--color-kor); background: rgba(255,87,34,0.15); padding: 2px 6px; border-radius: 4px;">
              SPORCU EKRANI
            </span>
          </div>

          <div style="padding: 14px; overflow-y: auto; flex: 1;">
            <div style="font-size: 16px; font-weight: 900; color: #FFF; margin-bottom: 2px;">Fırsatlar</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 14px;">Partner antrenmanlarına özel salon & sponsor ayrıcalıkları.</div>

            <!-- Simulated Deal Card in Mobile -->
            <div style="background: var(--bg-surface-elevated, #141620); border: 1.5px solid var(--border-glass-bright, rgba(255,87,34,0.3)); border-radius: 18px; padding: 16px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
              <span style="position: absolute; top: 12px; right: 12px; background: rgba(255, 87, 34, 0.2); color: var(--color-kor); border: 1px solid rgba(255, 87, 34, 0.4); font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 12px;">
                SPONSORLU
              </span>

              <div style="font-size: 11px; font-weight: 800; color: var(--color-kor); text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">
                ${selected.brandName || adv.brandName}
              </div>

              <h4 style="font-size: 15px; font-weight: 800; color: #FFF; margin: 0 0 6px;">
                ${selected.title}
              </h4>

              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4; margin: 0 0 12px;">
                ${selected.description}
              </p>

              <!-- Coupon Code Box -->
              <div style="background: rgba(0,0,0,0.4); border: 1px dashed rgba(255, 87, 34, 0.5); border-radius: 10px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-family: monospace; font-size: 13px; font-weight: 900; color: var(--color-kor); letter-spacing: 0.05em;">
                  ${selected.code}
                </span>
                <span style="font-size: 10.5px; font-weight: 800; background: var(--color-kor-gradient); color: #FFF; padding: 4px 8px; border-radius: 6px;">
                  Kodu Kopyala
                </span>
              </div>

              <div style="font-size: 10px; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between;">
                <span>Son Geçerlilik: ${selected.validUntil || '31 Aralık 2026'}</span>
                <span style="color: #10B981;">✓ Doğrulandı</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 4. Billing Tab
  renderBillingTab({ adv }) {
    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; flex-wrap: wrap;">
        <!-- Top Up Card -->
        <div class="biz-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <h3 style="font-size: 17px; font-weight: 900; color: #FFF; margin: 0;">Reklam Kredisi Yükle</h3>
            <span style="font-size: 13px; font-weight: 800; color: #10B981;">Mevcut: ${Number(adv.balance || 0).toLocaleString("tr-TR")} ₺</span>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 20px;">
            Yüklediğiniz bakiye yalnızca sporcular kupon kodunuza tıkladığında veya yönlendirme yapıldığında (CPC modeli) bakiyenizden düşer.
          </p>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px;">
            <button class="btn-select-topup" data-amount="5000" style="padding: 14px 10px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 12px; color: #FFF; font-weight: 800; cursor: pointer; text-align: center;">
              <div style="font-size: 16px; color: #60A5FA;">5.000 ₺</div>
              <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 4px;">Başlangıç Paketi</div>
            </button>
            <button class="btn-select-topup" data-amount="15000" style="padding: 14px 10px; background: rgba(59,130,246,0.15); border: 1.5px solid #3B82F6; border-radius: 12px; color: #FFF; font-weight: 800; cursor: pointer; text-align: center;">
              <div style="font-size: 16px; color: #93C5FD;">15.000 ₺</div>
              <div style="font-size: 10.5px; color: #10B981; margin-top: 4px;">%10 Bonus Kredi</div>
            </button>
            <button class="btn-select-topup" data-amount="30000" style="padding: 14px 10px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 12px; color: #FFF; font-weight: 800; cursor: pointer; text-align: center;">
              <div style="font-size: 16px; color: #60A5FA;">30.000 ₺</div>
              <div style="font-size: 10.5px; color: #10B981; margin-top: 4px;">%20 Bonus Kredi</div>
            </button>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
              Veya Özel Tutar Girin (₺)
            </label>
            <input type="number" id="input-custom-topup" placeholder="Örn: 20000" style="width: 100%; border-radius: 10px; padding: 12px 14px; font-size: 14px; background: #0A0D14; color: #FFF; border: 1px solid var(--biz-border); box-sizing: border-box; outline: none;">
          </div>

          <button id="btn-submit-topup" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 800; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFF; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
            ${icons.lock(15)} Güvenli Kurumsal Bakiye Yükle (Simülasyon)
          </button>
        </div>

        <!-- Corporate Invoicing Card -->
        <div class="biz-card">
          <h3 style="font-size: 17px; font-weight: 900; color: #FFF; margin: 0 0 14px;">Kurumsal Fatura Bilgileri</h3>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--biz-border); padding-bottom: 6px;">
              <span>Şirket Unvanı:</span>
              <strong style="color: #FFF;">${adv.brandName} Tic. A.Ş.</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--biz-border); padding-bottom: 6px;">
              <span>Vergi Dairesi / No:</span>
              <strong style="color: #FFF;">Boğaziçi VD / ${adv.companyTaxNo || '4560128930'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--biz-border); padding-bottom: 6px;">
              <span>E-Fatura Adresi:</span>
              <strong style="color: #FFF;">${adv.email}</strong>
            </div>
          </div>

          <h4 style="font-size: 14px; font-weight: 800; color: #FFF; margin: 0 0 10px;">Son Kesilen Faturalar:</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--biz-border); border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #FFF;">FAT-2026-00492 · Reklam Hizmet Bedeli</div>
                <div style="font-size: 11px; color: var(--text-muted);">25 Ekim 2026 · E-Arşiv Fatura</div>
              </div>
              <button class="btn-download-invoice" style="padding: 6px 10px; font-size: 11px; font-weight: 700; color: #60A5FA; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 6px; cursor: pointer;">
                PDF İndir
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // MODAL: CREATE NEW CAMPAIGN
  // ==========================================
  openCampaignModal() {
    const overlay = document.getElementById("biz-modal-overlay");
    if (!overlay) return;

    overlay.style.display = "flex";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.background = "rgba(0,0,0,0.85)";
    overlay.style.backdropFilter = "blur(10px)";
    overlay.style.zIndex = "10000";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "20px";
    overlay.style.boxSizing = "border-box";

    overlay.innerHTML = `
      <div style="width: 100%; max-width: 620px; max-height: 90vh; overflow-y: auto; background: var(--biz-surface); border: 1.5px solid var(--biz-border-bright); border-radius: 24px; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.9);">
        
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h3 style="font-size: 20px; font-weight: 900; color: #FFF; margin: 0 0 4px;">Yeni Reklam Kampanyası Başlat</h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Sporculara özel teklifinizi yapılandırın.</p>
          </div>
          <button id="btn-close-camp-modal" style="background: transparent; border: none; color: var(--text-muted); font-size: 24px; cursor: pointer; padding: 4px;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
              Kampanya Başlığı (Sporcunun Göreceği Başlık)
            </label>
            <input type="text" id="input-camp-title" placeholder="Örn: %25 Whey Protein & Amino Asit İndirimi" style="width: 100%; border-radius: 10px; padding: 12px 14px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1px solid var(--biz-border); box-sizing: border-box; outline: none;">
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
              Kampanya Detay Açıklaması
            </label>
            <textarea id="input-camp-desc" rows="3" placeholder="Veyro partnerinizle beraber sipariş verirken kullanabileceğiniz özel sepet indirimi..." style="width: 100%; border-radius: 10px; padding: 12px 14px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1px solid var(--biz-border); box-sizing: border-box; outline: none; resize: vertical;"></textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
                İndirim / Kupon Kodu
              </label>
              <input type="text" id="input-camp-code" placeholder="Örn: VEYRO25" style="width: 100%; border-radius: 10px; padding: 12px 14px; font-size: 13.5px; font-family: monospace; font-weight: 800; color: var(--color-kor); background: #0A0D14; border: 1px solid var(--biz-border); box-sizing: border-box; outline: none;">
            </div>

            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
                Hedef Kitle / Sporcu Seviyesi
              </label>
              <select id="input-camp-target" style="width: 100%; border-radius: 10px; padding: 12px 14px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1px solid var(--biz-border); box-sizing: border-box; outline: none;">
                <option value="Tüm Sporcular">Tüm Sporcular (Geniş Erişim)</option>
                <option value="Kas & Güç">Kas & Güç (Ağırlık Çalışanlar)</option>
                <option value="Definasyon / Kilo Verme">Kilo Verme / Definasyon</option>
                <option value="CrossFit & Fonksiyonel">CrossFit & Fonksiyonel</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
                Yönlendirme Web Sitesi (CTA Link)
              </label>
              <input type="url" id="input-camp-link" placeholder="https://siteniz.com/kampanya" style="width: 100%; border-radius: 10px; padding: 12px 14px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1px solid var(--biz-border); box-sizing: border-box; outline: none;">
            </div>

            <div>
              <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
                Toplam Bütçe (₺)
              </label>
              <input type="number" id="input-camp-budget" value="10000" placeholder="10000" style="width: 100%; border-radius: 10px; padding: 12px 14px; font-size: 13.5px; background: #0A0D14; color: #FFF; border: 1px solid var(--biz-border); box-sizing: border-box; outline: none;">
            </div>
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
              Görsel Banner (Hazır Fitness Görsellerinden Seçin veya Link Girin)
            </label>
            <input type="text" id="input-camp-banner" value="https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&q=80" placeholder="https://..." style="width: 100%; border-radius: 10px; padding: 12px 14px; font-size: 13px; background: #0A0D14; color: #FFF; border: 1px solid var(--biz-border); box-sizing: border-box; outline: none;">
          </div>

          <button id="btn-save-new-campaign" style="width: 100%; padding: 14px; font-size: 14.5px; font-weight: 800; background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: #FFF; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 24px rgba(59,130,246,0.4); margin-top: 10px;">
            ${icons.rocket(16)} Kampanyayı Başlat & Yayına Al
          </button>
        </div>
      </div>
    `;

    const close = () => {
      overlay.style.display = "none";
    };

    document.getElementById("btn-close-camp-modal")?.addEventListener("click", close);
    overlay.onclick = (e) => {
      if (e.target === overlay) close();
    };

    document.getElementById("btn-save-new-campaign")?.addEventListener("click", () => {
      const title = document.getElementById("input-camp-title")?.value.trim();
      const desc = document.getElementById("input-camp-desc")?.value.trim();
      const code = document.getElementById("input-camp-code")?.value.trim();
      const targetAudience = document.getElementById("input-camp-target")?.value;
      const ctaLink = document.getElementById("input-camp-link")?.value.trim();
      const totalBudget = Number(document.getElementById("input-camp-budget")?.value) || 10000;
      const bannerUrl = document.getElementById("input-camp-banner")?.value.trim();

      if (!title || !code) {
        notify.error("Lütfen kampanya başlığını ve indirim kupon kodunu girin.");
        return;
      }

      const newCamp = {
        id: "camp-" + Date.now(),
        advertiserId: this.currentAdv.id,
        brandName: this.currentAdv.brandName,
        title: title,
        description: desc || `${this.currentAdv.brandName} tarafından Veyro sporcularına özel kampanya.`,
        adType: "deals_card",
        targetAudience: targetAudience,
        targetGym: "all",
        code: code.toUpperCase(),
        ctaLink: ctaLink || "https://veyro-fit.vercel.app",
        bannerUrl: bannerUrl || "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&q=80",
        dailyBudget: Math.round(totalBudget / 30),
        totalBudget: totalBudget,
        spent: 0,
        impressions: 1,
        clicks: 0,
        status: "active",
        validUntil: "31 Aralık 2026",
        createdAt: new Date().toISOString().split("T")[0]
      };

      db.saveCampaign(newCamp);
      notify.success(`✓ "${title}" kampanyası başarıyla oluşturuldu ve sporcu mobil Fırsatlar ekranına yüklendi!`);
      close();
      this.activeTab = "campaigns";
      this.render();
    });
  }

  // ==========================================
  // EVENT LISTENERS FOR TAB ACTIONS
  // ==========================================
  attachTabSpecificListeners() {
    // Quick create from KPI tab
    document.getElementById("btn-quick-create-from-kpi")?.addEventListener("click", () => {
      this.openCampaignModal();
    });

    document.getElementById("btn-create-campaign-tab")?.addEventListener("click", () => {
      this.openCampaignModal();
    });

    document.getElementById("btn-create-campaign-empty")?.addEventListener("click", () => {
      this.openCampaignModal();
    });

    // Toggle Campaign Status (Active / Paused)
    this.root.querySelectorAll(".btn-toggle-camp-status").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const current = btn.dataset.current;
        const next = current === 'active' ? 'paused' : 'active';
        db.updateCampaignStatus(id, next);
        notify.info(`Kampanya durumu "${next === 'active' ? 'Yayında' : 'Duraklatıldı'}" olarak güncellendi.`);
        this.render();
      });
    });

    // Preview Campaign in simulator
    this.root.querySelectorAll(".btn-preview-camp").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const camps = db.getCampaigns(this.currentAdv.id);
        const found = camps.find(c => c.id === id);
        if (found) {
          this.selectedCampaignForPreview = found;
          this.activeTab = "preview";
          this.render();
        }
      });
    });

    // Select Preview in simulator tab
    this.root.querySelectorAll(".btn-select-preview-camp").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const camps = db.getCampaigns(this.currentAdv.id);
        const found = camps.find(c => c.id === id);
        if (found) {
          this.selectedCampaignForPreview = found;
          this.render();
        }
      });
    });

    // Delete Campaign
    this.root.querySelectorAll(".btn-delete-camp").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (confirm("Bu kampanyayı silmek istediğinizden emin misiniz?")) {
          db.deleteCampaign(id);
          notify.info("Kampanya silindi.");
          this.render();
        }
      });
    });

    // Top up preset selection
    this.root.querySelectorAll(".btn-select-topup").forEach(btn => {
      btn.addEventListener("click", () => {
        const amount = btn.dataset.amount;
        const input = document.getElementById("input-custom-topup");
        if (input) input.value = amount;
      });
    });

    // Submit Top Up
    document.getElementById("btn-submit-topup")?.addEventListener("click", () => {
      const input = document.getElementById("input-custom-topup");
      const val = Number(input?.value) || 5000;
      if (val < 500) {
        notify.error("Minimum yükleme tutarı 500 ₺'dir.");
        return;
      }
      db.topUpAdvertiserBalance(this.currentAdv.id, val);
      notify.success(`✓ ${val.toLocaleString("tr-TR")} ₺ reklam kredisi cüzdanınıza başarıyla eklendi!`);
      this.refreshData();
    });

    // Download invoice simulation
    this.root.querySelectorAll(".btn-download-invoice").forEach(btn => {
      btn.addEventListener("click", () => {
        notify.success("Kurumsal E-Arşiv Fatura PDF formatında indirildi.");
      });
    });
  }
}

new VeyroBusinessApp();
