/**
 * Veyro - Calendar Integration Service
 * Real Calendar Export:
 * 1. Generates and triggers download of .ics (iCalendar) for Apple Calendar / Outlook / iOS native
 * 2. Creates Google Calendar Web Event Links for one-tap web sync
 */

export function generateIcsFile(appointment, partner, gym) {
  const pad = (n) => (n < 10 ? '0' + n : n);

  // Compute realistic target timestamp based on time slot
  const now = new Date();
  const [hours, mins] = (appointment.time || "19:00").split(':').map(Number);
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins);
  const endDate = new Date(startDate.getTime() + 75 * 60000); // 1 hour 15 min workout

  const formatIcsDate = (date) => {
    return date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) + 'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) + 'Z';
  };

  const startFormatted = formatIcsDate(startDate);
  const endFormatted = formatIcsDate(endDate);

  const title = `Veyro Antrenmanı: ${appointment.workoutType || 'Fitness'} (${partner ? partner.name : 'Partner'} ile)`;
  const description = `Veyro ile planlanan spor seansı.\nPartner: ${partner ? partner.name : 'Partner'}\nSalon: ${gym ? gym.name : 'Spor Salonu'}\nHedef: Birlikte set ve spot verme`;
  const location = gym ? `${gym.name}, ${gym.district}` : "Spor Salonu";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Veyro Fitness//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:veyro_${appointment.id}_${Date.now()}@veyro.app`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Antrenmana 1 saat kaldı!",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `veyro_${appointment.workoutType.toLowerCase().replace(/\s+/g, '_')}_randevu.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
}

export function openGoogleCalendarIntent(appointment, partner, gym) {
  const [hours, mins] = (appointment.time || "19:00").split(':').map(Number);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins);
  const end = new Date(start.getTime() + 75 * 60000);

  const pad = (n) => (n < 10 ? '0' + n : n);
  const toGoogleIso = (d) => {
    return d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) + 'Z';
  };

  const text = encodeURIComponent(`Veyro: ${appointment.workoutType} (${partner ? partner.name : 'Partner'} ile)`);
  const details = encodeURIComponent(`Veyro spor arkadaşı uygulaması üzerinden planlanan seans. Salon: ${gym ? gym.name : ''}`);
  const location = encodeURIComponent(gym ? `${gym.name}, ${gym.district}` : 'Salon');
  const dates = `${toGoogleIso(start)}/${toGoogleIso(end)}`;

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
  window.open(url, "_blank");
  return url;
}
