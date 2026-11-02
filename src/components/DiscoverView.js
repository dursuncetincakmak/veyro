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

  // Collapsible workout planning banner (defaults to collapsed so athlete card fits on mobile screen)
  let isPlanBannerCollapsed = localStorage.getItem("veyro_plan_collapsed") !== "false";

  // Multi-dimensional filters (Default radius: 35 km so Çorlu users see Çorlu, Süleymanpaşa, Çerkezköy)
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
  const unsubscribeLocation = locationService.subscribe((newLoc, newCoords) => {
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

    // 1. Initial attribute filtering
    const filtered = allUsers.filter(user => {
      // Don't show current logged in user in their own discovery deck
      if (user.id === currentUser.id) return false;

      // Never show athletes who have been blocked or banned
      if (db.isBlocked(currentUser.id, user.id)) return false;
      if (user.isBanned) return false;

      // Never show athletes who have already been matched or invited
      if (matchedPartnerIds.has(user.id)) return false;

      // Filter by city / province if specified
      if (filters.city && filters.city !== "all") {
        if (user.city && user.city.toLowerCase() !== filters.city.toLowerCase()) return false;
      }

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

    // 2. Compute exact Haversine distances based on active location coordinates
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

    // 3. Apply Proximity Radius Threshold (Yarıçap Sınırı: 10km, 25km, 35km, 75km, all)
    let radiusFiltered = mapped;
    if (filters.maxDistanceKm && filters.maxDistanceKm !== "all") {
      const maxKm = parseFloat(filters.maxDistanceKm);
      radiusFiltered = mapped.filter(ath => ath.distanceKm <= maxKm);
    }

    // 4. Sort strictly nearest first
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

    container.innerHTML = `
      <div class="discover-page fade-in">
        <!-- 1. ATHLETE STORIES TRAY (24H WORKOUT MOMENTS) -->
        ${renderStoriesTray()}

        <!-- 2. UNIFIED LUXURY CONTROL BAR (Mode Switcher + Plan + Radius + Filter) -->
        <div class="view-switcher-bar" style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 8px;">
          <div class="segmented-control" style="padding: 3px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
            <div class="segmented-option ${mode === 'deck' ? 'selected' : ''}" id="btn-mode-deck" role="button" style="padding: 5px 11px; font-size: 12px; border-radius: 9px;">
              ${icons.cards(13)} <span>Sporcu Kartları</span>
            </div>
            <div class="segmented-option ${mode === 'feed' ? 'selected' : ''}" id="btn-mode-feed" role="button" style="padding: 5px 11px; font-size: 12px; border-radius: 9px;">
              ${icons.list(13)} <span>Liste Akışı</span>
            </div>
          </div>

          <div style="display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;">
            <!-- Compact Workout Plan Trigger -->
            <button type="button" id="btn-mini-plan-action" title="Antrenmanını Planla" style="height: 32px; padding: 0 10px; border-radius: 10px; font-size: 11.5px; font-weight: 800; color: #FFF; background: ${myPlan?.time ? 'rgba(255, 87, 34, 0.2)' : 'var(--color-kor-gradient)'}; border: ${myPlan?.time ? '1px solid rgba(255, 87, 34, 0.5)' : 'none'}; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; box-shadow: 0 2px 10px rgba(255,87,34,0.25);">
              ${myPlan?.time ? `${icons.flame(12)} <span>${myPlan.time}</span>` : `${icons.plus(12)} <span>Planla</span>`}
            </button>

            <!-- Compact Radius & GPS Trigger -->
            <button type="button" id="btn-trigger-location-modal" title="Mesafe Yarıçapı ve Konum" style="height: 32px; padding: 0 9px; border-radius: 10px; font-size: 11.5px; font-weight: 700; color: #E5E7EB; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
              <span style="color: var(--color-kor); display: flex;">${icons.pin(11)}</span>
              <span>${filters.maxDistanceKm === 'all' ? 'Tüm TR' : `${filters.maxDistanceKm} km`}</span>
            </button>

            <!-- Filter Icon Button -->
            <button class="btn-filter-trigger ${filterCount > 0 ? 'active' : ''}" id="btn-open-filters" type="button" title="Filtrele" style="height: 32px; padding: 0 9px; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); display: inline-flex; align-items: center; gap: 4px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              ${filterCount > 0 ? `<span style="background: var(--color-kor); color: #FFF; font-size: 10px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800;">${filterCount}</span>` : ''}
            </button>
            ${filterCount > 0 ? `
              <button class="btn-ghost" id="btn-clear-filters" title="Filtreleri Sıfırla" style="height: 32px; padding: 0 8px; font-size: 11px; color: var(--color-rose); background: rgba(244,63,94,0.12); border-radius: 10px; border: 1px solid rgba(244,63,94,0.25); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">
                ✕
              </button>
            ` : ''}
          </div>
        </div>

        <!-- 3. ACTIVE WORKOUT BANNER (Only visible when user has an active workout published) -->
        ${myPlan?.time ? renderMyWorkoutBanner(myPlan) : ''}

        <!-- 4. CONTENT: CARDS OR FEED -->
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

    // 1. Calculate dynamic Haversine distance for each story from current viewer coordinates
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

    // 2. Strictly filter stories for active city or real proximity (within 35 km)
    const localizedStories = storiesWithDistance.filter(story => {
      // Current user's own story always visible
      if (story.userId === currentUser.id || story.userId === "current-user") return true;
      // Match active gym
      if (userGymId && userGymId !== "all" && story.gymId === userGymId) return true;
      // City match
      if (story.city && story.city.toLowerCase() === activeCity.toLowerCase()) return true;
      // District / Neighborhood match
      if (story.district && story.district.toLowerCase() === activeDistrict.toLowerCase()) return true;
      if (story.gymName && (story.gymName.includes(activeDistrict) || story.gymName.includes(activeCity))) return true;
      // Calculated proximity check (only if true physical distance <= 35 km)
      if (typeof story.calculatedDistanceKm === "number" && story.calculatedDistanceKm <= 35.0) return true;
      return false;
    });

    // 3. Deduplicate stories by both user and avatar so two stories never share the same photo
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
      <div class="stories-tray-container" style="margin-bottom: 8px; overflow-x: auto; scrollbar-width: none;">
        <div style="display: flex; gap: 14px; align-items: flex-start; padding: 2px 2px 2px 2px;">
          <!-- User Add Story Circle -->
          <div id="btn-add-story-trigger" class="story-circle-item" style="display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; flex-shrink: 0;" title="Hikaye Paylaş">
            <div style="position: relative; width: 52px; height: 52px;">
              <div class="member-avatar accent-kor" style="width: 52px; height: 52px; font-size: 15px; border: 1.5px dashed rgba(255, 255, 255, 0.35); background: rgba(255, 255, 255, 0.04);">
                ${currentUser.initials || "SP"}
              </div>
              <div style="position: absolute; bottom: -1px; right: -1px; width: 18px; height: 18px; border-radius: 50%; background: var(--color-kor); color: #FFF; display: flex; align-items: center; justify-content: center; border: 2px solid #0B0C0E;">
                ${icons.plus(10)}
              </div>
            </div>
            <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">Hikayen</span>
          </div>

          <!-- Community Athlete Stories (Nearby / In Same Location) -->
          ${displayStories.map(story => `
            <div class="story-circle-item" data-story-id="${story.id}" style="display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; flex-shrink: 0;" title="${story.userName} - ${story.tag || 'Hikaye'}">
              <div class="story-avatar-ring ${story.viewed ? 'viewed' : 'unviewed'}" style="position: relative; width: 52px; height: 52px; border-radius: 50%; padding: 2px; background: ${story.viewed ? 'rgba(255,255,255,0.16)' : 'linear-gradient(135deg, #FF5722 0%, #FF8A65 100%)'}; transition: all 0.2s ease;">
                <div style="width: 100%; height: 100%; border-radius: 50%; overflow: hidden; background: #14151B; border: 2px solid #0B0C0E;">
                  ${story.userAvatar ? `<img src="${story.userAvatar}" style="width: 100%; height: 100%; object-fit: cover;">` : `<div class="member-avatar accent-kor" style="width: 100%; height: 100%; font-size: 14px;">${story.userInitials || "SP"}</div>`}
                </div>
              </div>
              <span style="font-size: 11px; font-weight: ${story.viewed ? '500' : '600'}; color: ${story.viewed ? 'var(--text-muted)' : '#E5E7EB'}; max-width: 56px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${story.userName.split(' ')[0]}
              </span>
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
              <button type="button" class="btn-ghost btn-edit-active-plan" style="padding: 4px 8px; font-size: 10.5px; font-weight: 800; color: #FFF; background: var(--color-kor); border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                ${hasPlan ? `${icons.edit(12)} Düzenle` : `${icons.plus(11)} Planla`}
              </button>
              ${hasPlan ? `
                <button type="button" class="btn-ghost btn-cancel-active-plan" style="padding: 4px 8px; font-size: 10.5px; font-weight: 800; color: #FF5252; background: rgba(244, 63, 94, 0.14); border: 1px solid rgba(244, 63, 94, 0.35); border-radius: 6px; display: inline-flex; align-items: center; gap: 3px;">
                  ${icons.close(11)} İptal
                </button>
              ` : ''}
              <button type="button" class="btn-ghost" style="padding: 2px 4px; color: var(--text-secondary); display: flex; align-items: center;" aria-label="Genişlet">
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
            <button type="button" class="btn-ghost btn-edit-active-plan" id="btn-edit-active-plan" style="padding: 4px 8px; font-size: 11px; color: var(--text-secondary); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
              ${icons.edit(12)} Düzenle
            </button>
            <button type="button" class="btn-ghost btn-cancel-active-plan" id="btn-cancel-active-plan" style="padding: 4px 8px; font-size: 11px; color: #FF5252; background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 6px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
              ${icons.close(12)} İptal
            </button>
            <button type="button" class="btn-ghost" id="btn-toggle-plan-banner" style="padding: 4px 6px; font-size: 11px; color: var(--text-secondary); display: flex; align-items: center; gap: 2px; background: rgba(255,255,255,0.06); border-radius: 6px;" title="Daralt">
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
      const locLabel = activeLocation.label || `${activeLocation.district}, ${activeLocation.city}`;
      const radiusText = filters.maxDistanceKm !== 'all' ? `${filters.maxDistanceKm} km içinde` : 'tüm Türkiye’de';

      return `
        <div class="empty-athletes-card">
          <div style="color: var(--color-kor); margin-bottom: 12px; display: flex; justify-content: center;">${icons.dumbbell(48)}</div>
          <h3 style="font-size: 18px; font-weight: 800; color: #FFFFFF; margin-bottom: 6px;">
            ${totalCount === 0 ? `${locLabel} Çevresinde Başka Sporcu Kalmadı` : 'Çevrendeki Tüm Sporcuları İnceledin!'}
          </h3>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 22px;">
            ${totalCount === 0 
              ? `${locLabel} konumunda ${radiusText} şu an bekleyen başka sporcu kalmadı. Yarıçapı genişleterek komşu ilçelerdeki sporcuları görebilir veya konumunu değiştirebilirsin.`
              : 'Yeni bir sporcu katıldığında veya salonda antrenman çağrısı açıldığında anında haberdar olacaksın.'}
          </p>

          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            ${filters.maxDistanceKm !== 'all' && totalCount === 0 ? `
              <button class="btn-kor" id="btn-expand-radius" style="padding: 10px 18px; font-size: 13px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></svg>
                <span>Yarıçapı Genişlet (75 km)</span>
              </button>
            ` : ''}
            <button class="btn-secondary" id="btn-open-location-empty" style="padding: 10px 18px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
              ${icons.pin(14)} <span>Konumu Değiştir / GPS</span>
            </button>
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

    const matchedGym = allGyms.find(g => g.id === athlete.gymId);
    const gymName = athlete.gymName || matchedGym?.name || athlete.nextWorkout?.gymName || "Spartan Fitness Center";
    const gymDistrict = athlete.district || matchedGym?.district || activeLocation.district || "Çorlu";
    const gymCity = athlete.city || matchedGym?.city || activeLocation.city || "Tekirdağ";
    const distText = athlete.distanceText || (matchedGym?.distanceText || (athlete.distanceMeters ? `${athlete.distanceMeters} m` : '450 m'));
    const gymLabel = `${gymName} (${gymDistrict ? `${gymDistrict}, ` : ''}${gymCity})`;
    const athletePhotos = (Array.isArray(athlete.photos) && athlete.photos.length > 0)
      ? athlete.photos
      : (athlete.avatar ? [athlete.avatar] : []);

    return `
      <div class="tinder-deck-container">
        <!-- Full-Bleed Editorial Luxury Athlete Card -->
        <div class="tinder-athlete-card editorial-luxury-card" id="active-swipe-card" data-athlete-id="${athlete.id}">
          <!-- Full-Bleed Portrait Backdrop -->
          <div class="editorial-card-backdrop" id="card-avatar-container" title="${athletePhotos.length > 1 ? 'Diğer fotoğrafları görmek için dokun' : ''}">
            ${athletePhotos.length > 0 ? `
              <img src="${athletePhotos[0]}" id="card-hero-photo-img" class="editorial-backdrop-img" alt="${athlete.name}" />
            ` : `
              <div class="editorial-backdrop-fallback">
                <span>${athlete.initials || athlete.name.substring(0, 2).toUpperCase()}</span>
              </div>
            `}
            <div class="editorial-vignette-overlay"></div>
          </div>

          <!-- Top Bar Over Portrait: Story Bars + Status Pills -->
          <div class="editorial-top-layer">
            ${athletePhotos.length > 1 ? `
              <div class="card-story-indicators" style="position: static; margin-bottom: 10px;">
                ${athletePhotos.map((_, i) => `<span class="card-story-indicator-bar ${i === 0 ? 'active' : ''}"></span>`).join('')}
              </div>
            ` : ''}
            <div class="tinder-card-topbar" style="margin-bottom: 0;">
              <span class="editorial-glass-pill status-pill">
                <span class="live-pulse" style="width: 6px; height: 6px;"></span>
                Şimdi Salonda
              </span>
              <span class="editorial-glass-pill distance-pill">
                ${icons.pin(11)} <strong>${distText}</strong> · ${gymDistrict}
              </span>
            </div>
          </div>

          <!-- Bottom Editorial Info Overlay -->
          <div class="editorial-bottom-layer">
            <!-- Name, Age, Verified & Rating Row -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
              <div class="tinder-athlete-name" style="justify-content: flex-start; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF; text-shadow: 0 2px 12px rgba(0,0,0,0.6);">
                <span>${athlete.name}, ${athlete.age || 26}</span>
                ${athlete.verified ? `
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#10B981" style="flex-shrink: 0; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                ` : ''}
              </div>
              <div class="editorial-rating-chip">
                <span style="color: #FBBF24; display: flex;">${icons.starFilled(12)}</span>
                <span>${athlete.rating || 4.9}</span>
                <span style="opacity: 0.45;">·</span>
                <span>${athlete.workoutsCompleted || 14} seans</span>
              </div>
            </div>

            <!-- Gym Subtitle -->
            <div class="tinder-athlete-gym" style="text-align: left; font-size: 12.5px; color: rgba(255,255,255,0.78); font-weight: 500; margin-bottom: 10px; display: flex; align-items: center; gap: 5px;">
              <span style="color: var(--color-kor); display: flex;">${icons.dumbbell(12)}</span>
              <span>${gymLabel}</span>
            </div>

            <!-- Sleek Glass Workout & Goal Strip -->
            <div class="editorial-workout-strip">
              <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                <div class="editorial-workout-flame">${icons.flame(14)}</div>
                <div style="min-width: 0;">
                  <div style="font-size: 12.5px; font-weight: 800; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${athlete.nextWorkout?.time || 'Bugün 19:00'} · ${athlete.nextWorkout?.workoutType || athlete.nextWorkout?.type || 'Fitness'}
                  </div>
                  <div style="font-size: 11px; color: rgba(255,255,255,0.65); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${athlete.level || 'Orta'} Seviye · ${athlete.nextWorkout?.expectation || 'Partner arıyor'}
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 4px; flex-shrink: 0;">
                ${(athlete.goals || ['Kas', 'Güç']).slice(0, 2).map(g => `<span class="editorial-goal-tag">${g}</span>`).join('')}
              </div>
            </div>

            <!-- Understated Bio Line -->
            <p class="editorial-bio-text">
              ${athlete.bio || 'Haftada 4 gün antrenmandayım. Karşılıklı spotter olabileceğim disiplinli partner arıyorum.'}
            </p>
          </div>
        </div>

        <!-- Refined Luxury Floating Action Dock -->
        <div class="tinder-actions-bar editorial-actions-dock">
          <!-- Pass -->
          <button class="tinder-action-btn pass" id="btn-card-pass" title="Pas Geç (Sonraki Sporcu)">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <!-- Chat -->
          <button class="tinder-action-btn chat" id="btn-card-chat" title="Mesaj Gönder">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>

          <!-- Match / Invite -->
          <button class="tinder-action-btn match" id="btn-card-match" title="Antrenman Daveti Gönder">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.4">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </button>

          <!-- Info -->
          <button class="tinder-action-btn info" id="btn-card-info" title="Profili İncele">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
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
          const matchedGym = allGyms.find(g => g.id === member.gymId);
          const gymName = member.gymName || matchedGym?.name || member.nextWorkout?.gymName || "Spartan Fitness Center";
          const gymDistrict = member.district || matchedGym?.district || "";
          const locationCity = member.city || matchedGym?.city || (activeLocation.city || 'Tekirdağ');
          const distText = member.distanceText || (member.distanceMeters ? `${member.distanceMeters} m` : '450 m');
          const feedGymLabel = `${gymName} (${gymDistrict ? `${gymDistrict}, ` : ''}${locationCity})`;
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
                    <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                      <span class="feed-dist-badge" style="font-size: 10.5px; font-weight: 800; color: #00E5FF; background: rgba(0, 229, 255, 0.12); border: 1px solid rgba(0, 229, 255, 0.28); padding: 1px 6px; border-radius: 4px; display: inline-flex; align-items: center; gap: 3px;">
                        ${icons.pin(10)} ${distText}
                      </span>
                      <span>${feedGymLabel}</span>
                    </div>
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

    // Athlete Stories Handlers
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
    container.querySelectorAll(".btn-edit-active-plan").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openPlanModal();
      });
    });
    document.getElementById("btn-feed-plan-workout")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openPlanModal();
    });

    // Cancel Active Workout Plan (Works in both collapsed and expanded banners)
    container.querySelectorAll(".btn-cancel-active-plan").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        auth.updateProfile({ nextWorkout: null });
        refreshUserAndCollections();
        notify.info("Aktrenman çağrın iptal edildi ve yayından kaldırıldı.");
        render();
      });
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

    // Location Header Bar Trigger (Canlı Harita & İlçe Seçici)
    document.getElementById("btn-trigger-location-modal")?.addEventListener("click", () => {
      showLocationModal(filters.maxDistanceKm, (newRadius) => {
        filters.maxDistanceKm = newRadius;
        activeIndex = 0;
        render();
      });
    });

    // Empty state location button
    document.getElementById("btn-open-location-empty")?.addEventListener("click", () => {
      showLocationModal(filters.maxDistanceKm, (newRadius) => {
        filters.maxDistanceKm = newRadius;
        activeIndex = 0;
        render();
      });
    });

    // Quick Radius Selector Bar Change
    document.getElementById("select-quick-radius-bar")?.addEventListener("change", (e) => {
      filters.maxDistanceKm = e.target.value;
      activeIndex = 0;
      render();
    });

    // Expand Radius button from empty state
    document.getElementById("btn-expand-radius")?.addEventListener("click", () => {
      filters.maxDistanceKm = "75";
      activeIndex = 0;
      render();
    });

    // Clear Filters
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
