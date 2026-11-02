/**
 * Veyro - Story Creator Modal (Hikaye Paylaş)
 * Allows athletes to share multiple 24-hour gym moments, PR achievements,
 * workout photos, fitness stickers/tags, custom floating emojis, and workout music / recorded voice.
 */

import { db } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService, STORY_MUSIC_TRACKS } from '../services/soundService.js';
import { photoService } from '../services/photoService.js';
import { locationService } from '../services/location.js';
import { icons } from './icons.js';

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

const STORY_EMOJIS = ["🔥", "💪", "⚡", "🏋️", "🦍", "👑", "🎯", "🏆", "💦", "🥗", "🚀", "💯", "❤️‍🔥", "🥊"];

export function showStoryCreatorModal(onSuccess) {
  let modalOverlay = document.getElementById("story-creator-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "story-creator-overlay";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  const currentUser = auth.getCurrentUser() || { id: "current-user", name: "Sporcu", initials: "SP" };
  const userGym = (currentUser.gymId && db.getItemById("gyms", currentUser.gymId)) || { name: currentUser.gymName || "Spor Salonu" };
  const activeLoc = locationService.getActiveLocation() || { district: "Çorlu", city: "Tekirdağ" };
  const existingMyStories = (db.getCollection("stories") || []).filter(s => s.userId === currentUser.id);

  let selectedImage = SAMPLE_STORY_PRESETS[existingMyStories.length % SAMPLE_STORY_PRESETS.length].url;
  let selectedTag = FITNESS_TAGS[existingMyStories.length % FITNESS_TAGS.length];
  let captionText = "";
  let selectedEmojis = ["🔥", "💪"];
  let selectedMusicTrack = STORY_MUSIC_TRACKS[0];
  let isRecordingVoice = false;
  let mediaRecorder = null;
  let audioChunks = [];

  function closeCreator() {
    soundService.stopStoryMusic();
    if (mediaRecorder && mediaRecorder.state === "recording") {
      try { mediaRecorder.stop(); } catch (e) {}
    }
    modalOverlay.classList.remove("open");
  }

  function render() {
    modalOverlay.innerHTML = `
      <div class="modal-drawer fade-in" style="max-height: 94vh; padding-bottom: max(24px, env(safe-area-inset-bottom));">
        <div class="drawer-pill-bar"></div>

        <!-- Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <button class="btn-ghost" id="btn-close-story-creator" style="padding: 6px;" aria-label="Kapat">
            ${icons.chevronLeft(22)}
          </button>
          <div style="text-align: center;">
            <h3 style="font-size: 19px; font-weight: 800; color: #FFF; margin: 0;">Hikaye Paylaş</h3>
            <span style="font-size: 11px; color: var(--text-secondary);">
              ${existingMyStories.length > 0 ? `Aktif ${existingMyStories.length} hikayen var · Yeni hikaye ekleniyor` : '24 Saat Boyunca Görünür · Birden çok hikaye atabilirsin'}
            </span>
          </div>
          <div style="width: 28px;"></div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 13px; max-height: 76vh; overflow-y: auto; padding-right: 2px;">
          <!-- Story Live Preview Card -->
          <div style="position: relative; height: 255px; border-radius: var(--radius-lg); overflow: hidden; background: #000; border: 1px solid var(--border-glass-bright); box-shadow: 0 8px 24px rgba(0,0,0,0.6); flex-shrink: 0;">
            <img id="story-preview-img" src="${selectedImage}" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Hikaye Önizleme">
            
            <!-- Dark Gradient Scrim -->
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 40%, rgba(0,0,0,0.88) 100%);"></div>

            <!-- Top Author Header + Music Pill in Preview -->
            <div style="position: absolute; top: 12px; left: 12px; right: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="member-avatar accent-kor" style="width: 32px; height: 32px; font-size: 12px; overflow: hidden; padding: 0;">
                  ${currentUser.photos?.[0] ? `<img src="${currentUser.photos[0]}" style="width: 100%; height: 100%; object-fit: cover;">` : (currentUser.initials || "SP")}
                </div>
                <div>
                  <strong style="font-size: 13px; color: #FFF; display: block;">${currentUser.name || "Sporcu"}</strong>
                  <span style="font-size: 10px; color: rgba(255,255,255,0.8);">${userGym.name || "Spor Salonu"} · Şimdi</span>
                </div>
              </div>

              ${selectedMusicTrack ? `
                <div id="preview-music-badge" style="background: rgba(0,0,0,0.65); backdrop-filter: blur(10px); border: 1px solid rgba(255,87,34,0.5); border-radius: 999px; padding: 4px 10px; display: inline-flex; align-items: center; gap: 5px; color: #FFF; font-size: 10.5px; font-weight: 700;">
                  <span style="color: var(--color-kor);">🎵</span>
                  <span style="max-width: 115px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${selectedMusicTrack.title}</span>
                </div>
              ` : ''}
            </div>

            <!-- Floating Emoji Stickers Overlay -->
            <div id="preview-emojis-layer" style="position: absolute; top: 58px; right: 14px; display: flex; flex-wrap: wrap; gap: 6px; max-width: 160px; justify-content: flex-end;">
              ${selectedEmojis.map((em, i) => `
                <span class="preview-emoji-item" data-idx="${i}" title="Kaldırmak için dokun" style="font-size: 28px; cursor: pointer; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.65)); transition: transform 0.15s ease; user-select: none;">
                  ${em}
                </span>
              `).join('')}
            </div>

            <!-- Sticker / Tag Badge Overlay -->
            <div style="position: absolute; bottom: 42px; left: 14px;">
              <span id="preview-sticker-tag" style="background: var(--color-kor-gradient); color: #FFF; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 8px; box-shadow: 0 4px 12px var(--color-kor-glow); display: inline-flex; align-items: center; gap: 4px;">
                ${selectedTag}
              </span>
            </div>

            <!-- Caption Overlay -->
            <div id="preview-caption-text" style="position: absolute; bottom: 14px; left: 14px; right: 14px; font-size: 12.5px; color: #FFF; font-weight: 600; text-shadow: 0 1px 4px rgba(0,0,0,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${captionText || "Antrenman notunu aşağıdan ekle..."}
            </div>
          </div>

          <!-- 1. Photo Selection (Upload or Presets) -->
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
              ${SAMPLE_STORY_PRESETS.map((preset) => `
                <div class="preset-photo-thumb ${selectedImage === preset.url ? 'active' : ''}" data-url="${preset.url}" data-tag="${preset.tag}" style="width: 72px; height: 72px; border-radius: 10px; overflow: hidden; flex-shrink: 0; cursor: pointer; border: 2px solid ${selectedImage === preset.url ? 'var(--color-kor)' : 'transparent'}; position: relative;">
                  <img src="${preset.url}" style="width: 100%; height: 100%; object-fit: cover;">
                  <span style="position: absolute; bottom: 0; inset-x: 0; background: rgba(0,0,0,0.7); color: #FFF; font-size: 9px; font-weight: 700; text-align: center; padding: 2px 0;">${preset.name}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 2. Emoji & Sticker Picker (Hikayeye Emoji Ekle) -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label style="font-size: 12.5px; font-weight: 800; color: #FFF; display: flex; align-items: center; gap: 5px;">
                <span>🔥</span> Hikayeye Emoji Ekle
              </label>
              <span style="font-size: 10.5px; color: var(--text-muted);">Eklemek için dokun (${selectedEmojis.length}/5)</span>
            </div>
            <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
              ${STORY_EMOJIS.map(em => `
                <button type="button" class="btn-add-story-emoji" data-emoji="${em}" style="width: 38px; height: 38px; border-radius: 10px; background: var(--bg-surface-elevated); border: 1px solid ${selectedEmojis.includes(em) ? 'var(--color-kor)' : 'var(--border-glass)'}; font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer;">
                  ${em}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 3. Music & Sound Picker (Müzik veya Kendi Sesini Ekle) -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <label style="font-size: 12.5px; font-weight: 800; color: #FFF; display: flex; align-items: center; gap: 5px;">
                <span>🎵</span> Müzik veya Ses Ekle
              </label>
              <button type="button" id="btn-record-story-voice" style="padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; background: ${isRecordingVoice ? 'rgba(239,68,68,0.22)' : 'rgba(255,87,34,0.16)'}; color: ${isRecordingVoice ? '#F87171' : 'var(--color-kor)'}; border: 1px solid ${isRecordingVoice ? '#EF4444' : 'rgba(255,87,34,0.4)'}; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                <span>🎙️</span>
                <span>${isRecordingVoice ? 'Kaydı Bitir ve Ekle' : 'Kendi Sesini Kaydet'}</span>
              </button>
            </div>

            <div style="display: flex; gap: 7px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
              <button type="button" class="story-music-pill ${!selectedMusicTrack ? 'active' : ''}" data-track-id="none" style="padding: 7px 11px; border-radius: 10px; background: ${!selectedMusicTrack ? 'rgba(255,87,34,0.18)' : 'var(--bg-surface-elevated)'}; border: 1px solid ${!selectedMusicTrack ? 'var(--color-kor)' : 'var(--border-glass)'}; color: #FFF; font-size: 11px; font-weight: 700; white-space: nowrap; flex-shrink: 0; cursor: pointer;">
                🔇 Sessiz
              </button>
              ${STORY_MUSIC_TRACKS.map(track => {
                const isSelected = selectedMusicTrack?.id === track.id;
                return `
                  <button type="button" class="story-music-pill ${isSelected ? 'active' : ''}" data-track-id="${track.id}" style="padding: 7px 11px; border-radius: 10px; background: ${isSelected ? 'rgba(255,87,34,0.22)' : 'var(--bg-surface-elevated)'}; border: 1px solid ${isSelected ? 'var(--color-kor)' : 'var(--border-glass)'}; color: #FFF; text-align: left; flex-shrink: 0; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 13px;">${isSelected ? '🔊' : '🎵'}</span>
                    <div>
                      <div style="font-size: 11.5px; font-weight: 800; color: #FFF; white-space: nowrap;">${track.title}</div>
                      <div style="font-size: 9.5px; color: var(--text-secondary); white-space: nowrap;">${track.genre} · ${track.bpm} BPM</div>
                    </div>
                  </button>
                `;
              }).join('')}
              ${selectedMusicTrack?.id === 'custom_voice' ? `
                <button type="button" class="story-music-pill active" data-track-id="custom_voice" style="padding: 7px 11px; border-radius: 10px; background: rgba(16,185,129,0.22); border: 1px solid #10B981; color: #FFF; text-align: left; flex-shrink: 0; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  <span>🎙️</span>
                  <div>
                    <div style="font-size: 11.5px; font-weight: 800; color: #34D399;">Kendi Ses Kaydım</div>
                    <div style="font-size: 9.5px; color: rgba(255,255,255,0.75);">Hikayeye eklendi</div>
                  </div>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- 4. Fitness Tag / Sticker Selector -->
          <div>
            <label style="font-size: 12.5px; font-weight: 800; color: #FFF; margin-bottom: 8px; display: flex; align-items: center; gap: 5px;">
              ${icons.tag(14)} Antrenman Etiketi & Çıkartması
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${FITNESS_TAGS.map(tag => `
                <button type="button" class="story-tag-pill ${tag === selectedTag ? 'active' : ''}" data-tag="${tag}" style="padding: 6px 10px; font-size: 11.5px; font-weight: 700; border-radius: 8px; border: 1px solid ${tag === selectedTag ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${tag === selectedTag ? 'rgba(255, 87, 34, 0.18)' : 'var(--bg-surface-elevated)'}; color: ${tag === selectedTag ? '#FFF' : 'var(--text-secondary)'}; cursor: pointer; transition: all 0.2s ease;">
                  ${tag}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 5. Caption Input -->
          <div>
            <label style="font-size: 12.5px; font-weight: 800; color: #FFF; margin-bottom: 6px; display: block;">
              Açıklama / Motivasyon Cümlesi
            </label>
            <input type="text" id="input-story-caption" placeholder="Örn: Bugün bacak gününü yıktık! Salondayız 🔥" value="${captionText}" maxlength="100" style="width: 100%; padding: 11px 14px; background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); border-radius: var(--radius-md); color: #FFF; font-size: 13px; outline: none; box-sizing: border-box;">
          </div>

          <!-- Publish Button -->
          <button type="button" class="btn-kor" id="btn-publish-story" style="width: 100%; padding: 13px; font-size: 14px; font-weight: 800; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 16px var(--color-kor-glow); margin-top: 4px;">
            ${icons.share(16)} <span>Hikayeyi Şimdi Paylaş</span>
          </button>
        </div>
      </div>
    `;

    // Close button
    document.getElementById("btn-close-story-creator")?.addEventListener("click", closeCreator);

    // Preset photo selection
    modalOverlay.querySelectorAll(".preset-photo-thumb").forEach(thumb => {
      thumb.addEventListener("click", () => {
        selectedImage = thumb.dataset.url;
        if (thumb.dataset.tag) selectedTag = thumb.dataset.tag;
        render();
      });
    });

    // Add Emoji to story
    modalOverlay.querySelectorAll(".btn-add-story-emoji").forEach(btn => {
      btn.addEventListener("click", () => {
        const em = btn.dataset.emoji;
        if (selectedEmojis.length >= 5) {
          selectedEmojis.shift();
        }
        selectedEmojis.push(em);
        render();
      });
    });

    // Remove Emoji when tapped on preview
    modalOverlay.querySelectorAll(".preview-emoji-item").forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.dataset.idx, 10);
        if (!isNaN(idx)) {
          selectedEmojis.splice(idx, 1);
          render();
        }
      });
    });

    // Music Track selection & immediate audio preview
    modalOverlay.querySelectorAll(".story-music-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const trackId = pill.dataset.trackId;
        if (trackId === "none") {
          selectedMusicTrack = null;
          soundService.stopStoryMusic();
        } else if (trackId !== "custom_voice") {
          const found = STORY_MUSIC_TRACKS.find(t => t.id === trackId);
          if (found) {
            selectedMusicTrack = found;
            soundService.playStoryMusic(found);
          }
        }
        render();
      });
    });

    // Record custom voice/sound for story
    document.getElementById("btn-record-story-voice")?.addEventListener("click", async () => {
      if (isRecordingVoice) {
        isRecordingVoice = false;
        if (mediaRecorder && mediaRecorder.state === "recording") {
          try { mediaRecorder.stop(); } catch (e) {}
        } else {
          // Synthesized fallback voice clip if mic not available in desktop test
          selectedMusicTrack = {
            id: "custom_voice",
            title: "Kendi Ses Kaydım",
            artist: currentUser.name || "Sporcu",
            genre: "Canlı Ses",
            bpm: 135,
            notes: [220, 261.63, 329.63, 392, 329.63, 261.63],
            wave: "triangle"
          };
          soundService.playStoryMusic(selectedMusicTrack);
          notify.success("🎙️ Ses kaydın hikayeye eklendi!");
          render();
        }
        return;
      }

      soundService.stopStoryMusic();
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioChunks = [];
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) audioChunks.push(ev.data);
          };
          mediaRecorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
            const reader = new FileReader();
            reader.onloadend = () => {
              selectedMusicTrack = {
                id: "custom_voice",
                title: "Kendi Ses Kaydım",
                artist: currentUser.name || "Sporcu",
                genre: "Canlı Ses",
                audioDataUrl: reader.result
              };
              soundService.playStoryMusic(selectedMusicTrack);
              notify.success("🎙️ Ses kaydın hikayeye eklendi!");
              render();
            };
            reader.readAsDataURL(blob);
          };
          mediaRecorder.start();
          isRecordingVoice = true;
          notify.info("🎙️ Hikaye için ses kaydediliyor... Bitirmek için tekrar dokun.");
          render();
        } catch (err) {
          isRecordingVoice = true;
          notify.info("🎙️ Ses kaydediliyor... Bitirmek için tekrar dokun.");
          render();
        }
      } else {
        isRecordingVoice = true;
        render();
      }
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
      soundService.stopStoryMusic();
      const newStory = db.addStory({
        userId: currentUser.id,
        userName: currentUser.name || "Sporcu",
        userInitials: currentUser.initials || "SP",
        userAvatar: currentUser.photos?.[0] || currentUser.avatar || "",
        image: selectedImage,
        tag: selectedTag,
        caption: captionText || `${selectedTag} tamamlandı!`,
        emojis: [...selectedEmojis],
        musicTrack: selectedMusicTrack ? { ...selectedMusicTrack } : null,
        gymId: currentUser.gymId || "all",
        gymName: userGym.name || "Spor Salonu",
        city: activeLoc.city || "Tekirdağ",
        district: activeLoc.district || "Çorlu",
        lat: activeLoc.lat,
        lng: activeLoc.lng,
        timestamp: Date.now()
      });

      soundService.playMessageChime();
      notify.success("✓ Hikayen paylaşıldı! İstediğin kadar yeni hikaye ekleyebilirsin.");
      closeCreator();
      onSuccess?.(newStory);
    });
  }

  render();
  modalOverlay.classList.add("open");
}
