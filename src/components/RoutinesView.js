/**
 * Veyro - Hareketler (Workout Routine & Exercise Tracker) View
 * Follows Page 9 of the PDF: Exercise library, video preview, biomechanical form guides,
 * and live interactive sets & reps counter with automated rest timer.
 */

import { db } from '../services/db.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { icons } from './icons.js';

// Predefined multi-split routines
const ROUTINE_PROGRAMS = {
  bacak: {
    id: "bacak",
    title: "Bacak & Kalça",
    partnerNote: "Mert ile · bugün 19:00",
    sessionTitle: "Squat & Kuadriseps",
    exercises: [
      {
        id: "ex-1",
        name: "Barbell Back Squat",
        category: "Bacak",
        target: "Kuadriseps & Gluteus",
        defaultSets: 4,
        defaultReps: 10,
        tips: "Topukları yerden kesmeyin, dizlerin içe çökmesini önleyin.",
        tempo: { neg: "2 sn", pause: "1 sn", pos: "1 sn (Patlayıcı)" },
        steps: [
          "1. Başlangıç: Bar trapez kasının üzerinde sabit, ayaklar omuz hizasında açık.",
          "2. İniş: Kalçayı geriye iterek uyluklar yere paralel olana kadar kontrollü çökün.",
          "3. İtiş: Topuklardan güç alarak gövde açısını bozmadan patlayıcı şekilde doğrulun."
        ],
        warning: "Topukları kaldırmayın ve bel çukurunun doğal kavisini bozmayın."
      },
      {
        id: "ex-2",
        name: "Leg Press 45°",
        category: "Bacak",
        target: "Kuadriseps",
        defaultSets: 4,
        defaultReps: 12,
        tips: "Dizleri üst noktada kilitlenme noktasına kadar uzatmayın.",
        tempo: { neg: "2 sn", pause: "1 sn", pos: "1 sn" },
        steps: [
          "1. Başlangıç: Sırt ve baş desteğe tam yaslı, ayaklar platformun ortasında.",
          "2. İniş: Ağırlığı dizler 90 derece bükülene kadar kontrollü şekilde göğse çekin.",
          "3. İtiş: Ayak tabanının tamamıyla platformu itin, üstte dizleri hafif bükük bırakın."
        ],
        warning: "Ağırlığı aniden bırakmayın ve kalçayı koltuktan yukarı kaldırmayın."
      },
      {
        id: "ex-3",
        name: "Romanya Deadlift'i (RDL)",
        category: "Bacak",
        target: "Hamstrings & Glutes",
        defaultSets: 3,
        defaultReps: 10,
        tips: "Sırtı düz tutun, hareketi kalçayı geriye iterek başlatın.",
        tempo: { neg: "3 sn", pause: "1 sn", pos: "1 sn" },
        steps: [
          "1. Başlangıç: Bar kalça hizasında, omuzlar geride, kürek kemikleri kilitli.",
          "2. İniş: Dizleri hafif bükük tutarak barı kaval kemiği boyunca kalçayı geriye iterek indirin.",
          "3. İtiş: Arka bacak ve kalçayı sıkarak gövdeyi dik pozisyona getirin."
        ],
        warning: "Sırtı kamburlaştırmayın ve barı bacaklardan uzaklaştırmayın."
      },
      {
        id: "ex-4",
        name: "Standing Calf Raise",
        category: "Bacak",
        target: "Gastrocnemius & Kalf",
        defaultSets: 3,
        defaultReps: 15,
        tips: "Üst noktada 1 saniye sıkıştırıp yavaşça indirin.",
        tempo: { neg: "2 sn", pause: "2 sn", pos: "1 sn" },
        steps: [
          "1. Başlangıç: Ayak parmak uçları basamakta, topuklar serbestçe aşağı sarkıtılmış.",
          "2. İtiş: Parmak uçlarında yükselebildiğiniz en üst seviyeye kadar kalkın.",
          "3. Bitiş: Zirvede 2 saniye kalf kaslarını sıkın ve kontrollü olarak geriye esnetin."
        ],
        warning: "Hareketi yaylanarak değil, duraklamalı ve tam hareket aralığıyla yapın."
      }
    ]
  },
  gogus: {
    id: "gogus",
    title: "Göğüs & Kol",
    partnerNote: "Selin ile · yarın 18:30",
    sessionTitle: "Bench Press & Triceps",
    exercises: [
      {
        id: "ex-5",
        name: "Barbell Bench Press",
        category: "Göğüs",
        target: "Pectoralis Major",
        defaultSets: 4,
        defaultReps: 8,
        tips: "Kürek kemiklerini geriye kilitleyin, barı göğüs ortasına indirin.",
        tempo: { neg: "2 sn", pause: "1 sn", pos: "1 sn" },
        steps: [
          "1. Başlangıç: Sehpada gözler barın altında, kürek kemikleri geride kenetlenmiş.",
          "2. İniş: Barı meme ucu hizasına kadar dirsekleri 45 derece açık tutarak indirin.",
          "3. İtiş: Göğüs kaslarını sıkarak barı yukarı itin, bilekleri bükmeyin."
        ],
        warning: "Barı göğüste zıplatmayın ve kalçayı sehpadan kaldırmayın."
      },
      {
        id: "ex-6",
        name: "Incline Dumbbell Press",
        category: "Göğüs",
        target: "Üst Göğüs & Ön Omuz",
        defaultSets: 4,
        defaultReps: 10,
        tips: "Açıyı 30-45 derecede tutun, dambılları birbirine çarpmayın.",
        tempo: { neg: "2 sn", pause: "1 sn", pos: "1 sn" },
        steps: [
          "1. Başlangıç: Eğimli sehpada dambıllar göğüs hizasında, ayaklar yere sağlam basıyor.",
          "2. İtiş: Dambılları üst göğüs üzerinde hafif yay çizerek yukarı itin.",
          "3. İniş: Göğüs liflerinin esnediğini hissederek 2 saniyede aşağı indirin."
        ],
        warning: "Eğimi 45 dereceden fazla yapmayın, yük omuz eklemine biner."
      },
      {
        id: "ex-7",
        name: "Cable Rope Pushdown",
        category: "Kol",
        target: "Triceps Lateral & Medial",
        defaultSets: 3,
        defaultReps: 12,
        tips: "Dirsekleri gövdeye sabitleyin, alt noktada halatı dışa açın.",
        tempo: { neg: "2 sn", pause: "1 sn", pos: "1 sn" },
        steps: [
          "1. Başlangıç: Halatı nötr tutuşla kavrayın, dirsekler kaburgalara kilitli.",
          "2. İtiş: Sadece ön kolları hareket ettirerek halatı bacakların yanına itin.",
          "3. Sıkıştırma: Alt noktada halatın uçlarını dışa doğru açarak tricepsi sıkın."
        ],
        warning: "Dirsekleri ileri-geri savurmayın ve gövdeden momentum almayın."
      }
    ]
  },
  sirt: {
    id: "sirt",
    title: "Sırt & Biceps",
    partnerNote: "Burak ile · Cuma 19:00",
    sessionTitle: "Lat Pulldown & Row",
    exercises: [
      {
        id: "ex-8",
        name: "Lat Pulldown (Geniş Tutuş)",
        category: "Sırt",
        target: "Latissimus Dorsi",
        defaultSets: 4,
        defaultReps: 10,
        tips: "Barı enseye değil göğüs üstüne çekin, sırt kaslarını sıkın.",
        tempo: { neg: "2 sn", pause: "1 sn", pos: "1 sn" },
        steps: [
          "1. Başlangıç: Barı omuzdan geniş kavrayın, gövdeyi hafif 10 derece geriye yatırın.",
          "2. Çekiş: Dirsekleri aşağı ve geriye yönlendirerek barı köprücük kemiğine çekin.",
          "3. Dönüş: Kolların tam uzamasına izin vererek lats kasını esnetin."
        ],
        warning: "Gövdeyi geriye doğru savurarak momentum kullanmayın."
      },
      {
        id: "ex-9",
        name: "Barbell Bent-over Row",
        category: "Sırt",
        target: "Orta Sırt & Rhomboids",
        defaultSets: 4,
        defaultReps: 8,
        tips: "Gövdeyi yere 45 derece eğik tutun, omurgayı düzleştirin.",
        tempo: { neg: "2 sn", pause: "1 sn", pos: "1 sn" },
        steps: [
          "1. Başlangıç: Dizler hafif bükük, gövde 45 derece eğik, bar omuz hizasında sarkıtılmış.",
          "2. Çekiş: Barı göbek deliğine doğru dirsekleri gövdeye yakın tutarak çekin.",
          "3. Sıkıştırma: Kürek kemiklerini birbirine yaklaştırarak 1 saniye duraklayın."
        ],
        warning: "Beli bükmeyin ve ağırlığı bacaklardan sıçratmayın."
      },
      {
        id: "ex-10",
        name: "Incline Dumbbell Biceps Curl",
        category: "Kol",
        target: "Biceps Brachii",
        defaultSets: 3,
        defaultReps: 12,
        tips: "Kolları tam esnetin, dirsekleri sabit tutun.",
        tempo: { neg: "2 sn", pause: "1 sn", pos: "1 sn" },
        steps: [
          "1. Başlangıç: 60 derece eğimli sehpada dambıllar yanlarda serbest sarkıyor.",
          "2. Kaldırma: Ön kolları çevirerek (supinasyon) dambılları omuza doğru bükün.",
          "3. İndirme: Negatif fazda biceps kasının uzamasını hissederek yavaşça bırakın."
        ],
        warning: "Omuzları öne çıkarmayın ve sallanmayın."
      }
    ]
  },
  omuz: {
    id: "omuz",
    title: "Omuz & Karın",
    partnerNote: "Melisa ile · Cumartesi 11:00",
    sessionTitle: "Overhead Press & Core",
    exercises: [
      {
        id: "ex-11",
        name: "Dumbbell Overhead Shoulder Press",
        category: "Omuz",
        target: "Ön & Yan Deltoid",
        defaultSets: 4,
        defaultReps: 10,
        tips: "Alt noktada dirsekleri 90 derecede tutun, yukarıda hafifçe yaklaştırın.",
        tempo: { neg: "2 sn", pause: "1 sn", pos: "1 sn" },
        steps: [
          "1. Başlangıç: Dambıllar kulak hizasında, avuç içleri karşıya dönük.",
          "2. İtiş: Dambılları başın üzerinde kontrollü bir yayla yukarı itin.",
          "3. İniş: Omuz eklemini korumak için dirsekleri 90 dereceye kadar indirin."
        ],
        warning: "Beli aşırı derecede çukurlaştırmayın, karın kaslarını sıkı tutun."
      },
      {
        id: "ex-12",
        name: "Dumbbell Lateral Raise",
        category: "Omuz",
        target: "Yan Deltoid (Geniş Omuz)",
        defaultSets: 4,
        defaultReps: 12,
        tips: "Dirsekleri hafif bükük tutun, serçe parmağı hafif yukarı yönlendirin.",
        tempo: { neg: "2 sn", pause: "1 sn", pos: "1 sn" },
        steps: [
          "1. Başlangıç: Dambıllar uylukların yanında, gövde hafifçe 5 derece öne eğik.",
          "2. Kaldırma: Dirsekleri omuz hizasına kadar yana doğru kaldırın.",
          "3. İndirme: Yerçekimine direnerek dambılları yavaşça başlangıç noktasına getirin."
        ],
        warning: "Trapezleri kasmayın ve ağırlığı belden savurmayın."
      },
      {
        id: "ex-13",
        name: "Plank & Core Hold",
        category: "Karın",
        target: "Transversus Abdominis",
        defaultSets: 3,
        defaultReps: 45,
        tips: "Kalçayı ne çok yukarı ne çok aşağı bırakın, düz bir çizgi koruyun.",
        tempo: { neg: "Statik", pause: "45 sn", pos: "Kilitli" },
        steps: [
          "1. Başlangıç: Ön kollar yerde, dirsekler omuzların tam altında.",
          "2. Duruş: Topuklardan başa kadar vücut tek bir düz çizgi oluşturmalı.",
          "3. Sıkılık: Karın ve gluteus kaslarını maksimum güçle sıkarak nefes alın."
        ],
        warning: "Beli aşağı düşürmeyin, boynu nötr pozisyonda tutun."
      }
    ]
  }
};

export function renderRoutinesView(container, onBack) {
  let selectedRoutineKey = "bacak"; // 'bacak' | 'gogus' | 'sirt' | 'omuz'
  let activeTab = "video"; // 'video' | 'visual' | 'tips'

  // Rest Timer State
  let timerSeconds = 45;
  let isTimerRunning = false;
  let timerInterval = null;

  // Track checked sets in memory
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
        soundService.playMessageChime();
        notify.success("⏰ Dinlenme süresi bitti! Sıradaki sete başla.");
      }
    }, 1000);
  }

  function resetTimer(seconds = 45) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerSeconds = seconds;
    updateTimerUI();
  }

  function adjustTimer(diff) {
    timerSeconds = Math.max(5, timerSeconds + diff);
    updateTimerUI();
  }

  function updateTimerUI() {
    const clockElem = document.getElementById("rest-timer-clock");
    const toggleBtn = document.getElementById("btn-toggle-rest-timer");
    if (clockElem) clockElem.textContent = formatTime(timerSeconds);
    if (toggleBtn) {
      toggleBtn.innerHTML = isTimerRunning ? icons.pause(18) : icons.play(18);
    }
  }

  function render() {
    const routine = ROUTINE_PROGRAMS[selectedRoutineKey] || ROUTINE_PROGRAMS.bacak;
    const exercises = routine.exercises;

    // Calculate total sets and completed count
    let totalSets = 0;
    let completedSets = 0;
    exercises.forEach(ex => {
      totalSets += ex.defaultSets;
      for (let s = 0; s < ex.defaultSets; s++) {
        if (checkedSets[`${ex.id}_s${s}`]) completedSets++;
      }
    });
    const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

    container.innerHTML = `
      <div class="routines-page fade-in">
        <!-- Top Nav Bar with Back (Page 9) -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <button class="btn-ghost" id="btn-routines-back" style="padding: 6px;" aria-label="Geri">
            ${icons.chevronLeft(22)}
          </button>
          <div style="text-align: center;">
            <h3 style="font-size: 19px; font-weight: 800; color: var(--text-main); margin: 0;">${routine.title}</h3>
            <span style="font-size: 12px; color: var(--text-secondary);">${routine.partnerNote}</span>
          </div>
          <div style="width: 28px;"></div>
        </div>

        <!-- Routine Selector Dropdown / Pills -->
        <div class="routine-picker-bar" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 12px; scrollbar-width: none;">
          ${Object.values(ROUTINE_PROGRAMS).map(prog => `
            <button class="routine-split-pill ${prog.id === selectedRoutineKey ? 'active' : ''}" data-routine="${prog.id}" style="padding: 6px 12px; font-size: 11.5px; font-weight: 700; border-radius: 20px; white-space: nowrap; cursor: pointer; border: 1px solid ${prog.id === selectedRoutineKey ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${prog.id === selectedRoutineKey ? 'var(--color-kor-gradient)' : 'var(--bg-surface-elevated)'}; color: #FFF; transition: all 0.2s ease;">
              ${prog.title}
            </button>
          `).join('')}
        </div>

        <!-- Routine Video / Timer Hero Card (Page 9) -->
        <div class="routine-hero-card" style="position: relative; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <div>
              <span class="badge badge-kor" style="margin-bottom: 4px; display: inline-flex; align-items: center; gap: 4px;">
                <span class="live-pulse" style="width: 6px; height: 6px;"></span> Canlı Seans
              </span>
              <h4 style="font-size: 18px; font-weight: 800; color: #FFF; margin: 0;">${routine.sessionTitle}</h4>
            </div>
            <div class="timer-clock" id="rest-timer-clock">${formatTime(timerSeconds)}</div>
          </div>

          <!-- Progress Bar -->
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 700;">
              <span>İlerleme: ${completedSets} / ${totalSets} Set Tamamlandı</span>
              <span style="color: var(--color-kor);">${progressPct}%</span>
            </div>
            <div style="height: 6px; width: 100%; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${progressPct}%; background: var(--color-kor-gradient); transition: width 0.3s ease; box-shadow: 0 0 8px var(--color-kor-glow);"></div>
            </div>
          </div>

          <!-- Rest Timer Controls -->
          <div class="timer-widget" style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 10px 14px;">
            <div>
              <div class="timer-label" style="font-size: 12px; font-weight: 800; color: #FFF;">Set Arası Dinlenme Sayacı</div>
              <span style="font-size: 11px; color: var(--text-muted);">Önerilen: 45 saniye</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button class="btn-ghost" id="btn-timer-minus" title="-15 sn" style="padding: 5px 8px; font-size: 11px; font-weight: 800; color: var(--text-secondary); background: rgba(255,255,255,0.06); border-radius: 6px;">
                -15s
              </button>
              <button class="btn-timer-toggle" id="btn-toggle-rest-timer" aria-label="Sayacı Başlat / Durdur" style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-kor-gradient); color: #FFF; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px var(--color-kor-glow);">
                ${isTimerRunning ? icons.pause(18) : icons.play(18)}
              </button>
              <button class="btn-ghost" id="btn-timer-plus" title="+15 sn" style="padding: 5px 8px; font-size: 11px; font-weight: 800; color: var(--text-secondary); background: rgba(255,255,255,0.06); border-radius: 6px;">
                +15s
              </button>
              <button class="btn-ghost" id="btn-timer-reset" title="Sıfırla" style="padding: 6px; color: var(--text-muted); display: flex; align-items: center;">
                ${icons.rotateCcw(15)}
              </button>
            </div>
          </div>
        </div>

        <!-- Subtabs: Video / Görsel / İpuçları (Page 9) -->
        <div class="routine-subtabs" style="margin-bottom: 14px;">
          <button class="routine-subtab-btn ${activeTab === 'video' ? 'active' : ''}" data-subtab="video">
            ${icons.activity(14)} Video & Tempo
          </button>
          <button class="routine-subtab-btn ${activeTab === 'visual' ? 'active' : ''}" data-subtab="visual">
            ${icons.target(14)} Görsel Form
          </button>
          <button class="routine-subtab-btn ${activeTab === 'tips' ? 'active' : ''}" data-subtab="tips">
            ${icons.bulb(14)} İpuçları
          </button>
        </div>

        <!-- Exercises List (Page 9) -->
        <div class="exercises-list" style="display: flex; flex-direction: column; gap: 14px;">
          ${exercises.map((ex, index) => {
            return `
              <div class="exercise-item-card" data-ex-id="${ex.id}" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); border-radius: var(--radius-lg); padding: 16px;">
                <div class="exercise-header-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                  <div class="exercise-info-left" style="display: flex; align-items: center; gap: 12px;">
                    <div class="exercise-icon-wrap" style="width: 38px; height: 38px; border-radius: 10px; background: rgba(255, 87, 34, 0.12); color: var(--color-kor); display: flex; align-items: center; justify-content: center;">
                      ${icons.dumbbell(20)}
                    </div>
                    <div class="exercise-titles">
                      <h4 style="font-size: 15px; font-weight: 800; color: #FFF; margin: 0 0 2px 0;">${index + 1}. ${ex.name}</h4>
                      <p style="font-size: 11.5px; color: var(--text-secondary); margin: 0;">Örnek: ${ex.defaultSets} set · ${ex.defaultReps} tekrar · <span style="color: var(--color-kor); font-weight: 700;">${ex.target}</span></p>
                    </div>
                  </div>
                  <span style="color: var(--text-muted);">${icons.chevronRight(18)}</span>
                </div>

                <!-- SUBTAB 1: VIDEO & TEMPO PREVIEW -->
                ${activeTab === 'video' ? `
                  <div class="exercise-video-card" style="margin-top: 10px; border-radius: 12px; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 87, 34, 0.3); padding: 12px; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                      <span style="font-size: 11px; font-weight: 800; color: var(--color-kor); text-transform: uppercase; display: flex; align-items: center; gap: 5px;">
                        ${icons.play(13)} Egzersiz Tempo Rehberi (Kadans)
                      </span>
                      <span style="font-size: 10.5px; color: var(--color-cyan, #00E5FF); background: rgba(0, 229, 255, 0.1); padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                        ${ex.target}
                      </span>
                    </div>
                    <div class="workout-tempo-box" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center; margin-bottom: 8px;">
                      <div style="background: rgba(255,255,255,0.05); padding: 6px 4px; border-radius: 6px;">
                        <span style="font-size: 10px; color: var(--text-secondary); display: block;">Negatif (İniş)</span>
                        <strong style="font-size: 13px; color: #FFF;">${ex.tempo.neg}</strong>
                      </div>
                      <div style="background: rgba(255,255,255,0.05); padding: 6px 4px; border-radius: 6px;">
                        <span style="font-size: 10px; color: var(--text-secondary); display: block;">Duraklama</span>
                        <strong style="font-size: 13px; color: #FFF;">${ex.tempo.pause}</strong>
                      </div>
                      <div style="background: rgba(255,255,255,0.05); padding: 6px 4px; border-radius: 6px;">
                        <span style="font-size: 10px; color: var(--text-secondary); display: block;">Pozitif (İtiş)</span>
                        <strong style="font-size: 13px; color: var(--color-kor);">${ex.tempo.pos}</strong>
                      </div>
                    </div>
                    <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; display: flex; align-items: center; gap: 6px;">
                      ${icons.bulb(13)} <span>Nefes kuralı: Yükü kaldırırken (itişte) ağızdan verin, indirirken burundan derin nefes alın.</span>
                    </div>
                  </div>
                ` : ''}

                <!-- SUBTAB 2: VISUAL BIOMECHANICAL FORM GUIDE -->
                ${activeTab === 'visual' ? `
                  <div class="exercise-visual-card" style="margin-top: 10px; border-radius: 12px; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(0, 229, 255, 0.25); padding: 12px; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                      <span style="font-size: 11px; font-weight: 800; color: var(--color-cyan, #00E5FF); text-transform: uppercase; display: flex; align-items: center; gap: 5px;">
                        ${icons.target(13)} Biyomekanik Form ve Açı Aşamaları
                      </span>
                      <span style="font-size: 10px; color: var(--text-muted); font-weight: 700;">3 Fazlı Rehber</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px; font-size: 11.5px; line-height: 1.4; color: var(--text-main);">
                      ${ex.steps.map(step => `
                        <div style="display: flex; gap: 6px; align-items: flex-start;">
                          <span style="color: var(--color-kor); font-weight: 800;">•</span>
                          <span>${step}</span>
                        </div>
                      `).join('')}
                    </div>
                    <div style="margin-top: 8px; padding: 6px 10px; background: rgba(244, 63, 94, 0.12); border-left: 3px solid var(--color-rose); border-radius: 4px; font-size: 11px; color: #FFF; display: flex; align-items: center; gap: 6px;">
                      ${icons.alertTriangle(14)}
                      <span><strong>Kritik Uyarı:</strong> ${ex.warning}</span>
                    </div>
                  </div>
                ` : ''}

                <!-- SUBTAB 3: COACH TIPS -->
                ${activeTab === 'tips' ? `
                  <div style="margin-top: 10px; margin-bottom: 12px; font-size: 12px; color: var(--text-paper); background: rgba(255, 87, 34, 0.08); border: 1px solid rgba(255, 87, 34, 0.2); padding: 10px 14px; border-radius: 10px; display: flex; align-items: center; gap: 8px;">
                    <div style="color: var(--color-kor); flex-shrink: 0;">${icons.bulb(16)}</div>
                    <div>
                      <strong style="color: #FFF;">Antrenör Tavsiyesi:</strong> ${ex.tips}
                    </div>
                  </div>
                ` : ''}

                <!-- Interactive Set Trackers -->
                <div class="exercise-sets-tracker" style="display: flex; flex-direction: column; gap: 6px;">
                  ${Array.from({ length: ex.defaultSets }).map((_, sIdx) => {
                    const setKey = `${ex.id}_s${sIdx}`;
                    const isChecked = Boolean(checkedSets[setKey]);
                    return `
                      <div class="set-row-item ${isChecked ? 'completed-row' : ''}" style="display: flex; align-items: center; justify-content: space-between; background: ${isChecked ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isChecked ? 'rgba(0, 229, 255, 0.3)' : 'var(--border-glass)'}; border-radius: 8px; padding: 8px 12px; transition: all 0.2s ease;">
                        <span class="set-tag" style="font-size: 12px; font-weight: 800; color: ${isChecked ? 'var(--color-cyan, #00E5FF)' : '#FFF'};">Set ${sIdx + 1}</span>
                        <span class="set-reps-weight" style="font-size: 12px; color: var(--text-secondary);">${ex.defaultReps} tekrar</span>
                        <button class="set-check-btn ${isChecked ? 'checked' : ''}" data-set-key="${setKey}" aria-label="Seti tamamla" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid ${isChecked ? 'var(--color-kor)' : 'rgba(255,255,255,0.2)'}; background: ${isChecked ? 'var(--color-kor)' : 'transparent'}; color: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;">
                          ${isChecked ? icons.check(16) : ''}
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <p style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 14px; line-height: 1.4;">
          Antrenman partnerinizle senkronize seans. Her set tamamlandığında dinlenme sayacı otomatik başlar.
        </p>
      </div>
    `;

    // Routine selector buttons
    container.querySelectorAll(".routine-split-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedRoutineKey = btn.dataset.routine;
        render();
      });
    });

    // Back click
    document.getElementById("btn-routines-back")?.addEventListener("click", onBack);

    // Subtabs click
    container.querySelectorAll(".routine-subtab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.subtab;
        render();
      });
    });

    // Timer buttons
    document.getElementById("btn-toggle-rest-timer")?.addEventListener("click", startTimer);
    document.getElementById("btn-timer-plus")?.addEventListener("click", () => adjustTimer(15));
    document.getElementById("btn-timer-minus")?.addEventListener("click", () => adjustTimer(-15));
    document.getElementById("btn-timer-reset")?.addEventListener("click", () => resetTimer(45));

    // Set check clicks
    container.querySelectorAll(".set-check-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.setKey;
        checkedSets[key] = !checkedSets[key];
        const isNowChecked = checkedSets[key];

        if (isNowChecked) {
          soundService.playMessageChime();
          resetTimer(45);
          startTimer();
          notify.success("Set tamamlandı! 45 sn dinlenme sayacı başladı.");
        }
        render();
      });
    });
  }

  render();
}
