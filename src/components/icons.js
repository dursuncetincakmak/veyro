/**
 * Veyro - Unified Modern Athletic SVG Icon Library
 * Provides a single, unified, high-aesthetic vector icon set across the entire app.
 * Completely replaces all system/keyboard emojis with sleek, responsive SVG icons.
 */

function svg(paths, size = 18, className = "", extraAttrs = "") {
  return `<svg class="veyro-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ${extraAttrs}>${paths}</svg>`;
}

export const icons = {
  // Athletic & Core
  bolt: (size = 18, cls = "") => svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>', size, cls),
  flame: (size = 18, cls = "") => svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>', size, cls),
  dumbbell: (size = 18, cls = "") => svg('<path d="m6.5 6.5 11 11"></path><path d="m21 21-1-1a2 2 0 0 0-2.8 0l-1.4 1.4a2 2 0 0 1-2.8 0l-.7-.7a2 2 0 0 1 0-2.8l1.4-1.4a2 2 0 0 0 0-2.8l-1-1"></path><path d="m3 3 1 1a2 2 0 0 0 2.8 0l1.4-1.4a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L10.3 7.5a2 2 0 0 0 0 2.8l1 1"></path>', size, cls),
  activity: (size = 18, cls = "") => svg('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>', size, cls),
  target: (size = 18, cls = "") => svg('<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>', size, cls),
  shield: (size = 18, cls = "") => svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>', size, cls),
  sparkles: (size = 18, cls = "") => svg('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path>', size, cls),

  // Navigation & UI
  cards: (size = 18, cls = "") => svg('<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>', size, cls),
  list: (size = 18, cls = "") => svg('<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>', size, cls),
  pin: (size = 18, cls = "") => svg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>', size, cls),
  clock: (size = 18, cls = "") => svg('<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>', size, cls),
  calendar: (size = 18, cls = "") => svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>', size, cls),
  edit: (size = 18, cls = "") => svg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>', size, cls),
  refresh: (size = 18, cls = "") => svg('<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>', size, cls),
  share: (size = 18, cls = "") => svg('<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>', size, cls),
  chat: (size = 18, cls = "") => svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>', size, cls),
  camera: (size = 18, cls = "") => svg('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>', size, cls),
  star: (size = 18, cls = "") => svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>', size, cls),
  starFilled: (size = 18, cls = "") => `<svg class="veyro-icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,

  // Status & Verification
  check: (size = 18, cls = "") => svg('<polyline points="20 6 9 17 4 12"></polyline>', size, cls),
  checkCircle: (size = 18, cls = "") => svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>', size, cls),
  alert: (size = 18, cls = "") => svg('<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>', size, cls),
  alertTriangle: (size = 18, cls = "") => svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>', size, cls),
  close: (size = 18, cls = "") => svg('<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>', size, cls),
  plus: (size = 18, cls = "") => svg('<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>', size, cls),
  bulb: (size = 18, cls = "") => svg('<path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2v1"></path><path d="M12 7a5 5 0 1 0-3 9h6a5 5 0 0 0-3-9z"></path>', size, cls),
  bell: (size = 18, cls = "") => svg('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>', size, cls),
  handshake: (size = 18, cls = "") => svg('<path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2-2"></path><path d="m18 10 1.4-1.4a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L14 6"></path><path d="M2 13.5V20a2 2 0 0 0 2 2h3.5a2 2 0 0 0 1.4-.6L14 16.3"></path><path d="M22 10.5V4a2 2 0 0 0-2-2h-3.5a2 2 0 0 0-1.4.6L10 7.7"></path>', size, cls),

  // Account & Auth
  settings: (size = 18, cls = "") => svg('<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>', size, cls),
  lock: (size = 18, cls = "") => svg('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>', size, cls),
  logout: (size = 18, cls = "") => svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>', size, cls),
  rocket: (size = 18, cls = "") => svg('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>', size, cls),
  users: (size = 18, cls = "") => svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>', size, cls),
  user: (size = 18, cls = "") => svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>', size, cls),
  phone: (size = 18, cls = "") => svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>', size, cls),
  mail: (size = 18, cls = "") => svg('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>', size, cls),
  send: (size = 18, cls = "") => svg('<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>', size, cls),
  key: (size = 18, cls = "") => svg('<path d="m21 2-2 2m-1.5 1.5L14 9l-4-4-6.5 6.5a2.12 2.12 0 0 0 0 3l5 5a2.12 2.12 0 0 0 3 0L18 13l3.5-3.5a2.12 2.12 0 0 0 0-3L20 5"></path><circle cx="7.5" cy="16.5" r="1.5"></circle>', size, cls),

  // Times & Day
  sun: (size = 18, cls = "") => svg('<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>', size, cls),
  sunrise: (size = 18, cls = "") => svg('<path d="M12 2v6"></path><path d="m4.93 10.93 1.41 1.41"></path><path d="M20 18h2"></path><path d="m19.07 10.93-1.41 1.41"></path><path d="M22 22H2"></path><path d="m8 6 4-4 4 4"></path><path d="M16 18a4 4 0 0 0-8 0"></path>', size, cls),
  sunset: (size = 18, cls = "") => svg('<path d="M12 10V4"></path><path d="m4.93 10.93 1.41 1.41"></path><path d="M2 18h2"></path><path d="M20 18h2"></path><path d="m19.07 10.93-1.41 1.41"></path><path d="M22 22H2"></path><path d="m16 6-4 4-4-4"></path><path d="M16 18a4 4 0 0 0-8 0"></path>', size, cls),
  moon: (size = 18, cls = "") => svg('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>', size, cls),

  // Fitness Body Parts
  leg: (size = 18, cls = "") => svg('<path d="M8 2h4l2 9-2 11h-3l1-9-3-4V2z"></path>', size, cls),
  biceps: (size = 18, cls = "") => svg('<path d="M6 16c2 1 5 1 7-1l5-5c1-1 1-3 0-4l-1-1c-1-1-3-1-4 0l-5 5c-2 2-2 5-1 7z"></path><path d="M9 13a4 4 0 0 1 4-4"></path>', size, cls),
  run: (size = 18, cls = "") => svg('<circle cx="17" cy="4" r="2"></circle><path d="m15 8-4 4-4-1-3 3"></path><path d="m9 12 3 5 5-2 3 4"></path>', size, cls),

  // Chevrons
  chevronLeft: (size = 18, cls = "") => svg('<polyline points="15 18 9 12 15 6"></polyline>', size, cls),
  chevronRight: (size = 18, cls = "") => svg('<polyline points="9 18 15 12 9 6"></polyline>', size, cls),
  chevronDown: (size = 18, cls = "") => svg('<polyline points="6 9 12 15 18 9"></polyline>', size, cls),
  chevronUp: (size = 18, cls = "") => svg('<polyline points="18 15 12 9 6 15"></polyline>', size, cls)
};
