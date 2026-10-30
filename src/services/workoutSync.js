/**
 * Veyro - Live Co-Workout Synchronization Engine
 * Handles real-time shared workout session state between workout partners:
 * Live set check-offs, spotter readiness broadcasts, and synchronized rest timers.
 */

import { db } from './db.js';

class WorkoutSyncService {
  constructor() {
    this.activeSessionKey = "veyro_live_workout_session";
  }

  getSession(appointmentId) {
    try {
      const raw = localStorage.getItem(`${this.activeSessionKey}_${appointmentId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Could not parse workout session", e);
    }

    // Default synchronized session
    const defaultSession = {
      appointmentId,
      startedAt: Date.now(),
      durationMinutes: 75,
      completedSets: {}, // { "ex-1_s0_userA": true, "ex-1_s0_userB": true }
      currentSpotter: null,
      restTimerActive: false,
      restTimerSeconds: 45,
      activityLog: [
        { id: "log-1", text: "Antrenman seansı başladı. Isınma setleri tamamlandı.", timestamp: Date.now() - 300000 }
      ]
    };
    this.saveSession(appointmentId, defaultSession);
    return defaultSession;
  }

  saveSession(appointmentId, sessionData) {
    localStorage.setItem(`${this.activeSessionKey}_${appointmentId}`, JSON.stringify(sessionData));
    db.notifySubscribers(`live_session_${appointmentId}`, sessionData);
  }

  /**
   * Complete a set by one of the partners
   */
  completeSet(appointmentId, exerciseId, setIndex, user, weight = "80 kg") {
    const session = this.getSession(appointmentId);
    const setKey = `${exerciseId}_s${setIndex}_${user.id}`;
    const wasChecked = Boolean(session.completedSets[setKey]);

    session.completedSets[setKey] = !wasChecked;

    if (!wasChecked) {
      session.activityLog.unshift({
        id: `log_${Date.now()}`,
        text: `${user.name} Set ${setIndex + 1}'i tamamladı! (${weight})`,
        timestamp: Date.now()
      });
      // Trigger shared rest timer
      session.restTimerActive = true;
      session.restTimerSeconds = 45;
    }

    this.saveSession(appointmentId, session);
    return session;
  }

  /**
   * Set Spotter status
   */
  setSpotterReady(appointmentId, user, isReady = true) {
    const session = this.getSession(appointmentId);
    session.currentSpotter = isReady ? user.name : null;
    session.activityLog.unshift({
      id: `log_${Date.now()}`,
      text: isReady ? `${user.name} spot vermeye hazır!` : `${user.name} dinleniyor.`,
      timestamp: Date.now()
    });
    this.saveSession(appointmentId, session);
    return session;
  }
}

export const workoutSync = new WorkoutSyncService();
