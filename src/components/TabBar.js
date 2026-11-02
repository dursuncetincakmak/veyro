/**
 * Veyro - Bottom Navigation Tab Bar Component
 * Tabs: Keşfet (Discover), Randevular (Appointments), Hareketler (Routines), Fırsatlar (Deals)
 */

import { db } from '../services/db.js';

export function renderTabBar(container, currentTab, onTabSelect) {
  // Check if there are incoming appointment requests
  const appointments = db.getCollection("appointments");
  const pendingIncoming = appointments.filter(a => a.status === "incoming_request").length;

  const nav = container.querySelector("#bottom-navigation");
  if (nav) {
    nav.querySelectorAll(".tab-item").forEach(button => {
      button.classList.toggle("active", button.dataset.tab === currentTab);
    });
    const aptBtn = nav.querySelector("[data-tab='appointments']");
    if (aptBtn) {
      const existingDot = aptBtn.querySelector(".badge-dot");
      if (pendingIncoming > 0 && !existingDot) {
        aptBtn.insertAdjacentHTML("beforeend", '<span class="badge-dot"></span>');
      } else if (pendingIncoming === 0 && existingDot) {
        existingDot.remove();
      }
    }
    return;
  }

  container.innerHTML = `
    <nav class="tab-bar safe-bottom" id="bottom-navigation">
      <button class="tab-item ${currentTab === 'discover' ? 'active' : ''}" data-tab="discover" aria-label="Keşfet">
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="8" r="4"></circle>
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
          <circle cx="19" cy="8" r="2"></circle>
          <path d="M22 17v-1a2 2 0 0 0-2-2"></path>
        </svg>
        <span class="tab-label">Keşfet</span>
      </button>

      <button class="tab-item ${currentTab === 'appointments' ? 'active' : ''}" data-tab="appointments" aria-label="Randevular">
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span class="tab-label">Randevular</span>
        ${pendingIncoming > 0 ? '<span class="badge-dot"></span>' : ''}
      </button>

      <button class="tab-item ${currentTab === 'routines' ? 'active' : ''}" data-tab="routines" aria-label="Hareketler">
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4M6 12h12"></path>
        </svg>
        <span class="tab-label">Hareketler</span>
      </button>

      <button class="tab-item ${currentTab === 'deals' ? 'active' : ''}" data-tab="deals" aria-label="Fırsatlar">
        <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
        <span class="tab-label">Fırsatlar</span>
      </button>
    </nav>
  `;

  container.querySelectorAll(".tab-item").forEach(button => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;
      if (tab) onTabSelect(tab);
    });
  });
}
