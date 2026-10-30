/**
 * Veyro - Plan Workout Modal (Antrenman Planlama & Çağrı Ekranı)
 * "Ne zaman ve nerede spor yapacaksın?"
 * Kullanıcının kendi antrenman gününü, saatini, salonunu ve çalışma bölgesini planlayıp
 * salon eşleşmelerinde aktif antrenman çağrısı olarak yayınlamasını sağlar.
 */

import { auth } from '../services/auth.js';
import { db } from '../services/db.js';
import { notify } from '../services/notification.js';
import { locationService } from '../services/location.js';
import { gymPlacesService } from '../services/gymPlacesService.js';
import { icons } from './icons.js';

export function showPlanWorkoutModal(onSuccess, onClose) {
  let modalOverlay = document.getElementById("plan-workout-modal-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "plan-workout-modal-overlay";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  const currentUser = auth.getCurrentUser() || {};
  const currentPlan = currentUser.nextWorkout || {};
  let allGyms = [...(db.getCollection("gyms") || [])];

  // Default initial values from current active plan or defaults
  const state = {
    day: currentPlan.day || "Bugün",
    time: currentPlan.time || "19:30",
    gymId: currentPlan.gymId || currentUser.gymId || (allGyms[0]?.id || "gym_maps_direct"),
    workoutType: currentPlan.workoutType || currentPlan.type || "Bacak & Squat Günü",
    expectation: currentPlan.expectation || "Spotter arıyorum",
    note: currentPlan.note || ""
  };

  const dayOptions = ["Bugün", "Yarın", "Bu Hafta Sonu"];
  const quickTimes = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
  const workoutTypes = [
    "Bacak & Squat Günü",
    "Göğüs & Biceps",
    "Sırt & Deadlift",
    "Omuz & Kol",
    "Kardiyo & HIIT",
    "Tüm Vücut (Full Body)"
  ];
  const expectations = [
    { id: "Spotter arıyorum", icon: icons.shield(15), label: "Spotter Arıyorum", desc: "Ağır kilolarda güvenlik ve destek" },
    { id: "Ağırlık arttıracağız", icon: icons.bolt(15), label: "Ağırlık Arttıracağız", desc: "Maksimum güç ve PR denemeleri" },
    { id: "Motivasyon & Disiplin", icon: icons.flame(15), label: "Motivasyon & Disiplin", desc: "Pes etmeden tempolu çalışma" },
    { id: "Kardiyo Arkadaşı", icon: icons.run(15), label: "Kardiyo Arkadaşı", desc: "Koşu, kürek ve kondisyon partneri" }
  ];

  function render() {
    modalOverlay.innerHTML = `
      <div class="modal-drawer fade-in" style="max-height: 90vh;">
        <div class="drawer-pill-bar"></div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px;">
              ${icons.bolt(20)} <span>Antrenmanını Planla</span>
            </h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 4px 0 0 0;">
              Ne zaman, nerede ve hangi bölgeyi çalışacağını belirle; salondaki partnerlerle eşleş!
            </p>
          </div>
          <button class="btn-ghost" id="btn-close-plan-workout" style="padding: 6px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div style="overflow-y: auto; max-height: calc(90vh - 150px); padding-right: 4px;">
          <!-- 1. HANGİ GÜN -->
          <div style="margin-bottom: 18px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.calendar(15)} <span>Hangi Gün?</span>
            </label>
            <div style="display: flex; gap: 8px;">
              ${dayOptions.map(d => `
                <button type="button" class="plan-day-chip ${state.day === d ? 'active' : ''}" data-day="${d}"
                  style="flex: 1; padding: 10px 12px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; text-align: center; border: 1.5px solid ${state.day === d ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${state.day === d ? 'rgba(255, 87, 34, 0.15)' : 'var(--bg-surface-elevated)'}; color: ${state.day === d ? 'var(--color-kor)' : 'var(--text-secondary)'};">
                  ${d}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 2. SAAT KAÇTA -->
          <div style="margin-bottom: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-size: 13px; font-weight: 700; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 6px;">
                ${icons.clock(15)} <span>Saat Kaçta?</span>
              </label>
              <span style="font-size: 13px; font-weight: 800; color: var(--color-kor);" id="label-selected-time">
                ${state.time}
              </span>
            </div>

            <!-- Quick time pills -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 8px;">
              ${quickTimes.map(t => `
                <button type="button" class="plan-time-chip ${state.time === t ? 'active' : ''}" data-time="${t}"
                  style="padding: 8px 6px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; text-align: center; border: 1.5px solid ${state.time === t ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${state.time === t ? 'rgba(255, 87, 34, 0.15)' : 'var(--bg-surface-elevated)'}; color: ${state.time === t ? 'var(--color-kor)' : 'var(--text-secondary)'};">
                  ${t}
                </button>
              `).join('')}
            </div>

            <!-- Custom time input fallback -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; color: var(--text-muted);">Özel saat:</span>
              <input type="time" id="input-custom-plan-time" value="${state.time}"
                style="padding: 6px 12px; background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); border-radius: 8px; color: #FFF; font-size: 12px; outline: none;">
            </div>
          </div>

          <!-- 3. HANGİ SALONDA -->
          <div style="margin-bottom: 18px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.pin(15)} <span>Hangi Salonda?</span>
            </label>
            <select id="select-plan-gym" class="field-select" style="width: 100%; padding: 12px 14px; background: var(--bg-surface-elevated); border: 1.5px solid var(--border-glass); border-radius: 12px; color: #FFF; font-size: 13.5px; font-weight: 600; outline: none;">
              ${allGyms.map(g => `
                <option value="${g.id}" ${state.gymId === g.id ? 'selected' : ''}>
                  ${g.name} (${g.district})
                </option>
              `).join('')}
            </select>
          </div>

          <!-- 4. HANGİ BÖLGE / ANTRENMAN TÜRÜ -->
          <div style="margin-bottom: 18px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.dumbbell(15)} <span>Antrenman Bölgesi</span>
            </label>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
              ${workoutTypes.map(w => `
                <button type="button" class="plan-workout-chip ${state.workoutType === w ? 'active' : ''}" data-workout="${w}"
                  style="padding: 10px 12px; border-radius: 12px; font-size: 12.5px; font-weight: 700; cursor: pointer; text-align: left; border: 1.5px solid ${state.workoutType === w ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${state.workoutType === w ? 'rgba(255, 87, 34, 0.15)' : 'var(--bg-surface-elevated)'}; color: ${state.workoutType === w ? 'var(--color-kor)' : 'var(--text-secondary)'};">
                  ${w}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 5. PARTNER BEKLENTİSİ -->
          <div style="margin-bottom: 18px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.target(15)} <span>Partner Beklentisi</span>
            </label>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${expectations.map(exp => `
                <div class="expectation-item ${state.expectation === exp.id ? 'active' : ''}" data-exp="${exp.id}"
                  style="padding: 10px 14px; border-radius: 12px; cursor: pointer; border: 1.5px solid ${state.expectation === exp.id ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${state.expectation === exp.id ? 'rgba(255, 87, 34, 0.12)' : 'var(--bg-surface-elevated)'}; display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <strong style="font-size: 13px; color: ${state.expectation === exp.id ? 'var(--color-kor)' : 'var(--text-main)'}; display: flex; align-items: center; gap: 6px;">
                      ${exp.icon} <span>${exp.label}</span>
                    </strong>
                    <span style="font-size: 11px; color: var(--text-secondary);">
                      ${exp.desc}
                    </span>
                  </div>
                  <div style="width: 18px; height: 18px; border-radius: 50%; border: 2px solid ${state.expectation === exp.id ? 'var(--color-kor)' : 'var(--text-muted)'}; display: flex; align-items: center; justify-content: center;">
                    ${state.expectation === exp.id ? '<div style="width: 8px; height: 8px; border-radius: 50%; background: var(--color-kor);"></div>' : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 6. KISA ANTRENMAN NOTU -->
          <div style="margin-bottom: 22px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              ${icons.chat(15)} <span>Çağrı Notu (Opsiyonel)</span>
            </label>
            <input type="text" id="input-plan-note" value="${state.note}" placeholder="Örn: 100 kg bench press deneyeceğim, sağlam spotter lazım!"
              style="width: 100%; padding: 12px 14px; background: var(--bg-surface-elevated); border: 1.5px solid var(--border-glass); border-radius: 12px; color: #FFF; font-size: 13px; outline: none;">
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 14px;">
          ${currentPlan.time ? `
            <button class="btn-ghost" id="btn-delete-plan" style="padding: 12px 14px; color: var(--color-rose); font-size: 13px; font-weight: 700;">
              Planı Kaldır
            </button>
          ` : ''}
          <button class="btn-kor" id="btn-save-plan" style="flex: 1; padding: 14px; font-size: 14px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
            ${icons.rocket(16)} <span>Antrenman Çağrımı Yayınla</span>
          </button>
        </div>
      </div>
    `;

    modalOverlay.classList.add("open");

    // Close handler
    const close = () => {
      modalOverlay.classList.remove("open");
      onClose?.();
    };
    document.getElementById("btn-close-plan-workout")?.addEventListener("click", close);

    // Day selection
    modalOverlay.querySelectorAll(".plan-day-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        state.day = btn.dataset.day;
        render();
      });
    });

    // Quick time selection
    modalOverlay.querySelectorAll(".plan-time-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        state.time = btn.dataset.time;
        render();
      });
    });

    // Custom time
    document.getElementById("input-custom-plan-time")?.addEventListener("change", (e) => {
      state.time = e.target.value;
      const lbl = document.getElementById("label-selected-time");
      if (lbl) lbl.textContent = state.time;
    });

    // Gym selection
    document.getElementById("select-plan-gym")?.addEventListener("change", (e) => {
      state.gymId = e.target.value;
    });

    // Asynchronously fetch live Maps gyms for user's GPS
    locationService.getCurrentPosition().then(coords => {
      gymPlacesService.fetchNearbyGymsFromMaps(coords).then(liveGyms => {
        if (liveGyms && liveGyms.length > 0) {
          liveGyms.forEach(lg => {
            if (!allGyms.some(g => g.name?.toLowerCase() === lg.name?.toLowerCase())) {
              allGyms.push(lg);
            }
          });
          const select = document.getElementById("select-plan-gym");
          if (select) {
            select.innerHTML = allGyms.map(g => `
              <option value="${g.id}" ${state.gymId === g.id ? 'selected' : ''}>
                ${g.name} (${g.district} · ${g.distanceText || 'Maps'})
              </option>
            `).join('');
          }
        }
      });
    });

    // Workout type selection
    modalOverlay.querySelectorAll(".plan-workout-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        state.workoutType = btn.dataset.workout;
        render();
      });
    });

    // Expectation selection
    modalOverlay.querySelectorAll(".expectation-item").forEach(item => {
      item.addEventListener("click", () => {
        state.expectation = item.dataset.exp;
        render();
      });
    });

    // Delete plan
    document.getElementById("btn-delete-plan")?.addEventListener("click", () => {
      auth.updateProfile({ nextWorkout: null });
      notify.info("Antrenman planı kaldırıldı.");
      modalOverlay.classList.remove("open");
      onSuccess?.(null);
    });

    // Save and Publish Plan
    document.getElementById("btn-save-plan")?.addEventListener("click", () => {
      const selectedGym = allGyms.find(g => g.id === state.gymId) || allGyms[0] || { name: "Spor Salonu", district: "Kadıköy" };
      if (selectedGym) {
        db.ensureGym(selectedGym);
      }
      const noteVal = document.getElementById("input-plan-note")?.value.trim() || "";

      const newPlan = {
        day: state.day,
        time: state.time,
        gymId: state.gymId,
        gymName: selectedGym.name,
        district: selectedGym.district,
        workoutType: state.workoutType,
        expectation: state.expectation,
        note: noteVal,
        status: "Partner arıyor",
        updatedAt: Date.now()
      };

      auth.updateProfile({
        gymId: state.gymId,
        nextWorkout: newPlan
      });

      notify.success(`${newPlan.workoutType} antrenmanın ${newPlan.day} saat ${newPlan.time} için başarıyla yayınlandı!`);
      modalOverlay.classList.remove("open");
      onSuccess?.(newPlan);
    });
  }

  render();
}
