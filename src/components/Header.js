/**
 * Veyro - Top Header Component
 * Displays currently selected gym and user avatar badge.
 */

import { auth } from '../services/auth.js';
import { db } from '../services/db.js';
import { locationService } from '../services/location.js';
import { icons } from './icons.js';

export function renderHeader(container, onGymClick, onProfileClick, onAdminClick, onChatsClick) {
  const user = auth.getCurrentUser() || { id: "current-user", name: "Sporcu", initials: "SP", gymId: "all" };
  const isAllGyms = !user.gymId || user.gymId === "all";
  const currentGym = !isAllGyms ? db.getItemById("gyms", user.gymId) : null;
  const activeLoc = locationService.getActiveLocation() || { district: "Çorlu", city: "Tekirdağ" };
  const unreadCount = user.id ? db.getUnreadMessagesCount(user.id) : 0;
  const locationLabel = isAllGyms
    ? `${activeLoc.district || 'Çorlu'}, ${activeLoc.city || 'Tekirdağ'}`
    : (currentGym?.name || 'Spor Salonu');

  container.innerHTML = `
    <header class="top-header safe-top">
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
        <!-- Luxury Brand Monogram -->
        <div style="display: flex; align-items: center; gap: 7px; flex-shrink: 0;">
          <span style="width: 9px; height: 9px; border-radius: 50%; background: var(--color-kor); box-shadow: 0 0 10px var(--color-kor);"></span>
          <span style="font-family: var(--font-heading); font-size: 18px; font-weight: 900; letter-spacing: 0.08em; color: #FFFFFF;">VEYRO</span>
        </div>

        <span style="width: 1px; height: 16px; background: rgba(255,255,255,0.12); flex-shrink: 0;"></span>

        <!-- Sleek Location / Gym Pill -->
        <button class="gym-selector-btn" id="btn-gym-select" aria-label="Spor Salonunu veya Bölgeyi Değiştir" style="padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); min-width: 0;">
          <span style="color: var(--color-kor); display: flex; flex-shrink: 0;">${icons.pin(12)}</span>
          <span id="header-gym-name" style="font-size: 12.5px; font-weight: 700; color: #E5E7EB; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 155px;">${locationLabel}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2.5" style="flex-shrink: 0;">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>

      <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
        <!-- Chat Inbox Button with Live Unread Indicator -->
        <button class="btn-ghost" id="btn-header-chats" title="Sohbetler ve Mesajlar" aria-label="Sohbetler" style="position: relative; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: var(--text-main); cursor: pointer; transition: transform 0.2s ease;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          ${unreadCount > 0 ? `
            <span class="badge-dot" style="position: absolute; top: 3px; right: 3px; width: 7px; height: 7px; background: var(--color-kor); border-radius: 50%; box-shadow: 0 0 8px var(--color-kor);"></span>
          ` : ''}
        </button>

        <button type="button" role="button" class="avatar-badge-btn" id="btn-user-profile" aria-label="Kullanıcı Profili" style="width: 36px; height: 36px; overflow: hidden; padding: 0; cursor: pointer; position: relative; z-index: 50; touch-action: manipulation; user-select: none; -webkit-tap-highlight-color: transparent;">
          ${(user.photos && user.photos[0]) || user.avatar ? `
            <img src="${(user.photos && user.photos[0]) || user.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; pointer-events: none;" alt="${user.name}" />
          ` : `
            <span id="header-avatar-initials" style="pointer-events: none;">${user.initials || "SP"}</span>
          `}
          <span class="avatar-online-dot" style="pointer-events: none;"></span>
        </button>
      </div>
    </header>
  `;

  const gymBtn = container.querySelector("#btn-gym-select");
  if (gymBtn) gymBtn.onclick = onGymClick;

  const chatBtn = container.querySelector("#btn-header-chats");
  if (chatBtn) chatBtn.onclick = onChatsClick;

  const profBtn = container.querySelector("#btn-user-profile");
  if (profBtn) {
    profBtn.addEventListener("click", (e) => {
      e.preventDefault();
      onProfileClick?.();
    });
  }
}
