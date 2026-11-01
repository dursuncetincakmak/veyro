/**
 * Veyro - Real SMS, Email & Google Maps Gateway Configuration
 * Stores and manages real API credentials for:
 * 1. SMS Gateway (Netgsm, Twilio, Firebase Phone Auth, Mutlucell)
 * 2. Email Gateway (SendGrid, Resend, AWS SES, Custom SMTP)
 * 3. Google Maps & Places API Keys
 */

const STORAGE_KEY = "veyro_production_gateways_v2";

const DEFAULT_GATEWAYS = {
  // SMS Gateway (OTP Verification)
  sms: {
    provider: "Netgsm", // 'Netgsm' | 'Twilio' | 'Firebase' | 'Mutlucell'
    apiKey: "", // Netgsm Usercode or Twilio SID
    apiSecret: "", // Netgsm Password or Twilio Auth Token
    senderHeader: "VEYRO", // SMS Originator Header (Max 11 chars)
    enabled: true,
    lastTested: null
  },
  // Email Gateway
  email: {
    provider: "SendGrid", // 'SendGrid' | 'Resend' | 'AWS_SES' | 'SMTP'
    apiKey: "",
    senderEmail: "noreply@veyro.app",
    senderName: "Veyro Fitness",
    smtpHost: "smtp.sendgrid.net",
    smtpPort: 587,
    smtpUser: "apikey",
    enabled: true,
    lastTested: null
  },
  // Google Maps & Places API
  maps: {
    googleMapsApiKey: "", // Optional Google Maps JavaScript API Key (Requires Google Cloud billing + Maps JS API)
    placesApiKey: "", // Optional Google Places API Key
    defaultCenter: { lat: 41.1603, lng: 27.7989, city: "Çorlu, Tekirdağ" },
    mapStyle: "luxury_dark",
    provider: "carto_dark", // 'carto_dark' (Leaflet OLED - 100% Free & No API Key Needed) | 'google_maps'
    enabled: true,
    lastTested: Date.now()
  },
  // Google & Apple OAuth
  auth: {
    googleClientId: "", // Google OAuth 2.0 Client ID (apps.googleusercontent.com)
    appleClientId: "", // Apple Service ID
    enabled: true
  }
};

export function getGatewayConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_GATEWAYS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Could not read gateway config", e);
  }
  return DEFAULT_GATEWAYS;
}

export function saveGatewayConfig(updates) {
  try {
    const current = getGatewayConfig();
    const merged = {
      ...current,
      ...updates,
      sms: { ...current.sms, ...(updates.sms || {}) },
      email: { ...current.email, ...(updates.email || {}) },
      maps: { ...current.maps, ...(updates.maps || {}) },
      auth: { ...current.auth, ...(updates.auth || {}) }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error("Error saving gateway config", e);
    return null;
  }
}

