/**
 * Veyro - Top Header Component
 * Displays currently selected gym and user avatar badge.
 */

import { auth } from '../services/auth.js';
import { db } from '../services/db.js';
import { icons } from './icons.js';

export function renderHeader(container, onGymClick, onProfileClick, onAdminClick, onChatsClick) {
  const user = auth.getCurrentUser() || { id: "current-user", name: "Sporcu", initials: "SP", gymId: "all" };
  const allUsers = db.getCollection("users");
  const isAllGyms = !user.gymId || user.gymId === "all";
  const currentGym = !isAllGyms ? db.getItemById("gyms", user.gymId) : null;
  const memberCount = isAllGyms ? allUsers.length : allUsers.filter(u => u.gymId === user.gymId).length;
  const unreadCount = user.id ? db.getUnreadMessagesCount(user.id) : 0;

  container.innerHTML = `
    <header class="top-header safe-top">
      <button class="gym-selector-btn" id="btn-gym-select" aria-label="Spor Salonunu veya Bölgeyi Değiştir">
        <div>
          <div class="gym-selector-title">
            <span id="header-gym-name">${isAllGyms ? `${icons.pin(14)} Yakınımdaki Sporcular` : (currentGym?.name || 'Spor Salonu')}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <div class="gym-selector-sub" id="header-gym-stats">
            ${isAllGyms ? `${memberCount} aktif partner · 5 km çevresi` : `${currentGym?.district || ''} · ${memberCount} sporcu`}
          </div>
        </div>
      </button>

      <div style="display: flex; align-items: center; gap: 8px;">
        <!-- Chat Inbox Button with Live Unread Indicator -->
        <button class="btn-ghost" id="btn-header-chats" title="Sohbetler ve Mesajlar" aria-label="Sohbetler" style="position: relative; width: 38px; height: 38px; border-radius: 50%; background: var(--bg-surface-elevated); border: 1px solid var(--border-glass-bright); display: flex; align-items: center; justify-content: center; color: var(--text-main); cursor: pointer; transition: transform 0.2s ease;">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          ${unreadCount > 0 ? `
            <span class="badge-dot" style="position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; background: var(--color-kor); border-radius: 50%; box-shadow: 0 0 8px var(--color-kor);"></span>
          ` : ''}
        </button>

        <button type="button" role="button" class="avatar-badge-btn" id="btn-user-profile" aria-label="Kullanıcı Profili" style="overflow: hidden; padding: 0; cursor: pointer; position: relative; z-index: 50; touch-action: manipulation; user-select: none; -webkit-tap-highlight-color: transparent;">
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
