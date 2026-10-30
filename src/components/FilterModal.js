/**
 * Veyro - Filter Modal (Antrenman ve Sporcu Filtreleme Ekranı)
 * Sporcuların zaman dilimine, salona, antrenman hedefine, seviyeye ve cinsiyet tercihine
 * göre hassas filtrelenmesini sağlar.
 */

import { db } from '../services/db.js';
import { locationService } from '../services/location.js';
import { gymPlacesService } from '../services/gymPlacesService.js';
import { icons } from './icons.js';

export function showFilterModal(currentFilters = {}, onApply, onClose) {
  let modalOverlay = document.getElementById("filter-modal-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "filter-modal-overlay";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  let allGyms = [...(db.getCollection("gyms") || [])];

  // Filter state
  const state = {
    timeSlot: currentFilters.timeSlot || "all", // all | morning | noon | evening | night
    gymId: currentFilters.gymId || "all",
    workoutType: currentFilters.workoutType || "all",
    goal: currentFilters.goal || "all",
    level: currentFilters.level || "all",
    gender: currentFilters.gender || "all"
  };

  const timeSlots = [
    { id: "all", label: "Tümü" },
    { id: "morning", label: "Sabah (06-11)" },
    { id: "noon", label: "Öğle (11-16)" },
    { id: "evening", label: "Akşam (17-21)" },
    { id: "night", label: "Gece (21+)" }
  ];

  const workoutTypes = [
    { id: "all", label: "Tümü" },
    { id: "Bacak", label: "Bacak & Squat" },
    { id: "Göğüs", label: "Göğüs & Kol" },
    { id: "Sırt", label: "Sırt & Deadlift" },
    { id: "Kardiyo", label: "Kardiyo & HIIT" },
    { id: "Full Body", label: "Full Body" }
  ];

  const goals = [
    { id: "all", label: "Tümü" },
    { id: "Kas", label: "Kas / Hipertrofi" },
    { id: "Güç", label: "Güç / Powerlifting" },
    { id: "Kondisyon", label: "Kondisyon / Dayanıklılık" },
    { id: "Genel form", label: "Genel Sağlık & Form" }
  ];

  const levels = [
    { id: "all", label: "Tümü" },
    { id: "Yeni başladım", label: "Yeni Başladım" },
    { id: "Orta", label: "Orta Seviye" },
    { id: "İleri", label: "İleri Seviye (Hardcore)" }
  ];

  const genders = [
    { id: "all", label: "Herkes" },
    { id: "Kadın", label: "Sadece Kadınlar" },
    { id: "Erkek", label: "Sadece Erkekler" }
  ];

  function render() {
    modalOverlay.innerHTML = `
      <div class="modal-drawer fade-in" style="max-height: 88vh;">
        <div class="drawer-pill-bar"></div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 8px;">
            ${icons.settings(20)} <span>Antrenman Filtreleri</span>
          </h3>
          <button class="btn-ghost" id="btn-close-filter-modal" style="padding: 6px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div style="overflow-y: auto; max-height: calc(88vh - 140px); padding-right: 4px;">
          <!-- 1. ZAMAN DİLİMİ -->
          <div style="margin-bottom: 16px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.clock(15)} <span>Antrenman Zamanı</span>
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${timeSlots.map(t => `
                <button type="button" class="filter-chip ${state.timeSlot === t.id ? 'active' : ''}" data-type="timeSlot" data-val="${t.id}"
                  style="padding: 8px 12px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1.5px solid ${state.timeSlot === t.id ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${state.timeSlot === t.id ? 'var(--color-kor)' : 'var(--bg-surface-elevated)'}; color: #FFF;">
                  ${t.label}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 2. SPOR SALONU -->
          <div style="margin-bottom: 16px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.pin(15)} <span>Spor Salonu</span>
            </label>
            <select id="select-filter-gym" style="width: 100%; padding: 10px 14px; background: var(--bg-surface-elevated); border: 1.5px solid var(--border-glass); border-radius: 12px; color: #FFF; font-size: 13px; font-weight: 600; outline: none;">
              <option value="all" ${state.gymId === 'all' ? 'selected' : ''}>Yakınımdaki Tüm Salonlar</option>
              ${allGyms.map(g => `
                <option value="${g.id}" ${state.gymId === g.id ? 'selected' : ''}>${g.name} (${g.district})</option>
              `).join('')}
            </select>
          </div>

          <!-- 3. ANTRENMAN TÜRÜ -->
          <div style="margin-bottom: 16px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.dumbbell(15)} <span>Antrenman Bölgesi</span>
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${workoutTypes.map(w => `
                <button type="button" class="filter-chip ${state.workoutType === w.id ? 'active' : ''}" data-type="workoutType" data-val="${w.id}"
                  style="padding: 8px 12px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1.5px solid ${state.workoutType === w.id ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${state.workoutType === w.id ? 'var(--color-kor)' : 'var(--bg-surface-elevated)'}; color: #FFF;">
                  ${w.label}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 4. FITNESS HEDEFİ -->
          <div style="margin-bottom: 16px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.target(15)} <span>Antrenman Hedefi</span>
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${goals.map(g => `
                <button type="button" class="filter-chip ${state.goal === g.id ? 'active' : ''}" data-type="goal" data-val="${g.id}"
                  style="padding: 8px 12px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1.5px solid ${state.goal === g.id ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${state.goal === g.id ? 'var(--color-kor)' : 'var(--bg-surface-elevated)'}; color: #FFF;">
                  ${g.label}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 5. DENEYİM SEVİYESİ -->
          <div style="margin-bottom: 16px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.bolt(15)} <span>Deneyim Seviyesi</span>
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${levels.map(l => `
                <button type="button" class="filter-chip ${state.level === l.id ? 'active' : ''}" data-type="level" data-val="${l.id}"
                  style="padding: 8px 12px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1.5px solid ${state.level === l.id ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${state.level === l.id ? 'var(--color-kor)' : 'var(--bg-surface-elevated)'}; color: #FFF;">
                  ${l.label}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- 6. EŞLEŞME TERCİHİ -->
          <div style="margin-bottom: 20px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.users(15)} <span>Cinsiyet / Eşleşme Tercihi</span>
            </label>
            <div style="display: flex; gap: 8px;">
              ${genders.map(g => `
                <button type="button" class="filter-chip ${state.gender === g.id ? 'active' : ''}" data-type="gender" data-val="${g.id}"
                  style="flex: 1; padding: 10px 8px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1.5px solid ${state.gender === g.id ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${state.gender === g.id ? 'var(--color-kor)' : 'var(--bg-surface-elevated)'}; color: #FFF; text-align: center;">
                  ${g.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div style="display: flex; gap: 10px; margin-top: 14px;">
          <button class="btn-ghost" id="btn-reset-filters" style="padding: 12px 14px; color: var(--text-secondary); font-size: 13px; font-weight: 700;">
            Temizle
          </button>
          <button class="btn-kor" id="btn-apply-filters" style="flex: 1; padding: 14px; font-size: 14px; font-weight: 800;">
            Filtreleri Uygula
          </button>
        </div>
      </div>
    `;

    modalOverlay.classList.add("open");

    // Close
    const close = () => {
      modalOverlay.classList.remove("open");
      onClose?.();
    };
    document.getElementById("btn-close-filter-modal")?.addEventListener("click", close);

    // Chip click handler
    modalOverlay.querySelectorAll(".filter-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        const val = btn.dataset.val;
        state[type] = val;
        render();
      });
    });

    // Gym change
    document.getElementById("select-filter-gym")?.addEventListener("change", (e) => {
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
          const select = document.getElementById("select-filter-gym");
          if (select) {
            select.innerHTML = `
              <option value="all" ${state.gymId === 'all' ? 'selected' : ''}>📍 Yakınımdaki Tüm Salonlar</option>
              ${allGyms.map(g => `
                <option value="${g.id}" ${state.gymId === g.id ? 'selected' : ''}>${g.name} (${g.district} · ${g.distanceText || 'Maps'})</option>
              `).join('')}
            `;
          }
        }
      });
    });

    // Reset filters
    document.getElementById("btn-reset-filters")?.addEventListener("click", () => {
      state.timeSlot = "all";
      state.gymId = "all";
      state.workoutType = "all";
      state.goal = "all";
      state.level = "all";
      state.gender = "all";
      modalOverlay.classList.remove("open");
      onApply?.({ ...state });
    });

    // Apply filters
    document.getElementById("btn-apply-filters")?.addEventListener("click", () => {
      modalOverlay.classList.remove("open");
      onApply?.({ ...state });
    });
  }

  render();
}
