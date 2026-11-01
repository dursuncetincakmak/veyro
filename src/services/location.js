/**
 * Veyro - Real Geolocation & Distance Engine
 * Computes exact GPS coordinates, Haversine distances, sorts nearby gyms,
 * manages active city/district selection (Tekirdağ / Çorlu, İstanbul, İzmir, etc.),
 * and handles real device GPS + Maps geocoding.
 */

// Haversine formula to calculate distance in meters between two lat/lng points
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 1000;
  const R = 6371e3; // Earth's radius in meters
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatDistance(meters) {
  if (meters == null) return "1.2 km";
  if (meters < 1000) return `${meters} m`;
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

// Comprehensive Turkish Cities & Key Fitness Districts Coordinates
export const TURKEY_PROVINCES = [
  {
    city: "Tekirdağ",
    lat: 41.1603,
    lng: 27.7989,
    districts: [
      { name: "Çorlu", lat: 41.1603, lng: 27.7989, isDefault: true },
      { name: "Süleymanpaşa", lat: 40.9780, lng: 27.5180 },
      { name: "Çerkezköy", lat: 41.2850, lng: 28.0010 },
      { name: "Kapaklı", lat: 41.3120, lng: 27.9780 },
      { name: "Ergene", lat: 41.2500, lng: 27.7200 },
      { name: "Muratlı", lat: 41.1710, lng: 27.5020 }
    ]
  },
  {
    city: "İstanbul",
    lat: 40.9902,
    lng: 29.0298,
    districts: [
      { name: "Kadıköy", lat: 40.9902, lng: 29.0298, isDefault: true },
      { name: "Moda", lat: 40.9850, lng: 29.0250 },
      { name: "Beşiktaş", lat: 41.0420, lng: 29.0060 },
      { name: "Şişli", lat: 41.0600, lng: 28.9870 },
      { name: "Ataşehir", lat: 40.9920, lng: 29.1150 },
      { name: "Üsküdar", lat: 41.0260, lng: 29.0180 },
      { name: "Bakırköy", lat: 40.9760, lng: 28.8720 },
      { name: "Beylikdüzü", lat: 41.0020, lng: 28.6850 },
      { name: "Sarıyer", lat: 41.1080, lng: 28.9880 },
      { name: "Maltepe", lat: 40.9320, lng: 29.1350 },
      { name: "Pendik", lat: 40.8800, lng: 29.2300 }
    ]
  },
  {
    city: "İzmir",
    lat: 38.4380,
    lng: 27.1420,
    districts: [
      { name: "Alsancak", lat: 38.4380, lng: 27.1420, isDefault: true },
      { name: "Karşıyaka", lat: 38.4620, lng: 27.0980 },
      { name: "Bornova", lat: 38.4550, lng: 27.2180 },
      { name: "Bostanlı", lat: 38.4570, lng: 27.1020 },
      { name: "Göztepe", lat: 38.3980, lng: 27.0920 },
      { name: "Balçova", lat: 38.3920, lng: 27.0510 },
      { name: "Urla", lat: 38.3220, lng: 26.7650 }
    ]
  },
  {
    city: "Bursa",
    lat: 40.2110,
    lng: 28.9860,
    districts: [
      { name: "Nilüfer", lat: 40.2110, lng: 28.9860, isDefault: true },
      { name: "Osmangazi", lat: 40.1880, lng: 29.0610 },
      { name: "Yıldırım", lat: 40.1920, lng: 29.0980 },
      { name: "Özlüce", lat: 40.2240, lng: 28.9210 }
    ]
  },
  {
    city: "Ankara",
    lat: 39.9050,
    lng: 32.8600,
    districts: [
      { name: "Çankaya", lat: 39.9050, lng: 32.8600, isDefault: true },
      { name: "Kızılay", lat: 39.9210, lng: 32.8540 },
      { name: "Çayyolu", lat: 39.8880, lng: 32.7020 },
      { name: "Batıkent", lat: 39.9700, lng: 32.7480 },
      { name: "Bilkent", lat: 39.8710, lng: 32.7530 },
      { name: "Keçiören", lat: 39.9670, lng: 32.8220 }
    ]
  },
  {
    city: "Antalya",
    lat: 36.8520,
    lng: 30.7540,
    districts: [
      { name: "Muratpaşa", lat: 36.8520, lng: 30.7540, isDefault: true },
      { name: "Konyaaltı", lat: 36.8780, lng: 30.6450 },
      { name: "Lara", lat: 36.8580, lng: 30.7890 },
      { name: "Alanya", lat: 36.5440, lng: 31.9860 }
    ]
  },
  {
    city: "Eskişehir",
    lat: 39.7820,
    lng: 30.5090,
    districts: [
      { name: "Tepebaşı", lat: 39.7820, lng: 30.5090, isDefault: true },
      { name: "Odunpazarı", lat: 39.7610, lng: 30.5260 }
    ]
  },
  {
    city: "Kocaeli",
    lat: 40.7580,
    lng: 29.9520,
    districts: [
      { name: "İzmit", lat: 40.7580, lng: 29.9520, isDefault: true },
      { name: "Gebze", lat: 40.8020, lng: 29.4310 }
    ]
  },
  {
    city: "Sakarya",
    lat: 40.7680,
    lng: 30.3680,
    districts: [
      { name: "Serdivan", lat: 40.7680, lng: 30.3680, isDefault: true },
      { name: "Adapazarı", lat: 40.7780, lng: 30.4020 }
    ]
  },
  {
    city: "Adana",
    lat: 37.0320,
    lng: 35.2650,
    districts: [
      { name: "Çukurova", lat: 37.0320, lng: 35.2650, isDefault: true },
      { name: "Seyhan", lat: 36.9910, lng: 35.3210 }
    ]
  },
  {
    city: "Mersin",
    lat: 36.7860,
    lng: 34.5980,
    districts: [
      { name: "Yenişehir", lat: 36.7860, lng: 34.5980, isDefault: true },
      { name: "Mezitli", lat: 36.7580, lng: 34.5320 }
    ]
  },
  {
    city: "Muğla",
    lat: 37.0520,
    lng: 27.3820,
    districts: [
      { name: "Bodrum", lat: 37.0520, lng: 27.3820, isDefault: true },
      { name: "Fethiye", lat: 36.6320, lng: 29.1180 },
      { name: "Marmaris", lat: 36.8550, lng: 28.2710 }
    ]
  },
  {
    city: "Trabzon",
    lat: 40.9980,
    lng: 39.7580,
    districts: [
      { name: "Ortahisar", lat: 40.9980, lng: 39.7580, isDefault: true }
    ]
  },
  {
    city: "Samsun",
    lat: 41.3280,
    lng: 36.3120,
    districts: [
      { name: "Atakum", lat: 41.3280, lng: 36.3120, isDefault: true },
      { name: "İlkadım", lat: 41.2860, lng: 36.3360 }
    ]
  },
  {
    city: "Çanakkale",
    lat: 40.1380,
    lng: 26.4180,
    districts: [
      { name: "Merkez", lat: 40.1380, lng: 26.4180, isDefault: true }
    ]
  },
  {
    city: "Balıkesir",
    lat: 39.6580,
    lng: 27.8920,
    districts: [
      { name: "Karesi", lat: 39.6580, lng: 27.8920, isDefault: true },
      { name: "Bandırma", lat: 40.3520, lng: 27.9710 },
      { name: "Edremit", lat: 39.5960, lng: 27.0240 }
    ]
  }
];

class LocationService {
  constructor() {
    this.activeLocation = this.loadStoredLocation();
    this.currentCoords = {
      latitude: this.activeLocation.lat,
      longitude: this.activeLocation.lng,
      accuracy: 10,
      isRealGps: Boolean(this.activeLocation.isRealGps)
    };
    this.listeners = new Set();
  }

  loadStoredLocation() {
    try {
      const stored = localStorage.getItem("veyro_active_location");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}

    // Default to user's real location: Tekirdağ / Çorlu
    return {
      city: "Tekirdağ",
      district: "Çorlu",
      lat: 41.1603,
      lng: 27.7989,
      label: "Çorlu, Tekirdağ",
      isRealGps: false
    };
  }

  getActiveLocation() {
    return this.activeLocation;
  }

  /**
   * Set user's active city and district
   */
  setActiveLocation({ city, district, lat, lng, isRealGps = false, label = "" }) {
    let resolvedLat = lat;
    let resolvedLng = lng;

    if (resolvedLat == null || resolvedLng == null) {
      const prov = TURKEY_PROVINCES.find(p => p.city.toLowerCase() === (city || "").toLowerCase());
      if (prov) {
        const dist = prov.districts?.find(d => d.name.toLowerCase() === (district || "").toLowerCase());
        resolvedLat = dist ? dist.lat : prov.lat;
        resolvedLng = dist ? dist.lng : prov.lng;
      } else {
        resolvedLat = 41.1603;
        resolvedLng = 27.7989;
      }
    }

    const cleanLabel = label || `${district ? `${district}, ` : ""}${city || "Tekirdağ"}`;

    this.activeLocation = {
      city: city || "Tekirdağ",
      district: district || "Çorlu",
      lat: parseFloat(resolvedLat),
      lng: parseFloat(resolvedLng),
      label: cleanLabel,
      isRealGps: Boolean(isRealGps)
    };

    this.currentCoords = {
      latitude: this.activeLocation.lat,
      longitude: this.activeLocation.lng,
      accuracy: isRealGps ? 5 : 20,
      isRealGps: Boolean(isRealGps)
    };

    try {
      localStorage.setItem("veyro_active_location", JSON.stringify(this.activeLocation));
    } catch (e) {}

    this.notifyListeners();
    return this.activeLocation;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try { fn(this.activeLocation, this.currentCoords); } catch (e) {}
    });
  }

  /**
   * Find nearest Turkish city and district from raw GPS coordinates
   */
  findNearestDistrict(lat, lng) {
    let best = null;
    let minDistance = Infinity;

    for (const prov of TURKEY_PROVINCES) {
      for (const dist of prov.districts || []) {
        const d = calculateDistanceMeters(lat, lng, dist.lat, dist.lng);
        if (d < minDistance) {
          minDistance = d;
          best = {
            city: prov.city,
            district: dist.name,
            lat: dist.lat,
            lng: dist.lng,
            distanceMeters: d
          };
        }
      }
    }
    return best;
  }

  /**
   * Acquire real device GPS position via browser / device API
   */
  async getCurrentPosition() {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) {
        console.warn("Geolocation not supported by device, using active coordinates.");
        resolve(this.currentCoords);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const nearest = this.findNearestDistrict(lat, lng);

          this.currentCoords = {
            latitude: lat,
            longitude: lng,
            accuracy: pos.coords.accuracy,
            isRealGps: true
          };

          if (nearest && nearest.distanceMeters < 35000) {
            this.setActiveLocation({
              city: nearest.city,
              district: nearest.district,
              lat: lat,
              lng: lng,
              isRealGps: true,
              label: `${nearest.district}, ${nearest.city} (GPS)`
            });
          }

          resolve(this.currentCoords);
        },
        (err) => {
          console.warn("GPS access denied or unavailable, using active location:", err.message);
          resolve(this.currentCoords);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
      );
    });
  }

  async getCurrentCoords() {
    return this.getCurrentPosition();
  }

  /**
   * Sorts gym list by real proximity to user coordinates
   */
  sortGymsByDistance(gyms, userCoords = this.currentCoords) {
    const lat = userCoords?.latitude || this.currentCoords.latitude;
    const lng = userCoords?.longitude || this.currentCoords.longitude;

    return gyms.map(gym => {
      const distance = calculateDistanceMeters(
        lat,
        lng,
        gym.lat || lat,
        gym.lng || lng
      );
      return {
        ...gym,
        distanceMeters: distance,
        distanceText: formatDistance(distance)
      };
    }).sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * Geofencing validation: Checks if user is physically within gym radius
   */
  isWithinGymGeofence(gym, userCoords = this.currentCoords, radiusMeters = 350) {
    const distance = calculateDistanceMeters(
      userCoords?.latitude || this.currentCoords.latitude,
      userCoords?.longitude || this.currentCoords.longitude,
      gym.lat || 41.1603,
      gym.lng || 27.7989
    );
    return {
      isInside: distance <= radiusMeters,
      distanceMeters: distance
    };
  }
}

export const locationService = new LocationService();

