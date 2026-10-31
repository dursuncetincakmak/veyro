/**
 * Veyro - Güvenlik & Şikayet Bildirimi Modalı (Report Modal)
 * Modern, mobil odaklı şikayet ve engelleme arayüzü.
 * - Çoklu kategori seçimi (Uygunsuz fotoğraf, sahte profil, taciz, no-show, spam vb.)
 * - Açıklama alanı
 * - Aynı anda engelleme seçeneği
 * - Benzersiz takip bileti (#REP-XXXX) üretir ve veritabanı ile senkronize eder.
 */

import { db } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { icons } from './icons.js';

export function showReportModal(targetUser, onComplete) {
  if (!targetUser) return;
  const currentUser = auth.getCurrentUser() || { id: "current-user", name: "Sporcu" };

  let overlay = document.getElementById("report-modal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "report-modal-overlay";
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  }

  const reasons = [
    { id: "fake_profile", label: "Sahte veya Yanıltıcı Profil", desc: "Başkasına ait fotoğraf veya sahte kimlik" },
    { id: "inappropriate_photo", label: "Uygunsuz / Rahatsız Edici Fotoğraf", desc: "Müstehcen veya kurallara aykırı görsel" },
    { id: "harassment", label: "Taciz, Tehdit veya Hakaret", desc: "Mesajlarda veya randevuda rahatsız edici tutum" },
    { id: "no_show", label: "Randevuya Gelmedi (No-Show)", desc: "Onaylanan antrenmana mazeretsiz katılmadı" },
    { id: "spam_commercial", label: "Spam / Reklam / Ticari Faaliyet", desc: "PT veya ürün satışı yapmaya çalışıyor" },
    { id: "other", label: "Diğer Güvenlik İhlali", desc: "Topluluk kurallarını ihlal eden diğer durumlar" }
  ];

  let selectedReason = reasons[0].label;
  let blockAlso = true;

  overlay.innerHTML = `
    <div class="modal-drawer fade-in" style="max-width: 480px; max-height: 90vh; overflow-y: auto; padding-bottom: 24px;">
      <div class="drawer-pill-bar"></div>

      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 12px; background: rgba(239, 68, 68, 0.15); color: #EF4444; display: flex; align-items: center; justify-content: center;">
            ${icons.flag(20)}
          </div>
          <div>
            <h3 style="font-size: 17px; font-weight: 800; color: #FFF; margin: 0;">Şikayet Et & Bildir</h3>
            <span style="font-size: 11.5px; color: var(--text-secondary);">Topluluk Güvenliği Masası</span>
          </div>
        </div>
        <button class="btn-ghost" id="btn-close-report-modal" style="padding: 6px; color: var(--text-secondary);">
          ${icons.close(20)}
        </button>
      </div>

      <!-- Target Athlete Banner -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--border-glass); border-radius: 14px; padding: 12px; display: flex; align-items: center; gap: 12px; margin-bottom: 18px;">
        <div style="width: 44px; height: 44px; border-radius: 50%; overflow: hidden; background: #222; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          ${(targetUser.photos && targetUser.photos[0]) || targetUser.avatar ? `
            <img src="${(targetUser.photos && targetUser.photos[0]) || targetUser.avatar}" style="width: 100%; height: 100%; object-fit: cover;" alt="${targetUser.name}" />
          ` : `
            <span style="font-weight: 800; font-size: 15px; color: #FFF;">${targetUser.initials || targetUser.name?.substring(0, 2).toUpperCase() || 'SP'}</span>
          `}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 700; color: #FFF; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${targetUser.name}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${targetUser.gymName || 'Veyro Sporcusu'}</div>
        </div>
      </div>

      <!-- Reason Selection -->
      <div style="margin-bottom: 18px;">
        <label style="display: block; font-size: 13px; font-weight: 700; color: #FFF; margin-bottom: 8px;">
          Şikayet Nedeni <span style="color: #EF4444;">*</span>
        </label>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${reasons.map((r, idx) => `
            <label class="report-reason-option ${idx === 0 ? 'active' : ''}" data-reason="${r.label}" style="display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1.5px solid ${idx === 0 ? 'var(--color-kor)' : 'var(--border-glass)'}; cursor: pointer; transition: all 0.2s ease;">
              <input type="radio" name="report_reason" value="${r.label}" ${idx === 0 ? 'checked' : ''} style="margin-top: 3px; accent-color: var(--color-kor);">
              <div>
                <strong style="display: block; font-size: 13.5px; color: #FFF;">${r.label}</strong>
                <span style="font-size: 11px; color: var(--text-secondary);">${r.desc}</span>
              </div>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Explanation Field -->
      <div style="margin-bottom: 18px;">
        <label for="input-report-details" style="display: block; font-size: 13px; font-weight: 700; color: #FFF; margin-bottom: 6px;">
          Detaylar ve Açıklama (İsteğe Bağlı)
        </label>
        <textarea id="input-report-details" rows="3" placeholder="Gördüğünüz durumu veya yaşadığınız olayı kısaca açıklayın..." style="width: 100%; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); color: #FFF; padding: 10px 12px; font-size: 13px; font-family: inherit; resize: vertical; box-sizing: border-box; outline: none;"></textarea>
      </div>

      <!-- Also Block Checkbox -->
      <div style="margin-bottom: 22px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 12px; padding: 12px;">
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
          <input type="checkbox" id="chk-also-block" checked style="width: 18px; height: 18px; accent-color: #EF4444; cursor: pointer;">
          <div>
            <strong style="display: block; font-size: 13px; color: #FFF;">Bu kullanıcıyı aynı zamanda engelle</strong>
            <span style="font-size: 11px; color: var(--text-secondary);">Birbirinizi Keşfet'te göremez, mesajlaşamaz ve davet gönderemezsiniz.</span>
          </div>
        </label>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 10px;">
        <button class="btn-secondary" id="btn-cancel-report" style="flex: 1; padding: 12px;">
          Vazgeç
        </button>
        <button class="btn-kor" id="btn-submit-report" style="flex: 2; padding: 12px; background: linear-gradient(135deg, #EF4444, #DC2626); border-color: #EF4444; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px;">
          ${icons.flag(16)} Şikayeti Gönder
        </button>
      </div>
    </div>
  `;

  overlay.classList.add("open");

  const close = () => {
    overlay.classList.remove("open");
  };

  document.getElementById("btn-close-report-modal")?.addEventListener("click", close);
  document.getElementById("btn-cancel-report")?.addEventListener("click", close);

  // Reason radio click highlighting
  overlay.querySelectorAll(".report-reason-option").forEach(labelEl => {
    labelEl.addEventListener("click", () => {
      overlay.querySelectorAll(".report-reason-option").forEach(l => {
        l.style.borderColor = "var(--border-glass)";
        l.classList.remove("active");
      });
      labelEl.style.borderColor = "var(--color-kor)";
      labelEl.classList.add("active");
      const radio = labelEl.querySelector("input[type='radio']");
      if (radio) {
        radio.checked = true;
        selectedReason = radio.value;
      }
    });
  });

  // Submit report
  document.getElementById("btn-submit-report")?.addEventListener("click", () => {
    const details = document.getElementById("input-report-details")?.value.trim() || "";
    const shouldBlock = document.getElementById("chk-also-block")?.checked;

    const ticketId = `#REP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const reportObj = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      ticketId: ticketId,
      reporterId: currentUser.id || "current-user",
      reporterName: currentUser.name || "Kullanıcı",
      reportedUserId: targetUser.id,
      reportedUserName: targetUser.name,
      reason: selectedReason,
      details: details || "Kullanıcı tarafından şikayet edildi.",
      status: "İnceleniyor", // 'İnceleniyor' | 'İşlem Yapıldı' | 'Çözüldü'
      actionTaken: "",
      createdAt: Date.now()
    };

    db.addItem("reports", reportObj);

    if (shouldBlock) {
      db.blockUser(currentUser.id, targetUser.id);
      notify.info(`${targetUser.name} engellendi.`);
    }

    notify.success(`Şikayetiniz (${ticketId}) alındı ve incelemeye alındı.`);
    close();
    onComplete?.();
  });
}
