/**
 * Veyro - Real Geolocation & Distance Engine
 * Computes exact GPS coordinates, Haversine distances, sorts nearby gyms,
 * and handles geofencing for gym check-in verification.
 */

// Haversine formula to calculate distance in meters between two lat/lng points
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
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

class LocationService {
  constructor() {
    // Default reference location: Kadıköy Moda, İstanbul (40.9875, 29.0280)
    this.currentCoords = {
      latitude: 40.9875,
      longitude: 29.0280,
      accuracy: 15,
      isRealGps: false
    };
  }

  /**
   * Acquire real device GPS position
   */
  async getCurrentPosition() {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) {
        console.warn("Geolocation not supported by device, using reference coordinates.");
        resolve(this.currentCoords);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.currentCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            isRealGps: true
          };
          resolve(this.currentCoords);
        },
        (err) => {
          console.warn("GPS access denied or unavailable, using active city coordinates.", err.message);
          resolve(this.currentCoords);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    });
  }

  /**
   * Alias for getCurrentPosition to prevent method name confusion
   */
  async getCurrentCoords() {
    return this.getCurrentPosition();
  }

  /**
   * Sorts gym list by real proximity to user coordinates
   */
  sortGymsByDistance(gyms, userCoords = this.currentCoords) {
    return gyms.map(gym => {
      const distance = calculateDistanceMeters(
        userCoords.latitude,
        userCoords.longitude,
        gym.lat || 40.9902,
        gym.lng || 29.0298
      );
      return {
        ...gym,
        distanceMeters: distance,
        distanceText: distance < 1000 ? `${distance} m` : `${(distance / 1000).toFixed(1)} km`
      };
    }).sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * Geofencing validation: Checks if user is physically within gym radius (e.g., 300 meters)
   */
  isWithinGymGeofence(gym, userCoords = this.currentCoords, radiusMeters = 350) {
    const distance = calculateDistanceMeters(
      userCoords.latitude,
      userCoords.longitude,
      gym.lat || 40.9902,
      gym.lng || 29.0298
    );
    return {
      isInside: distance <= radiusMeters,
      distanceMeters: distance
    };
  }
}

export const locationService = new LocationService();
