/**
 * Veyro - Real Interactive Gym Map Component (Harita Görünümü)
 * Dual-Engine Architecture:
 * 1. Supports Real Google Maps JavaScript API when key is configured in Admin.
 * 2. High-performance Leaflet + CartoDB tile engine with automatic size invalidation.
 * Features: Live GPS pulsing dot, custom flame gym pins, smooth camera transitions,
 * style switcher (Sokak / Gece), and one-tap gym selection.
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
let currentTileLayer = null;
let currentStyle = 'street'; // 'street' (OpenStreetMap) | 'dark' (CartoDB Dark) | 'satellite' (Uydu)

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
    <div class="map-view-wrapper fade-in" style="position: relative; width: 100%; height: ${height}; border-radius: 20px; overflow: hidden; margin-bottom: 16px; border: 1.5px solid var(--border-glass-bright); background: #0A0C12; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);">
      <!-- Real Map Canvas Container -->
      <div id="${mapId}" style="width: 100%; height: 100%; z-index: 1;"></div>

      <!-- Top Overlay Toolbar (Engine Badge & Style Switcher) -->
      <div style="position: absolute; top: 10px; left: 10px; z-index: 500; display: flex; gap: 8px; align-items: center;">
        <div style="background: rgba(14, 16, 23, 0.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border-glass-bright); font-size: 11px; font-weight: 700; color: #FFFFFF; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: #00F0FF; box-shadow: 0 0 8px #00F0FF;"></span>
          <span id="map-engine-label">${config.maps.googleMapsApiKey ? 'Google Maps' : 'Canlı GPS Haritası'}</span>
        </div>

        <!-- Style Toggle (Sokak / Gece / Uydu) -->
        <button id="btn-toggle-map-theme" style="background: rgba(14, 16, 23, 0.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--border-glass-bright); color: #FFFFFF; padding: 5px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px;">
          <span id="label-map-theme">${currentStyle === 'street' ? '🗺️ Sokak' : (currentStyle === 'dark' ? '🌙 Gece' : '🛰️ Uydu')}</span>
        </button>
      </div>

      <!-- Recenter GPS Button -->
      <button id="btn-recenter-map" title="Konumuma Git" style="position: absolute; top: 10px; right: 10px; z-index: 500; background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%); border: 1.5px solid #FFFFFF; color: #FFFFFF; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 14px rgba(255, 87, 34, 0.45); transition: transform 0.2s ease;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>

      <!-- Zoom In / Zoom Out Controls -->
      <div style="position: absolute; right: 10px; top: 54px; z-index: 500; display: flex; flex-direction: column; gap: 5px;">
        <button id="btn-zoom-in" title="Yakınlaştır" style="width: 32px; height: 32px; border-radius: 9px; background: rgba(18, 20, 27, 0.92); backdrop-filter: blur(8px); border: 1px solid var(--border-glass-bright); color: #FFF; font-size: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">+</button>
        <button id="btn-zoom-out" title="Uzaklaştır" style="width: 32px; height: 32px; border-radius: 9px; background: rgba(18, 20, 27, 0.92); backdrop-filter: blur(8px); border: 1px solid var(--border-glass-bright); color: #FFF; font-size: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">−</button>
      </div>

      <!-- Selected Gym Drawer (Bottom Sheet) -->
      ${selectedGym ? `
        <div id="map-selected-drawer" style="position: absolute; bottom: 8px; left: 8px; right: 8px; z-index: 500; background: rgba(18, 20, 27, 0.96); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1.5px solid rgba(255, 87, 34, 0.4); border-radius: 16px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);">
          <div style="flex: 1; padding-right: 10px; min-width: 0;">
            <strong id="drawer-gym-title" style="font-size: 13.5px; font-weight: 800; color: #FFFFFF; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${selectedGym.name}</strong>
            <span id="drawer-gym-distance" style="font-size: 11px; color: var(--color-kor); font-weight: 700;">
              ${selectedGym.distanceText || (selectedGym.distanceMeters + ' m')} · ${selectedGym.district || 'İstanbul'}
            </span>
          </div>
          <button class="btn-kor" id="btn-map-choose-gym" style="padding: 8px 14px; font-size: 12px; font-weight: 800; width: auto; white-space: nowrap; border-radius: 10px;">
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
      console.warn("Google Maps load failed, falling back to Leaflet engine:", e);
    }
  }

  // Primary High-Performance Leaflet Engine with Size Invalidation
  initLeafletMap(mapId, userCoords, sortedGyms, (gym) => {
    selectedGym = gym;
    updateDrawer(gym);
    if (onSelectGym) onSelectGym(gym);
  });

  function updateDrawer(gym) {
    const titleEl = document.getElementById("drawer-gym-title");
    const distEl = document.getElementById("drawer-gym-distance");
    if (titleEl) titleEl.textContent = gym.name;
    if (distEl) distEl.textContent = `${gym.distanceText || (gym.distanceMeters + ' m')} · ${gym.district || 'İstanbul'}`;
  }
}

/**
 * Initializes Leaflet with high-visibility tiles, custom pins and invalidation
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

  const tileUrls = {
    street: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  function applyTiles(style) {
    if (currentTileLayer) {
      map.removeLayer(currentTileLayer);
    }
    const url = tileUrls[style] || tileUrls.street;
    currentTileLayer = L.tileLayer(url, {
      maxZoom: 19,
      attribution: ''
    }).addTo(map);
  }

  applyTiles(currentStyle);

  // Style switcher button (Street -> Dark -> Satellite -> Street)
  document.getElementById("btn-toggle-map-theme")?.addEventListener("click", () => {
    if (currentStyle === 'street') currentStyle = 'dark';
    else if (currentStyle === 'dark') currentStyle = 'satellite';
    else currentStyle = 'street';

    applyTiles(currentStyle);
    const lbl = document.getElementById("label-map-theme");
    if (lbl) {
      lbl.textContent = currentStyle === 'street' ? '🗺️ Sokak' : (currentStyle === 'dark' ? '🌙 Gece' : '🛰️ Uydu');
    }
  });

  // User Live GPS Blue Pulse Icon
  const userIcon = L.divIcon({
    className: 'leaflet-user-pulse-icon',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(0, 240, 255, 0.3); animation: pulseUser 2s infinite;"></div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background: #00F0FF; border: 2.5px solid #FFFFFF; box-shadow: 0 0 12px #00F0FF;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  L.marker([centerLat, centerLng], { icon: userIcon })
    .addTo(map)
    .bindTooltip("📍 Canlı GPS Konumun", { direction: 'top', className: 'dark-map-tooltip', permanent: false });

  // Gym Flame Markers with clean, visible design
  gyms.forEach(gym => {
    if (!gym.lat || !gym.lng) return;

    const shortName = gym.name.length > 18 ? gym.name.substring(0, 16) + '..' : gym.name;

    const gymIcon = L.divIcon({
      className: 'leaflet-gym-flame-icon',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; width: 140px; margin-left: -10px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6));">
          <div style="background: rgba(18, 20, 27, 0.95); border: 1.5px solid rgba(255, 87, 34, 0.65); border-radius: 8px; padding: 2px 8px; font-size: 10px; font-weight: 800; color: #FFFFFF; white-space: nowrap; margin-bottom: 2px; box-shadow: 0 4px 12px rgba(0,0,0,0.7); max-width: 130px; overflow: hidden; text-overflow: ellipsis;">
            ${shortName}
          </div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #FF5722 0%, #FF7043 100%); border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(255, 87, 34, 0.65);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </div>
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #FF5722; margin-top: -1px;"></div>
        </div>
      `,
      iconSize: [140, 56],
      iconAnchor: [70, 54]
    });

    const marker = L.marker([gym.lat, gym.lng], { icon: gymIcon }).addTo(map);

    marker.on("click", () => {
      map.flyTo([gym.lat, gym.lng], 15, { animate: true, duration: 0.8 });
      if (navigator.vibrate) navigator.vibrate([20]);
      onPinClick(gym);
    });
  });

  // Automatically fit bounds so user GPS and closest gyms are visible
  if (gyms.length > 0) {
    const points = [[centerLat, centerLng]];
    gyms.slice(0, 4).forEach(g => {
      if (g.lat && g.lng) points.push([g.lat, g.lng]);
    });
    if (points.length > 1) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
      } catch (e) {}
    }
  }

  // Recenter GPS Button
  document.getElementById("btn-recenter-map")?.addEventListener("click", async () => {
    notify.info("Cihaz GPS konumu güncelleniyor...");
    const pos = await locationService.getCurrentPosition();
    map.flyTo([pos.latitude, pos.longitude], 15, { animate: true, duration: 1.0 });
    notify.success("Konum merkeze alındı!");
  });

  // Zoom In / Zoom Out controls
  document.getElementById("btn-zoom-in")?.addEventListener("click", () => map.zoomIn());
  document.getElementById("btn-zoom-out")?.addEventListener("click", () => map.zoomOut());

  // CRUCIAL: Invalidate size repeatedly to prevent gray/unrendered tiles during modal animation
  requestAnimationFrame(() => map.invalidateSize());
  setTimeout(() => map.invalidateSize(), 50);
  setTimeout(() => map.invalidateSize(), 150);
  setTimeout(() => map.invalidateSize(), 300);
  setTimeout(() => map.invalidateSize(), 600);

  if (typeof window !== 'undefined' && window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      try { map.invalidateSize(); } catch (e) {}
    });
    ro.observe(mapEl);
  }
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
