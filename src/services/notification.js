/**
 * Veyro - Notification & Feedback Service
 * Displays sleek glassmorphism toasts, floating mobile push banners,
 * plays audible notification chimes, and triggers device haptic feedback.
 */

import { soundService } from './soundService.js';

class NotificationService {
  constructor() {
    this.toastContainer = null;
    this.init();
    this.requestPermission();
  }

  init() {
    if (typeof document === 'undefined') return;
    if (!document.getElementById("veyro-toast-container")) {
      const container = document.createElement("div");
      container.id = "veyro-toast-container";
      container.style.cssText = `
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        width: 90%;
        max-width: 400px;
      `;
      document.body.appendChild(container);
      this.toastContainer = container;
    } else {
      this.toastContainer = document.getElementById("veyro-toast-container");
    }
  }

  /**
   * Asks for native browser/phone notification permission
   */
  async requestPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (e) {}
      }
    }
  }

  /**
   * High-end floating mobile push banner (like iOS dynamic island / push alert)
   */
  showIncomingMessageBanner({ senderName, senderInitials, text, onOpen }) {
    this.init();
    soundService.playMessageChime();

    // Trigger phone native notification if permitted and in background
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`Veyro: ${senderName}`, {
          body: text || 'Yeni bir mesajınız var',
          icon: '/assets/icon.png',
          badge: '/assets/icon.png',
          tag: 'veyro-chat'
        });
      } catch (e) {}
    }

    if (!this.toastContainer) return;

    const banner = document.createElement("div");
    banner.style.cssText = `
      background: rgba(18, 20, 26, 0.96);
      color: #FFFFFF;
      padding: 12px 14px;
      border-radius: 18px;
      border: 1px solid rgba(255, 87, 34, 0.4);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 87, 34, 0.25);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      opacity: 0;
      transform: translateY(-20px) scale(0.96);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
      cursor: pointer;
    `;

    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;">
        <div style="width: 38px; height: 38px; border-radius: 12px; background: var(--color-kor-gradient); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #FFF; flex-shrink: 0; box-shadow: 0 2px 8px var(--color-kor-glow);">
          ${senderInitials || 'SP'}
        </div>
        <div style="min-width: 0; flex: 1;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <strong style="font-size: 13.5px; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${senderName || 'Partner'}
            </strong>
            <span style="font-size: 10px; color: var(--color-kor); font-weight: 800; background: rgba(255,87,34,0.15); padding: 1px 5px; border-radius: 6px;">Yeni Mesaj</span>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary); margin: 2px 0 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${text}
          </p>
        </div>
      </div>
      <button style="background: var(--color-kor); color: #FFF; border: none; border-radius: 10px; padding: 6px 12px; font-size: 11.5px; font-weight: 800; cursor: pointer; flex-shrink: 0;">
        Aç
      </button>
    `;

    banner.addEventListener("click", () => {
      if (onOpen) onOpen();
      banner.style.opacity = "0";
      banner.style.transform = "translateY(-20px) scale(0.95)";
      setTimeout(() => banner.remove(), 250);
    });

    this.toastContainer.prepend(banner);

    requestAnimationFrame(() => {
      banner.style.opacity = "1";
      banner.style.transform = "translateY(0) scale(1)";
    });

    setTimeout(() => {
      if (banner.parentNode) {
        banner.style.opacity = "0";
        banner.style.transform = "translateY(-20px) scale(0.95)";
        setTimeout(() => banner.remove(), 300);
      }
    }, 4500);
  }

  show(message, type = "info", duration = 3200) {
    this.init();
    const toast = document.createElement("div");

    let accentBg = "var(--color-kor)";
    let iconSvg = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>`;

    if (type === "success") {
      accentBg = "var(--color-emerald)";
      iconSvg = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`;
    } else if (type === "warning") {
      accentBg = "var(--color-amber)";
    } else if (type === "error") {
      accentBg = "var(--color-rose)";
    }

    toast.style.cssText = `
      background: rgba(22, 24, 33, 0.94);
      color: #FFFFFF;
      padding: 12px 16px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-left: 4px solid ${accentBg};
      font-size: 13.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto;
    `;

    toast.innerHTML = `
      <span style="color: ${accentBg}; display: flex; align-items: center;">${iconSvg}</span>
      <span style="flex: 1;">${message}</span>
    `;

    this.toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    // Vibration feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(type === "success" ? [30, 40, 30] : 40);
    }

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  success(msg) {
    this.show(msg, "success");
  }

  error(msg) {
    this.show(msg, "error");
  }

  info(msg) {
    this.show(msg, "info");
  }
}

export const notify = new NotificationService();
