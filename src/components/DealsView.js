/**
 * Veyro - Fırsatlar (Deals & Gym Partnerships) View
 */

import { db } from '../services/db.js';
import { notify } from '../services/notification.js';

export function renderDealsView(container) {
  const deals = db.getCollection("deals");

  container.innerHTML = `
    <div class="deals-page fade-in">
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 26px; font-weight: 800; color: var(--text-main);">Fırsatlar</h2>
        <p style="font-size: 13px; color: var(--text-secondary);">
          Veyro üyelerine ve partner antrenmanlarına özel salon & besin takviyesi ayrıcalıkları.
        </p>
      </div>

      <div class="deals-grid">
        ${deals.map(deal => `
          <div class="deal-card" data-deal-id="${deal.id}">
            <span class="deal-badge-pill">${deal.badge}</span>
            <div class="deal-brand">${deal.brand}</div>
            <h3 class="deal-title">${deal.title}</h3>
            <p class="deal-desc">${deal.description}</p>

            <div class="deal-code-box">
              <span class="code-text" id="code-${deal.id}">${deal.code}</span>
              <button class="btn-copy-code" data-code="${deal.code}">
                Kodu Kopyala
              </button>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 10px;">
              Son geçerlilik: ${deal.validUntil}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.querySelectorAll(".btn-copy-code").forEach(btn => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.code;
      navigator.clipboard?.writeText(code);
      btn.textContent = "Kopyalandı!";
      notify.success(`${code} kupon kodu panoya kopyalandı!`);
      setTimeout(() => {
        btn.textContent = "Kodu Kopyala";
      }, 2000);
    });
  });
}
