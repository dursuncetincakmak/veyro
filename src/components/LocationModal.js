/**
 * Veyro - Location & Proximity Modal (Canlı Konum ve Yarıçap Belirleme)
 * Kullanıcının gerçek GPS konumunu algılar, Tekirdağ / Çorlu ve tüm Türkiye
 * illeri/ilçeleri arasında anında geçiş yapmasını ve arama yarıçapını ayarlamasını sağlar.
 */

import { locationService, TURKEY_PROVINCES } from '../services/location.js';
import { gymPlacesService } from '../services/gymPlacesService.js';
import { notify } from '../services/notification.js';
import { icons } from './icons.js';

export function showLocationModal(currentRadius = "35", onLocationChanged) {
  let modalOverlay = document.getElementById("location-modal-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "location-modal-overlay";
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
  }

  const activeLoc = locationService.getActiveLocation();
  let selectedCity = activeLoc.city || "Tekirdağ";
  let selectedDistrict = activeLoc.district || "Çorlu";
  let selectedRadius = currentRadius || "35";
  let isGpsLoading = false;

  function getDistrictsForCity(cityName) {
    const prov = TURKEY_PROVINCES.find(p => p.city.toLowerCase() === cityName.toLowerCase());
    return prov?.districts || [{ name: cityName, lat: 41.1603, lng: 27.7989 }];
  }

  function render() {
    const districts = getDistrictsForCity(selectedCity);

    modalOverlay.innerHTML = `
      <div class="modal-drawer fade-in" style="max-height: 85vh;">
        <div class="drawer-pill-bar"></div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h3 style="font-size: 19px; font-weight: 800; color: #FFF; margin: 0; display: flex; align-items: center; gap: 8px;">
            ${icons.pin(20)} <span>Aktif Konum ve Arama Yarıçapı</span>
          </h3>
          <button class="btn-ghost" id="btn-close-location-modal" style="padding: 6px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div style="overflow-y: auto; max-height: calc(85vh - 140px); padding-right: 4px;">
          <!-- 1. LIVE GPS ONE-TAP AUTO-DETECT BUTTON -->
          <div style="margin-bottom: 18px;">
            <button class="btn-secondary" id="btn-detect-live-gps" type="button" style="width: 100%; padding: 13px 16px; border-radius: 12px; background: rgba(0, 229, 255, 0.12); border: 1.5px solid rgba(0, 229, 255, 0.4); color: #FFF; display: flex; align-items: center; justify-content: center; gap: 9px; font-weight: 800; font-size: 13.5px; cursor: pointer; transition: all 0.2s ease;">
              ${isGpsLoading ? `
                <span class="spinner" style="width: 18px; height: 18px; border: 2px solid rgba(0,229,255,0.3); border-top-color: #00E5FF; border-radius: 50%; display: inline-block; animation: spin 0.8s linear infinite;"></span>
                <span>Harita GPS Konumu Algılanıyor...</span>
              ` : `
                <span style="color: #00E5FF; display: flex;">${icons.bolt(18)}</span>
                <span>⚡ Cihazımın Canlı GPS Konumunu Al</span>
              `}
            </button>
            <p style="font-size: 11px; color: var(--text-secondary); margin: 6px 0 0 4px; text-align: center;">
              Harita API üzerinden bulunduğun ilçeyi (örn. Çorlu) otomatik tespit eder.
            </p>
          </div>

          <!-- CURRENT ACTIVE LOCATION BADGE -->
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-glass); border-radius: 12px; padding: 12px 14px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 11px; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Mevcut Konumun</div>
              <div style="font-size: 15px; font-weight: 800; color: #00E5FF; margin-top: 2px; display: flex; align-items: center; gap: 6px;">
                <span>${activeLoc.label || `${activeLoc.district}, ${activeLoc.city}`}</span>
                ${activeLoc.isRealGps ? '<span style="font-size: 9.5px; background: rgba(0,229,255,0.2); color: #00E5FF; padding: 1px 5px; border-radius: 4px; font-weight: 800;">GPS AKTİF</span>' : ''}
              </div>
            </div>
            <div style="color: var(--color-kor);">${icons.target(22)}</div>
          </div>

          <!-- 2. CITY SELECTION -->
          <div style="margin-bottom: 16px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.pin(15)} <span>Şehir / İl Seç</span>
            </label>
            <select id="select-modal-city" style="width: 100%; padding: 12px 14px; background: var(--bg-surface-elevated); border: 1.5px solid var(--border-glass); border-radius: 12px; color: #FFF; font-size: 13.5px; font-weight: 600; outline: none;">
              ${TURKEY_PROVINCES.map(p => `
                <option value="${p.city}" ${selectedCity.toLowerCase() === p.city.toLowerCase() ? 'selected' : ''}>
                  ${p.city}
                </option>
              `).join('')}
            </select>
          </div>

          <!-- 3. DISTRICT SELECTION -->
          <div style="margin-bottom: 18px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              ${icons.target(15)} <span>İlçe / Bölge Seç</span>
            </label>
            <select id="select-modal-district" style="width: 100%; padding: 12px 14px; background: var(--bg-surface-elevated); border: 1.5px solid var(--border-glass); border-radius: 12px; color: #FFF; font-size: 13.5px; font-weight: 600; outline: none;">
              ${districts.map(d => `
                <option value="${d.name}" ${selectedDistrict.toLowerCase() === d.name.toLowerCase() ? 'selected' : ''}>
                  ${d.name} ${d.isDefault ? '· Merkez' : ''}
                </option>
              `).join('')}
            </select>
          </div>

          <!-- 4. SEARCH RADIUS SELECTION -->
          <div style="margin-bottom: 22px;">
            <label style="font-size: 13px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="6"></circle>
                <circle cx="12" cy="12" r="2"></circle>
              </svg>
              <span>Arama Yarıçapı / Mesafe Sınırı</span>
            </label>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
              ${[
                { val: "10", label: "10 km (Yakın Çevre)" },
                { val: "25", label: "25 km (İlçe Çevresi)" },
                { val: "35", label: "35 km (Şehir Geneli - Önerilen)" },
                { val: "75", label: "75 km (Bölgesel / Komşu İller)" },
                { val: "all", label: "Tüm Türkiye (Sınırsız)" }
              ].map(opt => `
                <button type="button" class="btn-radius-pill ${selectedRadius === opt.val ? 'active' : ''}" data-val="${opt.val}"
                  style="grid-column: ${opt.val === 'all' ? 'span 2' : 'span 1'}; padding: 11px 12px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1.5px solid ${selectedRadius === opt.val ? '#00E5FF' : 'var(--border-glass)'}; background: ${selectedRadius === opt.val ? 'rgba(0, 229, 255, 0.16)' : 'var(--bg-surface-elevated)'}; color: ${selectedRadius === opt.val ? '#00E5FF' : '#FFF'}; text-align: center; transition: all 0.2s ease;">
                  ${opt.label}
                </button>
              `).join('')}
            </div>
            <p style="font-size: 11px; color: var(--text-secondary); margin: 8px 0 0 2px;">
              Belirlediğin yarıçap dışındaki (örn. Çorlu'dayken İzmir/Bursa gibi) sporcular filtrelenir ve gösterilmez.
            </p>
          </div>
        </div>

        <!-- BUTTONS -->
        <div style="display: flex; gap: 10px; margin-top: 14px;">
          <button class="btn-ghost" id="btn-cancel-location-modal" style="padding: 13px 16px; color: var(--text-secondary); font-size: 13.5px; font-weight: 700;">
            Vazgeç
          </button>
          <button class="btn-kor" id="btn-save-location-modal" style="flex: 1; padding: 13px; font-size: 14px; font-weight: 800;">
            Konumu ve Yarıçapı Kaydet
          </button>
        </div>
      </div>
    `;

    modalOverlay.classList.add("open");

    // Close handlers
    const close = () => {
      modalOverlay.classList.remove("open");
    };
    document.getElementById("btn-close-location-modal")?.addEventListener("click", close);
    document.getElementById("btn-cancel-location-modal")?.addEventListener("click", close);

    // City dropdown change
    document.getElementById("select-modal-city")?.addEventListener("change", (e) => {
      selectedCity = e.target.value;
      const newDistricts = getDistrictsForCity(selectedCity);
      selectedDistrict = newDistricts[0]?.name || selectedCity;
      render();
    });

    // District dropdown change
    document.getElementById("select-modal-district")?.addEventListener("change", (e) => {
      selectedDistrict = e.target.value;
    });

    // Radius pill clicks
    modalOverlay.querySelectorAll(".btn-radius-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedRadius = btn.dataset.val;
        modalOverlay.querySelectorAll(".btn-radius-pill").forEach(b => {
          const isAct = b.dataset.val === selectedRadius;
          b.style.borderColor = isAct ? '#00E5FF' : 'var(--border-glass)';
          b.style.background = isAct ? 'rgba(0, 229, 255, 0.16)' : 'var(--bg-surface-elevated)';
          b.style.color = isAct ? '#00E5FF' : '#FFF';
        });
      });
    });

    // Detect GPS click
    document.getElementById("btn-detect-live-gps")?.addEventListener("click", async () => {
      isGpsLoading = true;
      render();

      try {
        const coords = await locationService.getCurrentPosition();
        if (coords && coords.latitude) {
          // Attempt reverse geocoding via OpenStreetMap / Nominatim
          try {
            const geo = await gymPlacesService.getDistrictFromCoords(coords.latitude, coords.longitude);
            if (geo && geo.city) {
              selectedCity = geo.city;
              selectedDistrict = geo.district || selectedDistrict;
            }
          } catch (e) {}

          const nearest = locationService.findNearestDistrict(coords.latitude, coords.longitude);
          if (nearest) {
            selectedCity = nearest.city;
            selectedDistrict = nearest.district;
          }

          locationService.setActiveLocation({
            city: selectedCity,
            district: selectedDistrict,
            lat: coords.latitude,
            lng: coords.longitude,
            isRealGps: true,
            label: `${selectedDistrict}, ${selectedCity} (GPS)`
          });

          notify.success(`📍 Harita konumu algılandı: ${selectedDistrict}, ${selectedCity}!`);
          close();
          onLocationChanged?.(selectedRadius);
          return;
        }
      } catch (err) {
        notify.warning("GPS sinyali alınamadı, lütfen şehri listeden seçin.");
      } finally {
        isGpsLoading = false;
        render();
      }
    });

    // Save location & radius
    document.getElementById("btn-save-location-modal")?.addEventListener("click", () => {
      const districtsList = getDistrictsForCity(selectedCity);
      const matched = districtsList.find(d => d.name.toLowerCase() === selectedDistrict.toLowerCase());
      const lat = matched ? matched.lat : 41.1603;
      const lng = matched ? matched.lng : 27.7989;

      locationService.setActiveLocation({
        city: selectedCity,
        district: selectedDistrict,
        lat: lat,
        lng: lng,
        isRealGps: false,
        label: `${selectedDistrict}, ${selectedCity}`
      });

      notify.success(`📍 Konum güncellendi: ${selectedDistrict}, ${selectedCity}`);
      close();
      onLocationChanged?.(selectedRadius);
    });
  }

  render();
}
