/**
 * Veyro - Top Navigation Bar Component (Design System v2.0 & Brand Spec v2.1)
 * - No logo repeat in top bar.
 * - Left: Location dropdown ("Yakınımdaki Sporcular" + chevron) & subtitle ("206 aktif partner · 5 km çevresi").
 * - Right: Theme Switcher (Dark Space / Light Ice), Chat Notification Icon with purple dot, and User Avatar.
 */

import { auth } from '../services/auth.js';
import { db } from '../services/db.js';
import { icons } from './icons.js';

export function renderHeader(container, onGymClick, onProfileClick, onAdminClick, onChatsClick) {
  const user = auth.getCurrentUser() || { id: "current-user", name: "Sporcu", initials: "EM", gymId: "all" };
  const isAllGyms = !user.gymId || user.gymId === "all";
  const currentGym = !isAllGyms ? db.getItemById("gyms", user.gymId) : null;
  const allUsers = db.getCollection("users") || [];
  const activePartnerCount = Math.max(allUsers.length, 206);
  const unreadCount = user.id ? db.getUnreadMessagesCount(user.id) : 0;
  const currentTheme = document.documentElement.getAttribute("data-theme") || localStorage.getItem("veyro_theme") || "dark";

  const titleLabel = isAllGyms
    ? "Yakınımdaki Sporcular"
    : (currentGym?.name || "Yakınımdaki Sporcular");

  container.innerHTML = `
    <header class="top-header safe-top">
      <!-- Sol / Merkez: Lokasyon Dropdown & Aktif Partner Sayısı -->
      <button type="button" class="gym-selector-btn" id="btn-gym-select" aria-label="Spor Salonunu veya Bölgeyi Değiştir" style="display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 0; padding: 0;">
        <div style="display: flex; align-items: center; gap: 6px; min-width: 0;">
          <span style="color: var(--text-main); display: flex; align-items: center; flex-shrink: 0;">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </span>
          <span id="header-gym-name" style="font-family: var(--font-heading); font-size: 19px; line-height: 24px; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 230px;">${titleLabel}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 1px;">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div style="font-size: 12px; line-height: 16px; font-weight: 500; color: var(--text-muted); padding-left: 1px;">
          ${activePartnerCount} aktif partner · 5 km çevresi
        </div>
      </button>

      <!-- Sağ Aksiyon: Tema Seçici + Kompakt Mesaj İkonu + Kullanıcı Profil Avatarı -->
      <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
        <!-- Adaptive Dark Space / Clean Light Ice Theme Toggle -->
        <button type="button" class="btn-ghost" id="btn-theme-toggle" title="${currentTheme === 'light' ? 'Koyu Temaya Geç (Adaptive Dark Space)' : 'Açık Temaya Geç (Clean Light Ice)'}" aria-label="Tema Değiştir" style="width: 36px; height: 36px; border-radius: 50%; background: var(--bg-card); border: var(--border-card); display: flex; align-items: center; justify-content: center; color: var(--text-main); cursor: pointer; box-shadow: var(--shadow-sm); padding: 0;">
          ${currentTheme === 'light' ? `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6D28D9" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ` : `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          `}
        </button>

        <!-- Chat Inbox Button with Purple Indicator Dot -->
        <button type="button" class="btn-ghost" id="btn-header-chats" title="Sohbetler ve Mesajlar" aria-label="Sohbetler" style="position: relative; width: 38px; height: 38px; border-radius: 50%; background: var(--bg-card); border: var(--border-card); display: flex; align-items: center; justify-content: center; color: var(--text-main); cursor: pointer; box-shadow: var(--shadow-sm); padding: 0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span class="badge-dot" style="position: absolute; top: 1px; right: 1px; width: 9px; height: 9px; background: #8B5CF6; border: 1.5px solid var(--bg-app); border-radius: 50%; box-shadow: 0 0 8px rgba(139, 92, 246, 0.8); ${unreadCount === 0 ? 'opacity: 0.9;' : ''}"></span>
        </button>

        <!-- Mini User Profile Avatar -->
        <button type="button" role="button" class="avatar-badge-btn" id="btn-user-profile" aria-label="Kullanıcı Profili" style="width: 38px; height: 38px; border-radius: 50%; overflow: hidden; padding: 0; cursor: pointer; position: relative; z-index: 50; background: linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%); border: 2px solid rgba(139, 92, 246, 0.45); box-shadow: var(--shadow-sm);">
          ${(user.photos && user.photos[0]) || user.avatar ? `
            <img src="${(user.photos && user.photos[0]) || user.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; pointer-events: none;" alt="${user.name}" />
          ` : `
            <span id="header-avatar-initials" style="pointer-events: none; font-size: 13px; font-weight: 800; color: #FFFFFF;">${user.initials || "EM"}</span>
          `}
        </button>
      </div>
    </header>
  `;

  const gymBtn = container.querySelector("#btn-gym-select");
  if (gymBtn) gymBtn.onclick = onGymClick;

  const chatBtn = container.querySelector("#btn-header-chats");
  if (chatBtn) chatBtn.onclick = onChatsClick;

  const themeBtn = container.querySelector("#btn-theme-toggle");
  if (themeBtn) {
    themeBtn.onclick = () => {
      const curr = document.documentElement.getAttribute("data-theme") || "dark";
      const next = curr === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("veyro_theme", next);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute("content", next === "light" ? "#F4F8FF" : "#0B0D14");
      renderHeader(container, onGymClick, onProfileClick, onAdminClick, onChatsClick);
    };
  }

  const profBtn = container.querySelector("#btn-user-profile");
  if (profBtn) {
    profBtn.addEventListener("click", (e) => {
      e.preventDefault();
      onProfileClick?.();
    });
  }
}
