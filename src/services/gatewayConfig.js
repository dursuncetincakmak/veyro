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
    googleMapsApiKey: "", // Real Google Maps JavaScript API Key
    placesApiKey: "", // Google Places API Key
    defaultCenter: { lat: 40.9902, lng: 29.0298, city: "Kadıköy, İstanbul" },
    mapStyle: "luxury_dark",
    provider: "carto_dark", // 'carto_dark' | 'google_maps'
    enabled: true,
    lastTested: null
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
      maps: { ...current.maps, ...(updates.maps || {}) }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error("Error saving gateway config", e);
    return null;
  }
}

