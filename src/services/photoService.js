
/**
 * Veyro - Profile Photo Management Service
 * Supports up to 8 photos per profile, canvas downscaling to ~60KB per image,
 * mandatory 3-photo registration verification, and curated athletic presets.
 */

// 8 Curated High-Quality Athletic/Fitness Photos for instant demo / rapid onboarding testing
const ATHLETIC_PHOTO_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80", // Athletic portrait
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=700&q=80", // Barbell gym workout
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=700&q=80", // Dumbbells / strength
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=700&q=80", // Athletic running / cardio
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=700&q=80", // Gym training / focus
  "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=700&q=80", // Pull-ups / back day
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=700&q=80", // Core / mobility / mat
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=700&q=80"  // Spotter / gym floor
];

export const photoService = {
  MIN_REQUIRED_PHOTOS: 3,
  MIN_PHOTOS: 3,
  MAX_ALLOWED_PHOTOS: 8,
  MAX_PHOTOS: 8,

  /**
   * Compresses user-uploaded image via an offscreen Canvas
   * Max 800px dimension and 0.76 JPEG quality (~45-75KB per photo).
   */
  compressPhoto(file, maxDim = 800, quality = 0.76) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("Lütfen geçerli bir resim dosyası seçin."));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Dosya okunamadı."));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Görsel yüklenemedi."));
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let w = img.width;
            let h = img.height;

            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }

            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, w, h);

            const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedDataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Alias for compressPhoto to ensure universal compatibility
   */
  compressImage(file, maxDim = 800, quality = 0.76) {
    return this.compressPhoto(file, maxDim, quality);
  },

  /**
   * Validate photo count for onboarding registration (minimum 3 required, max 8)
   */
  validatePhotos(photos) {
    const list = Array.isArray(photos) ? photos.filter(Boolean) : [];
    if (list.length < this.MIN_REQUIRED_PHOTOS) {
      return {
        valid: false,
        count: list.length,
        error: `Kayıt olabilmek için profilinize en az ${this.MIN_REQUIRED_PHOTOS} fotoğraf eklemelisiniz! (Şu an: ${list.length}/${this.MIN_REQUIRED_PHOTOS})`
      };
    }
    if (list.length > this.MAX_ALLOWED_PHOTOS) {
      return {
        valid: false,
        count: list.length,
        error: `Profilinize en fazla ${this.MAX_ALLOWED_PHOTOS} fotoğraf yükleyebilirsiniz.`
      };
    }
    return { valid: true, count: list.length };
  },

  /**
   * Return high-quality fitness presets for 1-click test fill
   */
  getAthleticPresets() {
    return [...ATHLETIC_PHOTO_PRESETS];
  }
};
