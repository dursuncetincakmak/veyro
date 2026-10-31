/**
 * Veyro - Live Partner Chat Modal
 * Instant real-time messaging, photo sharing with recipient privacy consent,
 * audible chimes, and live multi-device synchronization.
 */

import { db, getChatRoomKey } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { showReportModal } from './ReportModal.js';
import { icons } from './icons.js';

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

  function renderMessages() {
    const messages = db.getChatMessages(chatKey);
    const area = document.getElementById("chat-messages-scroll");
    if (!area) return;

    if (messages.length === 0) {
      area.innerHTML = `
        <div style="text-align: center; padding: 40px 16px; color: var(--text-secondary);">
          <div style="color: var(--color-kor); margin-bottom: 12px; display: flex; justify-content: center;">${icons.chat(36)}</div>
          <p style="font-weight: 700; color: #FFF; font-size: 15px;">Henüz mesaj yok</p>
          <p style="font-size: 12px; margin-top: 4px;">İlk mesajı göndererek veya fotoğraf paylaşarak antrenmanı planlayın.</p>
        </div>
      `;
      return;
    }

    area.innerHTML = messages.map(msg => {
      const isOutgoing = msg.senderId === currentUser.id;
      const timeStr = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // PHOTO MESSAGE RENDERING
      if (msg.image) {
        if (isOutgoing) {
          // Outgoing photo sent by current user
          return `
            <div class="chat-bubble outgoing" style="padding: 6px 8px;">
              <div class="chat-photo-thumb" data-full-img="${msg.image}" style="cursor: pointer;">
                <img src="${msg.image}" style="max-width: 220px; max-height: 200px; border-radius: 12px; display: block; object-fit: cover;">
              </div>
              ${msg.text && msg.text !== 'Fotoğraf' ? `<div style="margin-top: 4px; font-size: 13px;">${msg.text}</div>` : ''}
              <div class="chat-bubble-time" style="margin-top: 4px; font-size: 10px; display: inline-flex; align-items: center; gap: 4px;">
                ${timeStr} · <span>${icons.lock(10)} İzin Kontrollü</span>
              </div>
            </div>
          `;
        } else {
          // Incoming photo sent by partner
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
            // Pending Recipient Permission
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
          <div class="chat-bubble-time">${timeStr}</div>
        </div>
      `;
    }).join('');

    area.scrollTop = area.scrollHeight;

    // Attach Photo Consent Click Handlers
    area.querySelectorAll(".btn-approve-photo").forEach(btn => {
      btn.addEventListener("click", () => {
        const msgId = btn.dataset.msgId;
        db.updateChatMessageImageStatus(chatKey, msgId, "approved");
        soundService.playPhotoChime();
        renderMessages();
      });
    });

    area.querySelectorAll(".btn-reject-photo").forEach(btn => {
      btn.addEventListener("click", () => {
        const msgId = btn.dataset.msgId;
        db.updateChatMessageImageStatus(chatKey, msgId, "rejected");
        renderMessages();
      });
    });

    // Lightbox click handlers
    area.querySelectorAll(".chat-photo-thumb").forEach(thumb => {
      thumb.addEventListener("click", () => {
        const fullImg = thumb.dataset.fullImg;
        if (fullImg) openLightbox(fullImg);
      });
    });
  }

  function openLightbox(src) {
    let lb = document.getElementById("chat-lightbox-overlay");
    if (!lb) {
      lb = document.createElement("div");
      lb.id = "chat-lightbox-overlay";
      lb.style.cssText = `
        position: fixed; inset: 0; z-index: 10005; background: rgba(0,0,0,0.92);
        display: flex; align-items: center; justify-content: center; padding: 16px;
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      `;
      document.body.appendChild(lb);
    }
    lb.innerHTML = `
      <div style="position: relative; max-width: 95vw; max-height: 90vh;">
        <button id="btn-close-lightbox" style="position: absolute; top: -44px; right: 0; background: rgba(255,255,255,0.15); border: none; color: #FFF; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center;">${icons.close(18)}</button>
        <img src="${src}" style="max-width: 95vw; max-height: 85vh; border-radius: 12px; object-fit: contain; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
      </div>
    `;
    lb.style.display = "flex";
    const closeLb = () => { lb.style.display = "none"; };
    document.getElementById("btn-close-lightbox")?.addEventListener("click", closeLb);
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLb();
    });
  }

  const isBlocked = db.isBlocked(currentUser.id, partner.id);

  modalOverlay.innerHTML = `
    <div class="modal-drawer fade-in">
      <div class="drawer-pill-bar"></div>

      <div class="chat-container">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="chat-user-meta">
            <div class="member-avatar accent-kor" style="width: 40px; height: 40px; font-size: 14px;">
              ${partner.initials || "SP"}
            </div>
            <div>
              <strong style="font-size: 15px; color: var(--text-main); display: block;">${partner.name}</strong>
              <span style="font-size: 11px; color: var(--color-emerald); font-weight: 600;">● Çevrimiçi</span>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
            <button class="btn-ghost" id="btn-chat-safety" title="Güvenlik ve Şikayet" style="padding: 6px; color: var(--text-secondary);">
              ${icons.flag(18)}
            </button>
            <button class="btn-ghost" id="btn-close-chat" style="padding: 6px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Chat Safety Drawer -->
        <div id="chat-safety-drawer" style="display: none; background: rgba(18, 20, 28, 0.95); border-bottom: 1px solid var(--border-glass); padding: 12px 16px; margin: 0 -16px 10px; animation: slideDown 0.2s ease;">
          <div style="font-size: 12px; font-weight: 700; color: #FFF; margin-bottom: 8px;">${partner.name} ile İletişim Güvenliği</div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-secondary" id="btn-chat-report" style="flex: 1; padding: 8px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: #EF4444; border-color: rgba(239, 68, 68, 0.3);">
              ${icons.flag(14)} Şikayet Et
            </button>
            <button class="btn-secondary" id="btn-chat-block" style="flex: 1; padding: 8px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; color: #F59E0B; border-color: rgba(245, 158, 11, 0.3);">
              ${icons.close(14)} Engelle
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="chat-messages-area" id="chat-messages-scroll"></div>

        <!-- Input Bar with Photo Button or Blocked Notice -->
        ${isBlocked ? `
          <div style="padding: 14px 16px; text-align: center; color: #EF4444; font-size: 13px; font-weight: 600; background: rgba(239, 68, 68, 0.08); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.25);">
            Bu kullanıcı ile iletişim engellenmiştir. Mesaj gönderilemez.
          </div>
        ` : `
          <div class="chat-input-bar" style="display: flex; align-items: center; gap: 8px;">
            <!-- Hidden File Input for Photos -->
            <input type="file" id="chat-photo-file-input" accept="image/*" style="display: none;">

            <button class="btn-ghost" id="btn-pick-chat-photo" type="button" title="Fotoğraf Paylaş" style="width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-glass); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; color: #FFF;">
              ${icons.camera(18)}
            </button>

            <input type="text" id="chat-msg-input" class="chat-input-field" placeholder="${partner.name} kullanıcısına mesaj yaz..." autocomplete="off" style="flex: 1;">

            <button class="btn-send-message" id="btn-send-chat" aria-label="Gönder" style="flex-shrink: 0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        `}
      </div>
    </div>
  `;

  modalOverlay.classList.add("open");
  renderMessages();

  // Reactive subscription
  const unsubscribe = db.subscribe(chatKey, () => {
    db.markChatAsRead(chatKey, currentUser.id);
    renderMessages();
  });

  // Fast background polling & sync
  const pollInterval = setInterval(() => {
    db.syncWithServer().then(() => renderMessages());
  }, 1000);

  const sendMessage = () => {
    const input = document.getElementById("chat-msg-input");
    const text = input?.value.trim();
    if (text) {
      db.addChatMessage(chatKey, {
        senderId: currentUser.id,
        senderName: currentUser.name || "Sporcu",
        receiverId: partnerId,
        receiverName: partner.name || "Partner",
        text: text
      });
      soundService.playMessageChime();
      input.value = "";
      renderMessages();
    }
  };

  // Photo Attachment Handler with Canvas compression
  const photoInput = document.getElementById("chat-photo-file-input");
  document.getElementById("btn-pick-chat-photo")?.addEventListener("click", () => {
    photoInput?.click();
  });

  photoInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    notify.info("Fotoğraf hazırlanıyor...");
    const reader = new FileReader();
    reader.onload = (re) => {
      const img = new Image();
      img.onload = () => {
        // Compress via canvas to max 850px for fast transmission
        const canvas = document.createElement("canvas");
        const maxDim = 850;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
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
          imageStatus: "pending_approval" // recipient will see privacy consent lock
        });

        soundService.playPhotoChime();
        notify.success("Fotoğraf partnerin izin onayına sunuldu!");
        renderMessages();
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
      renderMessages();
    });
  });

  document.getElementById("btn-chat-block")?.addEventListener("click", () => {
    db.blockUser(currentUser.id, partner.id);
    notify.info(`${partner.name} engellendi.`);
    close();
  });

  const close = () => {
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
