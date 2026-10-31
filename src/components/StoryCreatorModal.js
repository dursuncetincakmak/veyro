/**
 * Veyro - Story Creator Modal (Hikaye Paylaş)
 * Allows athletes to share 24-hour gym moments, PR achievements,
 * workout photos, fitness stickers/tags, and captions.
 */

import { db } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { photoService } from '../services/photoService.js';
import { icons } from './icons.js';

// High resolution athletic sample workout moments
const SAMPLE_STORY_PRESETS = [
  {
    name: "Squat PR",
    url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80",
    tag: "💪 Bacak Günü PR"
  },
  {
    name: "Bench Press",
    url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    tag: "⚡ Bench Press 100kg"
  },
  {
    name: "Sabah Koşusu",
    url: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop&q=80",
    tag: "🔥 Sabah Kardiyosu"
  },
  {
    name: "Kardiyo & HIIT",
    url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80",
    tag: "🏃‍♂️ 5K Tempo Koşusu"
  },
  {
    name: "Post-Workout",
    url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80",
    tag: "🥗 Post-Workout Shake"
  }
];

const FITNESS_TAGS = [
  "💪 Bacak Günü PR",
  "🔥 Sabah Kardiyosu",
  "⚡ Kişisel Rekor (PR)",
  "🏋️ Bench Press 100kg",
  "🥗 Post-Workout Shake",
  "📍 Salondayız",
  "🎯 Günlük Hedef Tamam",
  "🏆 Ağır Siklet Seansı"
];

export function showStoryCreatorModal(onSuccess) {
  let modalOverlay = document.getElementById("story-creator-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "story-creator-overlay";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  const currentUser = auth.getCurrentUser() || { id: "current-user", name: "Sporcu", initials: "SP" };
  const userGym = (currentUser.gymId && db.getItemById("gyms", currentUser.gymId)) || { name: "Spor Salonu" };

  let selectedImage = SAMPLE_STORY_PRESETS[0].url;
  let selectedTag = FITNESS_TAGS[0];
  let captionText = "";

  function render() {
    modalOverlay.innerHTML = `
      <div class="modal-drawer fade-in" style="max-height: 94vh; padding-bottom: max(24px, env(safe-area-inset-bottom));">
        <div class="drawer-pill-bar"></div>

        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <button class="btn-ghost" id="btn-close-story-creator" style="padding: 6px;" aria-label="Kapat">
            ${icons.chevronLeft(22)}
          </button>
          <div style="text-align: center;">
            <h3 style="font-size: 19px; font-weight: 800; color: #FFF; margin: 0;">Hikaye Paylaş</h3>
            <span style="font-size: 11px; color: var(--text-secondary);">24 Saat Boyunca Görünür</span>
          </div>
          <div style="width: 28px;"></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px; max-height: 75vh; overflow-y: auto; padding-right: 2px;">
          <!-- Story Live Preview Card -->
          <div style="position: relative; height: 260px; border-radius: var(--radius-lg); overflow: hidden; background: #000; border: 1px solid var(--border-glass-bright); box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
            <img id="story-preview-img" src="${selectedImage}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Hikaye Önizleme">
            
            <!-- Dark Gradient Scrim -->
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.85) 100%);"></div>

            <!-- Top Author Header in Preview -->
            <div style="position: absolute; top: 12px; left: 12px; right: 12px; display: flex; align-items: center; gap: 8px;">
              <div class="member-avatar accent-kor" style="width: 32px; height: 32px; font-size: 12px;">
                ${currentUser.initials || "SP"}
              </div>
              <div>
                <strong style="font-size: 13px; color: #FFF; display: block;">${currentUser.name || "Sporcu"}</strong>
                <span style="font-size: 10px; color: rgba(255,255,255,0.8);">${userGym.name || "Spor Salonu"} · Şimdi</span>
              </div>
            </div>

            <!-- Sticker / Tag Badge Overlay -->
            <div style="position: absolute; bottom: 44px; left: 14px;">
              <span id="preview-sticker-tag" style="background: var(--color-kor-gradient); color: #FFF; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 8px; box-shadow: 0 4px 12px var(--color-kor-glow); display: inline-flex; align-items: center; gap: 4px;">
                ${selectedTag}
              </span>
            </div>

            <!-- Caption Overlay -->
            <div id="preview-caption-text" style="position: absolute; bottom: 14px; left: 14px; right: 14px; font-size: 12.5px; color: #FFF; font-weight: 600; text-shadow: 0 1px 4px rgba(0,0,0,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${captionText || "Antrenman notunu aşağıdan ekle..."}
            </div>
          </div>

          <!-- Photo Selection (Upload or Presets) -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <label style="font-size: 12.5px; font-weight: 800; color: #FFF; display: flex; align-items: center; gap: 5px;">
                ${icons.camera(14)} Fotoğraf Seç veya Yükle
              </label>
              <button class="btn-ghost" id="btn-upload-story-photo" style="font-size: 11.5px; color: var(--color-kor); font-weight: 700; padding: 2px 6px;">
                Cihazdan Yükle
              </button>
              <input type="file" id="story-file-picker" accept="image/*" style="display: none;">
            </div>

            <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none;">
              ${SAMPLE_STORY_PRESETS.map((preset, idx) => `
                <div class="preset-photo-thumb ${selectedImage === preset.url ? 'active' : ''}" data-url="${preset.url}" data-tag="${preset.tag}" style="width: 74px; height: 74px; border-radius: 10px; overflow: hidden; flex-shrink: 0; cursor: pointer; border: 2px solid ${selectedImage === preset.url ? 'var(--color-kor)' : 'transparent'}; position: relative;">
                  <img src="${preset.url}" style="width: 100%; height: 100%; object-fit: cover;">
                  <span style="position: absolute; bottom: 0; inset-x: 0; background: rgba(0,0,0,0.7); color: #FFF; font-size: 9px; font-weight: 700; text-align: center; padding: 2px 0;">${preset.name}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Fitness Tag / Sticker Selector -->
          <div>
            <label style="font-size: 12.5px; font-weight: 800; color: #FFF; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;">
              ${icons.tag(14)} Antrenman Etiketi & Çıkartması
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${FITNESS_TAGS.map(tag => `
                <button class="story-tag-pill ${tag === selectedTag ? 'active' : ''}" data-tag="${tag}" style="padding: 6px 10px; font-size: 11.5px; font-weight: 700; border-radius: 8px; border: 1px solid ${tag === selectedTag ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${tag === selectedTag ? 'rgba(255, 87, 34, 0.18)' : 'var(--bg-surface-elevated)'}; color: ${tag === selectedTag ? '#FFF' : 'var(--text-secondary)'}; cursor: pointer; transition: all 0.2s ease;">
                  ${tag}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Caption Input -->
          <div>
            <label style="font-size: 12.5px; font-weight: 800; color: #FFF; margin-bottom: 6px; display: block;">
              Açıklama / Motivasyon Cümlesi
            </label>
            <input type="text" id="input-story-caption" placeholder="Örn: Bugün bacak gününü yıktık! Salondayız 🔥" value="${captionText}" maxlength="100" style="width: 100%; padding: 11px 14px; background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); border-radius: var(--radius-md); color: #FFF; font-size: 13px; outline: none; box-sizing: border-box;">
          </div>

          <!-- Publish Button -->
          <button class="btn-kor" id="btn-publish-story" style="width: 100%; padding: 13px; font-size: 14px; font-weight: 800; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 16px var(--color-kor-glow); margin-top: 6px;">
            ${icons.share(16)} <span>Hikayeyi Şimdi Paylaş</span>
          </button>
        </div>
      </div>
    `;

    // Close button
    const close = () => modalOverlay.classList.remove("open");
    document.getElementById("btn-close-story-creator")?.addEventListener("click", close);

    // Preset photo selection
    modalOverlay.querySelectorAll(".preset-photo-thumb").forEach(thumb => {
      thumb.addEventListener("click", () => {
        selectedImage = thumb.dataset.url;
        if (thumb.dataset.tag) selectedTag = thumb.dataset.tag;
        render();
      });
    });

    // Tag pills
    modalOverlay.querySelectorAll(".story-tag-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        selectedTag = pill.dataset.tag;
        const tagEl = document.getElementById("preview-sticker-tag");
        if (tagEl) tagEl.textContent = selectedTag;
        modalOverlay.querySelectorAll(".story-tag-pill").forEach(p => {
          p.classList.toggle("active", p.dataset.tag === selectedTag);
          p.style.borderColor = p.dataset.tag === selectedTag ? "var(--color-kor)" : "var(--border-glass)";
          p.style.background = p.dataset.tag === selectedTag ? "rgba(255, 87, 34, 0.18)" : "var(--bg-surface-elevated)";
          p.style.color = p.dataset.tag === selectedTag ? "#FFF" : "var(--text-secondary)";
        });
      });
    });

    // Caption live update
    const captionInput = document.getElementById("input-story-caption");
    captionInput?.addEventListener("input", (e) => {
      captionText = e.target.value;
      const previewCaption = document.getElementById("preview-caption-text");
      if (previewCaption) {
        previewCaption.textContent = captionText || "Antrenman notunu aşağıdan ekle...";
      }
    });

    // File upload
    const filePicker = document.getElementById("story-file-picker");
    document.getElementById("btn-upload-story-photo")?.addEventListener("click", () => {
      filePicker?.click();
    });

    filePicker?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          notify.info("Fotoğraf optimize ediliyor...");
          const compressed = await photoService.compressPhoto(file, 800, 0.85);
          selectedImage = compressed;
          render();
        } catch (err) {
          notify.error("Fotoğraf yüklenemedi.");
        }
      }
    });

    // Publish action
    document.getElementById("btn-publish-story")?.addEventListener("click", () => {
      const newStory = db.addStory({
        userId: currentUser.id,
        userName: currentUser.name || "Sporcu",
        userInitials: currentUser.initials || "SP",
        userAvatar: currentUser.photos?.[0] || "",
        image: selectedImage,
        tag: selectedTag,
        caption: captionText || `${selectedTag} tamamlandı!`,
        gymName: userGym.name || "Spor Salonu",
        timestamp: Date.now()
      });

      soundService.playMessageChime();
      notify.success("✓ Hikayen başarıyla paylaşıldı!");
      close();
      onSuccess?.(newStory);
    });
  }

  render();
  modalOverlay.classList.add("open");
}
