/**
 * Veyro - Create Appointment Modal (Randevu Oluştur)
 * Follows Page 7 of the PDF with workout categories, interactive date carousel,
 * time slots, calendar sync toggle, and reminder options.
 */

import { db, getChatRoomKey } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { generateIcsFile, openGoogleCalendarIntent } from '../services/calendar.js';
import { icons } from './icons.js';

export function showCreateAppointmentModal(partner, onClose, onSuccess) {
  if (!partner) {
    console.warn("showCreateAppointmentModal called without partner");
    onClose?.();
    return;
  }

  let modalOverlay = document.getElementById("appointment-modal-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "appointment-modal-overlay";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  const gym = (partner.gymId && db.getItemById("gyms", partner.gymId)) || { name: "Spor Salonu", district: "İstanbul" };

  const workoutTypes = ["Göğüs", "Sırt", "Bacak", "Omuz", "Kol", "Kardiyo"];
  const days = [
    { name: "Paz", num: "25", full: "Pazar 25 Ekim" },
    { name: "Pzt", num: "26", full: "Pazartesi 26 Ekim" },
    { name: "Sal", num: "27", full: "Salı 27 Ekim" },
    { name: "Çar", num: "28", full: "Çarşamba 28 Ekim" },
    { name: "Per", num: "29", full: "Perşembe 29 Ekim" },
    { name: "Cum", num: "30", full: "Cuma 30 Ekim" }
  ];
  const hourSlots = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30"];

  let selectedWorkout = "Bacak";
  let selectedDay = days[0];
  let selectedHour = "19:00";
  let syncCalendar = true;
  let reminderText = "1 saat önce";

  function render() {
    const partnerName = partner.name || "Sporcu";
    const partnerInitials = partner.initials || partnerName.substring(0, 2).toUpperCase();

    modalOverlay.innerHTML = `
      <div class="modal-drawer fade-in" style="max-height: 94vh; padding-bottom: max(24px, env(safe-area-inset-bottom));">
        <div class="drawer-pill-bar"></div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <button class="btn-ghost" id="btn-close-apt" style="padding: 6px; display: flex; align-items: center; justify-content: center;" aria-label="Geri">
            ${icons.chevronLeft(22)}
          </button>
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main);">Randevu oluştur</h3>
          <div style="width: 22px;"></div>
        </div>

        <!-- Matched Partner Card (Page 7) -->
        <div class="partner-badge-selected">
          <div class="member-avatar accent-kor" style="width: 44px; height: 44px; font-size: 15px;">
            ${partnerInitials}
          </div>
          <div style="flex: 1;">
            <strong style="font-size: 15px; color: var(--text-main);">${partnerName} ile</strong>
            <p style="font-size: 12px; color: var(--text-secondary);">${gym.name}</p>
          </div>
          <span class="badge badge-paper" style="display: inline-flex; align-items: center; gap: 4px;">
            ${icons.flame(12)} Eşleşti
          </span>
        </div>

        <!-- Antrenman Türü -->
        <div style="margin-bottom: 20px;">
          <label class="form-label">Antrenman türü</label>
          <div class="workout-types-grid" id="apt-workout-types">
            ${workoutTypes.map(w => `
              <button type="button" class="workout-type-btn ${selectedWorkout === w ? 'active' : ''}" data-type="${w}">
                ${w}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Gün Seçimi -->
        <div style="margin-bottom: 20px;">
          <label class="form-label">Gün</label>
          <div class="date-strip-scroll" id="apt-days-strip">
            ${days.map(d => `
              <div class="date-strip-day ${selectedDay.num === d.num ? 'active' : ''}" data-num="${d.num}">
                <div class="day-name">${d.name}</div>
                <div class="day-number">${d.num}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Saat Seçimi -->
        <div style="margin-bottom: 20px;">
          <label class="form-label">Saat</label>
          <div class="hours-slots-grid" id="apt-hours-grid">
            ${hourSlots.map(h => `
              <button type="button" class="hour-slot-btn ${selectedHour === h ? 'active' : ''}" data-hour="${h}">
                ${h}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Takvimime Ekle Switch -->
        <div class="form-toggle-row">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${icons.calendar(20)}
            <span style="font-size: 14px; font-weight: 700;">Takvimime ekle</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="check-calendar-sync" ${syncCalendar ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <!-- Hatırlatıcı Seçici -->
        <div class="form-toggle-row" id="row-reminder-select" style="cursor: pointer;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${icons.bell(20)}
            <span style="font-size: 14px; font-weight: 700;">Hatırlatıcı</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 13px; font-weight: 600;">
            <span id="label-reminder-time">${reminderText}</span>
            ${icons.chevronRight(16)}
          </div>
        </div>

        <!-- Submit Button -->
        <div style="margin-top: 24px;">
          <button class="btn-kor" id="btn-submit-appointment" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
            ${icons.bolt(16)} Randevuyu gönder
          </button>
        </div>
      </div>
    `;

    modalOverlay.classList.add("open");

    // Close handlers
    const closeModal = () => {
      modalOverlay.classList.remove("open");
      onClose?.();
    };

    document.getElementById("btn-close-apt")?.addEventListener("click", closeModal);

    modalOverlay.onclick = (e) => {
      if (e.target === modalOverlay) closeModal();
    };

    // Workout category click
    modalOverlay.querySelectorAll("#apt-workout-types .workout-type-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedWorkout = btn.dataset.type;
        render();
      });
    });

    // Day strip click
    modalOverlay.querySelectorAll("#apt-days-strip .date-strip-day").forEach(dayElem => {
      dayElem.addEventListener("click", () => {
        const num = dayElem.dataset.num;
        selectedDay = days.find(d => d.num === num) || days[0];
        render();
      });
    });

    // Hour slots click
    modalOverlay.querySelectorAll("#apt-hours-grid .hour-slot-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedHour = btn.dataset.hour;
        render();
      });
    });

    // Calendar sync toggle
    document.getElementById("check-calendar-sync")?.addEventListener("change", (e) => {
      syncCalendar = e.target.checked;
    });

    // Reminder selector
    document.getElementById("row-reminder-select")?.addEventListener("click", () => {
      const options = ["15 dakika önce", "30 dakika önce", "1 saat önce", "2 saat önce"];
      const nextIndex = (options.indexOf(reminderText) + 1) % options.length;
      reminderText = options[nextIndex];
      const lbl = document.getElementById("label-reminder-time");
      if (lbl) lbl.textContent = reminderText;
    });

    // Submit appointment (Send Sports Invite)
    document.getElementById("btn-submit-appointment")?.addEventListener("click", () => {
      const currentUser = auth.getCurrentUser() || { id: "current-user", name: "Sporcu" };
      const currentUserId = currentUser.id || "current-user";
      const currentUserName = currentUser.name || "Sporcu";

      // Also record like in db so matched list stays complete
      db.recordLike?.(currentUserId, partner.id);

      const newAppointment = db.addItem("appointments", {
        userId: currentUserId,
        userName: currentUserName,
        partnerId: partner.id,
        partnerName: partnerName,
        gymId: partner.gymId || currentUser.gymId,
        gymName: gym.name,
        workoutType: `${selectedWorkout} günü`,
        date: `${selectedDay.name} ${selectedDay.num}`,
        dayNum: selectedDay.num,
        time: selectedHour,
        status: "pending",
        syncCalendar: syncCalendar,
        reminder: reminderText
      });

      // Send sports invite message to chat thread
      const chatKey = getChatRoomKey(currentUserId, partner.id);
      db.addChatMessage(chatKey, {
        senderId: currentUserId,
        senderName: currentUserName,
        receiverId: partner.id,
        receiverName: partnerName,
        text: `Spor Daveti: ${selectedWorkout} antrenmanı için davet teklifi gönderdim (${selectedDay.name} ${selectedDay.num} · ${selectedHour}). Randevular sekmesinden kabul edebilirsin!`,
        type: "workout_invite",
        appointmentId: newAppointment.id
      });

      soundService.playMessageChime();
      notify.success(`${partnerName} kullanıcısına antrenman daveti başarıyla gönderildi!`);

      // If calendar sync is enabled, trigger real calendar generation
      if (syncCalendar) {
        setTimeout(() => {
          generateIcsFile(newAppointment, partner, gym);
          notify.info("Takvim (.ics) dosyası indirildi!");
        }, 600);
      }

      modalOverlay.classList.remove("open");
      onSuccess?.(newAppointment);
    });
  }

  render();
}
