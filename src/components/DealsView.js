/**
 * Veyro - Fırsatlar (Gym Partnerships, Supplement & Gear Perks) View
 * Features:
 * - Category filtering (Tümü, Spor Salonu, Supplement, Giyim & Ekipman)
 * - Personalized local gym deal based on the athlete's active gym/city
 * - Bulletproof clipboard copy (with WebView/mobile fallback)
 * - Interactive "Fırsatı Kullan / QR Kupon" modal for instant in-gym or online redemption
 */

import { db } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { icons } from './icons.js';

const EXTRA_CURATED_DEALS = [
  {
    id: "deal-supplementler",
    brand: "SUPPLEMENTLER.COM",
    category: "supplement",
    title: "%15 Kreatin & Pre-Workout İndirimi",
    description: "Veyro sporcularına özel tüm mikronize kreatin, pre-workout ve elektrolit ürünlerinde geçerli anında %15 sepet indirimi.",
    badge: "SUPPLEMENT",
    code: "VEYROSUP15",
    validUntil: "31 Aralık 2026",
    ctaLink: "https://www.supplementler.com",
    bannerUrl: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: "deal-decathlon",
    brand: "DECATHLON TÜRKİYE",
    category: "gear",
    title: "Antrenman Ekipmanlarında 250 TL İndirim",
    description: "Ağırlık eldiveni, dizlik, lifting strap, shaker ve spor çantası alışverişlerinde 1000 TL üzeri anında 250 TL indirim.",
    badge: "EKİPMAN",
    code: "VEYRODEC250",
    validUntil: "31 Aralık 2026",
    ctaLink: "https://www.decathlon.com.tr",
    bannerUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop&q=80"
  }
];

function inferCategory(deal) {
  if (deal.category) return deal.category;
  const text = `${deal.brand || ''} ${deal.title || ''} ${deal.badge || ''} ${deal.description || ''}`.toLowerCase();
  if (text.includes('protein') || text.includes('bcaa') || text.includes('nutrition') || text.includes('supplement') || text.includes('kreatin')) {
    return 'supplement';
  }
  if (text.includes('giyim') || text.includes('armour') || text.includes('ayakkabı') || text.includes('ekipman') || text.includes('decathlon')) {
    return 'gear';
  }
  return 'gym';
}

async function copyCouponCode(code) {
  if (!code) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(code);
      return true;
    }
  } catch (e) {}

  try {
    const textArea = document.createElement("textarea");
    textArea.value = code;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textArea);
    return ok;
  } catch (err) {
    return false;
  }
}

export function renderDealsView(container) {
  let activeCategory = "all"; // 'all' | 'gym' | 'supplement' | 'gear'
  const currentUser = auth.getCurrentUser() || {};

  function buildDealsList() {
    const rawDeals = db.getCollection("deals") || [];
    const activeCampaigns = (db.getCampaigns ? db.getCampaigns() : []).filter(
      c => c.status === "active" && c.adType === "deals_card"
    );

    const campaignDeals = activeCampaigns.map(c => ({
      id: `camp_deal_${c.id}`,
      campaignId: c.id,
      brand: c.brandName,
      title: c.title,
      description: c.description,
      badge: "SPONSORLU",
      code: c.code || "VEYROVIP",
      validUntil: c.validUntil || "31 Aralık 2026",
      ctaLink: c.ctaLink || "",
      bannerUrl: c.bannerUrl || "",
      isSponsored: true
    }));

    const merged = [...campaignDeals];

    // Add personalized local gym deal if user has a gym or city
    const userGymName = currentUser.gymName && currentUser.gymName !== "Tüm Salonlar"
      ? currentUser.gymName
      : (currentUser.city ? `${currentUser.city} Partner Salonları` : null);

    if (userGymName) {
      merged.unshift({
        id: "deal-local-user-gym",
        brand: userGymName.toUpperCase(),
        category: "gym",
        title: "Partnerinle Gel: 1 Ay + %25 Üyelik Avantajı",
        description: `${userGymName} bünyesinde Veyro antrenman partnerinle birlikte kayıt veya yenileme yaptığında anında %25 indirim ve ücretsiz 2 misafir giriş hakkı.`,
        badge: "SENİN SALONUN",
        code: "VEYROPARTNER25",
        validUntil: "31 Aralık 2026",
        bannerUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80",
        isLocalGymDeal: true
      });
    }

    // Merge DB deals + Curated deals without duplicate codes
    [...rawDeals, ...EXTRA_CURATED_DEALS].forEach(d => {
      if (!merged.some(m => m.code === d.code && m.title === d.title)) {
        merged.push({
          ...d,
          category: inferCategory(d)
        });
      }
    });

    return merged.map(d => ({
      ...d,
      category: inferCategory(d)
    }));
  }

  function openRedeemModal(deal) {
    let modal = document.getElementById("deal-redeem-modal-overlay");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "deal-redeem-modal-overlay";
      modal.className = "modal-overlay";
      document.body.appendChild(modal);
    }

    const userCode = `${deal.code}-${(currentUser.id || "VYR").slice(-4).toUpperCase()}`;

    modal.innerHTML = `
      <div class="modal-drawer fade-in" style="max-width: 430px; padding: 22px 20px 28px;">
        <div class="drawer-pill-bar"></div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <span class="badge badge-kor" style="font-size: 10.5px; padding: 4px 10px;">${deal.badge || 'VEYRO FIRSAT'}</span>
          <button class="btn-ghost" id="btn-close-deal-modal" style="padding: 6px;" aria-label="Kapat">
            ${icons.close ? icons.close(20) : '✕'}
          </button>
        </div>

        <div style="font-size: 11.5px; font-weight: 800; color: var(--color-kor); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">
          ${deal.brand}
        </div>
        <h3 style="font-size: 20px; font-weight: 800; color: #FFF; margin: 0 0 8px 0; line-height: 1.25;">
          ${deal.title}
        </h3>
        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin: 0 0 18px 0;">
          ${deal.description}
        </p>

        <!-- Digital Pass & Barcode Visual -->
        <div class="deal-qr-pass-box">
          <div class="deal-qr-header">
            <span>VEYRO DİJİTAL SPORCU KUPONU</span>
            <span style="color: #10B981;">● AKTİF</span>
          </div>
          <div class="deal-barcode-bars" aria-hidden="true">
            ${Array.from({ length: 34 }).map((_, i) => `<span style="width:${(i % 3 === 0) ? 4 : (i % 2 === 0 ? 2 : 3)}px; height: 46px; background: #FFF; opacity: ${0.75 + (i % 3) * 0.08}; display:inline-block;"></span>`).join('')}
          </div>
          <div style="font-family: monospace; font-size: 12px; color: var(--text-secondary); letter-spacing: 0.16em; margin-top: 6px;">
            PASS ID: ${userCode}
          </div>
        </div>

        <!-- Copyable Code Box -->
        <div class="deal-code-box" style="margin-bottom: 16px;">
          <div>
            <span style="font-size: 10px; color: var(--text-muted); display: block; margin-bottom: 2px;">İNDİRİM KODU</span>
            <span class="code-text">${deal.code}</span>
          </div>
          <button class="btn-copy-code" id="btn-modal-copy-code" data-code="${deal.code}">
            Kodu Kopyala
          </button>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 12px; padding: 12px 14px; margin-bottom: 18px; font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
          <strong style="color: #FFF; display: block; margin-bottom: 4px;">Nasıl Kullanılır?</strong>
          1. İndirim kodunu kopyalayın veya dijital barkodu salon/mağaza görevlisine gösterin.<br>
          2. Online alışverişlerde ödeme adımında <strong>${deal.code}</strong> kodunu girerek indirimi anında uygulayın.
        </div>

        <div style="display: flex; gap: 10px;">
          ${deal.ctaLink ? `
            <a href="${deal.ctaLink}" target="_blank" rel="noopener noreferrer" class="btn-kor" id="btn-deal-external-go" style="flex: 1; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 16px; border-radius: 12px; font-size: 14px; font-weight: 800;">
              <span>Mağazaya Git & Kullan</span> ${icons.chevronRight(16)}
            </a>
          ` : `
            <button type="button" class="btn-kor" id="btn-deal-activate-pass" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 16px; border-radius: 12px; font-size: 14px; font-weight: 800;">
              ${icons.check(16)} <span>Kuponu Şimdi Aktifleştir</span>
            </button>
          `}
        </div>
      </div>
    `;

    modal.classList.add("open");

    const closeModal = () => modal.classList.remove("open");
    modal.querySelector("#btn-close-deal-modal")?.addEventListener("click", closeModal);
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    modal.querySelector("#btn-modal-copy-code")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      await copyCouponCode(deal.code);
      soundService.playSuccessChime();
      notify.success(`"${deal.code}" panoya kopyalandı!`);
      btn.textContent = "✓ Kopyalandı";
      btn.classList.add("copied");
    });

    modal.querySelector("#btn-deal-activate-pass")?.addEventListener("click", async () => {
      await copyCouponCode(deal.code);
      soundService.playSuccessChime();
      notify.success(`${deal.brand} kuponunuz aktifleştirildi ve kod kopyalandı!`);
      closeModal();
    });

    modal.querySelector("#btn-deal-external-go")?.addEventListener("click", async () => {
      await copyCouponCode(deal.code);
      if (deal.campaignId && db.recordCampaignClick) {
        db.recordCampaignClick(deal.campaignId);
      }
      notify.info(`"${deal.code}" kodu kopyalandı, mağazaya yönlendiriliyorsunuz...`);
    });
  }

  function render() {
    const allDeals = buildDealsList();
    const filteredDeals = activeCategory === "all"
      ? allDeals
      : allDeals.filter(d => d.category === activeCategory);

    // Record impressions for sponsored deals
    filteredDeals.forEach(d => {
      if (d.campaignId && db.recordCampaignImpression) {
        db.recordCampaignImpression(d.campaignId);
      }
    });

    const categories = [
      { id: "all", label: "Tümü", count: allDeals.length },
      { id: "gym", label: "Spor Salonu", count: allDeals.filter(d => d.category === "gym").length },
      { id: "supplement", label: "Supplement", count: allDeals.filter(d => d.category === "supplement").length },
      { id: "gear", label: "Giyim & Ekipman", count: allDeals.filter(d => d.category === "gear").length }
    ];

    container.innerHTML = `
      <div class="deals-page fade-in">
        <div class="deals-header-top">
          <div>
            <h2 style="font-size: 24px; font-weight: 800; margin: 0 0 4px 0; color: var(--text-main);">Sporcu Fırsatları</h2>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">
              Antrenman partnerinle sana özel salon, supplement ve ekipman ayrıcalıkları
            </p>
          </div>
          <span class="deals-count-pill">${filteredDeals.length} Aktif Fırsat</span>
        </div>

        <!-- Category Filter Bar -->
        <div class="deals-category-bar">
          ${categories.map(cat => `
            <button type="button" class="deal-cat-pill ${activeCategory === cat.id ? 'active' : ''}" data-cat="${cat.id}">
              <span>${cat.label}</span>
              <span class="deal-cat-count">${cat.count}</span>
            </button>
          `).join('')}
        </div>

        <div class="deals-grid">
          ${filteredDeals.map(deal => `
            <div class="deal-card ${deal.isLocalGymDeal ? 'deal-card-featured' : ''}" data-deal-id="${deal.id}">
              ${deal.bannerUrl ? `
                <div class="deal-banner-wrap">
                  <img src="${deal.bannerUrl}" alt="${deal.brand}" loading="lazy">
                  <div class="deal-banner-gradient"></div>
                  <div class="deal-badge-pill">${deal.badge}</div>
                  <div class="deal-banner-brand">${deal.brand}</div>
                </div>
              ` : `
                <div class="deal-badge-pill">${deal.badge}</div>
                <div class="deal-brand">${deal.brand}</div>
              `}

              <h3 class="deal-title">${deal.title}</h3>
              <p class="deal-desc">${deal.description}</p>

              <div class="deal-code-box">
                <div>
                  <span style="font-size: 10px; color: var(--text-muted); display: block; margin-bottom: 2px; font-weight: 700;">KUPON KODU</span>
                  <span class="code-text">${deal.code}</span>
                </div>
                <div class="deal-actions-group">
                  <button type="button" class="btn-copy-code" data-code="${deal.code}" data-campaign-id="${deal.campaignId || ''}">
                    Kopyala
                  </button>
                  <button type="button" class="btn-use-deal" data-redeem-id="${deal.id}">
                    Fırsatı Kullan
                  </button>
                </div>
              </div>

              <div class="deal-footer-meta">
                <span>Son geçerlilik: <strong>${deal.validUntil || '31 Aralık 2026'}</strong></span>
                <span class="deal-verified-tag">✓ Veyro Onaylı</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Category filter click
    container.querySelectorAll(".deal-cat-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.cat;
        render();
      });
    });

    // Copy code buttons
    container.querySelectorAll(".btn-copy-code").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const code = btn.dataset.code;
        const campId = btn.dataset.campaignId;

        if (campId && db.recordCampaignClick) {
          db.recordCampaignClick(campId);
        }

        await copyCouponCode(code);
        soundService.playSuccessChime();
        notify.success(`"${code}" indirim kodu panoya kopyalandı!`);

        const originalText = btn.textContent;
        btn.textContent = "✓ Kopyalandı";
        btn.classList.add("copied");

        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove("copied");
        }, 2200);
      });
    });

    // Redeem / Use Deal buttons
    container.querySelectorAll(".btn-use-deal").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const dealId = btn.dataset.redeemId;
        const found = allDeals.find(d => d.id === dealId);
        if (found) {
          openRedeemModal(found);
        }
      });
    });
  }

  render();
}
