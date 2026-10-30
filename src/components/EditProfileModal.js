/**
 * Veyro - Edit Profile Modal (Profil Düzenleme)
 * Allows users to update photos (up to 8), name, bio, fitness goals, level, routine hours, and gender match preferences.
 */

import { auth } from '../services/auth.js';
import { db } from '../services/db.js';
import { notify } from '../services/notification.js';
import { photoService } from '../services/photoService.js';
import { showVerificationModal } from './VerificationModal.js';
import { icons } from './icons.js';

export function showEditProfileModal(onSave, onClose) {
  let modalOverlay = document.getElementById("edit-profile-modal-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "edit-profile-modal-overlay";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  const user = auth.getCurrentUser() || {
    name: "Sporcu",
    bio: "",
    goals: ["Kas"],
    level: "Orta",
    preferredTimes: ["Akşam"],
    genderPref: "Herkes",
    verified: false,
    phone: "",
    email: "",
    photos: []
  };

  const state = {
    name: user.name || "",
    bio: user.bio || "",
    goals: [...(user.goals || ["Kas"])],
    level: user.level || "Orta",
    preferredTimes: [...(user.preferredTimes || ["Akşam"])],
    genderPref: user.genderPref || "Herkes",
    phone: user.phone || "",
    email: user.email || "",
    photos: [...(user.photos || (user.avatar ? [user.avatar] : []))]
  };

  const allGoals = ["Kas", "Güç", "Kondisyon", "Esneklik", "Genel form", "Hipertrofi"];
  const allLevels = ["Yeni başladım", "Orta", "İleri"];
  const allTimes = ["Sabah", "Öğle", "Akşam", "Gece", "Hafta sonu"];
  const allGenders = ["Herkes", "Sadece kadınlar", "Sadece erkekler"];

  function render() {
    modalOverlay.innerHTML = `
      <div class="modal-drawer fade-in" style="max-height: 92vh;">
        <div class="drawer-pill-bar"></div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main);">Profili Düzenle</h3>
          <button class="btn-ghost" id="btn-close-edit-profile" style="padding: 6px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Avatar & Verification Status -->
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 22px; background: var(--bg-surface-elevated); padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid var(--border-glass);">
          <div class="profile-large-avatar" style="width: 54px; height: 54px; font-size: 20px; margin: 0; overflow: hidden; padding: 0;">
            ${state.photos[0] ? `
              <img src="${state.photos[0]}" style="width: 100%; height: 100%; object-fit: cover;" alt="Profil" />
            ` : (user.initials || state.name.substring(0, 2).toUpperCase())}
          </div>
          <div style="flex: 1;">
            <strong style="font-size: 15px; color: var(--text-main); display: block;">${state.name}</strong>
            <span style="font-size: 12px; color: ${user.verified ? 'var(--color-emerald)' : 'var(--color-amber)'}; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
              ${user.verified ? `${icons.checkCircle(12)} Doğrulanmış Profil` : `${icons.alert(12)} Doğrulanmamış Profil`}
            </span>
          </div>
          ${!user.verified ? `
            <button class="btn-kor" id="btn-trigger-verify-from-profile" style="padding: 6px 12px; font-size: 11px; width: auto;">
              Doğrula
            </button>
          ` : ''}
        </div>

        <!-- 8-Photo Interactive Grid Section -->
        <div class="form-section">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <label class="form-label" style="margin: 0;">Profil Fotoğrafların (${state.photos.length}/8)</label>
            <span class="badge ${state.photos.length >= 3 ? 'badge-emerald' : 'badge-kor'}" style="font-size: 10.5px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">
              ${state.photos.length >= 3 ? `${icons.checkCircle(12)} Minimum 3 foto mevcut` : `${icons.alert(12)} ${3 - state.photos.length} foto daha önerilir`}
            </span>
          </div>
          <p style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 10px;">
            İlk fotoğraf ana profil resmin olarak kartlarda görünür. En fazla 8 fotoğraf ekleyebilirsin.
          </p>

          <div class="profile-photos-grid">
            ${Array.from({ length: 8 }).map((_, idx) => {
              const photo = state.photos[idx];
              const isPrimary = idx === 0;
              const isMandatory = idx < 3;

              if (photo) {
                return `
                  <div class="photo-slot filled ${isPrimary ? 'primary-main' : ''}" data-index="${idx}">
                    <img src="${photo}" alt="Fotoğraf ${idx + 1}" />
                    <button type="button" class="photo-slot-delete-btn" data-edit-del-idx="${idx}" title="Kaldır">${icons.close(12)}</button>
                    <div class="photo-slot-number-badge">${isPrimary ? `${icons.starFilled(10)} Ana` : (idx + 1)}</div>
                  </div>
                `;
              } else {
                return `
                  <div class="photo-slot empty ${isMandatory ? 'mandatory' : ''}" data-edit-slot-idx="${idx}">
                    <div class="photo-slot-empty-content">
                      <div class="photo-slot-plus-icon">${icons.plus(16)}</div>
                      <span style="font-size: 10px; font-weight: 700; color: #FFF; margin-bottom: 2px;">Foto ${idx + 1}</span>
                      <span class="${isMandatory ? 'photo-slot-mandatory-label' : 'photo-slot-optional-label'}" style="display: inline-flex; align-items: center; gap: 3px;">
                        ${isMandatory ? (isPrimary ? `${icons.starFilled(9)} Zorunlu` : 'Zorunlu') : 'İsteğe bağlı'}
                      </span>
                    </div>
                  </div>
                `;
              }
            }).join('')}
          </div>

          <input type="file" id="edit-photo-file-input" accept="image/*" multiple style="display: none;">

          <div style="display: flex; gap: 8px; margin-top: 6px;">
            <button type="button" class="btn-kor" id="btn-edit-upload-photo" style="flex: 1; padding: 10px; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;">
              ${icons.camera(15)} Fotoğraf Yükle
            </button>
            <button type="button" class="btn-secondary" id="btn-edit-presets" style="padding: 10px 14px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
              ${icons.sparkles(13)} Örnek Ekle
            </button>
          </div>
        </div>

        <!-- Ad Soyad -->
        <div class="form-section">
          <label class="form-label">Adın Soyadın</label>
          <input type="text" id="edit-input-name" class="text-input-field" value="${state.name}" placeholder="Adını gir">
        </div>

        <!-- Biyografi / Antrenman Notu -->
        <div class="form-section">
          <label class="form-label">Biyografi & Antrenman Stili</label>
          <textarea id="edit-input-bio" class="text-input-field" rows="2" style="resize: none;" placeholder="Nasıl antrenman yapıyorsun, hangi günlerde spotsun?">${state.bio}</textarea>
        </div>

        <!-- Seviye -->
        <div class="form-section">
          <label class="form-label">Fitness Seviyen</label>
          <div class="segmented-control" id="edit-level-control">
            ${allLevels.map(lvl => `
              <div class="segmented-option ${state.level === lvl ? 'selected' : ''}" data-val="${lvl}">${lvl}</div>
            `).join('')}
          </div>
        </div>

        <!-- Hedefler -->
        <div class="form-section">
          <label class="form-label">Antrenman Hedeflerin</label>
          <div class="chips-grid" id="edit-goals-chips">
            ${allGoals.map(g => `
              <button type="button" class="chip-btn ${state.goals.includes(g) ? 'selected' : ''}" data-val="${g}">${g}</button>
            `).join('')}
          </div>
        </div>

        <!-- Zaman Dilimleri -->
        <div class="form-section">
          <label class="form-label">Antrenman Saat Tercihlerin</label>
          <div class="chips-grid" id="edit-times-chips">
            ${allTimes.map(t => `
              <button type="button" class="chip-btn ${state.preferredTimes.includes(t) ? 'selected' : ''}" data-val="${t}">${t}</button>
            `).join('')}
          </div>
        </div>

        <!-- Eşleşme Tercihi -->
        <div class="form-section">
          <label class="form-label">Kimlerle Eşleşmek İstersin?</label>
          <div class="chips-grid" id="edit-gender-chips">
            ${allGenders.map(gend => `
              <button type="button" class="chip-btn ${state.genderPref === gend ? 'selected' : ''}" data-val="${gend}">${gend}</button>
            `).join('')}
          </div>
        </div>

        <!-- Submit Button -->
        <div style="margin-top: 20px; padding-bottom: 10px;">
          <button class="btn-kor" id="btn-save-profile-changes">
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    `;

    modalOverlay.classList.add("open");

    const close = () => {
      modalOverlay.classList.remove("open");
      onClose?.();
    };

    document.getElementById("btn-close-edit-profile")?.addEventListener("click", close);

    // Photo input & slot bindings
    const editFileInput = document.getElementById("edit-photo-file-input");

    modalOverlay.querySelectorAll(".photo-slot.empty").forEach(slot => {
      slot.addEventListener("click", () => {
        editFileInput?.click();
      });
    });

    document.getElementById("btn-edit-upload-photo")?.addEventListener("click", () => {
      editFileInput?.click();
    });

    document.getElementById("btn-edit-presets")?.addEventListener("click", () => {
      const presets = photoService.getAthleticPresets();
      for (const p of presets) {
        if (state.photos.length < 8 && !state.photos.includes(p)) {
          state.photos.push(p);
        }
      }
      notify.success("Örnek sporcu fotoğrafları eklendi!");
      render();
    });

    modalOverlay.querySelectorAll(".photo-slot-delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const delIdx = parseInt(btn.dataset.editDelIdx, 10);
        state.photos.splice(delIdx, 1);
        render();
      });
    });

    editFileInput?.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const remaining = 8 - state.photos.length;
      if (remaining <= 0) {
        notify.error("En fazla 8 fotoğraf yükleyebilirsiniz.");
        return;
      }

      const filesToProcess = files.slice(0, remaining);
      notify.info(`${filesToProcess.length} fotoğraf optimize ediliyor...`);

      try {
        for (const file of filesToProcess) {
          const compressed = await photoService.compressPhoto(file);
          if (state.photos.length < 8) {
            state.photos.push(compressed);
          }
        }
        notify.success(`${filesToProcess.length} fotoğraf başarıyla eklendi!`);
        render();
      } catch (err) {
        notify.error(err.message || "Fotoğraf yüklenemedi.");
      }
    });

    // Verification trigger
    document.getElementById("btn-trigger-verify-from-profile")?.addEventListener("click", () => {
      showVerificationModal('phone', state.phone || user.phone, () => {
        render();
      });
    });

    // Level selection
    modalOverlay.querySelectorAll("#edit-level-control .segmented-option").forEach(opt => {
      opt.addEventListener("click", () => {
        modalOverlay.querySelectorAll("#edit-level-control .segmented-option").forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
        state.level = opt.dataset.val;
      });
    });

    // Goals toggle
    modalOverlay.querySelectorAll("#edit-goals-chips .chip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.val;
        if (state.goals.includes(val)) {
          state.goals = state.goals.filter(g => g !== val);
          btn.classList.remove("selected");
        } else {
          state.goals.push(val);
          btn.classList.add("selected");
        }
      });
    });

    // Times toggle
    modalOverlay.querySelectorAll("#edit-times-chips .chip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const val = btn.dataset.val;
        if (state.preferredTimes.includes(val)) {
          state.preferredTimes = state.preferredTimes.filter(t => t !== val);
          btn.classList.remove("selected");
        } else {
          state.preferredTimes.push(val);
          btn.classList.add("selected");
        }
      });
    });

    // Gender preference
    modalOverlay.querySelectorAll("#edit-gender-chips .chip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        modalOverlay.querySelectorAll("#edit-gender-chips .chip-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        state.genderPref = btn.dataset.val;
      });
    });

    // Save
    document.getElementById("btn-save-profile-changes")?.addEventListener("click", () => {
      const nameVal = document.getElementById("edit-input-name")?.value.trim() || state.name;
      const bioVal = document.getElementById("edit-input-bio")?.value.trim() || state.bio;

      const updated = auth.updateProfile({
        name: nameVal,
        initials: nameVal.substring(0, 2).toUpperCase(),
        bio: bioVal,
        photos: state.photos,
        avatar: state.photos[0] || user.avatar || "",
        goals: state.goals,
        level: state.level,
        preferredTimes: state.preferredTimes,
        genderPref: state.genderPref
      });

      // Update user in users collection too
      db.updateItem("users", updated.id, updated);

      notify.success("Profiliniz ve fotoğraflarınız başarıyla güncellendi!");
      modalOverlay.classList.remove("open");
      onSave?.(updated);
    });
  }

  render();
}

