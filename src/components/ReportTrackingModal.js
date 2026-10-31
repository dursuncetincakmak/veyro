/**
 * Veyro - Şikayet Takip ve Güvenlik Masası Modalı (Report Tracking Modal)
 * Kullanıcının ilettiği şikayetlerin durumunu (İnceleniyor, İşlem Yapıldı, Çözüldü),
 * takip numaralarını (#REP-XXXX) ve engellenen kullanıcıları görüntüleyip yönetmesini sağlar.
 */

import { db } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { icons } from './icons.js';

export function showReportTrackingModal(onClose) {
  const currentUser = auth.getCurrentUser() || { id: "current-user" };

  let overlay = document.getElementById("report-tracking-modal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "report-tracking-modal-overlay";
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  }

  let activeTab = "reports"; // 'reports' | 'blocked'

  function render() {
    const allReports = db.getCollection("reports") || [];
    // User's own filed reports
    const myReports = allReports.filter(r => r.reporterId === currentUser.id);

    // User's blocked list
    const allBlocked = db.getBlockedUsers(currentUser.id) || [];
    const allUsers = db.getCollection("users") || [];

    overlay.innerHTML = `
      <div class="modal-drawer fade-in" style="max-width: 500px; max-height: 88vh; display: flex; flex-direction: column; padding: 0;">
        <div class="drawer-pill-bar" style="margin-top: 10px;"></div>

        <!-- Header -->
        <div style="padding: 16px 20px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-glass);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(255, 87, 34, 0.15); color: var(--color-kor); display: flex; align-items: center; justify-content: center;">
              ${icons.flag(18)}
            </div>
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #FFF; margin: 0;">Güvenlik & Şikayet Takibi</h3>
              <span style="font-size: 11px; color: var(--text-secondary);">Bildirimleriniz ve Hesap Koruma</span>
            </div>
          </div>
          <button class="btn-ghost" id="btn-close-tracking-modal" style="padding: 6px; color: var(--text-secondary);">
            ${icons.close(20)}
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div style="display: flex; padding: 10px 16px 6px; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.06);">
          <button class="btn-ghost" id="tab-btn-my-reports" style="flex: 1; padding: 9px; font-size: 12.5px; font-weight: 700; border-radius: 10px; background: ${activeTab === 'reports' ? 'rgba(255, 87, 34, 0.15)' : 'transparent'}; color: ${activeTab === 'reports' ? 'var(--color-kor)' : 'var(--text-secondary)'}; border: 1px solid ${activeTab === 'reports' ? 'rgba(255, 87, 34, 0.3)' : 'transparent'};">
            Şikayetlerim (${myReports.length})
          </button>
          <button class="btn-ghost" id="tab-btn-my-blocked" style="flex: 1; padding: 9px; font-size: 12.5px; font-weight: 700; border-radius: 10px; background: ${activeTab === 'blocked' ? 'rgba(255, 87, 34, 0.15)' : 'transparent'}; color: ${activeTab === 'blocked' ? 'var(--color-kor)' : 'var(--text-secondary)'}; border: 1px solid ${activeTab === 'blocked' ? 'rgba(255, 87, 34, 0.3)' : 'transparent'};">
            Engellenenler (${allBlocked.length})
          </button>
        </div>

        <!-- Content Area -->
        <div style="flex: 1; overflow-y: auto; padding: 16px 20px 24px;">
          ${activeTab === 'reports' ? renderReportsTab(myReports) : renderBlockedTab(allBlocked, allUsers)}
        </div>
      </div>
    `;

    overlay.classList.add("open");

    const close = () => {
      overlay.classList.remove("open");
      onClose?.();
    };

    document.getElementById("btn-close-tracking-modal")?.addEventListener("click", close);

    document.getElementById("tab-btn-my-reports")?.addEventListener("click", () => {
      activeTab = "reports";
      render();
    });

    document.getElementById("tab-btn-my-blocked")?.addEventListener("click", () => {
      activeTab = "blocked";
      render();
    });

    // Unblock handlers
    overlay.querySelectorAll(".btn-unblock-user").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.targetId;
        const targetName = btn.dataset.targetName;
        db.unblockUser(currentUser.id, targetId);
        notify.success(`${targetName || 'Kullanıcı'} engeli kaldırıldı.`);
        render();
      });
    });
  }

  function renderReportsTab(reports) {
    if (reports.length === 0) {
      return `
        <div style="text-align: center; padding: 40px 16px; color: var(--text-secondary);">
          <div style="color: var(--color-kor); margin-bottom: 12px; display: flex; justify-content: center;">
            ${icons.check(32)}
          </div>
          <h4 style="color: #FFF; font-size: 15px; font-weight: 700; margin: 0 0 6px;">Açık Şikayetiniz Bulunmuyor</h4>
          <p style="font-size: 12px; line-height: 1.5; margin: 0;">
            Topluluk kurallarını ihlal eden bir durumla karşılaşırsanız sporcu profilinden veya sohbet penceresinden şikayet bildirimi oluşturabilirsiniz.
          </p>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${reports.map(rep => {
          let badgeColor = "#F59E0B";
          let badgeBg = "rgba(245, 158, 11, 0.12)";
          let statusText = rep.status || "İnceleniyor";

          if (rep.status === "İşlem Yapıldı") {
            badgeColor = "#10B981";
            badgeBg = "rgba(16, 185, 129, 0.15)";
          } else if (rep.status === "Çözüldü") {
            badgeColor = "#3B82F6";
            badgeBg = "rgba(59, 130, 246, 0.15)";
          }

          const dateStr = new Date(rep.createdAt || Date.now()).toLocaleDateString("tr-TR", {
            day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
          });

          return `
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--border-glass); border-radius: 14px; padding: 14px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-family: monospace; font-size: 12px; font-weight: 700; color: var(--color-kor); background: rgba(255, 87, 34, 0.12); padding: 3px 8px; border-radius: 6px;">
                  ${rep.ticketId || '#REP-XXXX'}
                </span>
                <span style="font-size: 11px; font-weight: 700; color: ${badgeColor}; background: ${badgeBg}; padding: 3px 10px; border-radius: 100px; display: inline-flex; align-items: center; gap: 4px;">
                  ● ${statusText}
                </span>
              </div>

              <div style="margin-bottom: 8px;">
                <strong style="color: #FFF; font-size: 14px; display: block;">${rep.reason}</strong>
                <span style="font-size: 12px; color: var(--text-muted);">Bildirilen Sporcu: <strong>${rep.reportedUserName || 'Kullanıcı'}</strong></span>
              </div>

              ${rep.details ? `
                <div style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 8px 10px; font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                  "${rep.details}"
                </div>
              ` : ''}

              ${rep.actionTaken ? `
                <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10B981; border-radius: 4px; padding: 8px 10px; font-size: 11.5px; color: #10B981; margin-bottom: 8px;">
                  <strong>Moderasyon Yanıtı:</strong> ${rep.actionTaken}
                </div>
              ` : `
                <div style="font-size: 11.5px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                  ${icons.clock(12)} Moderasyon ekibimiz bildiriminizi inceliyor.
                </div>
              `}

              <div style="font-size: 11px; color: var(--text-muted); text-align: right; margin-top: 4px;">
                ${dateStr}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderBlockedTab(blockedList, allUsers) {
    if (blockedList.length === 0) {
      return `
        <div style="text-align: center; padding: 40px 16px; color: var(--text-secondary);">
          <div style="color: var(--color-kor); margin-bottom: 12px; display: flex; justify-content: center;">
            ${icons.check(32)}
          </div>
          <h4 style="color: #FFF; font-size: 15px; font-weight: 700; margin: 0 0 6px;">Engellenen Kullanıcı Yok</h4>
          <p style="font-size: 12px; line-height: 1.5; margin: 0;">
            Engellediğiniz kullanıcılar burada listelenir. Engellediğiniz kişiler sizi göremez ve size mesaj gönderemez.
          </p>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${blockedList.map(b => {
          const u = allUsers.find(user => user.id === b.toUserId) || { name: "Sporcu", id: b.toUserId };
          return `
            <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--border-glass); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: #222; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                  ${(u.photos && u.photos[0]) || u.avatar ? `
                    <img src="${(u.photos && u.photos[0]) || u.avatar}" style="width: 100%; height: 100%; object-fit: cover;" alt="${u.name}" />
                  ` : `
                    <span style="font-weight: 700; font-size: 12px; color: #FFF;">${u.initials || 'SP'}</span>
                  `}
                </div>
                <div>
                  <strong style="color: #FFF; font-size: 13.5px; display: block;">${u.name}</strong>
                  <span style="font-size: 11px; color: var(--text-muted);">${u.gymName || 'Engellendi'}</span>
                </div>
              </div>
              <button class="btn-unblock-user btn-secondary" data-target-id="${u.id}" data-target-name="${u.name}" style="padding: 6px 12px; font-size: 11.5px; border-radius: 8px;">
                Engeli Kaldır
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  render();
}
