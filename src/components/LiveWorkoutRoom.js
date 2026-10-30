/**
 * Veyro - Live Co-Workout Room (Ortak Canlı Antrenman Odası)
 * Real-time synchronized set completions, spotter readiness, and rest countdown for both partners.
 */

import { db } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { workoutSync } from '../services/workoutSync.js';
import { icons } from './icons.js';

export function showLiveWorkoutRoom(appointment, partner, onClose, onFinishWorkout) {
  let modalOverlay = document.getElementById("live-workout-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "live-workout-overlay";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  const currentUser = auth.getCurrentUser() || { id: "current-user", name: "Ece", initials: "EC" };
  const exercises = db.getCollection("exercises");

  let session = workoutSync.getSession(appointment.id);
  let timerInterval = null;

  function render() {
    session = workoutSync.getSession(appointment.id);

    modalOverlay.innerHTML = `
      <div class="modal-drawer fade-in" style="max-height: 95vh; padding-bottom: 24px;">
        <div class="drawer-pill-bar"></div>

        <!-- Room Header -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <div>
            <span class="badge badge-kor" style="margin-bottom: 4px; display: inline-flex; align-items: center; gap: 5px;"><span class="dot-indicator" style="background:#FF453A;"></span> Canlı Antrenman Seansı</span>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main);">${appointment.workoutType || 'Bacak günü'}</h3>
          </div>
          <button class="btn-ghost" id="btn-close-live-room" style="padding: 6px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Partners Status Card -->
        <div style="background: linear-gradient(135deg, #1C1E28 0%, #111319 100%); border: 1px solid var(--border-glass-bright); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 18px;">
          <div style="display: flex; align-items: center; justify-content: space-around; margin-bottom: 14px;">
            <div style="text-align: center;">
              <div class="member-avatar accent-kor" style="width: 50px; height: 50px; font-size: 16px; margin: 0 auto 6px;">
                ${currentUser.initials || "EC"}
              </div>
              <strong style="font-size: 14px; color: #FFFFFF;">${currentUser.name} (Sen)</strong>
              <span style="font-size: 11px; color: var(--color-emerald); display: block;">● Salonda Aktif</span>
            </div>

            <div style="color: var(--color-kor); display: flex; align-items: center; justify-content: center;">
              ${icons.bolt(22)}
            </div>

            <div style="text-align: center;">
              <div class="member-avatar" style="width: 50px; height: 50px; font-size: 16px; margin: 0 auto 6px; background: var(--bg-surface-elevated); border: 2px solid var(--border-glass-bright);">
                ${partner.initials || "MR"}
              </div>
              <strong style="font-size: 14px; color: #FFFFFF;">${partner.name}</strong>
              <span style="font-size: 11px; color: var(--color-emerald); display: block;">● Salonda Aktif</span>
            </div>
          </div>

          <!-- Spotter Button & Status -->
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.04); padding: 10px 14px; border-radius: 12px; border: 1px solid var(--border-glass);">
            <div style="display: flex; align-items: center; gap: 8px;">
              ${icons.handshake(18)}
              <span style="font-size: 13px; font-weight: 600; color: var(--text-paper);">
                ${session.currentSpotter ? `Spotter: ${session.currentSpotter} hazır!` : 'Spotter bekliyor...'}
              </span>
            </div>
            <button class="btn-secondary" id="btn-toggle-spotter" style="padding: 6px 12px; font-size: 12px; width: auto;">
              ${session.currentSpotter === currentUser.name ? 'Dinlenmeye Geç' : 'Spot Vermeye Hazırım'}
            </button>
          </div>
        </div>

        <!-- Shared Exercises & Live Sets Completion -->
        <h4 style="font-size: 15px; font-weight: 800; margin-bottom: 12px; color: var(--text-main);">
          Ortak Set Takibi (İki Sporcu İçin Canlı)
        </h4>

        <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
          ${exercises.map(ex => {
            return `
              <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 14px 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <strong style="font-size: 15px; color: var(--text-main);">${ex.name}</strong>
                  <span style="font-size: 12px; color: var(--color-kor); font-weight: 700;">${ex.defaultSets} Set · ${ex.defaultReps} Tekrar</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${Array.from({ length: ex.defaultSets }).map((_, sIdx) => {
                    const myKey = `${ex.id}_s${sIdx}_${currentUser.id}`;
                    const partnerKey = `${ex.id}_s${sIdx}_${partner.id}`;
                    const myDone = Boolean(session.completedSets[myKey]);
                    const partnerDone = Boolean(session.completedSets[partnerKey]);

                    return `
                      <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-card); padding: 8px 12px; border-radius: 8px; font-size: 13px;">
                        <span style="font-weight: 700; color: var(--text-secondary);">Set ${sIdx + 1}</span>

                        <div style="display: flex; align-items: center; gap: 14px;">
                          <!-- My Checkbox -->
                          <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 11px; color: var(--text-secondary);">${currentUser.name}:</span>
                            <button class="set-check-btn ${myDone ? 'checked' : ''}" data-action="toggle-my-set" data-ex="${ex.id}" data-set="${sIdx}">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                          </div>

                          <!-- Partner Checkbox (Simulated sync) -->
                          <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 11px; color: var(--text-secondary);">${partner.name}:</span>
                            <button class="set-check-btn ${partnerDone ? 'checked' : ''}" data-action="toggle-partner-set" data-ex="${ex.id}" data-set="${sIdx}">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Activity Feed Stream -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: 12px; padding: 12px; margin-bottom: 20px; max-height: 120px; overflow-y: auto;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Canlı Akış Kayıtları</span>
          <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
            ${(session.activityLog || []).map(log => `
              <div style="font-size: 12px; color: var(--text-secondary);">
                <span style="color: var(--color-kor);">●</span> ${log.text}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Finish Workout Button -->
        <button class="btn-kor" id="btn-finish-live-workout">
          Antrenmanı Tamamla & Seansı Bitir
        </button>
      </div>
    `;

    modalOverlay.classList.add("open");

    // Close
    document.getElementById("btn-close-live-room")?.addEventListener("click", () => {
      modalOverlay.classList.remove("open");
      onClose?.();
    });

    // Spotter toggle
    document.getElementById("btn-toggle-spotter")?.addEventListener("click", () => {
      const isCurrentlyReady = session.currentSpotter === currentUser.name;
      workoutSync.setSpotterReady(appointment.id, currentUser, !isCurrentlyReady);
      notify.success(!isCurrentlyReady ? "Spot vermeye hazır olduğun bildirildi!" : "Dinlenme moduna geçildi.");
      render();
    });

    // My set toggle
    modalOverlay.querySelectorAll("[data-action='toggle-my-set']").forEach(btn => {
      btn.addEventListener("click", () => {
        const exId = btn.dataset.ex;
        const setIdx = Number(btn.dataset.set);
        workoutSync.completeSet(appointment.id, exId, setIdx, currentUser);
        notify.success(`Set ${setIdx + 1} tamamlandı! ${partner.name} kullanıcısına bildirildi.`);
        render();
      });
    });

    // Partner set toggle (for simulation in co-workout testing)
    modalOverlay.querySelectorAll("[data-action='toggle-partner-set']").forEach(btn => {
      btn.addEventListener("click", () => {
        const exId = btn.dataset.ex;
        const setIdx = Number(btn.dataset.set);
        workoutSync.completeSet(appointment.id, exId, setIdx, partner);
        notify.info(`${partner.name} Set ${setIdx + 1}'i tamamladı.`);
        render();
      });
    });

    // Finish Workout & Proceed to Attendance / Rating
    document.getElementById("btn-finish-live-workout")?.addEventListener("click", () => {
      modalOverlay.classList.remove("open");
      onFinishWorkout(appointment, partner);
    });
  }

  render();
}
