/**
 * Veyro - Keşfet (Sporcu ve Antrenman Partneri Eşleşme Ekranı) - Design System v2.0
 * Özellikler:
 * 1. GPS & Yarıçap Paneli (Çorlu, Tekirdağ (GPS) + Yarıçap dropdown).
 * 2. Story & Canlı Sporcu Şeridi (52x52 avatarlar + mor/cyan ring + dinamik km mesafesi).
 * 3. Antrenman Planlama CTA Paneli ("Ne zaman ve nerede spor yapacaksın?" + "+ Antrenmanını Planla").
 * 4. Segmented Switcher (Sporcu Kartları | Liste Akışı) & Filtrele.
 * 5. Sporcu Eşleşme Kartı (.veyro-athlete-card: 6 katmanlı hiyerarşi).
 */

import { db } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { showPlanWorkoutModal } from './PlanWorkoutModal.js';
import { showFilterModal } from './FilterModal.js';
import { showLocationModal } from './LocationModal.js';
import { showStoryCreatorModal } from './StoryCreatorModal.js';
import { showStoryViewerModal } from './StoryViewerModal.js';
import { calculateDistanceMeters, locationService } from '../services/location.js';
import { icons } from './icons.js';

export function renderDiscoverView(container, onSelectUser, onRequestAppointment, onOpenChat) {
  let currentUser = auth.getCurrentUser() || {};
  let currentUserId = currentUser.id || "current-user";
  let isAllGyms = !currentUser.gymId || currentUser.gymId === "all";
  let allUsers = db.getCollection("users") || [];
  let allGyms = db.getCollection("gyms") || [];

  function refreshUserAndCollections() {
    currentUser = auth.getCurrentUser() || {};
    currentUserId = currentUser.id || "current-user";
    isAllGyms = !currentUser.gymId || currentUser.gymId === "all";
    allUsers = db.getCollection("users") || [];
    allGyms = db.getCollection("gyms") || [];
  }

  // Active Location state from LocationService (default: Çorlu, Tekirdağ)
  let activeLocation = locationService.getActiveLocation();
  let userCoords = {
    latitude: activeLocation.lat,
    longitude: activeLocation.lng
  };

  // State
  let mode = "deck"; // 'deck' (Sporcu Kartları) | 'feed' (Liste Akışı)
  let activeIndex = 0;

  // Collapsible workout planning banner (defaults to expanded per Design System v2.0)
  let isPlanBannerCollapsed = localStorage.getItem("veyro_plan_collapsed") === "true";

  // Multi-dimensional filters (Default radius: 35 km)
  let filters = {
    city: "all",
    maxDistanceKm: "35",
    timeSlot: "all",
    gymId: currentUser.gymId || "all",
    workoutType: "all",
    goal: "all",
    level: "all",
    gender: "all"
  };

  // Subscribe to location updates
  const unsubscribeLocation = locationService.subscribe((newLoc) => {
    activeLocation = newLoc;
    userCoords = {
      latitude: newLoc.lat,
      longitude: newLoc.lng
    };
    activeIndex = 0;
    render();
  });

  function getActiveFilterCount() {
    let count = 0;
    if (filters.city && filters.city !== "all") count++;
    if (filters.maxDistanceKm && filters.maxDistanceKm !== "35") count++;
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

    const filtered = allUsers.filter(user => {
      if (user.id === currentUser.id) return false;
      if (db.isBlocked(currentUser.id, user.id)) return false;
      if (user.isBanned) return false;
      if (matchedPartnerIds.has(user.id)) return false;

      if (filters.city && filters.city !== "all") {
        if (user.city && user.city.toLowerCase() !== filters.city.toLowerCase()) return false;
      }

      if (filters.gymId !== "all") {
        if (user.gymId !== filters.gymId) return false;
      } else if (!isAllGyms && user.gymId !== currentUser.gymId) {
        return false;
      }

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

    const mapped = filtered.map(ath => {
      let athleteLat = ath.lat;
      let athleteLng = ath.lng;
      if (!athleteLat || !athleteLng) {
        const matchedGym = allGyms.find(g => g.id === ath.gymId);
        if (matchedGym?.lat && matchedGym?.lng) {
          athleteLat = matchedGym.lat;
          athleteLng = matchedGym.lng;
        } else {
          const resolved = locationService.getCoordsForDistrict(
            ath.district || (ath.gymName && ath.gymName.includes("Çorlu") ? "Çorlu" : ""),
            ath.city || (ath.gymName && ath.gymName.includes("Tekirdağ") ? "Tekirdağ" : "")
          );
          athleteLat = resolved.lat;
          athleteLng = resolved.lng;
        }
      }
      const distMeters = calculateDistanceMeters(
        userCoords.latitude,
        userCoords.longitude,
        athleteLat,
        athleteLng
      );
      const rawKm = distMeters / 1000;
      const distText = distMeters < 1000
        ? `${distMeters} m`
        : rawKm < 10
        ? `${rawKm.toFixed(1)} km`
        : `${Math.round(rawKm)} km`;
      return {
        ...ath,
        distanceMeters: distMeters,
        distanceKm: parseFloat(rawKm.toFixed(1)),
        distanceText: distText
      };
    });

    let radiusFiltered = mapped;
    if (filters.maxDistanceKm && filters.maxDistanceKm !== "all") {
      const maxKm = parseFloat(filters.maxDistanceKm);
      radiusFiltered = mapped.filter(ath => ath.distanceKm <= maxKm);
    }

    return radiusFiltered.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  }

  function render() {
    refreshUserAndCollections();
    const athletes = getFilteredAthletes();
    if (activeIndex >= athletes.length && athletes.length > 0) {
      activeIndex = Math.max(0, athletes.length - 1);
    }
    const athlete = athletes[activeIndex] || null;
    const myPlan = currentUser.nextWorkout;
    const filterCount = getActiveFilterCount();
    const locDistrict = activeLocation.district || "Çorlu";
    const locCity = activeLocation.city || "Tekirdağ";

    container.innerHTML = `
      <div class="discover-page fade-in">
        <!-- 4.3. GPS & YARIÇAP PANELİ -->
        <div class="veyro-gps-radius-panel">
          <button type="button" class="gps-location-trigger" id="btn-trigger-location-modal" title="Konumu ve Haritayı Aç">
            <span class="gps-cyan-dot"></span>
            <span style="color: var(--color-cyan-vivid); display: flex; align-items: center;">${icons.pin(14)}</span>
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${locDistrict}, ${locCity} (GPS)</span>
            <span style="font-size: 11px; color: var(--text-muted); margin-left: 2px;">▾</span>
          </button>

          <div class="gps-radius-right">
            <span class="gps-radius-label">Yarıçap:</span>
            <div class="gps-radius-select-wrap">
              <select id="select-quick-radius-bar" class="gps-radius-select" aria-label="Mesafe Yarıçapı">
                <option value="10" ${filters.maxDistanceKm === '10' ? 'selected' : ''}>10 km</option>
                <option value="25" ${filters.maxDistanceKm === '25' ? 'selected' : ''}>25 km</option>
                <option value="35" ${filters.maxDistanceKm === '35' ? 'selected' : ''}>35 km</option>
                <option value="75" ${filters.maxDistanceKm === '75' ? 'selected' : ''}>75 km</option>
                <option value="all" ${filters.maxDistanceKm === 'all' ? 'selected' : ''}>Tüm TR</option>
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="position: absolute; right: 7px; pointer-events: none; color: inherit;">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>

        <!-- 4.4. STORY & CANLI SPORCU ŞERİDİ (HORIZONTAL RAIL) -->
        ${renderStoriesTray()}

        <!-- 4.5. ANTRENMAN PLANLAMA CTA PANELİ -->
        ${renderMyWorkoutBanner(myPlan)}

        <!-- 4.6. SEGMENTED SWITCHER & FİLTRE -->
        <div class="view-switcher-bar" style="margin-bottom: 2px;">
          <div class="segmented-control">
            <div class="segmented-option ${mode === 'deck' ? 'selected' : ''}" id="btn-mode-deck" role="button">
              ${icons.cards(14)} <span>Sporcu Kartları</span>
            </div>
            <div class="segmented-option ${mode === 'feed' ? 'selected' : ''}" id="btn-mode-feed" role="button">
              ${icons.list(14)} <span>Liste Akışı</span>
            </div>
          </div>

          <div style="display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;">
            <button class="btn-filter-trigger ${filterCount > 0 ? 'active' : ''}" id="btn-open-filters" type="button" title="Filtrele">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <span>Filtrele</span>
              ${filterCount > 0 ? `<span style="background: var(--color-purple-primary); color: #FFF; font-size: 10px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800;">${filterCount}</span>` : ''}
            </button>
            ${filterCount > 0 ? `
              <button class="btn-ghost" id="btn-clear-filters" title="Filtreleri Sıfırla" style="height: 36px; padding: 0 9px; font-size: 11px; color: var(--color-rose); background: rgba(244,63,94,0.12); border-radius: 12px; border: 1px solid rgba(244,63,94,0.25); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                ✕
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 4.7. SPORCU EŞLEŞME KARTI VEYA LİSTE AKIŞI -->
        ${mode === 'deck' ? renderAthleteDeck(athlete, athletes.length) : renderFeedList(athletes)}
      </div>
    `;

    attachEventHandlers(athletes);
  }

  function renderStoriesTray() {
    const allStories = db.getStories();
    const userGymId = currentUser.gymId;
    const activeCity = activeLocation.city || "Tekirdağ";
    const activeDistrict = activeLocation.district || "Çorlu";

    const storiesWithDistance = allStories.map(story => {
      const matchedGym = allGyms.find(g => g.id === story.gymId);
      let sLat = story.lat;
      let sLng = story.lng;
      if (!sLat || !sLng) {
        if (matchedGym?.lat && matchedGym?.lng) {
          sLat = matchedGym.lat;
          sLng = matchedGym.lng;
        } else {
          const coords = locationService.getCoordsForDistrict(story.district, story.city);
          sLat = coords.lat;
          sLng = coords.lng;
        }
      }
      const distMeters = calculateDistanceMeters(
        userCoords.latitude,
        userCoords.longitude,
        sLat,
        sLng
      );
      const rawKm = distMeters / 1000;
      const distText = distMeters < 1000 ? `${distMeters} m` : `${rawKm.toFixed(1)} km`;
      return {
        ...story,
        calculatedDistanceMeters: distMeters,
        calculatedDistanceKm: parseFloat(rawKm.toFixed(1)),
        calculatedDistanceText: distText
      };
    });

    const localizedStories = storiesWithDistance.filter(story => {
      if (story.userId === currentUser.id || story.userId === "current-user") return true;
      if (userGymId && userGymId !== "all" && story.gymId === userGymId) return true;
      if (story.city && story.city.toLowerCase() === activeCity.toLowerCase()) return true;
      if (story.district && story.district.toLowerCase() === activeDistrict.toLowerCase()) return true;
      if (story.gymName && (story.gymName.includes(activeDistrict) || story.gymName.includes(activeCity))) return true;
      if (typeof story.calculatedDistanceKm === "number" && story.calculatedDistanceKm <= 35.0) return true;
      return false;
    });

    const uniqueStoriesMap = new Map();
    const seenAvatars = new Set();
    const storiesPool = localizedStories.length > 0 ? localizedStories : storiesWithDistance;
    storiesPool.forEach(story => {
      const key = story.userId || story.userName;
      const avatarKey = story.userAvatar || "";
      if (!uniqueStoriesMap.has(key) && (!avatarKey || !seenAvatars.has(avatarKey))) {
        uniqueStoriesMap.set(key, story);
        if (avatarKey) seenAvatars.add(avatarKey);
      }
    });

    const displayStories = Array.from(uniqueStoriesMap.values()).slice(0, 10);

    return `
      <div class="stories-tray-container">
        <div style="display: flex; gap: 14px; align-items: flex-start; padding: 2px;">
          <!-- İlk eleman: EM (Hikayen) + mavi/mor artı (+) badge'i -->
          <div id="btn-add-story-trigger" class="story-circle-item" title="Hikaye Paylaş">
            <div class="story-my-avatar-ring">
              <span>${currentUser.initials || "EM"}</span>
              <div class="story-plus-badge">+</div>
            </div>
            <span class="story-user-name" style="margin-top: 2px;">Hikayen</span>
          </div>

          <!-- Aktif/yakın sporcular (52x52px dairesel avatar + mor-cyan ring + isim + dinamik mesafe) -->
          ${displayStories.map(story => `
            <div class="story-circle-item" data-story-id="${story.id}" title="${story.userName} · ${story.calculatedDistanceText || '3.3 km'}">
              <div class="story-avatar-ring ${story.viewed ? 'viewed' : 'unviewed'}">
                <div class="story-avatar-inner">
                  ${story.userAvatar ? `<img src="${story.userAvatar}" style="width: 100%; height: 100%; object-fit: cover;" alt="${story.userName}">` : `<span style="font-size: 14px; font-weight: 800; color: var(--text-main);">${story.userInitials || "SP"}</span>`}
                </div>
              </div>
              <span class="story-user-name">${story.userName.split(' ')[0]}</span>
              <span class="story-user-distance">${story.calculatedDistanceText || '3.3 km'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderMyWorkoutBanner(plan) {
    const hasPlan = plan && plan.time;

    if (isPlanBannerCollapsed) {
      return `
        <div class="workout-plan-callout-card collapsed" id="btn-toggle-plan-banner" role="button" aria-expanded="false" title="Genişlet / Detayları Gör">
          <div style="position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
              <div class="callout-icon" style="width: 32px; height: 32px; border-radius: 9px;">${icons.bolt(15)}</div>
              <div style="min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <div style="font-size: 13px; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                  <span style="overflow: hidden; text-overflow: ellipsis;">${hasPlan ? `${plan.workoutType || 'Fitness'} · ${plan.day || 'Bugün'} ${plan.time}` : 'Antrenmanını Planla'}</span>
                  ${hasPlan ? '<span class="live-pulse" style="width: 6px; height: 6px; flex-shrink: 0;"></span>' : ''}
                </div>
                <div style="font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis;">
                  ${hasPlan ? `${plan.gymName || 'Spor Salonu'}` : 'Günü ve saatini seç, partnerlerle eşleş'}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
              <button type="button" class="btn-edit-active-plan" style="padding: 5px 10px; font-size: 11px; font-weight: 700; color: #FFF; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); border-radius: 8px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
                ${hasPlan ? `${icons.edit(11)} Düzenle` : `+ Planla`}
              </button>
              ${hasPlan ? `
                <button type="button" class="btn-cancel-active-plan" style="padding: 5px 9px; font-size: 11px; font-weight: 700; color: #F43F5E; background: rgba(244, 63, 94, 0.14); border: 1px solid rgba(244, 63, 94, 0.35); border-radius: 8px; display: inline-flex; align-items: center; gap: 3px; cursor: pointer;">
                  ${icons.close(11)} İptal
                </button>
              ` : ''}
              <span style="color: var(--text-muted); display: flex; align-items: center;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>
          </div>
        </div>
      `;
    }

    if (!hasPlan) {
      return `
        <div class="workout-plan-callout-card expanded">
          <div class="callout-header">
            <div style="display: flex; align-items: flex-start; gap: 11px; min-width: 0;">
              <div class="callout-icon">${icons.bolt(19)}</div>
              <div class="callout-text">
                <h4>Ne zaman ve nerede spor yapacaksın?</h4>
                <p>Antrenman gününü ve saatini belirle, aynı salondaki partnerlerle eşleş.</p>
              </div>
            </div>
            <button type="button" class="btn-collapse-pill" id="btn-toggle-plan-banner" title="Daralt">
              <span>Daralt</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
          <button type="button" class="btn-primary-plan" id="btn-open-plan-workout" style="position: relative; z-index: 1;">
            <span style="font-size: 16px; line-height: 1; font-weight: 500;">+</span>
            <span>Antrenmanını Planla</span>
          </button>
        </div>
      `;
    }

    return `
      <div class="active-plan-banner expanded">
        <div class="active-plan-top">
          <div class="active-plan-badge">
            <span class="live-pulse" style="width: 7px; height: 7px;"></span>
            <span>AKTİF ANTRENMAN ÇAĞRIN</span>
          </div>
          <div class="active-plan-actions" style="display: flex; align-items: center; gap: 5px;">
            <button type="button" class="btn-ghost btn-edit-active-plan" id="btn-edit-active-plan" style="padding: 4px 8px; font-size: 11px; color: var(--text-main); background: rgba(139, 92, 246, 0.16); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 7px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
              ${icons.edit(12)} Düzenle
            </button>
            <button type="button" class="btn-ghost btn-cancel-active-plan" id="btn-cancel-active-plan" style="padding: 4px 8px; font-size: 11px; color: #F43F5E; background: rgba(244, 63, 94, 0.14); border: 1px solid rgba(244, 63, 94, 0.35); border-radius: 7px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
              ${icons.close(12)} İptal
            </button>
            <button type="button" class="btn-collapse-pill" id="btn-toggle-plan-banner" title="Daralt">
              <span>Daralt</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          </div>
        </div>
        <div class="active-plan-title">
          ${plan.workoutType || plan.type || "Fitness"}
        </div>
        <div class="active-plan-details">
          <span style="display: inline-flex; align-items: center; gap: 4px;">${icons.pin(12)} ${plan.gymName || "Spor Salonu"}</span>
          <span style="display: inline-flex; align-items: center; gap: 4px;">${icons.clock(12)} ${plan.day || "Bugün"} ${plan.time}</span>
          <span style="display: inline-flex; align-items: center; gap: 4px;">${icons.target(12)} ${plan.expectation || "Spotter arıyor"}</span>
        </div>
        ${plan.note ? `<div class="active-plan-note">“${plan.note}”</div>` : ''}
      </div>
    `;
  }

  function renderAthleteDeck(athlete, totalCount) {
    if (!athlete || activeIndex >= totalCount) {
      const locLabel = activeLocation.label || `${activeLocation.district}, ${activeLocation.city}`;
      const radiusText = filters.maxDistanceKm !== 'all' ? `${filters.maxDistanceKm} km içinde` : 'tüm Türkiye’de';

      return `
        <div class="empty-athletes-card">
          <div style="color: var(--color-purple-primary); margin-bottom: 12px; display: flex; justify-content: center;">${icons.dumbbell(48)}</div>
          <h3 style="font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">
            ${totalCount === 0 ? `${locLabel} Çevresinde Başka Sporcu Kalmadı` : 'Çevrendeki Tüm Sporcuları İnceledin!'}
          </h3>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 22px;">
            ${totalCount === 0
              ? `${locLabel} konumunda ${radiusText} şu an bekleyen başka sporcu kalmadı. Yarıçapı genişleterek komşu ilçelerdeki sporcuları görebilir veya konumunu değiştirebilirsin.`
              : 'Yeni bir sporcu katıldığında veya salonda antrenman çağrısı açıldığında anında haberdar olacaksın.'}
          </p>

          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            ${filters.maxDistanceKm !== 'all' && totalCount === 0 ? `
              <button class="btn-primary-plan" id="btn-expand-radius" style="width: auto; padding: 10px 18px; font-size: 13px;">
                <span>Yarıçapı Genişlet (75 km)</span>
              </button>
            ` : ''}
            <button class="btn-secondary" id="btn-open-location-empty" style="width: auto; padding: 10px 18px; font-size: 13px;">
              ${icons.pin(14)} <span>Konumu Değiştir / GPS</span>
            </button>
            ${totalCount > 0 ? `
              <button class="btn-primary-plan" id="btn-deck-rewind" style="width: auto; padding: 10px 18px; font-size: 13px;">
                ${icons.refresh(14)} <span>Kartları Baştan Gör</span>
              </button>
            ` : ''}
            <button class="btn-secondary" id="btn-share-gym-invite" style="width: auto; padding: 10px 18px; font-size: 13px;">
              ${icons.share(14)} <span>Arkadaşını Davet Et</span>
            </button>
          </div>
        </div>
      `;
    }

    const matchedGym = allGyms.find(g => g.id === athlete.gymId);
    const gymName = athlete.gymName || matchedGym?.name || athlete.nextWorkout?.gymName || "Crack Fitness (Emlak Konutları)";
    const gymDistrict = athlete.district || matchedGym?.district || activeLocation.district || "Çorlu";
    const gymCity = athlete.city || matchedGym?.city || activeLocation.city || "Tekirdağ";
    const distText = athlete.distanceText || (matchedGym?.distanceText || (athlete.distanceMeters ? `${athlete.distanceMeters} m` : '2.6 km'));
    const gymLabel = gymName.includes(gymCity)
      ? gymName
      : `${gymName} (${gymDistrict ? `${gymDistrict}, ` : ''}${gymCity})`;
    const athletePhotos = (Array.isArray(athlete.photos) && athlete.photos.length > 0)
      ? athlete.photos
      : (athlete.avatar ? [athlete.avatar] : []);

    const rawTime = (athlete.nextWorkout?.time || "17:00").replace(/^Bugün\s+/i, "");
    const workoutType = athlete.nextWorkout?.workoutType || athlete.nextWorkout?.type || "Bacak & Kalça";
    const expectation = athlete.nextWorkout?.expectation || "Spotter partneri arıyor";
    const goalsList = (Array.isArray(athlete.goals) && athlete.goals.length > 0) ? athlete.goals.slice(0, 3) : ["Kas", "Güç"];

    return `
      <div class="tinder-deck-container">
        <!-- 4.7. SPORCU EŞLEŞME KARTI (MAIN MATCH CARD) -->
        <div class="veyro-athlete-card" id="active-swipe-card" data-athlete-id="${athlete.id}">
          <!-- 1. Üst Durum Bandı -->
          <div class="veyro-card-topbar">
            <span class="veyro-status-pill">
              <span class="live-pulse" style="width: 7px; height: 7px;"></span>
              <span>Şimdi Salonda</span>
            </span>
            <span class="veyro-distance-pill">
              ${icons.pin(12)} <strong>${distText}</strong> · ${gymDistrict} (${gymCity})
            </span>
          </div>

          <!-- 2. Kullanıcı Bilgisi (Merkezde 64x64 mor/cyan parıltılı dairesel avatar + Başlık + Salon) -->
          <div class="veyro-card-profile-center">
            <div class="veyro-card-avatar-ring" id="card-avatar-container" title="Profili İncele">
              <div class="veyro-card-avatar-inner">
                ${athletePhotos.length > 0 ? `
                  <img src="${athletePhotos[0]}" id="card-hero-photo-img" alt="${athlete.name}" />
                ` : `
                  <span>${athlete.initials || athlete.name.substring(0, 2).toUpperCase()}</span>
                `}
              </div>
            </div>

            <div class="veyro-card-name">
              <span>${athlete.name}, ${athlete.age || 20}</span>
              ${athlete.verified ? `
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#10B981" style="flex-shrink: 0;">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              ` : ''}
            </div>

            <div class="veyro-card-gym">${gymLabel}</div>
          </div>

          <!-- 3. Çağrı & Program Paneli -->
          <div class="veyro-card-workout-box">
            <div class="veyro-workout-box-left">
              <div class="veyro-workout-flame-box">${icons.flame(17)}</div>
              <div style="min-width: 0;">
                <div class="veyro-workout-title">${rawTime} · ${workoutType}</div>
                <div class="veyro-workout-sub">${athlete.level || 'Orta'} · ${expectation}</div>
              </div>
            </div>
            <button type="button" class="veyro-active-call-badge" id="btn-card-active-call" title="Antrenman Çağrısına Katıl / Eşleş">
              <span>🔥</span>
              <span>AKTİF ÇAĞRI</span>
            </button>
          </div>

          <!-- 4. Hedef Rozetleri (Badges) -->
          <div class="veyro-card-goals-row">
            ${goalsList.map(g => `<span class="veyro-goal-badge">${g}</span>`).join('')}
          </div>

          <!-- 5. Kullanıcı Biyografisi (Bio Quote) -->
          <div class="veyro-card-bio-quote">
            “${athlete.bio || 'Haftada 4 gün ağırlık, 1 gün kardiyo. Birlikte motive olacak ve set aralarında spotterlik yapacak partner arıyorum 💪'}”
          </div>

          <!-- 6. Güven & Sadakat İstatistikleri (Footer Stats) -->
          <div class="veyro-card-footer-stats">
            <span class="veyro-stat-item">
              <span style="color: var(--color-cyan-vivid);">☆</span>
              <strong>${athlete.rating || 4.7}</strong>
              <span>Puan</span>
            </span>
            <span class="veyro-stat-item">
              <span style="color: var(--color-cyan-vivid);">🔥</span>
              <strong>${athlete.streakDays || 4} Gün</strong>
              <span>Seri</span>
            </span>
            <span class="veyro-stat-item">
              <span style="color: var(--color-cyan-vivid);">🏋️</span>
              <strong>${athlete.workoutsCompleted || 10}</strong>
              <span>Antrenman</span>
            </span>
          </div>
        </div>

        <!-- Hızlı Aksiyon Barı (Pas Geç, Sohbet, Eşleş, Profil) -->
        <div class="tinder-actions-bar editorial-actions-dock">
          <button class="tinder-action-btn pass" id="btn-card-pass" title="Pas Geç (Sonraki Sporcu)">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <button class="tinder-action-btn chat" id="btn-card-chat" title="Mesaj Gönder">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          <button class="tinder-action-btn match" id="btn-card-match" title="Antrenman Daveti Gönder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </button>

          <button class="tinder-action-btn info" id="btn-card-info" title="Profili İncele">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
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
          <div style="color: var(--color-purple-primary); margin-bottom: 12px; display: flex; justify-content: center;">${icons.dumbbell(40)}</div>
          <h3 style="font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">
            Şu Anda Eşleşecek Partner Bulunmuyor
          </h3>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 20px;">
            Antrenman arkadaşı arayan ilk çağrıyı sen oluştur, salondaki sporcular sana istek atsın!
          </p>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn-secondary" id="btn-share-gym-invite" style="width: auto; padding: 10px 18px; font-size: 13px;">
              ${icons.share(13)} <span>Salondan Arkadaşını Davet Et</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="members-feed">
        ${athletes.map(member => {
          const matchedGym = allGyms.find(g => g.id === member.gymId);
          const gymName = member.gymName || matchedGym?.name || member.nextWorkout?.gymName || "Crack Fitness";
          const gymDistrict = member.district || matchedGym?.district || "";
          const locationCity = member.city || matchedGym?.city || (activeLocation.city || 'Tekirdağ');
          const distText = member.distanceText || (member.distanceMeters ? `${member.distanceMeters} m` : '2.6 km');
          const feedGymLabel = `${gymName} (${gymDistrict ? `${gymDistrict}, ` : ''}${locationCity})`;
          return `
            <div class="member-card" data-user-id="${member.id}">
              <div class="member-card-header">
                <div class="member-profile-left" data-action="view-profile" data-user-id="${member.id}">
                  <div class="member-avatar" style="overflow: hidden; padding: 0;">
                    ${(member.photos && member.photos[0]) || member.avatar ? `
                      <img src="${(member.photos && member.photos[0]) || member.avatar}" style="width: 100%; height: 100%; object-fit: cover;" alt="${member.name}" />
                    ` : (member.initials || member.name.substring(0, 2).toUpperCase())}
                  </div>
                  <div class="member-meta">
                    <h4>
                      ${member.name}, ${member.age || 20}
                      ${member.verified ? `
                        <svg class="verified-icon" viewBox="0 0 24 24" fill="#10B981">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      ` : ''}
                    </h4>
                    <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                      <span style="font-size: 10.5px; font-weight: 800; color: var(--color-cyan-vivid); background: rgba(34, 211, 238, 0.12); border: 1px solid rgba(34, 211, 238, 0.3); padding: 1px 6px; border-radius: 5px; display: inline-flex; align-items: center; gap: 3px;">
                        ${icons.pin(10)} ${distText}
                      </span>
                      <span>${feedGymLabel}</span>
                    </div>
                    <div class="member-tags">
                      <span class="member-tag-chip" style="color: var(--color-purple-primary);">${member.level || 'Orta'}</span>
                      ${(member.goals || []).map(g => `<span class="member-tag-chip">${g}</span>`).join('')}
                    </div>
                  </div>
                </div>
              </div>

              <div class="member-workout-slot">
                <div class="workout-slot-time">
                  <span style="color: var(--color-action-fire); display: inline-flex;">${icons.flame(14)}</span>
                  <span>${(member.nextWorkout?.time || '17:00').replace(/^Bugün\s+/i, '')} · ${member.nextWorkout?.workoutType || member.nextWorkout?.type || 'Fitness'}</span>
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

    container.querySelector("#btn-add-story-trigger")?.addEventListener("click", () => {
      showStoryCreatorModal(() => {
        render();
      });
    });

    container.querySelectorAll(".story-circle-item[data-story-id]").forEach(item => {
      item.addEventListener("click", () => {
        const sId = item.dataset.storyId;
        showStoryViewerModal(sId, onOpenChat);
      });
    });

    const openPlanModal = () => {
      showPlanWorkoutModal(() => {
        render();
      });
    };

    document.getElementById("btn-toggle-plan-banner")?.addEventListener("click", () => {
      isPlanBannerCollapsed = !isPlanBannerCollapsed;
      localStorage.setItem("veyro_plan_collapsed", isPlanBannerCollapsed.toString());
      render();
    });

    document.getElementById("btn-open-plan-workout")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openPlanModal();
    });

    container.querySelectorAll(".btn-edit-active-plan").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openPlanModal();
      });
    });

    container.querySelectorAll(".btn-cancel-active-plan").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        auth.updateProfile({ nextWorkout: null });
        refreshUserAndCollections();
        notify.info("Antrenman çağrın iptal edildi ve yayından kaldırıldı.");
        render();
      });
    });

    document.getElementById("btn-open-filters")?.addEventListener("click", () => {
      showFilterModal(filters, (newFilters) => {
        filters = newFilters;
        activeIndex = 0;
        render();
      });
    });

    document.getElementById("btn-mode-deck")?.addEventListener("click", () => {
      mode = "deck";
      render();
    });

    document.getElementById("btn-mode-feed")?.addEventListener("click", () => {
      mode = "feed";
      render();
    });

    document.getElementById("btn-trigger-location-modal")?.addEventListener("click", () => {
      showLocationModal(filters.maxDistanceKm, (newRadius) => {
        filters.maxDistanceKm = newRadius;
        activeIndex = 0;
        render();
      });
    });

    document.getElementById("btn-open-location-empty")?.addEventListener("click", () => {
      showLocationModal(filters.maxDistanceKm, (newRadius) => {
        filters.maxDistanceKm = newRadius;
        activeIndex = 0;
        render();
      });
    });

    document.getElementById("select-quick-radius-bar")?.addEventListener("change", (e) => {
      filters.maxDistanceKm = e.target.value;
      activeIndex = 0;
      render();
    });

    document.getElementById("btn-expand-radius")?.addEventListener("click", () => {
      filters.maxDistanceKm = "75";
      activeIndex = 0;
      render();
    });

    document.getElementById("btn-clear-filters")?.addEventListener("click", () => {
      filters = {
        city: "all",
        maxDistanceKm: "35",
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

    document.getElementById("btn-deck-rewind")?.addEventListener("click", () => {
      activeIndex = 0;
      render();
    });

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

    // ACTION: PASS
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

    // ACTION: MATCH / ACTIVE CALL INVITE
    const triggerMatchInvite = () => {
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
    };

    document.getElementById("btn-card-match")?.addEventListener("click", triggerMatchInvite);
    document.getElementById("btn-card-active-call")?.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerMatchInvite();
    });

    // ACTION: CHAT
    document.getElementById("btn-card-chat")?.addEventListener("click", () => {
      if (athlete) {
        if (onOpenChat) onOpenChat(athlete.id);
        else notify.info(`${athlete.name} ile sohbet açılıyor...`);
      }
    });

    // ACTION: INFO / AVATAR CLICK
    document.getElementById("btn-card-info")?.addEventListener("click", () => {
      if (athlete) onSelectUser(athlete);
    });
    document.getElementById("card-avatar-container")?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (athlete) onSelectUser(athlete);
    });

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
        const rotate = diffX * 0.06;
        cardEl.style.transform = `translateX(${diffX}px) rotate(${rotate}deg)`;
      };

      const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        const diffX = currentX - startX;

        if (diffX > 90) {
          triggerMatchInvite();
        } else if (diffX < -90) {
          cardEl.classList.add("swiping-left");
          if (navigator.vibrate) navigator.vibrate([15]);
          setTimeout(() => {
            activeIndex++;
            render();
          }, 260);
        } else {
          cardEl.style.transform = "";
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
