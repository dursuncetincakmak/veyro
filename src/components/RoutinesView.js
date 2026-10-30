/**
 * Veyro - Hareketler (Workout Routine & Exercise Tracker) View
 * Follows Page 9 of the PDF: Exercise library, video preview, technique tips,
 * and live interactive sets & reps counter with rest timer.
 */

import { db } from '../services/db.js';
import { notify } from '../services/notification.js';
import { icons } from './icons.js';

export function renderRoutinesView(container, onBack) {
  const exercises = db.getCollection("exercises");
  let activeTab = "video"; // 'video' | 'visual' | 'tips'

  // Rest Timer State
  let timerSeconds = 45;
  let isTimerRunning = false;
  let timerInterval = null;

  // Track checked sets in memory/state
  const checkedSets = {};

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' + s : s}`;
  }

  function startTimer() {
    if (isTimerRunning) {
      clearInterval(timerInterval);
      isTimerRunning = false;
      updateTimerUI();
      return;
    }

    isTimerRunning = true;
    updateTimerUI();

    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerUI();
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerSeconds = 45;
        updateTimerUI();
        notify.success("Dinlenme süresi bitti! Sıradaki sete başla.");
      }
    }, 1000);
  }

  function updateTimerUI() {
    const clockElem = document.getElementById("rest-timer-clock");
    const toggleBtn = document.getElementById("btn-toggle-rest-timer");
    if (clockElem) clockElem.textContent = formatTime(timerSeconds);
    if (toggleBtn) {
      toggleBtn.innerHTML = isTimerRunning ? `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      ` : `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
    }
  }

  function render() {
    container.innerHTML = `
      <div class="routines-page fade-in">
        <!-- Top Nav Bar with Back (Page 9) -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <button class="btn-ghost" id="btn-routines-back" style="padding: 6px;" aria-label="Geri">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div style="text-align: center;">
            <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main);">Bacak günü</h3>
            <span style="font-size: 12px; color: var(--text-secondary);">Mert ile · bugün 19:00</span>
          </div>
          <div style="width: 22px;"></div>
        </div>

        <!-- Routine Video / Timer Hero Card (Page 9) -->
        <div class="routine-hero-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
            <div>
              <span class="badge badge-kor" style="margin-bottom: 6px;">Canlı Seans</span>
              <h4 style="font-size: 18px; font-weight: 800;">Squat & Kuadriseps</h4>
            </div>
            <div class="timer-clock" id="rest-timer-clock">${formatTime(timerSeconds)}</div>
          </div>

          <!-- Rest Timer Controls -->
          <div class="timer-widget">
            <div>
              <div class="timer-label">Set Arası Dinlenme Sayacı</div>
              <span style="font-size: 11px; color: var(--text-muted);">Önerilen: 45 saniye</span>
            </div>
            <button class="btn-timer-toggle" id="btn-toggle-rest-timer" aria-label="Sayacı Başlat / Durdur">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
          </div>
        </div>

        <!-- Subtabs: Video / Görsel / İpuçları (Page 9) -->
        <div class="routine-subtabs">
          <button class="routine-subtab-btn ${activeTab === 'video' ? 'active' : ''}" data-subtab="video">Video</button>
          <button class="routine-subtab-btn ${activeTab === 'visual' ? 'active' : ''}" data-subtab="visual">Görsel</button>
          <button class="routine-subtab-btn ${activeTab === 'tips' ? 'active' : ''}" data-subtab="tips">İpuçları</button>
        </div>

        <!-- Exercises List (Page 9) -->
        <div class="exercises-list">
          ${exercises.map((ex, index) => {
            return `
              <div class="exercise-item-card" data-ex-id="${ex.id}">
                <div class="exercise-header-row">
                  <div class="exercise-info-left">
                    <div class="exercise-icon-wrap">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4M6 12h12"></path>
                      </svg>
                    </div>
                    <div class="exercise-titles">
                      <h4>${index + 1}. ${ex.name}</h4>
                      <p>Örnek: ${ex.defaultSets} set · ${ex.defaultReps} tekrar</p>
                    </div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--text-muted);">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>

                ${activeTab === 'tips' ? `
                  <div style="margin-top: 10px; font-size: 12px; color: var(--text-paper); background: rgba(255, 87, 34, 0.08); padding: 8px 12px; border-radius: 8px; display: flex; align-items: center; gap: 6px;">
                    ${icons.bulb(14)} <strong>Form İpucu:</strong> ${ex.tips}
                  </div>
                ` : ''}

                <!-- Interactive Set Trackers -->
                <div class="exercise-sets-tracker">
                  ${Array.from({ length: ex.defaultSets }).map((_, sIdx) => {
                    const setKey = `${ex.id}_s${sIdx}`;
                    const isChecked = Boolean(checkedSets[setKey]);
                    return `
                      <div class="set-row-item">
                        <span class="set-tag">Set ${sIdx + 1}</span>
                        <span class="set-reps-weight">${ex.defaultReps} tekrar</span>
                        <button class="set-check-btn ${isChecked ? 'checked' : ''}" data-set-key="${setKey}" aria-label="Seti tamamla">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <p style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 10px; line-height: 1.4;">
          Örnek antrenman içeriği. Gerçek videolar ve form rehberleri lisanslı antrenör veritabanından çekilmektedir.
        </p>
      </div>
    `;

    // Back click
    document.getElementById("btn-routines-back")?.addEventListener("click", onBack);

    // Subtabs click
    container.querySelectorAll(".routine-subtab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.subtab;
        render();
      });
    });

    // Timer button
    document.getElementById("btn-toggle-rest-timer")?.addEventListener("click", startTimer);

    // Set check clicks
    container.querySelectorAll(".set-check-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.setKey;
        checkedSets[key] = !checkedSets[key];
        btn.classList.toggle("checked", checkedSets[key]);
        if (checkedSets[key]) {
          notify.success("Set tamamlandı! Dinlenme sayacı hazır.");
        }
      });
    });
  }

  render();
}
