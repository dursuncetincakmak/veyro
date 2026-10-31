/**
 * Veyro - Profile Detail & Action Sheet Modal
 * Follows Page 6 of the PDF with full verification, photo carousel (up to 8 photos),
 * workout slot, and safety actions (Engelle, Şikayet et).
 */

import { db } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { showChatModal } from './ChatModal.js';
import { showReportModal } from './ReportModal.js';
import { icons } from './icons.js';

export function showProfileDetailModal(user, onSendRequest, onClose) {
  let modalOverlay = document.getElementById("profile-detail-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "profile-detail-overlay";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  const gym = db.getItemById("gyms", user.gymId) || { name: "Spor Salonu", district: "İstanbul" };
  const photos = (Array.isArray(user.photos) && user.photos.length > 0)
    ? user.photos
    : (user.avatar ? [user.avatar] : []);
  let activePhotoIdx = 0;

  function updateCarouselView() {
    const imgEl = document.getElementById("profile-detail-carousel-img");
    if (imgEl && photos[activePhotoIdx]) {
      imgEl.src = photos[activePhotoIdx];
    }
    modalOverlay.querySelectorAll(".card-story-indicator-bar").forEach((bar, idx) => {
      bar.classList.toggle("active", idx === activePhotoIdx);
    });
    modalOverlay.querySelectorAll(".carousel-thumb-item").forEach((thumb, idx) => {
      thumb.classList.toggle("active", idx === activePhotoIdx);
    });
  }

  modalOverlay.innerHTML = `
    <div class="modal-drawer fade-in">
      <div class="drawer-pill-bar"></div>

      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <button class="btn-ghost" id="btn-close-profile" style="padding: 6px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <span style="font-size: 14px; font-weight: 700; color: var(--text-secondary);">Kullanıcı Profili</span>
        <button class="btn-ghost" id="btn-open-safety-actions" style="padding: 6px;" aria-label="Seçenekler">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="1.5"></circle>
            <circle cx="19" cy="12" r="1.5"></circle>
            <circle cx="5" cy="12" r="1.5"></circle>
          </svg>
        </button>
      </div>

      <div class="profile-modal-content">
        ${photos.length > 0 ? `
          <div class="profile-photo-carousel" id="profile-detail-carousel">
            ${photos.length > 1 ? `
              <div class="card-story-indicators">
                ${photos.map((_, i) => `<span class="card-story-indicator-bar ${i === 0 ? 'active' : ''}"></span>`).join('')}
              </div>
            ` : ''}

            <img src="${photos[0]}" id="profile-detail-carousel-img" class="profile-carousel-img" alt="${user.name}" />

            ${photos.length > 1 ? `
              <div class="profile-carousel-nav left" id="btn-carousel-prev" title="Önceki Fotoğraf">
                <div class="carousel-nav-arrow" style="display: flex; align-items: center; justify-content: center;">${icons.chevronLeft(16)}</div>
              </div>
              <div class="profile-carousel-nav right" id="btn-carousel-next" title="Sonraki Fotoğraf">
                <div class="carousel-nav-arrow" style="display: flex; align-items: center; justify-content: center;">${icons.chevronRight(16)}</div>
              </div>
            ` : ''}
          </div>

          ${photos.length > 1 ? `
            <div class="carousel-thumbnails-row">
              ${photos.map((p, idx) => `
                <div class="carousel-thumb-item ${idx === 0 ? 'active' : ''}" data-thumb-idx="${idx}">
                  <img src="${p}" alt="Foto ${idx + 1}" />
                </div>
              `).join('')}
            </div>
          ` : ''}
        ` : `
          <div class="profile-large-avatar">
            ${user.initials || user.name.substring(0, 2).toUpperCase()}
          </div>
        `}

        <h3 class="profile-name-title">${user.name}</h3>
        <p class="profile-sub-gym">${gym.name} · ${user.level || 'Orta seviye'}</p>
        <div class="verification-pill">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          ${user.verified ? 'Telefonu ve Google ile doğrulandı' : 'Profil doğrulandı'}
        </div>

        <!-- HEDEFLERİ -->
        <div class="profile-section-box">
          <h5>Hedefleri</h5>
          <div class="chips-grid">
            ${(user.goals || []).map(g => `<span class="chip-btn selected" style="cursor: default;">${g}</span>`).join('')}
            ${(user.preferredTimes || []).map(t => `<span class="chip-btn" style="cursor: default;">${t}</span>`).join('')}
          </div>
        </div>

        <!-- CURRENT WORKOUT SLOT (PAGE 6) -->
        <div class="profile-active-schedule">
          <div class="schedule-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div style="flex: 1; text-align: left;">
            <strong style="display: block; font-size: 14px; color: var(--text-main);">
              ${user.nextWorkout?.time || 'Bugün 19:00'} · ${user.nextWorkout?.type || 'Bacak günü'}
            </strong>
            <span style="font-size: 12px; color: var(--text-secondary);">
              ${user.nextWorkout?.status || 'Partner arıyor'}
            </span>
          </div>
        </div>

        <div style="margin-top: 24px; display: flex; gap: 10px;">
          <button class="btn-kor" id="btn-profile-send-invite" style="flex: 2; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
            ${icons.bolt(16)} Antrenman isteği gönder
          </button>
          <button class="btn-secondary" id="btn-profile-open-chat" style="flex: 1; padding: 13px 12px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            ${icons.chat(15)} Mesaj
          </button>
        </div>
      </div>

      <!-- Action Sheet (Engelle / Şikayet Et) Section -->
      <div id="safety-action-sheet" style="display: none; margin-top: 20px; border-top: 1px solid var(--border-glass); padding-top: 16px;">
        <h4 style="font-size: 15px; margin-bottom: 12px; text-align: left;">${user.name} için</h4>
        <div class="action-sheet-options">
          <div class="action-sheet-item" id="btn-block-user">
            <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
            <div class="action-item-text">
              <strong>Engelle</strong>
              <span>Seni göremez, sana ulaşamaz</span>
            </div>
          </div>

          <div class="action-sheet-item danger" id="btn-report-user">
            <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="15"></line>
            </svg>
            <div class="action-item-text">
              <strong>Şikayet et</strong>
              <span>Uygunsuz davranışı bize bildir</span>
            </div>
          </div>

          <button class="btn-secondary" id="btn-cancel-safety" style="margin-top: 8px;">
            Vazgeç
          </button>
        </div>
      </div>
    </div>
  `;

  modalOverlay.classList.add("open");

  const close = () => {
    modalOverlay.classList.remove("open");
    setTimeout(() => {
      onClose();
    }, 200);
  };

  document.getElementById("btn-close-profile")?.addEventListener("click", close);

  // Carousel navigation
  if (photos.length > 1) {
    document.getElementById("btn-carousel-prev")?.addEventListener("click", (e) => {
      e.stopPropagation();
      activePhotoIdx = (activePhotoIdx - 1 + photos.length) % photos.length;
      updateCarouselView();
    });

    document.getElementById("btn-carousel-next")?.addEventListener("click", (e) => {
      e.stopPropagation();
      activePhotoIdx = (activePhotoIdx + 1) % photos.length;
      updateCarouselView();
    });

    modalOverlay.querySelectorAll(".carousel-thumb-item").forEach(thumb => {
      thumb.addEventListener("click", () => {
        const idx = parseInt(thumb.dataset.thumbIdx, 10);
        activePhotoIdx = idx;
        updateCarouselView();
      });
    });
  }

  document.getElementById("btn-profile-send-invite")?.addEventListener("click", () => {
    close();
    onSendRequest(user);
  });

  document.getElementById("btn-profile-open-chat")?.addEventListener("click", () => {
    close();
    showChatModal(user.id);
  });

  // Toggle safety drawer
  const safetySheet = document.getElementById("safety-action-sheet");
  document.getElementById("btn-open-safety-actions")?.addEventListener("click", () => {
    safetySheet.style.display = safetySheet.style.display === "none" ? "block" : "none";
  });

  document.getElementById("btn-cancel-safety")?.addEventListener("click", () => {
    safetySheet.style.display = "none";
  });

  // Block user
  document.getElementById("btn-block-user")?.addEventListener("click", () => {
    const currentUser = auth.getCurrentUser() || { id: "current-user" };
    db.blockUser(currentUser.id, user.id);
    notify.info(`${user.name} engellendi. Artık sizi göremez ve size ulaşamaz.`);
    close();
  });

  // Report user
  document.getElementById("btn-report-user")?.addEventListener("click", () => {
    close();
    showReportModal(user, () => {});
  });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) close();
  });
}

