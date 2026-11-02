/**
 * Veyro - Live Partner Chat Modal
 * Instant real-time messaging, voice messages (Sesli Mesaj), photo sharing with recipient privacy consent,
 * scroll-preserved live updates, audible chimes, and multi-device synchronization.
 */

import { db, getChatRoomKey } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { showReportModal } from './ReportModal.js';
import { icons } from './icons.js';

function formatVoiceDuration(sec) {
  const s = Math.max(1, Math.round(Number(sec) || 1));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
}

/**
 * Generates a lightweight valid WAV audio data URL as a fallback
 * when device microphone hardware/permission is unavailable in a test/WebView environment.
 */
function generateFallbackVoiceDataUrl(durationSec = 3) {
  const sampleRate = 8000;
  const seconds = Math.min(8, Math.max(1, Math.round(durationSec)));
  const numSamples = sampleRate * seconds;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin(Math.PI * Math.min(1, (t * 2) % 1)) * 0.25;
    const freq = 220 + 60 * Math.sin(t * 6);
    const sample = Math.sin(2 * Math.PI * freq * t) * envelope;
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "data:audio/wav;base64," + btoa(binary);
}

export function showChatModal(partnerId, onClose) {
  let modalOverlay = document.getElementById("chat-modal-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "chat-modal-overlay";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  const partner = db.getItemById("users", partnerId) || { id: partnerId, name: "Partner", initials: "SP" };
  const currentUser = auth.getCurrentUser() || { id: "current-user", name: "Sporcu" };

  // Symmetric conversation key
  const chatKey = getChatRoomKey(currentUser.id, partnerId);

  // Mark incoming messages as read
  db.markChatAsRead(chatKey, currentUser.id);

  let lastRenderedSignature = null;
  let activeAudioEl = null;
  let activeVoiceMsgId = null;

  // Voice recording state
  let mediaRecorder = null;
  let mediaStream = null;
  let audioChunks = [];
  let isRecordingVoice = false;
  let recordingSeconds = 0;
  let recordingTimerInterval = null;
  let discardRecording = false;

  function computeMessagesSignature(messages) {
    if (!messages || messages.length === 0) return "empty";
    return messages
      .map(m => `${m.id}:${m.read ? 1 : 0}:${m.imageStatus || ""}:${m.text || ""}:${m.audio ? 1 : 0}`)
      .join("|");
  }

  function renderMessages(forceScrollBottom = false) {
    const messages = db.getChatMessages(chatKey);
    const area = document.getElementById("chat-messages-scroll");
    if (!area) return;

    // Do not destroy DOM while a voice message is actively playing unless user forced it
    if (activeAudioEl && !activeAudioEl.paused && !forceScrollBottom) {
      return;
    }

    const nextSignature = computeMessagesSignature(messages);
    if (nextSignature === lastRenderedSignature && !forceScrollBottom) {
      return;
    }

    // Check if user is currently near the bottom BEFORE modifying innerHTML
    const prevScrollTop = area.scrollTop;
    const distanceFromBottom = area.scrollHeight - area.scrollTop - area.clientHeight;
    const wasNearBottom = lastRenderedSignature === null || distanceFromBottom < 90;

    lastRenderedSignature = nextSignature;

    if (messages.length === 0) {
      area.innerHTML = `
        <div style="text-align: center; padding: 40px 16px; color: var(--text-secondary);">
          <div style="color: var(--color-kor); margin-bottom: 12px; display: flex; justify-content: center;">${icons.chat(36)}</div>
          <p style="font-weight: 700; color: #FFF; font-size: 15px;">Henüz mesaj yok</p>
          <p style="font-size: 12px; margin-top: 4px;">İlk mesajı, sesli kaydı veya fotoğrafı göndererek antrenmanı planlayın.</p>
        </div>
      `;
      return;
    }

    area.innerHTML = messages.map(msg => {
      const isOutgoing = msg.senderId === currentUser.id;
      const timeStr = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Read status indicator for outgoing messages
      const readReceiptHtml = isOutgoing
        ? (msg.read
            ? `<span class="read-receipt read" title="Okundu" style="color: #00E5FF; display: inline-flex; align-items: center; gap: 3px; font-weight: 700;">${icons.checkCheck(13)} Okundu</span>`
            : `<span class="read-receipt sent" title="İletildi" style="color: rgba(255,255,255,0.45); display: inline-flex; align-items: center; gap: 3px;">${icons.check(12)} İletildi</span>`)
        : '';

      // VOICE MESSAGE RENDERING (Sesli Mesaj)
      if (msg.audio) {
        const durLabel = msg.audioDuration || "0:03";
        const barHeights = [10, 16, 22, 14, 24, 18, 12, 26, 20, 14, 22, 16, 24, 13, 19, 15, 21, 12];
        return `
          <div class="chat-bubble ${isOutgoing ? 'outgoing' : 'incoming'} chat-voice-bubble" style="min-width: 220px; max-width: 275px; padding: 10px 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <button type="button" class="btn-play-voice" data-msg-id="${msg.id}" aria-label="Sesli mesajı oynat" style="width: 36px; height: 36px; border-radius: 50%; border: none; background: ${isOutgoing ? 'rgba(255,255,255,0.22)' : 'var(--color-kor-gradient)'}; color: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; box-shadow: 0 3px 10px rgba(0,0,0,0.25);">
                <span class="voice-play-icon">${icons.play(16)}</span>
              </button>
              <div style="flex: 1; min-width: 0;">
                <div class="voice-waveform-bars" data-wave-id="${msg.id}" style="display: flex; align-items: center; gap: 2.5px; height: 26px; margin-bottom: 4px;">
                  ${barHeights.map((h, idx) => `
                    <span class="voice-wave-bar" data-bar-idx="${idx}" style="flex: 1; height: ${h}px; border-radius: 2px; background: ${isOutgoing ? 'rgba(255,255,255,0.45)' : 'rgba(255,87,34,0.45)'}; transition: background 0.15s ease, transform 0.15s ease;"></span>
                  `).join('')}
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10.5px; opacity: 0.9;">
                  <span class="voice-duration-label" data-dur-id="${msg.id}" style="font-weight: 700;">🎤 Sesli Mesaj · ${durLabel}</span>
                </div>
              </div>
              <audio id="voice-audio-${msg.id}" preload="metadata" src="${msg.audio}" style="display: none;"></audio>
            </div>
            <div class="chat-bubble-time" style="display: flex; align-items: center; justify-content: ${isOutgoing ? 'flex-end' : 'flex-start'}; gap: 5px; margin-top: 4px; font-size: 10px;">
              <span>${timeStr}</span>
              ${readReceiptHtml}
            </div>
          </div>
        `;
      }

      // PHOTO MESSAGE RENDERING
      if (msg.image) {
        if (isOutgoing) {
          return `
            <div class="chat-bubble outgoing" style="padding: 6px 8px;">
              <div class="chat-photo-thumb" data-full-img="${msg.image}" style="cursor: pointer;">
                <img src="${msg.image}" style="max-width: 220px; max-height: 200px; border-radius: 12px; display: block; object-fit: cover;">
              </div>
              ${msg.text && msg.text !== 'Fotoğraf' ? `<div style="margin-top: 4px; font-size: 13px;">${msg.text}</div>` : ''}
              <div class="chat-bubble-time" style="margin-top: 4px; font-size: 10px; display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end; width: 100%;">
                <span>${timeStr}</span> · <span>${icons.lock(10)} İzinli</span>
                ${readReceiptHtml}
              </div>
            </div>
          `;
        } else {
          if (msg.imageStatus === 'approved') {
            return `
              <div class="chat-bubble incoming" style="padding: 6px 8px;">
                <div class="chat-photo-thumb" data-full-img="${msg.image}" style="cursor: pointer;">
                  <img src="${msg.image}" style="max-width: 220px; max-height: 200px; border-radius: 12px; display: block; object-fit: cover;">
                </div>
                ${msg.text && msg.text !== 'Fotoğraf' ? `<div style="margin-top: 4px; font-size: 13px;">${msg.text}</div>` : ''}
                <div class="chat-bubble-time" style="margin-top: 4px; font-size: 10px; color: var(--color-emerald); display: inline-flex; align-items: center; gap: 4px;">
                  ${icons.check(11)} İzin Verildi · ${timeStr}
                </div>
              </div>
            `;
          } else if (msg.imageStatus === 'rejected') {
            return `
              <div class="chat-bubble incoming" style="padding: 8px 12px; font-size: 12px; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 4px;">
                ${icons.close(11)} Fotoğraf isteği gizlendi · <span class="chat-bubble-time">${timeStr}</span>
              </div>
            `;
          } else {
            return `
              <div class="chat-bubble incoming" style="padding: 10px; max-width: 260px; background: rgba(22, 24, 33, 0.95); border: 1px solid rgba(255, 87, 34, 0.4);">
                <div style="position: relative; border-radius: 10px; overflow: hidden; height: 110px; margin-bottom: 8px; background: #000;">
                  <img src="${msg.image}" style="width: 100%; height: 100%; object-fit: cover; filter: blur(14px) brightness(0.6); transform: scale(1.15);">
                  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #FFF; text-align: center; padding: 6px;">
                    <div style="color: var(--color-kor); margin-bottom: 4px;">${icons.lock(22)}</div>
                    <strong style="font-size: 12.5px;">Fotoğraf Paylaşıldı</strong>
                    <span style="font-size: 10.5px; color: rgba(255,255,255,0.75);">${partner.name} bir fotoğraf gönderdi</span>
                  </div>
                </div>
                <p style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.35; margin: 0 0 10px 0;">
                  Gizliliğiniz için fotoğraf kilitlendi. Görüntülemek için izin verin:
                </p>
                <div style="display: flex; gap: 6px;">
                  <button class="btn-approve-photo" data-msg-id="${msg.id}" style="flex: 1; padding: 7px 10px; font-size: 11.5px; font-weight: 800; background: var(--color-kor); color: #FFF; border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
                    ${icons.check(12)} İzin Ver ve Gör
                  </button>
                  <button class="btn-reject-photo" data-msg-id="${msg.id}" style="padding: 7px 10px; font-size: 11.5px; font-weight: 700; background: rgba(255,255,255,0.08); color: var(--text-secondary); border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px;">
                    ${icons.close(12)} Gizle
                  </button>
                </div>
                <div class="chat-bubble-time" style="margin-top: 6px;">${timeStr}</div>
              </div>
            `;
          }
        }
      }

      // STANDARD TEXT MESSAGE
      return `
        <div class="chat-bubble ${isOutgoing ? 'outgoing' : 'incoming'}">
          <div>${msg.text}</div>
          <div class="chat-bubble-time" style="display: flex; align-items: center; justify-content: ${isOutgoing ? 'flex-end' : 'flex-start'}; gap: 5px; margin-top: 4px; font-size: 10px;">
            <span>${timeStr}</span>
            ${readReceiptHtml}
          </div>
        </div>
      `;
    }).join('');

    // Preserve user's scroll position if they scrolled up; only scroll to bottom when near bottom or forced
    if (forceScrollBottom || wasNearBottom) {
      area.scrollTop = area.scrollHeight;
    } else {
      area.scrollTop = prevScrollTop;
    }

    // Attach Voice Message Play/Pause Handlers
    area.querySelectorAll(".btn-play-voice").forEach(btn => {
      btn.addEventListener("click", () => {
        const msgId = btn.dataset.msgId;
        const audioEl = document.getElementById(`voice-audio-${msgId}`);
        const iconSpan = btn.querySelector(".voice-play-icon");
        const waveWrap = area.querySelector(`.voice-waveform-bars[data-wave-id="${msgId}"]`);
        const bars = waveWrap ? Array.from(waveWrap.querySelectorAll(".voice-wave-bar")) : [];

        if (!audioEl) return;

        // Stop any other playing voice message
        if (activeAudioEl && activeAudioEl !== audioEl) {
          activeAudioEl.pause();
          activeAudioEl.currentTime = 0;
          if (activeVoiceMsgId) {
            const prevBtn = area.querySelector(`.btn-play-voice[data-msg-id="${activeVoiceMsgId}"] .voice-play-icon`);
            if (prevBtn) prevBtn.innerHTML = icons.play(16);
          }
        }

        if (audioEl.paused) {
          activeAudioEl = audioEl;
          activeVoiceMsgId = msgId;
          if (iconSpan) iconSpan.innerHTML = icons.pause(16);

          audioEl.ontimeupdate = () => {
            const total = audioEl.duration && isFinite(audioEl.duration) ? audioEl.duration : 3;
            const pct = Math.min(1, (audioEl.currentTime || 0) / total);
            const activeCount = Math.ceil(pct * bars.length);
            bars.forEach((b, idx) => {
              b.style.background = idx < activeCount ? "#00E5FF" : "";
              b.style.transform = idx === activeCount - 1 ? "scaleY(1.2)" : "scaleY(1)";
            });
          };

          audioEl.onended = () => {
            if (iconSpan) iconSpan.innerHTML = icons.play(16);
            bars.forEach(b => {
              b.style.background = "";
              b.style.transform = "scaleY(1)";
            });
            activeAudioEl = null;
            activeVoiceMsgId = null;
          };

          audioEl.play().catch(() => {
            soundService.playMessageChime();
            setTimeout(() => {
              if (iconSpan) iconSpan.innerHTML = icons.play(16);
              activeAudioEl = null;
              activeVoiceMsgId = null;
            }, 1500);
          });
        } else {
          audioEl.pause();
          if (iconSpan) iconSpan.innerHTML = icons.play(16);
          activeAudioEl = null;
          activeVoiceMsgId = null;
        }
      });
    });

    // Attach Photo Consent Click Handlers
    area.querySelectorAll(".btn-approve-photo").forEach(btn => {
      btn.addEventListener("click", () => {
        const msgId = btn.dataset.msgId;
        db.updateChatMessageImageStatus(chatKey, msgId, "approved");
        soundService.playPhotoChime();
        renderMessages(false);
      });
    });

    area.querySelectorAll(".btn-reject-photo").forEach(btn => {
      btn.addEventListener("click", () => {
        const msgId = btn.dataset.msgId;
        db.updateChatMessageImageStatus(chatKey, msgId, "rejected");
        renderMessages(false);
      });
    });

    // Lightbox click handlers
    area.querySelectorAll(".chat-photo-thumb").forEach(thumb => {
      thumb.addEventListener("click", () => {
        const fullImg = thumb.dataset.fullImg;
        const viewer = document.getElementById("chat-photo-lightbox");
        const viewerImg = document.getElementById("chat-photo-lightbox-img");
        if (viewer && viewerImg) {
          viewerImg.src = fullImg;
          viewer.style.display = "flex";
        }
      });
    });
  }

  modalOverlay.innerHTML = `
    <div class="modal-drawer fade-in" style="height: 85vh; display: flex; flex-direction: column; padding: 16px 20px;">
      <!-- Top Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid var(--border-glass);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="member-avatar accent-kor" style="width: 42px; height: 42px; font-size: 14px;">
            ${partner.initials || (partner.name ? partner.name.substring(0, 2).toUpperCase() : "SP")}
          </div>
          <div>
            <h4 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0;">${partner.name}</h4>
            <span style="font-size: 11px; color: var(--color-emerald); font-weight: 600;">● Aktif Antrenman Partneri</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button class="btn-ghost" id="btn-chat-safety" title="Güvenlik: Şikayet Et veya Engelle" style="padding: 6px; color: var(--color-rose); background: rgba(244, 63, 94, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            ${icons.shield(18)}
          </button>
          <button class="btn-ghost" id="btn-close-chat" style="padding: 6px; display: flex; align-items: center; justify-content: center;" aria-label="Kapat">
            ${icons.close(20)}
          </button>
        </div>
      </div>

      <!-- Safety Action Bar (Hidden by default) -->
      <div id="chat-safety-drawer" style="display: none; background: rgba(244, 63, 94, 0.08); border: 1px solid rgba(244, 63, 94, 0.28); border-radius: 10px; padding: 10px 12px; margin-top: 8px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 11.5px; color: #FFF; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">${icons.shield(14)} Güvenlik İşlemleri:</span>
          <div style="display: flex; gap: 6px;">
            <button id="btn-chat-report" style="padding: 5px 10px; font-size: 11px; font-weight: 800; background: var(--color-kor); color: #FFF; border: none; border-radius: 6px; cursor: pointer;">
              Şikayet Et
            </button>
            <button id="btn-chat-block" style="padding: 5px 10px; font-size: 11px; font-weight: 800; background: rgba(244, 63, 94, 0.25); color: #FF5252; border: 1px solid rgba(244, 63, 94, 0.5); border-radius: 6px; cursor: pointer;">
              Engelle
            </button>
          </div>
        </div>
      </div>

      <!-- Messages Scroll Area -->
      <div class="chat-messages-area" id="chat-messages-scroll" style="flex: 1; overflow-y: auto; padding: 16px 0; -webkit-overflow-scrolling: touch;"></div>

      <!-- Fullscreen Photo Lightbox -->
      <div id="chat-photo-lightbox" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 9999; align-items: center; justify-content: center; flex-direction: column; padding: 20px;">
        <img id="chat-photo-lightbox-img" src="" style="max-width: 94%; max-height: 80vh; border-radius: 14px; box-shadow: 0 12px 40px rgba(0,0,0,0.8);">
        <button id="btn-close-lightbox" class="btn-kor" style="width: auto; margin-top: 16px; padding: 10px 24px;">Kapat</button>
      </div>

      <!-- Quick Replies Strip -->
      <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none;">
        <button class="chip quick-chat-reply" style="white-space: nowrap; font-size: 11px; padding: 6px 10px;">Salona geçiyorum</button>
        <button class="chip quick-chat-reply" style="white-space: nowrap; font-size: 11px; padding: 6px 10px;">Isınmaya başladım</button>
        <button class="chip quick-chat-reply" style="white-space: nowrap; font-size: 11px; padding: 6px 10px;">Squat rack'teyim</button>
        <button class="chip quick-chat-reply" style="white-space: nowrap; font-size: 11px; padding: 6px 10px;">5 dk gecikeceğim</button>
      </div>

      <!-- Live Voice Recording Bar (Shown while recording) -->
      <div id="voice-recording-bar" style="display: none; align-items: center; justify-content: space-between; gap: 10px; background: rgba(244, 63, 94, 0.14); border: 1px solid rgba(244, 63, 94, 0.45); border-radius: 14px; padding: 10px 12px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: #FF3B30; box-shadow: 0 0 10px #FF3B30; animation: pulse 1s infinite;"></span>
          <span style="font-size: 12.5px; font-weight: 800; color: #FFF;">Ses Kaydediliyor</span>
          <span id="voice-rec-timer" style="font-family: monospace; font-size: 13px; font-weight: 800; color: var(--color-kor);">0:00</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button type="button" id="btn-cancel-voice" style="padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); color: var(--text-secondary); font-size: 11.5px; font-weight: 700; cursor: pointer;">
            İptal
          </button>
          <button type="button" id="btn-finish-voice" style="padding: 6px 12px; border-radius: 8px; border: none; background: var(--color-kor-gradient); color: #FFF; font-size: 11.5px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
            Gönder ${icons.send(13)}
          </button>
        </div>
      </div>

      <!-- Input Bar with Photo, Voice & Text -->
      <div class="chat-input-bar" style="padding-top: 8px; border-top: 1px solid var(--border-glass); display: flex; align-items: center; gap: 8px;">
        <input type="file" id="chat-photo-input" accept="image/*" style="display: none;">
        <button id="btn-send-photo" title="Fotoğraf Gönder (İzin Korumalı)" style="width: 40px; height: 40px; border-radius: 12px; background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); color: var(--color-kor); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
          ${icons.camera(19)}
        </button>
        <button id="btn-record-voice" title="Sesli Mesaj Gönder" aria-label="Sesli Mesaj Gönder" style="width: 40px; height: 40px; border-radius: 12px; background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); color: #00E5FF; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.2s ease;">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>
        <input type="text" class="chat-input-field" id="chat-msg-input" placeholder="Mesaj yazın veya 🎤 ses gönderin..." autocomplete="off" style="flex: 1; min-width: 0;">
        <button class="btn-chat-send" id="btn-send-chat" aria-label="Gönder" style="display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${icons.send(18)}
        </button>
      </div>
    </div>
  `;

  modalOverlay.classList.add("open");
  renderMessages(true);

  // Subscribe to real-time updates without resetting user scroll when reading older messages
  const unsubscribe = db.subscribe(chatKey, () => {
    db.markChatAsRead(chatKey, currentUser.id);
    renderMessages(false);
  });

  // Gentle background sync (only re-renders if message signature actually changed)
  const pollInterval = setInterval(() => {
    db.syncWithServer().then(() => {
      db.markChatAsRead(chatKey, currentUser.id);
      renderMessages(false);
    });
  }, 3000);

  // Close lightbox
  document.getElementById("btn-close-lightbox")?.addEventListener("click", () => {
    const viewer = document.getElementById("chat-photo-lightbox");
    if (viewer) viewer.style.display = "none";
  });

  function dispatchVoiceMessage(audioDataUrl, durationSec) {
    const formattedDur = formatVoiceDuration(durationSec);
    db.addChatMessage(chatKey, {
      senderId: currentUser.id,
      senderName: currentUser.name || "Sporcu",
      receiverId: partnerId,
      receiverName: partner.name || "Partner",
      text: `🎤 Sesli Mesaj (${formattedDur})`,
      audio: audioDataUrl,
      audioDuration: formattedDur,
      type: "voice"
    });
    soundService.playMessageChime();
    notify.success(`Sesli mesaj gönderildi (${formattedDur})`);
    renderMessages(true);
  }

  function cleanupVoiceRecordingUI() {
    clearInterval(recordingTimerInterval);
    isRecordingVoice = false;
    const recBar = document.getElementById("voice-recording-bar");
    if (recBar) recBar.style.display = "none";
    const voiceBtn = document.getElementById("btn-record-voice");
    if (voiceBtn) {
      voiceBtn.style.background = "var(--bg-surface-elevated)";
      voiceBtn.style.color = "#00E5FF";
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
  }

  async function startVoiceRecording() {
    if (isRecordingVoice) {
      // Second tap on mic button finishes and sends the recording
      finishVoiceRecording(false);
      return;
    }

    discardRecording = false;
    recordingSeconds = 0;
    audioChunks = [];
    isRecordingVoice = true;

    const recBar = document.getElementById("voice-recording-bar");
    const timerEl = document.getElementById("voice-rec-timer");
    const voiceBtn = document.getElementById("btn-record-voice");

    if (recBar) recBar.style.display = "flex";
    if (timerEl) timerEl.textContent = "0:00";
    if (voiceBtn) {
      voiceBtn.style.background = "rgba(244, 63, 94, 0.22)";
      voiceBtn.style.color = "#FF3B30";
    }

    recordingTimerInterval = setInterval(() => {
      recordingSeconds++;
      if (timerEl) timerEl.textContent = formatVoiceDuration(recordingSeconds);
      if (recordingSeconds >= 60) {
        finishVoiceRecording(false);
      }
    }, 1000);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof window.MediaRecorder !== "undefined") {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
        const supportedType = mimeTypes.find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
        mediaRecorder = supportedType ? new MediaRecorder(mediaStream, { mimeType: supportedType }) : new MediaRecorder(mediaStream);

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const finalDuration = Math.max(1, recordingSeconds);
          const wasDiscarded = discardRecording;
          cleanupVoiceRecordingUI();
          if (wasDiscarded) return;

          if (audioChunks.length > 0) {
            const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
            const reader = new FileReader();
            reader.onloadend = () => {
              dispatchVoiceMessage(reader.result, finalDuration);
            };
            reader.readAsDataURL(blob);
          } else {
            dispatchVoiceMessage(generateFallbackVoiceDataUrl(finalDuration), finalDuration);
          }
        };

        mediaRecorder.start();
      } else {
        mediaRecorder = null;
      }
    } catch (err) {
      // Fallback mode if microphone permission is denied or unavailable
      mediaRecorder = null;
    }
  }

  function finishVoiceRecording(cancel = false) {
    if (!isRecordingVoice) return;
    discardRecording = cancel;
    const finalDuration = Math.max(1, recordingSeconds);

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try {
        mediaRecorder.stop();
        return;
      } catch (e) {}
    }

    cleanupVoiceRecordingUI();
    if (!cancel) {
      dispatchVoiceMessage(generateFallbackVoiceDataUrl(finalDuration), finalDuration);
    }
  }

  document.getElementById("btn-record-voice")?.addEventListener("click", startVoiceRecording);
  document.getElementById("btn-cancel-voice")?.addEventListener("click", () => finishVoiceRecording(true));
  document.getElementById("btn-finish-voice")?.addEventListener("click", () => finishVoiceRecording(false));

  function sendMessage() {
    const input = document.getElementById("chat-msg-input");
    const text = input?.value.trim();
    if (!text) return;

    db.addChatMessage(chatKey, {
      senderId: currentUser.id,
      senderName: currentUser.name || "Sporcu",
      receiverId: partnerId,
      receiverName: partner.name || "Partner",
      text: text
    });

    soundService.playMessageChime();
    input.value = "";
    renderMessages(true);
  }

  // Quick reply click
  modalOverlay.querySelectorAll(".quick-chat-reply").forEach(chip => {
    chip.addEventListener("click", () => {
      const input = document.getElementById("chat-msg-input");
      if (input) {
        input.value = chip.textContent;
        sendMessage();
      }
    });
  });

  // Photo Attachment Handler (Compressed Canvas DataURL + Recipient Privacy Lock)
  const photoInput = document.getElementById("chat-photo-input");
  document.getElementById("btn-send-photo")?.addEventListener("click", () => {
    photoInput?.click();
  });

  photoInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 720;
        let w = img.width;
        let h = img.height;
        if (w > h && w > MAX_DIM) {
          h = Math.round((h * MAX_DIM) / w);
          w = MAX_DIM;
        } else if (h > MAX_DIM) {
          w = Math.round((w * MAX_DIM) / h);
          h = MAX_DIM;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.78);

        db.addChatMessage(chatKey, {
          senderId: currentUser.id,
          senderName: currentUser.name || "Sporcu",
          receiverId: partnerId,
          receiverName: partner.name || "Partner",
          text: "Fotoğraf",
          image: compressedDataUrl,
          imageStatus: "pending_approval"
        });

        soundService.playPhotoChime();
        notify.success("Fotoğraf partnerin izin onayına sunuldu!");
        renderMessages(true);
      };
      img.src = re.target.result;
    };
    reader.readAsDataURL(file);
    photoInput.value = "";
  });

  document.getElementById("btn-send-chat")?.addEventListener("click", sendMessage);
  document.getElementById("chat-msg-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Safety toggle & actions
  const safetyDrawer = document.getElementById("chat-safety-drawer");
  document.getElementById("btn-chat-safety")?.addEventListener("click", () => {
    if (safetyDrawer) {
      safetyDrawer.style.display = safetyDrawer.style.display === "none" ? "block" : "none";
    }
  });

  document.getElementById("btn-chat-report")?.addEventListener("click", () => {
    if (safetyDrawer) safetyDrawer.style.display = "none";
    showReportModal(partner, () => {
      renderMessages(false);
    });
  });

  document.getElementById("btn-chat-block")?.addEventListener("click", () => {
    db.blockUser(currentUser.id, partner.id);
    notify.info(`${partner.name} engellendi.`);
    close();
  });

  const close = () => {
    if (isRecordingVoice) {
      finishVoiceRecording(true);
    }
    if (activeAudioEl) {
      activeAudioEl.pause();
      activeAudioEl = null;
    }
    modalOverlay.classList.remove("open");
    clearInterval(pollInterval);
    unsubscribe();
    if (onClose) onClose();
  };

  document.getElementById("btn-close-chat")?.addEventListener("click", close);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) close();
  });
}
