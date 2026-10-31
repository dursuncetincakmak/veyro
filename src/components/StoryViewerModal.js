/**
 * Veyro - Story Viewer Modal (Hikaye İzleyici)
 * Full-screen Instagram / Strava style mobile story viewer.
 * Auto-advancing segmented progress bars, pause on hold, tap left/right to navigate,
 * quick emoji reactions with real-time DM trigger, and direct reply bar.
 */

import { db, getChatRoomKey } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { icons } from './icons.js';

export function showStoryViewerModal(initialStoryId = null, onOpenChat) {
  let modalOverlay = document.getElementById("story-viewer-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "story-viewer-overlay";
    modalOverlay.className = "modal-overlay story-viewer-overlay";
    document.body.appendChild(modalOverlay);
  }

  const stories = db.getStories();
  if (stories.length === 0) {
    notify.info("Görüntülenecek hikaye bulunmuyor.");
    return;
  }

  let currentIndex = initialStoryId ? stories.findIndex(s => s.id === initialStoryId) : 0;
  if (currentIndex < 0) currentIndex = 0;

  const currentUser = auth.getCurrentUser() || { id: "current-user", name: "Sporcu" };

  let progress = 0; // 0 to 100
  let isPaused = false;
  let timerInterval = null;
  const DURATION_MS = 5000;
  const STEP_MS = 50;

  function markCurrentViewed() {
    const current = stories[currentIndex];
    if (current) {
      db.markStoryViewed(current.id);
    }
  }

  function startStoryTimer() {
    clearInterval(timerInterval);
    progress = 0;

    timerInterval = setInterval(() => {
      if (!isPaused) {
        progress += (STEP_MS / DURATION_MS) * 100;
        const bar = document.getElementById(`story-progress-${currentIndex}`);
        if (bar) bar.style.width = `${Math.min(100, progress)}%`;

        if (progress >= 100) {
          nextStory();
        }
      }
    }, STEP_MS);
  }

  function nextStory() {
    if (currentIndex < stories.length - 1) {
      currentIndex++;
      render();
    } else {
      close();
    }
  }

  function prevStory() {
    if (currentIndex > 0) {
      currentIndex--;
      render();
    } else {
      progress = 0;
      const bar = document.getElementById(`story-progress-${currentIndex}`);
      if (bar) bar.style.width = "0%";
    }
  }

  function close() {
    clearInterval(timerInterval);
    modalOverlay.classList.remove("open");
  }

  function formatTimeAgo(ts) {
    if (!ts) return "Şimdi";
    const diffMin = Math.floor((Date.now() - ts) / 60000);
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${Math.floor(diffHours / 24)} gün önce`;
  }

  function sendReaction(emoji) {
    const story = stories[currentIndex];
    if (!story) return;

    soundService.playMessageChime();

    // Trigger floating reaction animation
    const container = document.getElementById("story-viewer-stage");
    if (container) {
      const floatEl = document.createElement("div");
      floatEl.textContent = emoji;
      floatEl.style.cssText = `
        position: absolute;
        bottom: 80px;
        left: ${40 + Math.random() * 40}%;
        font-size: 38px;
        pointer-events: none;
        z-index: 100;
        animation: floatUpFade 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      `;
      container.appendChild(floatEl);
      setTimeout(() => floatEl.remove(), 1200);
    }

    // Send direct chat message to story author if not self
    if (story.userId && story.userId !== currentUser.id) {
      const chatKey = getChatRoomKey(currentUser.id, story.userId);
      db.addChatMessage(chatKey, {
        senderId: currentUser.id,
        senderName: currentUser.name || "Sporcu",
        receiverId: story.userId,
        receiverName: story.userName || "Partner",
        text: `${emoji} Hikayene tepki verdi: "${story.tag || story.caption}"`
      });
      notify.success(`${emoji} Tepkin ${story.userName} sporcusuna iletildi!`);
    } else {
      notify.info("Kendi hikayene tepki verdin!");
    }
  }

  function sendDirectReply(text) {
    const story = stories[currentIndex];
    if (!story || !text.trim()) return;

    if (story.userId && story.userId !== currentUser.id) {
      const chatKey = getChatRoomKey(currentUser.id, story.userId);
      db.addChatMessage(chatKey, {
        senderId: currentUser.id,
        senderName: currentUser.name || "Sporcu",
        receiverId: story.userId,
        receiverName: story.userName || "Partner",
        text: `Hikayene yanıt verdi: "${text}" (${story.tag || ''})`
      });
      soundService.playMessageChime();
      notify.success("✓ Mesajın iletildi!");
    }
  }

  function render() {
    markCurrentViewed();
    const story = stories[currentIndex];
    const isSelf = story.userId === currentUser.id;

    modalOverlay.innerHTML = `
      <div id="story-viewer-stage" class="story-viewer-container fade-in" style="position: relative; width: 100%; max-width: 440px; height: 96vh; max-height: 860px; margin: auto; background: #000; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.85); border: 1px solid var(--border-glass-bright);">
        
        <!-- Story Background Media -->
        <img src="${story.image}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;" alt="Hikaye">

        <!-- Dark Vignette Gradient -->
        <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 25%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.9) 100%); pointer-events: none;"></div>

        <!-- Top Progress Segments -->
        <div style="position: absolute; top: 10px; left: 12px; right: 12px; display: flex; gap: 4px; z-index: 10;">
          ${stories.map((_, idx) => `
            <div style="flex: 1; height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
              <div id="story-progress-${idx}" style="height: 100%; background: #FFF; width: ${idx < currentIndex ? '100%' : idx === currentIndex ? '0%' : '0%'}; transition: width 0.05s linear;"></div>
            </div>
          `).join('')}
        </div>

        <!-- Author Header Row -->
        <div style="position: absolute; top: 22px; left: 14px; right: 14px; display: flex; align-items: center; justify-content: space-between; z-index: 10;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="member-avatar accent-kor" style="width: 38px; height: 38px; font-size: 14px; border: 2px solid var(--color-kor);">
              ${story.userAvatar ? `<img src="${story.userAvatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : (story.userInitials || "SP")}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="font-size: 14px; color: #FFF;">${story.userName}</strong>
                <span style="font-size: 11px; color: rgba(255,255,255,0.7);">· ${formatTimeAgo(story.timestamp)}</span>
              </div>
              <span style="font-size: 11px; color: var(--color-kor); font-weight: 700; display: flex; align-items: center; gap: 3px;">
                ${icons.pin(11)} ${story.gymName || "Spor Salonu"}
              </span>
            </div>
          </div>

          <button id="btn-close-story-viewer" style="background: rgba(0,0,0,0.4); border: none; width: 34px; height: 34px; border-radius: 50%; color: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${icons.close(18)}
          </button>
        </div>

        <!-- Tap Navigation Zones -->
        <div style="position: absolute; inset: 0; display: flex; z-index: 5;">
          <div id="story-tap-left" style="flex: 1; height: 75%; margin-top: 60px; cursor: pointer;"></div>
          <div id="story-tap-right" style="flex: 1; height: 75%; margin-top: 60px; cursor: pointer;"></div>
        </div>

        <!-- Story Content Overlay (Bottom) -->
        <div style="position: absolute; bottom: 85px; left: 16px; right: 16px; z-index: 10;">
          ${story.tag ? `
            <div style="margin-bottom: 8px;">
              <span style="background: var(--color-kor-gradient); color: #FFF; font-size: 13px; font-weight: 800; padding: 5px 12px; border-radius: 8px; box-shadow: 0 4px 14px var(--color-kor-glow); display: inline-flex; align-items: center; gap: 5px;">
                ${story.tag}
              </span>
            </div>
          ` : ''}

          <p style="font-size: 14px; font-weight: 600; color: #FFF; line-height: 1.4; text-shadow: 0 2px 6px rgba(0,0,0,0.9); margin: 0;">
            ${story.caption || ''}
          </p>
        </div>

        <!-- Bottom Action Bar (Reactions & Reply) -->
        <div style="position: absolute; bottom: 14px; left: 14px; right: 14px; z-index: 15; display: flex; flex-direction: column; gap: 8px;">
          
          <!-- Quick Reaction Buttons -->
          <div style="display: flex; align-items: center; justify-content: center; gap: 10px; background: rgba(0,0,0,0.45); backdrop-filter: blur(10px); padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
            ${['🔥', '💪', '👏', '⚡', '🎯'].map(emoji => `
              <button class="btn-story-reaction" data-emoji="${emoji}" style="background: transparent; border: none; font-size: 22px; cursor: pointer; transition: transform 0.15s ease;" title="Tepki ver">
                ${emoji}
              </button>
            `).join('')}
          </div>

          <!-- Direct Message Input (if not own story) -->
          ${!isSelf ? `
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="text" id="input-story-reply" placeholder="${story.userName} sporcusuna yanıt yaz..." style="flex: 1; padding: 10px 14px; background: rgba(255,255,255,0.12); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; color: #FFF; font-size: 13px; outline: none;">
              <button id="btn-send-story-reply" style="width: 38px; height: 38px; border-radius: 50%; background: var(--color-kor); color: #FFF; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
                ${icons.send(16)}
              </button>
            </div>
          ` : `
            <div style="text-align: center; font-size: 11.5px; color: rgba(255,255,255,0.6);">
              Senin hikayen · ${story.likesCount || 0} sporcu gördü
            </div>
          `}
        </div>

      </div>
    `;

    // Close button
    document.getElementById("btn-close-story-viewer")?.addEventListener("click", close);

    // Tap Left / Right navigation
    document.getElementById("story-tap-left")?.addEventListener("click", () => {
      prevStory();
    });

    document.getElementById("story-tap-right")?.addEventListener("click", () => {
      nextStory();
    });

    // Press and hold to pause
    const stage = document.getElementById("story-viewer-stage");
    stage?.addEventListener("mousedown", () => { isPaused = true; });
    stage?.addEventListener("mouseup", () => { isPaused = false; });
    stage?.addEventListener("touchstart", () => { isPaused = true; }, { passive: true });
    stage?.addEventListener("touchend", () => { isPaused = false; });

    // Quick reactions
    modalOverlay.querySelectorAll(".btn-story-reaction").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const emoji = btn.dataset.emoji;
        sendReaction(emoji);
      });
    });

    // Direct reply input & button
    const replyInput = document.getElementById("input-story-reply");
    const replyBtn = document.getElementById("btn-send-story-reply");

    replyInput?.addEventListener("focus", () => { isPaused = true; });
    replyInput?.addEventListener("blur", () => { isPaused = false; });

    const handleSend = () => {
      const text = replyInput?.value.trim();
      if (text) {
        sendDirectReply(text);
        replyInput.value = "";
      }
    };

    replyBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      handleSend();
    });

    replyInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.stopPropagation();
        handleSend();
      }
    });

    startStoryTimer();
  }

  render();
  modalOverlay.classList.add("open");
}
