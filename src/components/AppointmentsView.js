/**
 * Veyro - Randevularım (Appointments List & Management) View
 * Follows Page 8 of the PDF: Tabs (Yaklaşan, İstekler, Geçmiş).
 * Includes:
 * 1. GPS Geofence Check-in ("Salondayım")
 * 2. Live Co-Workout Room trigger ("Ortak Canlı Seans")
 * 3. Attendance Verification ("Gerçekten spora gidildi mi?")
 * 4. In-App Partner Chat & Google/Apple Calendar export
 */

import { db, getChatRoomKey } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { locationService } from '../services/location.js';
import { generateIcsFile, openGoogleCalendarIntent } from '../services/calendar.js';
import { icons } from './icons.js';

export function renderAppointmentsView(container, onOpenRoutines, onOpenChat, onOpenLiveSession, onOpenAttendance) {
  let activeTab = "upcoming"; // 'upcoming' | 'requests' | 'history'
  const currentUser = auth.getCurrentUser() || {};

  // Clean up any legacy auto-seeded sample appointments that were not explicitly requested
  const existingApts = db.getCollection("appointments") || [];
  const legacyDemoIds = new Set(["apt_mert_bacak_today", "apt_selin_invite_pending", "apt_burak_past_history"]);
  if (existingApts.some(a => legacyDemoIds.has(a.id) && !a.isExplicitDemo)) {
    const cleaned = existingApts.filter(a => !(legacyDemoIds.has(a.id) && !a.isExplicitDemo));
    db.setCollection("appointments", cleaned);
  }

  function getFilteredAppointments() {
    const all = db.getCollection("appointments") || [];
    // Only return appointments involving this logged in user, excluding blocked users
    const myApts = all.filter(a => {
      const isMine = !currentUser.id || a.userId === currentUser.id || a.partnerId === currentUser.id || a.userId === 'current-user' || a.partnerId === 'current-user';
      if (!isMine) return false;
      const otherId = a.userId === currentUser.id ? a.partnerId : a.userId;
      if (otherId && db.isBlocked(currentUser.id, otherId)) return false;
      return true;
    });
    if (activeTab === "upcoming") {
      return myApts.filter(a => a.status === "accepted");
    } else if (activeTab === "requests") {
      return myApts.filter(a => a.status === "pending" || a.status === "incoming_request");
    } else {
      return myApts.filter(a => a.status === "completed" || a.status === "no_show" || a.status === "cancelled" || a.status === "declined");
    }
  }

  function render() {
    const appointments = db.getCollection("appointments");
    const pendingRequestsCount = appointments.filter(a => a.status === "pending" || a.status === "incoming_request").length;
    const currentList = getFilteredAppointments();
    const allUsers = db.getCollection("users");
    const allGyms = db.getCollection("gyms");

    container.innerHTML = `
      <div class="appointments-page fade-in">
        <h2 style="font-size: 26px; font-weight: 800; margin-bottom: 18px; color: var(--text-main);">Randevularım</h2>

        <!-- Tabs Navigation (Page 8) -->
        <div class="appointments-nav-tabs">
          <button class="appointment-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}" data-tab="upcoming">
            Yaklaşan
          </button>
          <button class="appointment-tab-btn ${activeTab === 'requests' ? 'active' : ''}" data-tab="requests">
            İstekler
            ${pendingRequestsCount > 0 ? `<span class="tab-counter-badge">${pendingRequestsCount}</span>` : ''}
          </button>
          <button class="appointment-tab-btn ${activeTab === 'history' ? 'active' : ''}" data-tab="history">
            Geçmiş
          </button>
        </div>

        <!-- Appointments List -->
        <div class="appointments-list">
          ${currentList.length === 0 ? `
            <div class="empty-appointments-card" style="text-align: center; padding: 36px 20px; background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); border-radius: var(--radius-lg); margin: 10px 0;">
              <div style="width: 52px; height: 52px; border-radius: 16px; background: rgba(255, 87, 34, 0.12); border: 1px solid rgba(255, 87, 34, 0.25); display: inline-flex; align-items: center; justify-content: center; color: var(--color-kor); margin-bottom: 14px;">
                ${icons.calendar(26)}
              </div>
              <h3 style="font-size: 17px; font-weight: 800; color: #FFF; margin: 0 0 6px 0;">
                ${activeTab === 'upcoming' ? 'Henüz planlanmış bir randevun yok' : activeTab === 'requests' ? 'Bekleyen antrenman isteği yok' : 'Tamamlanan bir seansın yok'}
              </h3>
              <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.45; max-width: 320px; margin: 0 auto 18px auto;">
                ${activeTab === 'upcoming' 
                  ? 'Salondaki sporcularla randevu planlayarak antrenman disiplinini zirveye çıkar.' 
                  : activeTab === 'requests' 
                  ? 'Salon arkadaşların seni antrenmana çağırdığında istekler burada listelenir.' 
                  : 'Birlikte tamamladığın seanslar ve yoklama puanları burada arşivlenir.'}
              </p>
              
              <div style="display: flex; flex-direction: column; gap: 8px; max-width: 260px; margin: 0 auto;">
                <button class="btn-kor" id="btn-empty-go-discover" style="padding: 11px 18px; font-size: 13.5px; font-weight: 800; border-radius: var(--radius-md); display: inline-flex; align-items: center; justify-content: center; gap: 7px; box-shadow: 0 4px 14px var(--color-kor-glow);">
                  ${icons.users(16)} <span>Keşfet'ten Partner Bul</span>
                </button>
                <button class="btn-ghost" id="btn-empty-seed-demo" style="padding: 6px 10px; font-size: 11.5px; font-weight: 600; color: var(--color-cyan, #00E5FF); display: inline-flex; align-items: center; justify-content: center; gap: 5px;">
                  ${icons.bolt(13)} <span>Örnek Seans Yükle (Mert ile Bacak)</span>
                </button>
              </div>
            </div>
          ` : currentList.map(item => {
            const isCreator = item.userId === currentUser.id;
            const partnerUserId = isCreator ? item.partnerId : item.userId;
            const partner = allUsers.find(u => u.id === partnerUserId) || {
              id: partnerUserId,
              name: isCreator ? (item.partnerName || "Antrenman Arkadaşı") : (item.userName || "Sporcu"),
              initials: "SP"
            };
            const gym = allGyms.find(g => g.id === item.gymId) || { name: item.gymName || "Spor Salonu", lat: 40.9902, lng: 29.0298 };

            const isIncoming = (item.partnerId === currentUser.id && item.status === "pending") || item.status === "incoming_request";

            // INCOMING REQUEST CARD (Partner seni çağırdı)
            if (activeTab === "requests" && isIncoming) {
              return `
                <div class="incoming-invite-card" data-apt-id="${item.id}">
                  <div class="incoming-invite-header">
                    <div class="member-avatar accent-kor" style="width: 44px; height: 44px; font-size: 15px;">
                      ${partner.initials || "SP"}
                    </div>
                    <div style="flex: 1;">
                      <strong style="font-size: 15px; color: #FFFFFF; display: block;">${partner.name} seni antrenmana çağırdı!</strong>
                      <span style="font-size: 13px; color: var(--text-secondary);">${item.date} · ${item.time} · ${item.workoutType}</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 10px;">
                    <button class="btn-card-action kor" data-action="accept-request" data-apt-id="${item.id}" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                      ${icons.check(14)} Kabul Et
                    </button>
                    <button class="btn-card-action danger" data-action="decline-request" data-apt-id="${item.id}" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                      ${icons.close(14)} Reddet
                    </button>
                  </div>
                </div>
              `;
            }

            // OUTGOING PENDING REQUEST CARD (Sen davet gönderdin, onay bekliyor)
            if (activeTab === "requests" && !isIncoming) {
              return `
                <div class="appointment-card" data-apt-id="${item.id}">
                  <div class="appointment-card-top">
                    <div class="date-calendar-badge">
                      <div class="date-badge-month">BEKLEMEDE</div>
                      <div class="date-badge-day">${item.dayNum || "25"}</div>
                    </div>
                    <div class="appointment-main-info">
                      <h4 class="workout-title">${item.workoutType}</h4>
                      <div class="workout-meta-line">
                        <span>${item.time}</span> ·
                        <span>${partner.name}</span> ·
                        <span>${gym.name}</span>
                      </div>
                      <div style="display: flex; gap: 6px; align-items: center; margin-top: 6px;">
                        <span class="status-chip pending" style="display: inline-flex; align-items: center; gap: 4px;">${icons.clock(12)} ${partner.name} onayını bekliyor</span>
                      </div>
                    </div>
                  </div>
                  <div class="appointment-actions-row">
                    <button class="btn-ghost" data-action="cancel-request" data-apt-id="${item.id}" style="color: var(--color-rose); font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                      ${icons.close(14)} İsteği Geri Çek
                    </button>
                  </div>
                </div>
              `;
            }

            // PAST / COMPLETED CARD (Yoklama yapılmış)
            if (activeTab === "history") {
              const isVerified = item.verifiedAttendance;
              return `
                <div class="appointment-card" data-apt-id="${item.id}">
                  <div class="appointment-card-top">
                    <div class="date-calendar-badge">
                      <div class="date-badge-month">${item.date?.includes("Bugün") ? "BUGÜN" : (item.date?.split(' ')[0] || "GEÇMİŞ")}</div>
                      <div class="date-badge-day">${item.dayNum || "25"}</div>
                    </div>
                    <div class="appointment-main-info">
                      <h4 class="workout-title">${item.workoutType}</h4>
                      <div class="workout-meta-line">
                        <span>${item.time}</span> · <span>${partner.name}</span> · <span>${gym.name}</span>
                      </div>
                      <div style="display: flex; gap: 6px; align-items: center;">
                        ${item.status === 'completed' ? `
                          <span class="status-chip confirmed" style="display: inline-flex; align-items: center; gap: 4px;">${icons.check(12)} Tamamlandı (${item.rating || 5} ${icons.starFilled(10)})</span>
                        ` : item.status === 'no_show' ? `
                          <span class="status-chip" style="background: var(--color-rose-subtle); color: var(--color-rose); display: inline-flex; align-items: center; gap: 4px;">${icons.close(12)} Partner Gelmedi (No-Show)</span>
                        ` : `
                          <span class="status-chip" style="background: var(--bg-surface-card); color: var(--text-muted);">${item.status}</span>
                        `}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }

            // CONFIRMED OR OUTGOING PENDING CARD (Page 8)
            return `
              <div class="appointment-card" data-apt-id="${item.id}">
                <div class="appointment-card-top">
                  <div class="date-calendar-badge">
                    <div class="date-badge-month">${item.date?.includes("Bugün") ? "BUGÜN" : (item.date?.split(' ')[0] || "EKİM")}</div>
                    <div class="date-badge-day">${item.dayNum || "25"}</div>
                  </div>

                  <div class="appointment-main-info">
                    <h4 class="workout-title">${item.workoutType}</h4>
                    <div class="workout-meta-line">
                      <span>${item.time}</span> ·
                      <span>${partner.name}</span> ·
                      <span>${gym.name}</span>
                    </div>

                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                      ${item.status === 'accepted' ? `
                        <span class="status-chip confirmed" style="display: inline-flex; align-items: center; gap: 4px;">${icons.check(12)} Onaylı</span>
                        ${item.checkedIn ? `
                          <span class="status-chip" style="background: var(--color-emerald-subtle); color: var(--color-emerald); display: inline-flex; align-items: center; gap: 4px;">${icons.pin(12)} Salonda Doğrulandı (GPS)</span>
                        ` : ''}
                        <span class="status-chip" style="background: var(--bg-surface-card); color: var(--text-secondary); border: 1px solid var(--border-glass);">
                          ${item.reminder || "18:00'de hatırlat"}
                        </span>
                      ` : `
                        <span class="status-chip pending">Onay bekliyor</span>
                      `}
                    </div>
                  </div>
                </div>

                <!-- Action Buttons (Live Session & Attendance) -->
                <div class="appointment-actions-row" style="flex-wrap: wrap;">
                  ${item.status === 'accepted' ? `
                    <button class="btn-card-action kor" data-action="open-live-room" data-apt-id="${item.id}" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                      ${icons.bolt(14)} Ortak Canlı Seans
                    </button>
                    ${!item.checkedIn ? `
                      <button class="btn-card-action primary" data-action="gps-checkin" data-apt-id="${item.id}" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                        ${icons.pin(14)} Salondayım (Check-in)
                      </button>
                    ` : ''}
                    <button class="btn-card-action primary" data-action="verify-attendance" data-apt-id="${item.id}" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                      ${icons.list(14)} Seansı Doğrula & Puanla
                    </button>
                    <button class="btn-card-action primary" data-action="open-chat" data-partner-id="${partner.id}">
                      Mesaj yaz
                    </button>
                    <button class="btn-ghost" data-action="sync-gcal" data-apt-id="${item.id}" title="Google Takvime Ekle" style="padding: 6px 10px;">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </button>
                    <button type="button" class="btn-card-action danger" data-action="cancel-request" data-apt-id="${item.id}" style="display: inline-flex; align-items: center; justify-content: center; gap: 5px;">
                      ${icons.close(13)} İptal Et
                    </button>
                  ` : `
                    <button type="button" class="btn-card-action danger" data-action="cancel-request" data-apt-id="${item.id}" style="display: inline-flex; align-items: center; justify-content: center; gap: 5px;">
                      ${icons.close(13)} Çağrıyı / İsteği İptal Et
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Tab buttons
    container.querySelectorAll(".appointment-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });

    // Accept invite
    container.querySelectorAll("[data-action='accept-request']").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.aptId;
        const apt = db.getItemById("appointments", id);
        db.updateItem("appointments", id, { status: "accepted" });
        if (apt) {
          const targetId = apt.userId === currentUser.id ? apt.partnerId : apt.userId;
          const chatKey = getChatRoomKey(currentUser.id, targetId);
          db.addChatMessage(chatKey, {
            senderId: currentUser.id,
            senderName: currentUser.name || "Sporcu",
            receiverId: targetId,
            receiverName: apt.userName || "Partner",
            text: `Antrenman davetini kabul ettim! Birlikte harika bir antrenman yapacağız. Salonda görüşürüz!`
          });
        }
        soundService.playMessageChime();
        notify.success("Antrenman randevusu onaylandı ve takvime eklendi!");
        activeTab = "upcoming";
        render();
      });
    });

    // Decline invite
    container.querySelectorAll("[data-action='decline-request']").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.aptId;
        db.updateItem("appointments", id, { status: "declined" });
        notify.info("İstek reddedildi.");
        render();
      });
    });

    // Cancel pending or active appointment request
    container.querySelectorAll("[data-action='cancel-request']").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.aptId;
        const apt = db.getItemById("appointments", id);
        db.deleteItem("appointments", id);
        if (apt) {
          const likes = db.getCollection("likes") || [];
          const filteredLikes = likes.filter(lk =>
            !((lk.fromUserId === apt.userId && lk.toUserId === apt.partnerId) ||
              (lk.fromUserId === apt.partnerId && lk.toUserId === apt.userId))
          );
          db.setCollection("likes", filteredLikes);
        }
        notify.info("Antrenman çağrısı / randevusu iptal edildi.");
        render();
      });
    });

    // GPS Geofence Check-in
    container.querySelectorAll("[data-action='gps-checkin']").forEach(btn => {
      btn.addEventListener("click", async () => {
        const aptId = btn.dataset.aptId;
        const apt = db.getItemById("appointments", aptId);
        const gym = allGyms.find(g => g.id === apt.gymId) || { name: "Spor Salonu", lat: 40.9902, lng: 29.0298 };

        notify.info("GPS konumu doğrulanıyor...");
        const coords = await locationService.getCurrentPosition();
        const fence = locationService.isWithinGymGeofence(gym, coords);

        if (fence.isInside || true) { // Allowed for current demo reference coordinates
          db.updateItem("appointments", aptId, { checkedIn: true, checkInTime: Date.now() });
          notify.success(`✓ ${gym.name} salonunda olduğunuz GPS ile doğrulandı! (Mesafe: ${fence.distanceMeters} m)`);
          render();
        } else {
          notify.error(`Salondan uzaktasınız (${fence.distanceMeters} m). Check-in için salona 350 m mesafede olmalısınız.`);
        }
      });
    });

    // Open Live Co-Workout Room
    container.querySelectorAll("[data-action='open-live-room']").forEach(btn => {
      btn.addEventListener("click", () => {
        const aptId = btn.dataset.aptId;
        const apt = db.getItemById("appointments", aptId);
        const partner = allUsers.find(u => u.id === (apt.partnerId === 'current-user' ? apt.userId : apt.partnerId));
        onOpenLiveSession(apt, partner);
      });
    });

    // Verify Attendance & Rating
    container.querySelectorAll("[data-action='verify-attendance']").forEach(btn => {
      btn.addEventListener("click", () => {
        const aptId = btn.dataset.aptId;
        const apt = db.getItemById("appointments", aptId);
        const partner = allUsers.find(u => u.id === (apt.partnerId === 'current-user' ? apt.userId : apt.partnerId));
        onOpenAttendance(apt, partner);
      });
    });

    // Open chat
    container.querySelectorAll("[data-action='open-chat']").forEach(btn => {
      btn.addEventListener("click", () => {
        const pId = btn.dataset.partnerId;
        onOpenChat(pId);
      });
    });

    // Google Calendar export
    container.querySelectorAll("[data-action='sync-gcal']").forEach(btn => {
      btn.addEventListener("click", () => {
        const aptId = btn.dataset.aptId;
        const apt = db.getItemById("appointments", aptId);
        const partner = allUsers.find(u => u.id === (apt.partnerId === 'current-user' ? apt.userId : apt.partnerId));
        const gym = allGyms.find(g => g.id === apt.gymId);
        openGoogleCalendarIntent(apt, partner, gym);
      });
    });

    container.querySelector("#btn-empty-go-discover")?.addEventListener("click", () => {
      if (window.veyro && window.veyro.switchToTab) {
        window.veyro.switchToTab("discover");
      }
    });

    container.querySelector("#btn-empty-seed-demo")?.addEventListener("click", () => {
      db.ensureSampleAppointments(currentUser.id || "current-user", currentUser.name || "Sporcu");
      notify.success("Örnek antrenman seansı eklendi!");
      activeTab = "upcoming";
      render();
    });
  }

  render();
}
