/**
 * Veyro - Live Gym Places Service (Doğrudan Haritadan / Maps'ten Canlı Salon Listeleme)
 * Sıfır Statik Salon Kuralı: Salonlar kod içine elle yazılmaz, doğrudan Maps API'den canlı çekilir.
 * 1. Google Places API (Admin panelinde API anahtarı girildiğinde)
 * 2. Canlı OpenStreetMap / Nominatim Places Geocoding Motoru (Sıfır konfigürasyon, anlık canlı veri)
 */

import { getGatewayConfig } from './gatewayConfig.js';
import { calculateDistanceMeters } from './location.js';

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
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        { headers: { 'User-Agent': 'VeyroFitnessApp/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const district = data.address?.suburb || data.address?.district || data.address?.town || data.address?.city || "Kadıköy";
        const city = data.address?.city || data.address?.province || "İstanbul";
        this.reverseGeocodeCache = { district, city };
        return this.reverseGeocodeCache;
      }
    } catch (e) {
      console.warn("Reverse geocode failed, using Kadıköy:", e.message);
    }
    return { district: "Kadıköy", city: "İstanbul" };
  }

  /**
   * Fetch gyms directly from Maps based on user's live GPS coordinates
   */
  async fetchNearbyGymsFromMaps(userCoords, radiusMeters = 5000) {
    const lat = userCoords?.latitude || 40.9875;
    const lng = userCoords?.longitude || 29.0280;
    const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const config = getGatewayConfig();
    const googleApiKey = config.maps?.googleMapsApiKey?.trim();

    // 1. If Google Places API is active with a real key
    if (googleApiKey && window.google?.maps?.places) {
      try {
        const googleGyms = await this.fetchFromGooglePlaces(lat, lng, radiusMeters);
        if (googleGyms && googleGyms.length > 0) {
          const sorted = this.formatAndSort(googleGyms, lat, lng);
          this.cache.set(cacheKey, sorted);
          return sorted;
        }
      } catch (e) {
        console.warn("Google Places fetch error, falling back to Live Maps Search:", e);
      }
    }

    // 2. Live Maps Places Search directly from Maps Geocoding & POI API
    try {
      const geo = await this.getDistrictFromCoords(lat, lng);
      const queryDistrict = geo.district || "Kadıköy";
      const queryCity = geo.city || "İstanbul";

      // Query live Maps for gyms and fitness clubs in the user's actual district
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent('fitness gym ' + queryDistrict + ' ' + queryCity)}&limit=15&addressdetails=1`;
      
      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'VeyroFitnessApp/1.0' }
      });

      if (res.ok) {
        let places = await res.json();
        
        // If specific district returned few, expand search query to city level
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

        const formatted = places.map((item, idx) => {
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

        // Deduplicate by name
        const uniqueGyms = [];
        const seenNames = new Set();
        for (const g of formatted) {
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
    } catch (err) {
      console.error("Live Maps gym fetch error:", err);
    }

    return [];
  }

  /**
   * Live search on Maps when user types in the search field
   */
  async searchGymsOnMaps(query, userCoords) {
    if (!query || query.trim().length < 2) {
      return this.fetchNearbyGymsFromMaps(userCoords);
    }

    const lat = userCoords?.latitude || 40.9875;
    const lng = userCoords?.longitude || 29.0280;
    const cleanQuery = query.trim();

    const config = getGatewayConfig();
    const googleApiKey = config.maps?.googleMapsApiKey?.trim();

    // 1. Google Places search if active
    if (googleApiKey && window.google?.maps?.places) {
      try {
        const googleResults = await this.searchGooglePlaces(cleanQuery, lat, lng);
        if (googleResults && googleResults.length > 0) {
          return this.formatAndSort(googleResults, lat, lng);
        }
      } catch (e) {
        console.warn("Google Places textSearch error:", e);
      }
    }

    // 2. Direct Live Maps POI query
    try {
      const searchUrl1 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=12&addressdetails=1`;
      const res = await fetch(searchUrl1, {
        headers: { 'User-Agent': 'VeyroFitnessApp/1.0' }
      });

      let places = [];
      if (res.ok) {
        places = await res.json();
      }

      // If exact query returned few, expand search query with fitness context
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

      const formatted = places.map((item, idx) => {
        const cleanName = item.name || item.display_name.split(',')[0].trim();
        const cleanDistrict = item.address?.suburb || item.address?.neighbourhood || item.address?.district || "İstanbul";
        const cleanCity = item.address?.city || item.address?.province || "Türkiye";

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
    } catch (e) {
      console.warn("Direct search on Maps failed:", e);
    }

    return [];
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
              district: place.vicinity || place.formatted_address?.split(',')[0] || "İstanbul",
              city: "İstanbul",
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
              district: place.vicinity || "İstanbul",
              city: "İstanbul",
              lat: place.geometry?.location?.lat() || lat,
              lng: place.geometry?.location?.lng() || lng,
              address: place.vicinity || "",
              rating: place.rating || 4.8,
              source: "google_places"
            }));
            resolve(gyms);
          } else {
            reject(new Error("Google Places status: " + status));
          }
        }
      );
    });
  }
}

export const gymPlacesService = new GymPlacesService();
