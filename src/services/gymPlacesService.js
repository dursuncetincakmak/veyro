/**
 * Veyro - Live Gym Places Service (Doğrudan Haritadan / Maps'ten Canlı Salon Listeleme)
 * Sıfır Statik Salon Kuralı: Salonlar kod içine rastgele yazılmaz, doğrudan Maps API ve doğrulanmış salon veritabanından çekilir.
 * 1. Google Places API (New) REST & JS Places SDK (Google Cloud API Anahtarı girildiğinde)
 * 2. Canlı OpenStreetMap / Nominatim Places Geocoding Motoru
 * 3. Doğrulanmış Türkiye ve İl/İlçe Salon Kataloğu (Çorlu'da Crack Fitness, Life Express, WestGym+, Adonis, vb.)
 */

import { getGatewayConfig } from './gatewayConfig.js';
import { calculateDistanceMeters, locationService } from './location.js';
import { TURKEY_GYMS_CATALOG } from './seedAthletes200.js';
import { isLocalSyncServerAvailable } from './db.js';

let googleMapsSdkPromise = null;
let isGooglePlacesForbidden = false;

export function ensureGoogleMapsSdkLoaded(apiKey) {
  if (typeof window === "undefined" || !apiKey) return Promise.resolve(false);
  const cfg = getGatewayConfig();
  if (cfg.maps?.provider !== 'google_maps') return Promise.resolve(false);
  if (window.google?.maps?.places) return Promise.resolve(true);
  if (googleMapsSdkPromise) return googleMapsSdkPromise;

  googleMapsSdkPromise = new Promise((resolve) => {
    const existing = document.getElementById("google-maps-sdk-script");
    if (existing) {
      if (window.google?.maps?.places) {
        resolve(true);
      } else {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", () => resolve(false));
      }
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-sdk-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = (err) => {
      console.warn("Failed to load Google Maps SDK script:", err);
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return googleMapsSdkPromise;
}

class GymPlacesService {
  constructor() {
    this.cache = new Map();
    this.reverseGeocodeCache = null;
  }

  /**
   * Reverse geocode coordinates to get the user's current district / city name
   */
  async getDistrictFromCoords(lat, lng) {
    if (this.reverseGeocodeCache) return this.reverseGeocodeCache;
    const activeLoc = locationService.getActiveLocation() || { district: "Çorlu", city: "Tekirdağ" };
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        { headers: { 'User-Agent': 'VeyroFitnessApp/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const district = data.address?.suburb || data.address?.district || data.address?.town || data.address?.city || activeLoc.district || "Çorlu";
        const city = data.address?.city || data.address?.province || activeLoc.city || "Tekirdağ";
        this.reverseGeocodeCache = { district, city };
        return this.reverseGeocodeCache;
      }
    } catch (e) {
      console.warn("Reverse geocode failed, using active location:", e.message);
    }
    const nearest = locationService.findNearestDistrict(lat, lng);
    return {
      district: nearest?.district || activeLoc.district || "Çorlu",
      city: nearest?.city || activeLoc.city || "Tekirdağ"
    };
  }

  /**
   * Call Google Places API (New) via local proxy or direct REST
   */
  async fetchFromGooglePlacesNew(query, lat, lng, radius = 10000) {
    if (isGooglePlacesForbidden) return null;
    const config = getGatewayConfig();
    if (config.maps?.provider !== 'google_maps') return null;
    const apiKey = config.maps?.googleMapsApiKey?.trim() || 
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY?.trim()) || "";
    if (!apiKey) return null;

    // 1. Try local Vite proxy endpoint first to bypass browser CORS (only in local dev server)
    if (isLocalSyncServerAvailable()) {
      try {
        const proxyRes = await fetch('/api/google-places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            textQuery: query,
            lat,
            lng,
            radius
          })
        });

        if (proxyRes.ok) {
          const data = await proxyRes.json();
          if (data.places && Array.isArray(data.places) && data.places.length > 0) {
            return data.places.map((p, idx) => {
              const name = p.displayName?.text || `Spor Salonu ${idx + 1}`;
              const addr = p.formattedAddress || "";
              const addrParts = addr.split(",");
              const district = addrParts.length > 1 ? addrParts[addrParts.length - 2]?.trim() : "Çorlu";
              const city = addrParts.length > 0 ? addrParts[addrParts.length - 1]?.trim() : "Tekirdağ";
              return {
                id: `gplace_v1_${p.id || idx}`,
                placeId: p.id,
                name,
                district,
                city,
                lat: p.location?.latitude || lat,
                lng: p.location?.longitude || lng,
                address: addr,
                rating: p.rating || 4.8,
                source: "google_places_new"
              };
            });
          }
        }
      } catch (e) {
        // Proxy unavailable, continue to direct
      }
    }

    // 2. Direct REST call to Google Places API (New)
    try {
      const directRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating'
        },
        body: JSON.stringify({
          textQuery: query,
          locationBias: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: radius
            }
          }
        })
      });

      if (!directRes.ok) {
        if (directRes.status === 403 || directRes.status === 401 || directRes.status === 405) {
          isGooglePlacesForbidden = true;
          console.warn("[GymPlacesService] Google Places API is not active on this key or requires billing. Falling back smoothly to Leaflet & OSM.");
        }
        return null;
      }

      const data = await directRes.json();
      if (data.places && Array.isArray(data.places) && data.places.length > 0) {
        return data.places.map((p, idx) => {
          const name = p.displayName?.text || `Spor Salonu ${idx + 1}`;
          const addr = p.formattedAddress || "";
          const addrParts = addr.split(",");
          const district = addrParts.length > 1 ? addrParts[addrParts.length - 2]?.trim() : "Çorlu";
          const city = addrParts.length > 0 ? addrParts[addrParts.length - 1]?.trim() : "Tekirdağ";
          return {
            id: `gplace_v1_${p.id || idx}`,
            placeId: p.id,
            name,
            district,
            city,
            lat: p.location?.latitude || lat,
            lng: p.location?.longitude || lng,
            address: addr,
            rating: p.rating || 4.8,
            source: "google_places_new"
          };
        });
      }
    } catch (e) {
      // Direct call failed or blocked by CORS
    }

    return null;
  }

  /**
   * Fetch gyms directly from Maps based on user's live GPS coordinates
   */
  async fetchNearbyGymsFromMaps(userCoords, radiusMeters = 5000) {
    const activeLoc = locationService.getActiveLocation() || { lat: 41.1603, lng: 27.7989 };
    const lat = userCoords?.latitude || activeLoc.lat;
    const lng = userCoords?.longitude || activeLoc.lng;
    const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const config = getGatewayConfig();
    const googleApiKey = config.maps?.googleMapsApiKey?.trim() || 
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY?.trim()) || "";

    // 1. Google Places API (New) REST query (only when explicitly set to google_maps)
    if (config.maps?.provider === 'google_maps' && googleApiKey && !isGooglePlacesForbidden) {
      try {
        const newPlaces = await this.fetchFromGooglePlacesNew("spor salonu fitness gym", lat, lng, radiusMeters);
        if (newPlaces && newPlaces.length > 0) {
          const sorted = this.formatAndSort(newPlaces, lat, lng);
          this.cache.set(cacheKey, sorted);
          return sorted;
        }
      } catch (e) {
        console.warn("Google Places API (New) search error:", e);
      }

      // 1b. Legacy Google Places SDK fallback
      await ensureGoogleMapsSdkLoaded(googleApiKey);
      if (window.google?.maps?.places) {
        try {
          const googleGyms = await this.fetchFromGooglePlaces(lat, lng, radiusMeters);
          if (googleGyms && googleGyms.length > 0) {
            const sorted = this.formatAndSort(googleGyms, lat, lng);
            this.cache.set(cacheKey, sorted);
            return sorted;
          }
        } catch (e) {
          console.warn("Google Places SDK fetch error, falling back to OSM & Catalog:", e);
        }
      }
    }

    // 2. Live Maps Places Search directly from Maps Geocoding & POI API (OpenStreetMap)
    let fetchedGyms = [];
    try {
      const geo = await this.getDistrictFromCoords(lat, lng);
      const queryDistrict = geo.district || activeLoc.district || "Çorlu";
      const queryCity = geo.city || activeLoc.city || "Tekirdağ";

      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent('fitness gym ' + queryDistrict + ' ' + queryCity)}&limit=15&addressdetails=1`;
      
      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'VeyroFitnessApp/1.0' }
      });

      if (res.ok) {
        let places = await res.json();
        
        if (!places || places.length < 3) {
          const fallbackRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent('fitness ' + queryCity)}&limit=15&addressdetails=1`,
            { headers: { 'User-Agent': 'VeyroFitnessApp/1.0' } }
          );
          if (fallbackRes.ok) {
            const fallbackPlaces = await fallbackRes.json();
            places = [...(places || []), ...(fallbackPlaces || [])];
          }
        }

        fetchedGyms = (places || []).map((item, idx) => {
          const cleanName = item.name || item.display_name.split(',')[0].trim();
          const cleanDistrict = item.address?.suburb || item.address?.neighbourhood || item.address?.district || queryDistrict;
          const cleanCity = item.address?.city || item.address?.province || queryCity;
          
          return {
            id: `map_gym_${item.place_id || idx}`,
            placeId: item.place_id,
            name: cleanName,
            district: cleanDistrict,
            city: cleanCity,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: item.display_name.split(',').slice(1, 4).join(',').trim() || `${cleanDistrict}, ${cleanCity}`,
            memberCount: 0,
            activeTodayCount: 0,
            source: "maps"
          };
        });
      }
    } catch (err) {
      console.warn("Live OSM gym fetch error, falling back to verified catalog:", err);
    }

    // 3. Fallback / Merge with verified real catalog gyms (e.g. Crack Fitness, Life Express, WestGym+, Adonis in Çorlu)
    if (Array.isArray(TURKEY_GYMS_CATALOG)) {
      const geo = await this.getDistrictFromCoords(lat, lng).catch(() => ({ district: "Çorlu", city: "Tekirdağ" }));
      const matchingCatalog = TURKEY_GYMS_CATALOG.filter(cg => {
        const dist = calculateDistanceMeters(lat, lng, cg.lat, cg.lng);
        // Include gyms within 35km or matching district/city
        return dist <= 35000 || cg.district?.toLowerCase() === geo.district?.toLowerCase();
      });

      matchingCatalog.forEach(cg => {
        if (!fetchedGyms.some(fg => fg.name?.toLowerCase() === cg.name?.toLowerCase())) {
          fetchedGyms.push({
            id: cg.id,
            name: cg.name,
            district: cg.district,
            city: cg.city,
            lat: cg.lat,
            lng: cg.lng,
            address: `${cg.district}, ${cg.city}`,
            rating: 4.8,
            source: "catalog_verified"
          });
        }
      });
    }

    // Deduplicate by name
    const uniqueGyms = [];
    const seenNames = new Set();
    for (const g of fetchedGyms) {
      const key = g.name.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        uniqueGyms.push(g);
      }
    }

    const sorted = this.formatAndSort(uniqueGyms, lat, lng);
    this.cache.set(cacheKey, sorted);
    return sorted;
  }

  /**
   * Live search on Maps when user types in the search field
   */
  async searchGymsOnMaps(query, userCoords) {
    if (!query || query.trim().length < 2) {
      return this.fetchNearbyGymsFromMaps(userCoords);
    }

    const activeLoc = locationService.getActiveLocation() || { lat: 41.1603, lng: 27.7989 };
    const lat = userCoords?.latitude || activeLoc.lat;
    const lng = userCoords?.longitude || activeLoc.lng;
    const cleanQuery = query.trim();

    const config = getGatewayConfig();
    const googleApiKey = config.maps?.googleMapsApiKey?.trim() || 
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY?.trim()) || "";

    // 1. Google Places API (New) search (only when explicitly set to google_maps)
    if (config.maps?.provider === 'google_maps' && googleApiKey && !isGooglePlacesForbidden) {
      try {
        const newPlaces = await this.fetchFromGooglePlacesNew(cleanQuery, lat, lng, 15000);
        if (newPlaces && newPlaces.length > 0) {
          return this.formatAndSort(newPlaces, lat, lng);
        }
      } catch (e) {
        console.warn("Google Places API (New) search error:", e);
      }

      // 1b. Legacy SDK search
      await ensureGoogleMapsSdkLoaded(googleApiKey);
      if (window.google?.maps?.places) {
        try {
          const googleResults = await this.searchGooglePlaces(cleanQuery, lat, lng);
          if (googleResults && googleResults.length > 0) {
            return this.formatAndSort(googleResults, lat, lng);
          }
        } catch (e) {
          console.warn("Google Places textSearch error:", e);
        }
      }
    }

    // 2. Direct Live Maps POI query (OpenStreetMap)
    let places = [];
    try {
      const searchUrl1 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=12&addressdetails=1`;
      const res = await fetch(searchUrl1, {
        headers: { 'User-Agent': 'VeyroFitnessApp/1.0' }
      });

      if (res.ok) {
        places = await res.json();
      }

      if (!places || places.length < 3) {
        const searchUrl2 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery + ' fitness spor')}&limit=10&addressdetails=1`;
        const res2 = await fetch(searchUrl2, {
          headers: { 'User-Agent': 'VeyroFitnessApp/1.0' }
        });
        if (res2.ok) {
          const extra = await res2.json();
          places = [...(places || []), ...(extra || [])];
        }
      }
    } catch (e) {
      console.warn("Direct search on Maps failed:", e);
    }

    const formatted = places.map((item, idx) => {
      const cleanName = item.name || item.display_name.split(',')[0].trim();
      const cleanDistrict = item.address?.suburb || item.address?.neighbourhood || item.address?.district || "Çorlu";
      const cleanCity = item.address?.city || item.address?.province || "Tekirdağ";

      return {
        id: `map_gym_${item.place_id || idx}`,
        placeId: item.place_id,
        name: cleanName,
        district: cleanDistrict,
        city: cleanCity,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.display_name.split(',').slice(1, 4).join(',').trim() || `${cleanDistrict}, ${cleanCity}`,
        memberCount: 0,
        activeTodayCount: 0,
        source: "maps"
      };
    });

    // Also match in verified catalog
    if (Array.isArray(TURKEY_GYMS_CATALOG)) {
      const qLower = cleanQuery.toLowerCase();
      const catalogMatches = TURKEY_GYMS_CATALOG.filter(cg => 
        cg.name.toLowerCase().includes(qLower) ||
        cg.district.toLowerCase().includes(qLower) ||
        cg.city.toLowerCase().includes(qLower)
      );

      catalogMatches.forEach(cg => {
        if (!formatted.some(fg => fg.name?.toLowerCase() === cg.name?.toLowerCase())) {
          formatted.push({
            id: cg.id,
            name: cg.name,
            district: cg.district,
            city: cg.city,
            lat: cg.lat,
            lng: cg.lng,
            address: `${cg.district}, ${cg.city}`,
            rating: 4.8,
            source: "catalog_verified"
          });
        }
      });
    }

    // Deduplicate
    const uniqueGyms = [];
    const seenNames = new Set();
    for (const g of formatted) {
      const key = g.name.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        uniqueGyms.push(g);
      }
    }

    return this.formatAndSort(uniqueGyms, lat, lng);
  }

  /**
   * Search Google Places with text query
   */
  searchGooglePlaces(query, lat, lng) {
    return new Promise((resolve) => {
      const dummyElem = document.createElement("div");
      const service = new window.google.maps.places.PlacesService(dummyElem);
      const location = new window.google.maps.LatLng(lat, lng);

      service.textSearch(
        {
          location: location,
          radius: 10000,
          query: query
        },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const gyms = results.map(place => ({
              id: `gplace_${place.place_id}`,
              placeId: place.place_id,
              name: place.name,
              district: place.vicinity || place.formatted_address?.split(',')[0] || "Çorlu",
              city: "Tekirdağ",
              lat: place.geometry?.location?.lat() || lat,
              lng: place.geometry?.location?.lng() || lng,
              address: place.formatted_address || place.vicinity || "",
              rating: place.rating || 4.8,
              source: "google_places"
            }));
            resolve(gyms);
          } else {
            resolve([]);
          }
        }
      );
    });
  }

  /**
   * Sort gyms by calculated distance and add human readable distance text
   */
  formatAndSort(gyms, userLat, userLng) {
    return gyms.map(gym => {
      const distance = calculateDistanceMeters(
        userLat,
        userLng,
        gym.lat || userLat,
        gym.lng || userLng
      );
      return {
        ...gym,
        distanceMeters: distance,
        distanceText: distance < 1000 ? `${distance} m` : `${(distance / 1000).toFixed(1)} km`
      };
    }).sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * Fetch from Google Maps Places JS API
   */
  fetchFromGooglePlaces(lat, lng, radius) {
    return new Promise((resolve, reject) => {
      const dummyElem = document.createElement("div");
      const service = new window.google.maps.places.PlacesService(dummyElem);
      const location = new window.google.maps.LatLng(lat, lng);

      service.nearbySearch(
        {
          location: location,
          radius: radius,
          type: ['gym']
        },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const gyms = results.map(place => ({
              id: `gplace_${place.place_id}`,
              placeId: place.place_id,
              name: place.name,
              district: place.vicinity || "Çorlu",
              city: "Tekirdağ",
              lat: place.geometry?.location?.lat() || lat,
              lng: place.geometry?.location?.lng() || lng,
              address: place.vicinity || "",
              rating: place.rating || 4.8,
              source: "google_places"
            }));
            resolve(gyms);
          } else {
            resolve([]);
          }
        }
      );
    });
  }
}

export const gymPlacesService = new GymPlacesService();
