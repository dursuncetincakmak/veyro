/**
 * Veyro - Real Interactive Gym Map Component (Harita Görünümü)
 * Dual-Engine Architecture:
 * 1. Supports Real Google Maps JavaScript API when key is configured in Admin.
 * 2. High-performance Leaflet + CartoDB Dark Matter athletic tile engine for instant zero-config rendering.
 * Features: Live GPS pulsing dot, custom flame gym pins, geofence radius circle, and one-tap gym selection.
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationService } from '../services/location.js';
import { db } from '../services/db.js';
import { notify } from '../services/notification.js';
import { getGatewayConfig } from '../services/gatewayConfig.js';
import { gymPlacesService } from '../services/gymPlacesService.js';

let activeMapInstance = null;
let googleMapsScriptLoaded = false;

export async function renderGymMapView(container, onSelectGym, options = {}) {
  const height = options.height || "280px";
  const initialGymId = options.selectedGymId || null;
  const config = getGatewayConfig();

  // Get real live GPS coordinates
  const userCoords = await locationService.getCurrentPosition();

  // Fetch gyms directly from Maps (Google Places or Live Maps Geocoding API)
  let liveGyms = await gymPlacesService.fetchNearbyGymsFromMaps(userCoords);
  const dbGyms = db.getCollection("gyms") || [];

  // Combine db gyms with live Maps gyms (no duplicates)
  const combined = [...liveGyms];
  dbGyms.forEach(dbg => {
    if (!combined.some(g => g.name?.toLowerCase() === dbg.name?.toLowerCase())) {
      combined.push(dbg);
    }
  });

  const sortedGyms = locationService.sortGymsByDistance(combined, userCoords);
  let selectedGym = sortedGyms.find(g => g.id === initialGymId) || sortedGyms[0] || null;

  const mapId = `gym-interactive-map-${Math.random().toString(36).substring(2, 8)}`;

  container.innerHTML = `
    <div class="map-view-wrapper fade-in" style="position: relative; width: 100%; height: ${height}; border-radius: 20px; overflow: hidden; margin-bottom: 16px; border: 1px solid var(--border-glass-bright); background: #0A0C12;">
      <!-- Real Map Canvas Container -->
      <div id="${mapId}" style="width: 100%; height: 100%; z-index: 1;"></div>

      <!-- Top Overlay Badges -->
      <div style="position: absolute; top: 10px; left: 10px; z-index: 10; display: flex; gap: 8px; align-items: center;">
        <div style="background: rgba(14, 16, 23, 0.88); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border-glass-bright); font-size: 11px; font-weight: 700; color: #FFFFFF; display: flex; align-items: center; gap: 6px;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #00F0FF; box-shadow: 0 0 8px #00F0FF;"></span>
          <span id="map-engine-label">${config.maps.googleMapsApiKey ? 'Google Maps JS API' : 'Canlı GPS Haritası'}</span>
        </div>
      </div>

      <!-- Recenter GPS Button -->
      <button id="btn-recenter-map" style="position: absolute; top: 10px; right: 10px; z-index: 10; background: rgba(255, 87, 34, 0.9); border: none; color: #FFFFFF; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(255, 87, 34, 0.4); transition: transform 0.2s ease;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>

      <!-- Selected Gym Drawer (Bottom Sheet) -->
      ${selectedGym ? `
        <div id="map-selected-drawer" style="position: absolute; bottom: 8px; left: 8px; right: 8px; z-index: 10; background: rgba(18, 20, 27, 0.94); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid var(--border-glass-bright); border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
          <div style="flex: 1; padding-right: 10px;">
            <strong id="drawer-gym-title" style="font-size: 13.5px; color: #FFFFFF; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${selectedGym.name}</strong>
            <span id="drawer-gym-distance" style="font-size: 11px; color: var(--color-kor); font-weight: 700;">
              ${selectedGym.distanceText || (selectedGym.distanceMeters + ' m')} · ${selectedGym.district}
            </span>
          </div>
          <button class="btn-kor" id="btn-map-choose-gym" style="padding: 7px 14px; font-size: 12px; width: auto; white-space: nowrap;">
            Salonu Seç
          </button>
        </div>
      ` : ''}
    </div>
  `;

  // Attach bottom drawer button
  document.getElementById("btn-map-choose-gym")?.addEventListener("click", () => {
    if (selectedGym && onSelectGym) {
      onSelectGym(selectedGym);
    }
  });

  // Check if Google Maps JS API key is available
  const gmapKey = config.maps.googleMapsApiKey?.trim();
  if (gmapKey && gmapKey.startsWith("AIzaSy")) {
    try {
      await loadGoogleMapsSdk(gmapKey);
      initGoogleMap(mapId, userCoords, sortedGyms, (gym) => {
        selectedGym = gym;
        updateDrawer(gym);
        if (onSelectGym) onSelectGym(gym);
      });
      return;
    } catch (e) {
      console.warn("Google Maps load failed, falling back to Leaflet Dark tile engine:", e);
    }
  }

  // Primary High-Performance Leaflet Dark Tile Engine
  initLeafletMap(mapId, userCoords, sortedGyms, (gym) => {
    selectedGym = gym;
    updateDrawer(gym);
    if (onSelectGym) onSelectGym(gym);
  });

  function updateDrawer(gym) {
    const titleEl = document.getElementById("drawer-gym-title");
    const distEl = document.getElementById("drawer-gym-distance");
    if (titleEl) titleEl.textContent = gym.name;
    if (distEl) distEl.textContent = `${gym.distanceText || (gym.distanceMeters + ' m')} · ${gym.district}`;
  }
}

/**
 * Initializes Leaflet with CartoDB Dark Matter tiles and custom SVG pins
 */
function initLeafletMap(elementId, userCoords, gyms, onPinClick) {
  const mapEl = document.getElementById(elementId);
  if (!mapEl) return;

  const centerLat = userCoords.latitude || 40.9875;
  const centerLng = userCoords.longitude || 29.0280;

  // Cleanup existing map instance if any
  if (activeMapInstance) {
    try {
      activeMapInstance.remove();
    } catch (e) {}
  }

  const map = L.map(elementId, {
    zoomControl: false,
    attributionControl: false
  }).setView([centerLat, centerLng], 14);

  activeMapInstance = map;

  // Dark Athletic Tiles (CartoDB Dark Matter)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(map);

  // User Live GPS Blue Pulse Icon
  const userIcon = L.divIcon({
    className: 'leaflet-user-pulse-icon',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(0, 240, 255, 0.25); animation: pulseUser 2s infinite;"></div>
        <div style="width: 12px; height: 12px; border-radius: 50%; background: #00F0FF; border: 2.5px solid #FFFFFF; box-shadow: 0 0 10px #00F0FF;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

  L.marker([centerLat, centerLng], { icon: userIcon })
    .addTo(map)
    .bindTooltip("📍 Buradasın (Canlı GPS)", { direction: 'top', className: 'dark-map-tooltip' });

  // Gym Flame Markers
  gyms.forEach(gym => {
    if (!gym.lat || !gym.lng) return;

    const gymIcon = L.divIcon({
      className: 'leaflet-gym-flame-icon',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="background: #14161F; border: 1px solid rgba(255,255,255,0.18); border-radius: 6px; padding: 2px 6px; font-size: 9.5px; font-weight: 800; color: #FFFFFF; white-space: nowrap; margin-bottom: 2px; box-shadow: 0 4px 10px rgba(0,0,0,0.6);">
            ${gym.name.split(' ')[0]}
          </div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg, #FF5722 0%, #FF7043 100%); border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(255, 87, 34, 0.5);">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [60, 42],
      iconAnchor: [30, 40]
    });

    const marker = L.marker([gym.lat, gym.lng], { icon: gymIcon }).addTo(map);

    marker.on("click", () => {
      map.panTo([gym.lat, gym.lng]);
      onPinClick(gym);
    });
  });

  // Recenter GPS Button
  document.getElementById("btn-recenter-map")?.addEventListener("click", async () => {
    notify.info("Cihaz GPS konumu alınıyor...");
    const pos = await locationService.getCurrentPosition();
    map.flyTo([pos.latitude, pos.longitude], 15, { animate: true, duration: 1.2 });
    notify.success("Konum merkeze alındı!");
  });
}

/**
 * Loads Google Maps JavaScript SDK dynamically
 */
function loadGoogleMapsSdk(apiKey) {
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }
  if (googleMapsScriptLoaded) {
    return new Promise((resolve) => setTimeout(resolve, 300));
  }

  return new Promise((resolve, reject) => {
    googleMapsScriptLoaded = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/**
 * Initializes Google Maps JavaScript API with Dark Theme & Markers
 */
function initGoogleMap(elementId, userCoords, gyms, onPinClick) {
  const mapEl = document.getElementById(elementId);
  if (!mapEl || !window.google || !window.google.maps) return;

  const centerLat = userCoords.latitude || 40.9875;
  const centerLng = userCoords.longitude || 29.0280;

  const map = new window.google.maps.Map(mapEl, {
    center: { lat: centerLat, lng: centerLng },
    zoom: 14,
    disableDefaultUI: true,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#171821" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#171821" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#8E92A0" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#242735" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#0B0C10" }] },
      { featureType: "poi", stylers: [{ visibility: "off" }] }
    ]
  });

  // User Live Pin
  new window.google.maps.Marker({
    position: { lat: centerLat, lng: centerLng },
    map,
    title: "Canlı Konumunuz",
    icon: {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: "#00F0FF",
      fillOpacity: 1,
      strokeColor: "#FFFFFF",
      strokeWeight: 2.5
    }
  });

  // Gym Markers
  gyms.forEach(gym => {
    if (!gym.lat || !gym.lng) return;

    const marker = new window.google.maps.Marker({
      position: { lat: gym.lat, lng: gym.lng },
      map,
      title: gym.name,
      icon: {
        path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: "#FF5722",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2
      }
    });

    marker.addListener("click", () => {
      map.panTo({ lat: gym.lat, lng: gym.lng });
      onPinClick(gym);
    });
  });

  document.getElementById("btn-recenter-map")?.addEventListener("click", async () => {
    notify.info("Cihaz GPS konumu güncelleniyor...");
    const pos = await locationService.getCurrentPosition();
    map.panTo({ lat: pos.latitude, lng: pos.longitude });
    map.setZoom(15);
    notify.success("Konum merkeze alındı!");
  });
}
