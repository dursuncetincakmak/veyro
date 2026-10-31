/**
 * Veyro - In-App Custom Confirmation & Prompt Dialogs
 * Replaces ugly native browser confirm(), alert(), and prompt() with
 * ultra-premium obsidian glassmorphic dialogs matching Veyro design language.
 */

import { icons } from './icons.js';

/**
 * Show a sleek in-app confirmation dialog
 */
export function showConfirmModal({
  title = "İşlemi Onaylayın",
  message = "Bu işlemi gerçekleştirmek istediğinize emin misiniz?",
  confirmText = "Onayla",
  cancelText = "İptal",
  isDanger = false,
  icon = null,
  onConfirm = null,
  onCancel = null
}) {
  // Remove any existing confirm dialog
  const existing = document.getElementById("veyro-custom-confirm-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "veyro-custom-confirm-overlay";
  overlay.className = "modal-overlay open";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(4, 5, 8, 0.78);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 20px;
    animation: fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  `;

  const badgeIcon = icon || (isDanger ? icons.alert(24) : icons.checkCircle(24));
  const accentColor = isDanger ? "#EF4444" : "#FF5722";
  const badgeBg = isDanger ? "rgba(239, 68, 68, 0.16)" : "rgba(255, 87, 34, 0.16)";
  const badgeBorder = isDanger ? "rgba(239, 68, 68, 0.35)" : "rgba(255, 87, 34, 0.35)";
  const btnGradient = isDanger
    ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
    : "linear-gradient(135deg, #FF5722 0%, #F4511E 100%)";
  const btnShadow = isDanger
    ? "0 6px 20px rgba(239, 68, 68, 0.35)"
    : "0 6px 20px rgba(255, 87, 34, 0.35)";

  overlay.innerHTML = `
    <div class="custom-confirm-card" role="dialog" aria-modal="true" style="
      width: 100%;
      max-width: 360px;
      background: linear-gradient(180deg, #181A24 0%, #10121A 100%);
      border: 1.5px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 26px 22px 22px;
      text-align: center;
      box-sizing: border-box;
      transform: scale(0.96);
      animation: popInCard 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    ">
      <!-- Top Glowing Badge Icon -->
      <div style="
        width: 58px;
        height: 58px;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: ${badgeBg};
        border: 1.5px solid ${badgeBorder};
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${accentColor};
      ">
        ${badgeIcon}
      </div>

      <!-- Title -->
      <h3 style="
        font-family: var(--font-heading, inherit);
        font-size: 19px;
        font-weight: 800;
        color: #FFFFFF;
        margin: 0 0 8px;
        letter-spacing: -0.01em;
      ">${title}</h3>

      <!-- Message -->
      <p style="
        font-size: 13.5px;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.72);
        margin: 0 0 22px;
        font-weight: 500;
      ">${message}</p>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 10px;">
        <button type="button" id="btn-custom-dialog-cancel" style="
          flex: 1;
          height: 46px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.88);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        ">${cancelText}</button>

        <button type="button" id="btn-custom-dialog-confirm" style="
          flex: 1.2;
          height: 46px;
          border-radius: 14px;
          background: ${btnGradient};
          box-shadow: ${btnShadow};
          border: none;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        ">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  function closeDialog(confirmed = false) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.15s ease';
    setTimeout(() => {
      overlay.remove();
      if (confirmed) {
        onConfirm?.();
      } else {
        onCancel?.();
      }
    }, 150);
  }

  overlay.querySelector("#btn-custom-dialog-confirm")?.addEventListener("click", () => {
    closeDialog(true);
  });

  overlay.querySelector("#btn-custom-dialog-cancel")?.addEventListener("click", () => {
    closeDialog(false);
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog(false);
    }
  });

  // Escape key support
  const keyHandler = (e) => {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", keyHandler);
      closeDialog(false);
    } else if (e.key === "Enter") {
      document.removeEventListener("keydown", keyHandler);
      closeDialog(true);
    }
  };
  document.addEventListener("keydown", keyHandler, { once: true });
}

/**
 * Show a sleek in-app prompt dialog for text input
 */
export function showPromptModal({
  title = "Bilgi Girin",
  message = "Lütfen aşağıdaki alanı doldurun:",
  placeholder = "Buraya yazın...",
  defaultValue = "",
  confirmText = "Tamam",
  cancelText = "İptal",
  onConfirm = null,
  onCancel = null
}) {
  const existing = document.getElementById("veyro-custom-prompt-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "veyro-custom-prompt-overlay";
  overlay.className = "modal-overlay open";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(4, 5, 8, 0.78);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 20px;
    animation: fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  `;

  overlay.innerHTML = `
    <div class="custom-prompt-card" role="dialog" aria-modal="true" style="
      width: 100%;
      max-width: 380px;
      background: linear-gradient(180deg, #181A24 0%, #10121A 100%);
      border: 1.5px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
      border-radius: 24px;
      padding: 24px 22px 20px;
      box-sizing: border-box;
      transform: scale(0.96);
      animation: popInCard 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    ">
      <h3 style="
        font-family: var(--font-heading, inherit);
        font-size: 18px;
        font-weight: 800;
        color: #FFFFFF;
        margin: 0 0 6px;
      ">${title}</h3>

      <p style="
        font-size: 13px;
        color: rgba(255, 255, 255, 0.7);
        margin: 0 0 16px;
        line-height: 1.45;
      ">${message}</p>

      <!-- Input Pill -->
      <div style="
        display: flex;
        align-items: center;
        background: rgba(18, 20, 28, 0.95);
        border: 1.5px solid rgba(255, 255, 255, 0.12);
        border-radius: 14px;
        padding: 0 14px;
        height: 48px;
        margin-bottom: 20px;
        box-sizing: border-box;
        transition: border-color 0.2s ease;
      " id="custom-prompt-input-wrapper">
        <input type="text" id="custom-prompt-input" value="${defaultValue}" placeholder="${placeholder}" style="
          flex: 1;
          width: 100%;
          background: transparent !important;
          border: none !important;
          font-size: 14.5px;
          font-weight: 600;
          color: #FFFFFF !important;
          outline: none !important;
          padding: 0;
          margin: 0;
        ">
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 10px;">
        <button type="button" id="btn-custom-prompt-cancel" style="
          flex: 1;
          height: 44px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.85);
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
        ">${cancelText}</button>

        <button type="button" id="btn-custom-prompt-confirm" style="
          flex: 1.2;
          height: 44px;
          border-radius: 12px;
          background: var(--color-kor-gradient, linear-gradient(135deg, #FF5722, #F4511E));
          box-shadow: 0 6px 18px rgba(255, 87, 34, 0.35);
          border: none;
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 800;
          cursor: pointer;
        ">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const inputEl = overlay.querySelector("#custom-prompt-input");
  const wrapperEl = overlay.querySelector("#custom-prompt-input-wrapper");
  if (inputEl) {
    inputEl.focus();
    inputEl.select();
    inputEl.addEventListener("focus", () => {
      if (wrapperEl) wrapperEl.style.borderColor = "#FF5722";
    });
    inputEl.addEventListener("blur", () => {
      if (wrapperEl) wrapperEl.style.borderColor = "rgba(255, 255, 255, 0.12)";
    });
  }

  function closeDialog(confirmed = false) {
    const val = inputEl ? inputEl.value.trim() : "";
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.15s ease';
    setTimeout(() => {
      overlay.remove();
      if (confirmed) {
        onConfirm?.(val);
      } else {
        onCancel?.();
      }
    }, 150);
  }

  overlay.querySelector("#btn-custom-prompt-confirm")?.addEventListener("click", () => {
    closeDialog(true);
  });

  overlay.querySelector("#btn-custom-prompt-cancel")?.addEventListener("click", () => {
    closeDialog(false);
  });

  inputEl?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      closeDialog(true);
    } else if (e.key === "Escape") {
      closeDialog(false);
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog(false);
    }
  });
}

/**
 * Promise wrapper for confirmAction
 */
export function confirmAction(options) {
  return new Promise((resolve) => {
    showConfirmModal({
      ...options,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false)
    });
  });
}

/**
 * Promise wrapper for promptAction
 */
export function promptAction(options) {
  return new Promise((resolve) => {
    showPromptModal({
      ...options,
      onConfirm: (val) => resolve(val),
      onCancel: () => resolve(null)
    });
  });
}
