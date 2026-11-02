/**
 * Veyro - Tam Ekran Profil Görünümü (ProfileView)
 * Sporcunun kendi profilini gördüğü, düzenlediği ve oturumu yönettiği ana ekran.
 */

import { auth } from '../services/auth.js';
import { db } from '../services/db.js';
import { icons } from './icons.js';
import { showConfirmModal } from './ConfirmModal.js';

export function renderProfileView(container, {
  onEditProfile,
  onViewCard,
  onReportTracking,
  onGymSwitch,
  onVerify,
  onSignOut,
  onBack
}) {
  const user = auth.getCurrentUser() || {
    id: "current-user",
    name: "Sporcu",
    initials: "SP",
    phone: "",
    bio: "",
    gymId: "all",
    goals: ["Kas"],
    level: "Orta",
    preferredTimes: ["Akşam"],
    genderPref: "Herkes",
    verified: false,
    photos: []
  };

  const userPhotos = (user.photos && user.photos.length > 0) 
    ? user.photos 
    : (user.avatar ? [user.avatar] : []);
  const avatarPhoto = userPhotos[0] || "";
  const currentGym = user.gymId && user.gymId !== "all" ? db.getItemById("gyms", user.gymId) : null;
  const isAllGyms = !user.gymId || user.gymId === "all";

  container.innerHTML = `
    <div class="profile-view-container">
      <!-- Üst Başlık & Geri Dön Butonu -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
        <button id="btn-pv-back" class="btn-ghost" style="display: inline-flex; align-items: center; gap: 6px; color: var(--color-kor); font-weight: 700; font-size: 13.5px; padding: 6px 12px; border-radius: 10px; background: var(--bg-surface-elevated); border: 1px solid var(--border-glass-bright); cursor: pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Keşfet'e Dön
        </button>
        <span style="font-size: 12px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Sporcu Hesabım</span>
      </div>

      <!-- Hero Profil Kartı -->
      <div class="profile-hero-card">
        <div class="profile-avatar-wrapper">
          ${avatarPhoto ? `
            <img src="${avatarPhoto}" class="profile-avatar-img" alt="${user.name}" />
          ` : `
            <div class="profile-avatar-fallback">
              ${user.initials || (user.name ? user.name.substring(0, 2).toUpperCase() : "SP")}
            </div>
          `}
          <span class="profile-avatar-online-badge" title="Aktif Sporcu"></span>
        </div>

        <h2 class="profile-title-name">
          ${user.name}
          ${user.verified ? `
            <span title="SMS Doğrulanmış Profil" style="display: inline-flex; align-items: center; color: var(--color-emerald);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#10B981">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </span>
          ` : ''}
        </h2>

        <div class="profile-phone-text">
          ${user.phone ? `<span style="display:inline-flex;align-items:center;gap:6px;">${icons.phone(13)} ${user.phone}</span>` : (user.email ? `<span style="display:inline-flex;align-items:center;gap:6px;">${icons.mail(13)} ${user.email}</span>` : 'Sporcu Hesabı')}
        </div>

        ${user.verified ? `
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: var(--radius-full); font-size: 12px; font-weight: 700; color: var(--color-emerald); margin-bottom: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#10B981">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            SMS Doğrulanmış Sporcu
          </div>
        ` : `
          <button id="btn-profile-verify-sms" style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: var(--radius-full); font-size: 12px; font-weight: 700; color: var(--color-amber); cursor: pointer; margin-bottom: 6px;">
            ${icons.alert(13)} Telefonu Şimdi Doğrula (SMS OTP)
          </button>
        `}

        ${user.bio ? `
          <div class="profile-bio-box">
            "${user.bio}"
          </div>
        ` : `
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">
            Henüz biyografi eklenmedi. Kendini tanıtan kısa bir not yazabilirsin.
          </div>
        `}

        <!-- Ana Eylem Butonları -->
        <div class="profile-actions-grid">
          <button class="btn-profile-primary" id="btn-pv-edit-profile">
            ${icons.edit(16)} Profili Düzenle
          </button>
          <button class="btn-profile-secondary" id="btn-pv-preview-card">
            ${icons.dumbbell(16)} Kartımı Gör
          </button>
        </div>
      </div>

      <!-- Fotoğraflar Galerisi -->
      <div class="profile-section-card">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <div class="profile-section-title" style="margin-bottom: 0;">
            ${icons.camera(14)} Profil Fotoğrafları (${userPhotos.length}/8)
          </div>
          <button id="btn-pv-manage-photos" style="color: var(--color-kor); font-size: 12.5px; font-weight: 700; background: none; border: none; cursor: pointer;">
            Yönet / Ekle
          </button>
        </div>

        <div class="profile-photos-strip">
          ${userPhotos.map(photo => `
            <img src="${photo}" class="profile-thumb-card" alt="Profil Fotoğrafı" />
          `).join('')}
          ${userPhotos.length < 8 ? `
            <button id="btn-pv-add-photo-strip" style="width: 72px; height: 96px; border-radius: 12px; border: 1.5px dashed var(--border-glass-bright); background: var(--bg-surface-card); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; color: var(--text-muted); cursor: pointer; flex-shrink: 0;">
              ${icons.plus(20)}
              <span style="font-size: 10px; font-weight: 700;">Fotoğraf</span>
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Spor Salonu Seçimi -->
      <div class="profile-section-card" style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(255, 87, 34, 0.12); color: var(--color-kor); display: flex; align-items: center; justify-content: center;">
            ${icons.pin(18)}
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Aktif Salon / Bölge</div>
            <div style="font-size: 15px; font-weight: 800; color: var(--text-main);">
              ${isAllGyms ? 'Yakınımdaki Tüm Sporcular' : (currentGym?.name || 'Spor Salonu')}
            </div>
            <div style="font-size: 12px; color: var(--text-secondary);">
              ${isAllGyms ? 'GPS ile 5 km çevresi' : (currentGym?.district || '')}
            </div>
          </div>
        </div>
        <button class="btn-ghost" id="btn-pv-change-gym" style="padding: 8px 12px; border-radius: 10px; background: var(--bg-surface-card); border: 1px solid var(--border-glass-bright); font-size: 12.5px; font-weight: 700; color: var(--color-kor);">
          Değiştir
        </button>
      </div>

      <!-- Hedefler ve Seviye -->
      <div class="profile-section-card">
        <div class="profile-section-title">${icons.flame(14)} Fitness Hedefleri & Seviye</div>
        <div class="profile-pills-row">
          <span class="profile-pill-item active">
            ${icons.dumbbell(13)} Seviye: ${user.level || 'Orta'}
          </span>
          ${(user.goals || ['Kas']).map(goal => `
            <span class="profile-pill-item">
              ${icons.target(13)} ${goal}
            </span>
          `).join('')}
          ${(user.preferredTimes || ['Akşam']).map(time => `
            <span class="profile-pill-item">
              ${icons.clock(13)} ${time}
            </span>
          `).join('')}
          <span class="profile-pill-item">
            ${icons.users(13)} Tercih: ${user.genderPref || 'Herkes'}
          </span>
        </div>
      </div>

      <!-- Menü & Güvenlik Seçenekleri -->
      <div class="profile-menu-list">
        <!-- Güvenlik & Şikayet Takibi -->
        <button class="profile-menu-item" id="btn-pv-report-tracking">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="color: var(--color-kor);">${icons.flag(18)}</div>
            <span>Güvenlik & Şikayet Takibi</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <!-- Gizlilik Politikası & Kullanım Koşulları -->
        <button class="profile-menu-item" id="btn-pv-privacy">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="color: var(--color-kor);">${icons.shield(18)}</div>
            <span>Gizlilik Politikası & Kullanım Koşulları</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <!-- ÇIKIŞ YAP (Oturumu Kapat) -->
        <button class="profile-menu-item profile-menu-item-danger" id="btn-pv-signout">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="color: var(--color-rose);">${icons.logout(18)}</div>
            <span style="font-weight: 800;">Çıkış Yap (Hesaptan Ayrıl)</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <!-- HESABIMI SİL (App Store & Play Store Zorunluluğu) -->
        <button class="profile-menu-item profile-menu-item-danger" id="btn-pv-delete-account" style="opacity: 0.88;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="color: var(--color-rose);">${icons.alertTriangle(18)}</div>
            <span style="font-weight: 700; font-size: 13px;">Hesabımı Kalıcı Olarak Sil</span>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  `;

  // Event Listeners
  container.querySelector("#btn-pv-edit-profile")?.addEventListener("click", () => {
    onEditProfile?.();
  });

  container.querySelector("#btn-pv-preview-card")?.addEventListener("click", () => {
    onViewCard?.(user);
  });

  container.querySelector("#btn-pv-manage-photos")?.addEventListener("click", () => {
    onEditProfile?.();
  });

  container.querySelector("#btn-pv-add-photo-strip")?.addEventListener("click", () => {
    onEditProfile?.();
  });

  container.querySelector("#btn-pv-change-gym")?.addEventListener("click", () => {
    onGymSwitch?.();
  });

  container.querySelector("#btn-profile-verify-sms")?.addEventListener("click", () => {
    onVerify?.();
  });

  container.querySelector("#btn-pv-report-tracking")?.addEventListener("click", () => {
    onReportTracking?.();
  });

  container.querySelector("#btn-pv-privacy")?.addEventListener("click", () => {
    window.open("./privacy.html", "_blank");
  });

  container.querySelector("#btn-pv-back")?.addEventListener("click", () => {
    onBack?.();
  });

  container.querySelector("#btn-pv-signout")?.addEventListener("click", () => {
    showConfirmModal({
      title: "Oturumu Kapat",
      message: "Veyro hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      confirmText: "Çıkış Yap",
      cancelText: "Vazgeç",
      isDanger: true,
      icon: icons.logout(26),
      onConfirm: () => {
        onSignOut?.();
      }
    });
  });

  container.querySelector("#btn-pv-delete-account")?.addEventListener("click", () => {
    showConfirmModal({
      title: "Hesabı Kalıcı Olarak Sil",
      message: "Hesabınızı, fotoğraflarınızı ve tüm antrenman randevularınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      confirmText: "Hesabımı Sil",
      cancelText: "Vazgeç",
      isDanger: true,
      icon: icons.alertTriangle(26),
      onConfirm: () => {
        auth.deleteAccount();
        onSignOut?.();
      }
    });
  });
}
