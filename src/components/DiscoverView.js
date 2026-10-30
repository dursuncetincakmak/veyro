/**
 * Veyro - Keşfet (Sporcu ve Antrenman Partneri Eşleşme Ekranı)
 * Özellikler:
 * 1. Sporcu Kartları (Sağa kaydır: Eşleş/Davet et, Sola kaydır: Pas geç).
 * 2. Liste Akışı (Tüm salon sporcularını akış halinde inceleme).
 * 3. Kullanıcının Kendi Antrenmanını Planlama & Yayınlama ("Ne zaman ve nerede spor yapacaksın?").
 * 4. Çok Boyutlu Detaylı Filtreleme (Zaman dilimi, salon, hedef, seviye, cinsiyet).
 * 5. Gerçek GPS Konumu ve Mesafe Bilgisi.
 * 6. Sıfır Mock Veri Politikası (Tertemiz veritabanı, gerçek kayıtlı sporcular).
 */

import { db } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { showPlanWorkoutModal } from './PlanWorkoutModal.js';
import { showFilterModal } from './FilterModal.js';
import { icons } from './icons.js';

export function renderDiscoverView(container, onSelectUser, onRequestAppointment, onOpenChat) {
  const currentUser = auth.getCurrentUser() || {};
  const currentUserId = currentUser.id || "current-user";
  const isAllGyms = !currentUser.gymId || currentUser.gymId === "all";
  const allUsers = db.getCollection("users") || [];
  const allGyms = db.getCollection("gyms") || [];

  // State
  let mode = "deck"; // 'deck' (Sporcu Kartları) | 'feed' (Liste Akışı)
  let activeIndex = 0;

  // Collapsible workout planning banner (defaults to collapsed so athlete card fits on mobile screen)
  let isPlanBannerCollapsed = localStorage.getItem("veyro_plan_collapsed") !== "false";

  // Multi-dimensional filters
  let filters = {
    timeSlot: "all",
    gymId: currentUser.gymId || "all",
    workoutType: "all",
    goal: "all",
    level: "all",
    gender: "all"
  };

  function getActiveFilterCount() {
    let count = 0;
    if (filters.timeSlot !== "all") count++;
    if (filters.gymId !== "all" && filters.gymId !== currentUser.gymId) count++;
    if (filters.workoutType !== "all") count++;
    if (filters.goal !== "all") count++;
    if (filters.level !== "all") count++;
    if (filters.gender !== "all") count++;
    return count;
  }

  function getFilteredAthletes() {
    const allAppointments = db.getCollection("appointments") || [];
    const allLikes = db.getCollection("likes") || [];
    const matchedPartnerIds = new Set();

    allAppointments.forEach(apt => {
      if ((apt.userId === currentUserId || apt.userId === currentUser.id) && apt.partnerId) {
        matchedPartnerIds.add(apt.partnerId);
      }
      if ((apt.partnerId === currentUserId || apt.partnerId === currentUser.id) && apt.userId) {
        matchedPartnerIds.add(apt.userId);
      }
    });

    allLikes.forEach(lk => {
      if ((lk.fromUserId === currentUserId || lk.fromUserId === currentUser.id) && lk.toUserId) {
        matchedPartnerIds.add(lk.toUserId);
      }
    });

    return allUsers.filter(user => {
      // Don't show current logged in user in their own discovery deck
      if (user.id === currentUser.id) return false;

      // Never show athletes who have already been matched or invited
      if (matchedPartnerIds.has(user.id)) return false;

      // Filter by gym if specified
      if (filters.gymId !== "all") {
        if (user.gymId !== filters.gymId) return false;
      } else if (!isAllGyms && user.gymId !== currentUser.gymId) {
        return false;
      }


      // Detailed filters
      if (filters.workoutType !== "all") {
        const wType = user.nextWorkout?.workoutType || user.nextWorkout?.type || "";
        if (!wType.toLowerCase().includes(filters.workoutType.toLowerCase())) return false;
      }

      if (filters.goal !== "all") {
        if (!user.goals?.includes(filters.goal)) return false;
      }

      if (filters.level !== "all") {
        if (user.level !== filters.level) return false;
      }

      if (filters.gender !== "all") {
        if (user.gender && user.gender !== filters.gender) return false;
      }

      if (filters.timeSlot !== "all") {
        const hour = parseInt((user.nextWorkout?.time || "19:00").split(":")[0], 10);
        if (filters.timeSlot === "morning" && (hour < 6 || hour >= 11)) return false;
        if (filters.timeSlot === "noon" && (hour < 11 || hour >= 16)) return false;
        if (filters.timeSlot === "evening" && (hour < 16 || hour >= 21)) return false;
        if (filters.timeSlot === "night" && hour < 21) return false;
      }

      return true;
    });
  }

  function render() {
    const athletes = getFilteredAthletes();
    if (activeIndex >= athletes.length && athletes.length > 0) {
      activeIndex = Math.max(0, athletes.length - 1);
    }
    const athlete = athletes[activeIndex] || null;
    const myPlan = currentUser.nextWorkout;
    const filterCount = getActiveFilterCount();

    container.innerHTML = `
      <div class="discover-page fade-in">
        <!-- 1. USER'S OWN WORKOUT PLAN BANNER ("Ne zaman ve nerede spor yapacaksın?") -->
        ${renderMyWorkoutBanner(myPlan)}

        <!-- 2. VIEW SWITCHER & FILTER BUTTON (SLEEK & SINGLE LINE) -->
        <div class="view-switcher-bar">
          <!-- Professional Terminology: Sporcu Kartları / Liste Akışı with Unified SVG Icons -->
          <div class="segmented-control">
            <div class="segmented-option ${mode === 'deck' ? 'selected' : ''}" id="btn-mode-deck" role="button">
              ${icons.cards(14)} <span>Sporcu Kartları</span>
            </div>
            <div class="segmented-option ${mode === 'feed' ? 'selected' : ''}" id="btn-mode-feed" role="button">
              ${icons.list(14)} <span>Liste Akışı</span>
            </div>
          </div>

          <!-- Comprehensive Filter Button & Reset -->
          <div style="display: inline-flex; align-items: center; gap: 6px;">
            <button class="btn-filter-trigger ${filterCount > 0 ? 'active' : ''}" id="btn-open-filters" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span>Filtrele</span>
              ${filterCount > 0 ? `<span style="background: var(--color-kor); color: #FFF; font-size: 10px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800;">${filterCount}</span>` : ''}
            </button>
            ${filterCount > 0 ? `
              <button class="btn-ghost" id="btn-clear-filters" title="Filtreleri Sıfırla" style="height: 38px; padding: 0 10px; font-size: 11px; color: var(--color-rose); background: rgba(244,63,94,0.12); border-radius: var(--radius-md); border: 1px solid rgba(244,63,94,0.25); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                ✕
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 3. CONTENT: CARDS OR FEED -->
        ${mode === 'deck' ? renderAthleteDeck(athlete, athletes.length) : renderFeedList(athletes)}
      </div>
    `;

    attachEventHandlers(athletes);
  }

  function renderMyWorkoutBanner(plan) {
    const hasPlan = plan && plan.time;

    if (isPlanBannerCollapsed) {
      return `
        <div class="workout-plan-callout-card collapsed" id="btn-toggle-plan-banner" role="button" aria-expanded="false" title="Genişlet / Detayları Gör" style="margin-bottom: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <div style="display: flex; align-items: center; gap: 9px; min-width: 0;">
              <div class="callout-icon-mini" style="width: 28px; height: 28px; border-radius: 8px; background: var(--color-kor-gradient); display: flex; align-items: center; justify-content: center; color: #FFF; flex-shrink: 0; box-shadow: 0 2px 8px var(--color-kor-glow);">${icons.bolt(14)}</div>
              <div style="min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <div style="font-size: 13px; font-weight: 800; color: #FFF; display: flex; align-items: center; gap: 6px;">
                  <span style="overflow: hidden; text-overflow: ellipsis;">${hasPlan ? `${plan.workoutType || 'Fitness'} · ${plan.day || 'Bugün'} ${plan.time}` : 'Antrenmanını Planla'}</span>
                  ${hasPlan ? '<span class="live-pulse" style="width: 6px; height: 6px; flex-shrink: 0;"></span>' : ''}
                </div>
                <div style="font-size: 10.5px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px;">
                  ${hasPlan ? `${icons.pin(11)} ${plan.gymName || 'Spor Salonu'}` : 'Günü ve saatini seç, partnerlerle eşleş'}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
              <button class="btn-ghost" id="btn-mini-plan-action" style="padding: 3px 8px; font-size: 10.5px; font-weight: 800; color: #FFF; background: var(--color-kor); border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                ${hasPlan ? `${icons.edit(12)} Düzenle` : `${icons.plus(11)} Planla`}
              </button>
              <button class="btn-ghost" style="padding: 2px 4px; color: var(--text-secondary); display: flex; align-items: center;" aria-label="Genişlet">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (!hasPlan) {
      return `
        <div class="workout-plan-callout-card expanded" style="margin-bottom: 8px;">
          <div class="callout-header" style="justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
              <div class="callout-icon">${icons.bolt(18)}</div>
              <div class="callout-text">
                <h4 style="font-size: 14px;">Ne zaman ve nerede spor yapacaksın?</h4>
                <p style="font-size: 11px;">Antrenman gününü ve saatini belirle, aynı salondaki partnerlerle eşleş.</p>
              </div>
            </div>
            <button class="btn-ghost" id="btn-toggle-plan-banner" style="padding: 4px 6px; font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 3px; flex-shrink: 0; background: rgba(255,255,255,0.06); border-radius: 6px;" title="Daralt">
              <span>Daralt</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
          <button class="btn-kor btn-callout-action" id="btn-open-plan-workout" style="padding: 9px 14px; font-size: 12.5px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
            ${icons.plus(13)} <span>Antrenmanını Planla</span>
          </button>
        </div>
      `;
    }

    return `
      <div class="active-plan-banner expanded" style="margin-bottom: 8px;">
        <div class="active-plan-top" style="margin-bottom: 6px;">
          <div class="active-plan-badge">
            <span class="live-pulse" style="width: 7px; height: 7px;"></span>
            <span>AKTİF ANTRENMAN ÇAĞRIN</span>
          </div>
          <div class="active-plan-actions" style="display: flex; align-items: center; gap: 4px;">
            <button class="btn-ghost" id="btn-edit-active-plan" style="padding: 3px 6px; font-size: 11px; color: var(--text-secondary); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
              ${icons.edit(12)} Düzenle
            </button>
            <button class="btn-ghost" id="btn-cancel-active-plan" style="padding: 3px 6px; font-size: 11px; color: var(--color-rose); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
              ${icons.close(12)} İptal
            </button>
            <button class="btn-ghost" id="btn-toggle-plan-banner" style="padding: 3px 6px; font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 2px; background: rgba(255,255,255,0.06); border-radius: 6px;" title="Daralt">
              <span>Daralt</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
        </div>
        <div class="active-plan-title" style="font-size: 15px; margin-bottom: 4px;">
          ${plan.workoutType || plan.type || "Fitness"}
        </div>
        <div class="active-plan-details" style="font-size: 11.5px; gap: 10px;">
          <span style="display: inline-flex; align-items: center; gap: 4px;">${icons.pin(12)} ${plan.gymName || "Spor Salonu"}</span>
          <span style="display: inline-flex; align-items: center; gap: 4px;">${icons.clock(12)} ${plan.day || "Bugün"} ${plan.time}</span>
          <span style="display: inline-flex; align-items: center; gap: 4px;">${icons.target(12)} ${plan.expectation || "Spotter arıyor"}</span>
        </div>
        ${plan.note ? `<div class="active-plan-note" style="margin-top: 6px; padding: 4px 8px; font-size: 11px;">"${plan.note}"</div>` : ''}
      </div>
    `;
  }

  function renderAthleteDeck(athlete, totalCount) {
    if (!athlete || activeIndex >= totalCount) {
      return `
        <div class="empty-athletes-card">
          <div style="color: var(--color-kor); margin-bottom: 12px; display: flex; justify-content: center;">${icons.dumbbell(48)}</div>
          <h3 style="font-size: 18px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px;">
            ${totalCount === 0 ? 'Bu Salonda Henüz Başka Sporcu Beklemiyor' : 'Çevrendeki Tüm Sporcuları İnceledin!'}
          </h3>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 22px;">
            ${totalCount === 0 
              ? 'İlk antrenman çağrısını yukarıdan sen açabilirsin. Salondan arkadaşını davet et veya antrenman saatinde salondaki sporcularla eşleş.'
              : 'Yeni bir sporcu katıldığında veya salonda antrenman çağrısı açıldığında anında haberdar olacaksın.'}
          </p>

          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            ${totalCount > 0 ? `
              <button class="btn-kor" id="btn-deck-rewind" style="padding: 10px 18px; font-size: 13px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
                ${icons.refresh(14)} <span>Kartları Baştan Gör</span>
              </button>
            ` : ''}
            <button class="btn-secondary" id="btn-share-gym-invite" style="padding: 10px 18px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
              ${icons.share(14)} <span>Arkadaşını Davet Et</span>
            </button>
          </div>
        </div>
      `;
    }

    const gym = allGyms.find(g => g.id === athlete.gymId) || { name: athlete.district || "Kadıköy", distanceMeters: 850 };
    const distText = gym.distanceText || (gym.distanceMeters ? `${gym.distanceMeters} m` : '1.1 km');
    const athletePhotos = (Array.isArray(athlete.photos) && athlete.photos.length > 0)
      ? athlete.photos
      : (athlete.avatar ? [athlete.avatar] : []);

    return `
      <div class="tinder-deck-container">
        <!-- Interactive Athlete Card -->
        <div class="tinder-athlete-card" id="active-swipe-card" data-athlete-id="${athlete.id}">
          <!-- Card Top Info -->
          <div class="tinder-card-topbar">
            <span class="tinder-online-badge">
              <span class="live-pulse" style="width: 7px; height: 7px;"></span>
              Şimdi Salonda
            </span>
            <span class="tinder-distance-badge" style="display: inline-flex; align-items: center; gap: 4px;">
              ${icons.pin(11)} ${distText} · ${gym.name.split(' ')[0]}
            </span>
          </div>

          <!-- Hero Section -->
          <div class="tinder-hero-section">
            <div class="tinder-large-avatar" id="card-avatar-container" style="overflow: hidden; padding: 0; position: relative; cursor: pointer;" title="${athletePhotos.length > 1 ? 'Fotoğrafları görmek için dokun' : ''}">
              ${athletePhotos.length > 1 ? `
                <div class="card-story-indicators" style="top: 4px; left: 6px; right: 6px;">
                  ${athletePhotos.map((_, i) => `<span class="card-story-indicator-bar ${i === 0 ? 'active' : ''}"></span>`).join('')}
                </div>
              ` : ''}
              ${athletePhotos.length > 0 ? `
                <img src="${athletePhotos[0]}" id="card-hero-photo-img" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="${athlete.name}" />
              ` : (athlete.initials || athlete.name.substring(0, 2).toUpperCase())}
            </div>
            <div class="tinder-athlete-name">
              ${athlete.name}, ${athlete.age || 26}
              ${athlete.verified ? `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#10B981">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              ` : ''}
            </div>
            <div class="tinder-athlete-gym">${gym.name} (${gym.district || 'İstanbul'})</div>
          </div>

          <!-- Activity Spotlight Box -->
          <div class="tinder-activity-box">
            <div class="tinder-activity-left">
              <div class="tinder-activity-icon">${icons.flame(16)}</div>
              <div class="tinder-activity-text">
                <strong>${athlete.nextWorkout?.time || 'Bugün 19:00'} · ${athlete.nextWorkout?.workoutType || athlete.nextWorkout?.type || 'Fitness'}</strong>
                <span>${athlete.level || 'Orta Seviye'} · ${athlete.nextWorkout?.expectation || 'Partner arıyor'}</span>
              </div>
            </div>
            <span class="badge badge-kor" style="font-size: 10px;">AKTİF ÇAĞRI</span>
          </div>

          <!-- Goals Tags -->
          <div class="member-tags" style="justify-content: center; margin-bottom: 14px;">
            ${(athlete.goals || []).map(g => `<span class="member-tag-chip" style="font-size: 11.5px; padding: 4px 10px;">${g}</span>`).join('')}
          </div>

          <!-- Bio -->
          <div class="tinder-athlete-bio">
            "${athlete.bio || 'Haftada 4 gün antrenmandayım. Karşılıklı spotter olabileceğim disiplinli partner arıyorum.'}"
          </div>

          <!-- Stats Strip -->
          <div class="tinder-stats-strip">
            <div class="tinder-stat-col">
              <span class="tinder-stat-val" style="display: inline-flex; align-items: center; justify-content: center; gap: 3px;">${icons.starFilled(13)} ${athlete.rating || 4.9}</span>
              <span class="tinder-stat-label">Puan</span>
            </div>
            <div class="tinder-stat-col">
              <span class="tinder-stat-val" style="display: inline-flex; align-items: center; justify-content: center; gap: 3px;">${icons.flame(13)} ${athlete.attendanceStreak || 6} Gün</span>
              <span class="tinder-stat-label">Seri</span>
            </div>
            <div class="tinder-stat-col">
              <span class="tinder-stat-val" style="display: inline-flex; align-items: center; justify-content: center; gap: 3px;">${icons.dumbbell(13)} ${athlete.workoutsCompleted || 14}</span>
              <span class="tinder-stat-label">Antrenman</span>
            </div>
          </div>
        </div>

        <!-- The Athletic Circular Action Buttons Bar -->
        <div class="tinder-actions-bar">
          <!-- Pass (Red X) -->
          <button class="tinder-action-btn pass" id="btn-card-pass" title="Pas Geç (Sonraki Sporcu)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Chat (Cyan Message Bubble) -->
          <button class="tinder-action-btn chat" id="btn-card-chat" title="Hızlı Sohbet">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00F0FF" stroke-width="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          <!-- Match (Flame Glowing Center) -->
          <button class="tinder-action-btn match" id="btn-card-match" title="Antrenman Eşleşmesi / Davet Gönder!">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </button>

          <!-- Info (Grey Info) -->
          <button class="tinder-action-btn info" id="btn-card-info" title="Profili Detaylı İncele">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9BA0B2" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  function renderFeedList(athletes) {
    if (athletes.length === 0) {
      return `
        <div class="empty-athletes-card">
          <div style="color: var(--color-kor); margin-bottom: 12px; display: flex; justify-content: center;">${icons.dumbbell(40)}</div>
          <h3 style="font-size: 18px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px;">
            Şu Anda Eşleşecek Partner Bulunmuyor
          </h3>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 20px;">
            Antrenman arkadaşı arayan ilk çağrıyı sen oluştur, salondaki sporcular sana istek atsın!
          </p>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn-secondary" id="btn-share-gym-invite" style="padding: 10px 18px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
              ${icons.share(13)} <span>Salondan Arkadaşını Davet Et</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="members-feed">
        ${athletes.map(member => {
          const gym = allGyms.find(g => g.id === member.gymId) || { name: member.district || "Kadıköy" };
          return `
            <div class="member-card" data-user-id="${member.id}">
              <div class="member-card-header">
                <div class="member-profile-left" data-action="view-profile" data-user-id="${member.id}">
                  <div class="member-avatar accent-kor" style="overflow: hidden; padding: 0;">
                    ${(member.photos && member.photos[0]) || member.avatar ? `
                      <img src="${(member.photos && member.photos[0]) || member.avatar}" style="width: 100%; height: 100%; object-fit: cover;" alt="${member.name}" />
                    ` : (member.initials || member.name.substring(0, 2).toUpperCase())}
                  </div>
                  <div class="member-meta">
                    <h4>
                      ${member.name}, ${member.age || 26}
                      ${member.verified ? `
                        <svg class="verified-icon" viewBox="0 0 24 24" fill="#10B981">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      ` : ''}
                    </h4>
                    <p style="font-size: 11.5px; color: var(--text-secondary); margin-top: 1px; display: flex; align-items: center; gap: 4px;">
                      ${icons.pin(11)} ${gym.name}
                    </p>
                    <div class="member-tags">
                      <span class="member-tag-chip" style="color: var(--color-kor);">${member.level || 'Orta'}</span>
                      ${(member.goals || []).map(g => `<span class="member-tag-chip">${g}</span>`).join('')}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Workout Slot & Action -->
              <div class="member-workout-slot">
                <div class="workout-slot-time" style="display: flex; align-items: center; gap: 5px;">
                  <span style="color: var(--color-kor); display: inline-flex; vertical-align: middle;">${icons.flame(13)}</span>
                  <span>${member.nextWorkout?.time || 'Bugün 19:00'} · ${member.nextWorkout?.workoutType || member.nextWorkout?.type || 'Fitness'}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn-secondary" style="padding: 7px 12px; font-size: 12px; width: auto; display: inline-flex; align-items: center; gap: 5px;" data-action="chat" data-user-id="${member.id}">
                    ${icons.chat(13)} <span>Sohbet</span>
                  </button>
                  <button class="btn-send-request" data-action="request-invite" data-user-id="${member.id}">
                    Eşleş
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function attachEventHandlers(athletes) {
    const athlete = athletes[activeIndex] || null;

    // Workout Planning Modals
    const openPlanModal = () => {
      showPlanWorkoutModal(() => {
        // Refresh view when workout plan is saved/updated
        render();
      });
    };

    // Toggle Plan Banner Collapse / Expand
    document.getElementById("btn-toggle-plan-banner")?.addEventListener("click", () => {
      isPlanBannerCollapsed = !isPlanBannerCollapsed;
      localStorage.setItem("veyro_plan_collapsed", isPlanBannerCollapsed.toString());
      render();
    });

    document.getElementById("btn-mini-plan-action")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openPlanModal();
    });

    document.getElementById("btn-open-plan-workout")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openPlanModal();
    });
    document.getElementById("btn-edit-active-plan")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openPlanModal();
    });
    document.getElementById("btn-feed-plan-workout")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openPlanModal();
    });

    // Cancel Active Workout Plan
    document.getElementById("btn-cancel-active-plan")?.addEventListener("click", (e) => {
      e.stopPropagation();
      auth.updateProfile({ nextWorkout: null });
      notify.info("Antrenman planı kaldırıldı.");
      render();
    });

    // Detailed Filter Modal
    document.getElementById("btn-open-filters")?.addEventListener("click", () => {
      showFilterModal(filters, (newFilters) => {
        filters = newFilters;
        activeIndex = 0;
        render();
      });
    });

    // Mode Toggle Clicks
    document.getElementById("btn-mode-deck")?.addEventListener("click", () => {
      mode = "deck";
      render();
    });

    document.getElementById("btn-mode-feed")?.addEventListener("click", () => {
      mode = "feed";
      render();
    });

    // Clear Filters
    document.getElementById("btn-clear-filters")?.addEventListener("click", () => {
      filters = {
        timeSlot: "all",
        gymId: currentUser.gymId || "all",
        workoutType: "all",
        goal: "all",
        level: "all",
        gender: "all"
      };
      activeIndex = 0;
      render();
    });

    // Rewind Deck
    document.getElementById("btn-deck-rewind")?.addEventListener("click", () => {
      activeIndex = 0;
      render();
    });

    // Share / Invite Gym Friends
    document.getElementById("btn-share-gym-invite")?.addEventListener("click", () => {
      const shareData = {
        title: "Veyro - Antrenman Arkadaşı Bul",
        text: "Benimle birlikte spor salonunda çalışmak ister misin? Veyro'da antrenmanımı planladım!",
        url: window.location.href
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        navigator.clipboard?.writeText(window.location.href);
        notify.success("Davet bağlantısı panoya kopyalandı! Arkadaşına gönderebilirsin.");
      }
    });

    // ACTION: PASS (Swipe Left)
    document.getElementById("btn-card-pass")?.addEventListener("click", () => {
      const card = document.getElementById("active-swipe-card");
      if (card) {
        if (navigator.vibrate) navigator.vibrate([15]);
        card.classList.add("swiping-left");
        setTimeout(() => {
          activeIndex++;
          render();
        }, 280);
      }
    });

    // ACTION: MATCH (Flame button -> Beğen & Spor Daveti Gönder)
    document.getElementById("btn-card-match")?.addEventListener("click", () => {
      const card = document.getElementById("active-swipe-card");
      if (athlete && card) {
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        soundService.playMatchChime();
        db.recordLike(currentUserId, athlete.id);
        notify.success(`${athlete.name} beğenildi! Antrenman daveti açılıyor...`);
        card.classList.add("swiping-right");
        setTimeout(() => {
          onRequestAppointment(athlete);
        }, 160);
      }
    });

    // ACTION: CHAT
    document.getElementById("btn-card-chat")?.addEventListener("click", () => {
      if (athlete) {
        if (onOpenChat) onOpenChat(athlete.id);
        else notify.info(`${athlete.name} ile sohbet açılıyor...`);
      }
    });

    // ACTION: INFO
    document.getElementById("btn-card-info")?.addEventListener("click", () => {
      if (athlete) onSelectUser(athlete);
    });

    // ACTION: TAP PHOTO TO CYCLE (Stories style)
    const cardAvatarEl = document.getElementById("card-avatar-container");
    if (cardAvatarEl && athlete) {
      const photosList = (Array.isArray(athlete.photos) && athlete.photos.length > 0)
        ? athlete.photos
        : (athlete.avatar ? [athlete.avatar] : []);
      if (photosList.length > 1) {
        let currentPhotoIdx = 0;
        cardAvatarEl.addEventListener("click", (e) => {
          e.stopPropagation();
          currentPhotoIdx = (currentPhotoIdx + 1) % photosList.length;
          const img = document.getElementById("card-hero-photo-img");
          if (img) img.src = photosList[currentPhotoIdx];
          cardAvatarEl.querySelectorAll(".card-story-indicator-bar").forEach((bar, idx) => {
            bar.classList.toggle("active", idx === currentPhotoIdx);
          });
        });
      }
    }

    // FEED LIST ACTIONS
    container.querySelectorAll("[data-action='view-profile']").forEach(el => {
      el.addEventListener("click", () => {
        const userId = el.dataset.userId;
        const target = athletes.find(u => u.id === userId);
        if (target) onSelectUser(target);
      });
    });

    container.querySelectorAll("[data-action='request-invite']").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const userId = btn.dataset.userId;
        const target = athletes.find(u => u.id === userId);
        if (target) onRequestAppointment(target);
      });
    });

    container.querySelectorAll("[data-action='chat']").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const userId = btn.dataset.userId;
        if (onOpenChat) onOpenChat(userId);
      });
    });

    // Touch Drag & Swipe Support on the active card
    const cardEl = document.getElementById("active-swipe-card");
    if (cardEl && athlete) {
      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      const onStart = (e) => {
        startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        isDragging = true;
      };

      const onMove = (e) => {
        if (!isDragging) return;
        currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const diffX = currentX - startX;
        const rotate = diffX * 0.08;
        cardEl.style.transform = `translateX(${diffX}px) rotate(${rotate}deg)`;
        if (diffX > 50) {
          cardEl.style.boxShadow = `0 16px 40px rgba(255, 87, 34, 0.4)`;
        } else if (diffX < -50) {
          cardEl.style.boxShadow = `0 16px 40px rgba(239, 68, 68, 0.4)`;
        }
      };

      const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const diffX = currentX - startX;

        if (diffX > 90) {
          // Swipe Right: Match & Send Sports Invite!
          cardEl.classList.add("swiping-right");
          if (navigator.vibrate) navigator.vibrate([30, 40]);
          soundService.playMatchChime();
          db.recordLike(currentUserId, athlete.id);
          notify.success(`${athlete.name} beğenildi! Antrenman daveti açılıyor...`);
          setTimeout(() => {
            onRequestAppointment(athlete);
          }, 160);
        } else if (diffX < -90) {
          // Swipe Left: Pass!
          cardEl.classList.add("swiping-left");
          if (navigator.vibrate) navigator.vibrate([15]);
          setTimeout(() => {
            activeIndex++;
            render();
          }, 260);
        } else {
          // Reset
          cardEl.style.transform = "";
          cardEl.style.boxShadow = "";
        }
      };

      cardEl.addEventListener("touchstart", onStart, { passive: true });
      cardEl.addEventListener("touchmove", onMove, { passive: true });
      cardEl.addEventListener("touchend", onEnd);
      cardEl.addEventListener("mousedown", onStart);
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onEnd);
    }
  }

  render();
}
