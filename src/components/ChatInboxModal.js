/**
 * Veyro - Chat Inbox Modal (Sohbetler ve Gelen Mesajlar)
 * Lists all active conversation threads for the current logged-in user.
 * Displays partner avatar, latest message snippet, time, and unread badges.
 */

import { db } from '../services/db.js';
import { auth } from '../services/auth.js';
import { showChatModal } from './ChatModal.js';
import { icons } from './icons.js';

export function showChatInboxModal(onOpenChatPartner) {
  let modalOverlay = document.getElementById("chat-inbox-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "chat-inbox-overlay";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  const currentUser = auth.getCurrentUser() || { id: "current-user", name: "Sporcu" };
  const allUsers = db.getCollection("users") || [];
  const allGyms = db.getCollection("gyms") || [];

  function renderInbox() {
    const convos = db.getUserConversations(currentUser.id);

    modalOverlay.innerHTML = `
      <div class="modal-drawer fade-in" style="max-height: 85vh;">
        <div class="drawer-pill-bar"></div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border-glass);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 12px; background: var(--color-kor-gradient); display: flex; align-items: center; justify-content: center; color: #FFF; box-shadow: 0 4px 14px var(--color-kor-glow);">
              ${icons.chat(18)}
            </div>
            <div>
              <h3 style="font-size: 19px; font-weight: 800; color: #FFF; margin: 0;">Sohbetler</h3>
              <span style="font-size: 12px; color: var(--text-secondary);">${convos.length} aktif konuşma</span>
            </div>
          </div>
          <button class="btn-ghost" id="btn-close-inbox" style="padding: 6px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 60vh; overflow-y: auto;">
          ${convos.length === 0 ? `
            <div style="text-align: center; padding: 48px 16px; color: var(--text-secondary);">
              <div style="color: var(--text-muted); margin-bottom: 12px; display: flex; justify-content: center;">${icons.mail(36)}</div>
              <h4 style="font-size: 16px; font-weight: 800; color: #FFF; margin-bottom: 6px;">Henüz bir sohbetin yok</h4>
              <p style="font-size: 13px; line-height: 1.45; color: var(--text-muted); max-width: 280px; margin: 0 auto;">
                Keşfet ekranındaki sporcu kartlarında <strong>Sohbet</strong> butonuna dokunarak salondaki partnerine ilk mesajı gönderebilirsin.
              </p>
            </div>
          ` : convos.map(item => {
            const partner = allUsers.find(u => u.id === item.partnerId) || { id: item.partnerId, name: item.lastMessage?.senderName || "Sporcu", initials: "SP" };
            const gym = allGyms.find(g => g.id === partner.gymId);
            const timeStr = item.lastMessage?.timestamp ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const isMe = item.lastMessage?.senderId === currentUser.id;

            return `
              <div class="chat-thread-item" data-partner-id="${item.partnerId}" style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); border: 1px solid ${item.unreadCount > 0 ? 'rgba(255, 87, 34, 0.4)' : 'var(--border-glass)'}; border-radius: var(--radius-md); padding: 12px 14px; cursor: pointer; transition: all 0.2s ease;">
                <div style="display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1;">
                  <div class="member-avatar accent-kor" style="width: 44px; height: 44px; font-size: 15px; flex-shrink: 0; position: relative;">
                    ${partner.initials || "SP"}
                    ${item.unreadCount > 0 ? '<span class="avatar-online-dot" style="background: var(--color-kor);"></span>' : ''}
                  </div>
                  <div style="min-width: 0; flex: 1;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
                      <strong style="font-size: 15px; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${partner.name}
                      </strong>
                      <span style="font-size: 11px; color: var(--text-muted);">${timeStr}</span>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                      <p style="font-size: 12.5px; color: ${item.unreadCount > 0 ? 'var(--text-main)' : 'var(--text-secondary)'}; font-weight: ${item.unreadCount > 0 ? '700' : '400'}; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px;">
                        ${isMe ? (item.lastMessage?.read ? `<span style="color: #00E5FF; display: inline-flex; align-items: center;" title="Okundu">${icons.checkCheck(13)}</span>` : `<span style="color: rgba(255,255,255,0.45); display: inline-flex; align-items: center;" title="İletildi">${icons.check(12)}</span>`) : ''}
                        <span style="overflow: hidden; text-overflow: ellipsis;">${item.lastMessage?.text || (item.lastMessage?.image ? 'Fotoğraf' : '')}</span>
                      </p>
                      ${item.unreadCount > 0 ? `
                        <span style="background: var(--color-kor); color: #FFF; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 10px; margin-left: 8px; flex-shrink: 0;">
                          ${item.unreadCount}
                        </span>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Attach click handlers
    modalOverlay.querySelectorAll(".chat-thread-item").forEach(el => {
      el.addEventListener("click", () => {
        const pId = el.dataset.partnerId;
        closeInbox();
        if (onOpenChatPartner) {
          onOpenChatPartner(pId);
        } else {
          showChatModal(pId, () => renderInbox());
        }
      });
    });

    document.getElementById("btn-close-inbox")?.addEventListener("click", closeInbox);
  }

  const closeInbox = () => {
    modalOverlay.classList.remove("open");
  };

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeInbox();
  });

  modalOverlay.classList.add("open");
  renderInbox();

  // Subscribe to real-time chat updates
  const unsubscribe = db.subscribe("chats_updated", () => {
    renderInbox();
  });
}
