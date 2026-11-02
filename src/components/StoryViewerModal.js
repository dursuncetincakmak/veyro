/**
 * Veyro - Story Viewer Modal (Hikaye İzleyici)
 * Full-screen Instagram / Strava style mobile story viewer.
 * Features:
 * - Multiple stories per user with per-user segmented progress bars
 * - Music & recorded voice playback (soundService.playStoryMusic) + Mute toggle
 * - Custom emoji stickers overlay
 * - Story Insights drawer for own stories ("Kaç kişi gördü, kim ne yazdı")
 * - Quick emoji reactions & direct replies that land directly in the Message Inbox (ChatInboxModal)
 */

import { db, getChatRoomKey } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { showStoryCreatorModal } from './StoryCreatorModal.js';
import { icons } from './icons.js';

export function showStoryViewerModal(initialStoryId = null, onOpenChat = null, onCloseCallback = null) {
  let modalOverlay = document.getElementById("story-viewer-overlay");
  if (!modalOverlay) {
    modalOverlay = document.createElement("div");
    modalOverlay.id = "story-viewer-overlay";
    modalOverlay.className = "modal-overlay story-viewer-overlay";
    document.body.appendChild(modalOverlay);
  }

  const currentUser = auth.getCurrentUser() || { id: "current-user", name: "Sporcu", initials: "SP" };

  // Build ordered list of stories grouped by user so multiple stories of the same user play consecutively
  function buildOrderedStoriesList() {
    const rawStories = db.getCollection("stories") || [];
    // Sort chronologically (oldest to newest within same user, so multi-story plays in order 1 -> 2 -> 3)
    const userMap = new Map();
    rawStories.forEach(s => {
      const uid = s.userId || s.userName || "unknown";
      if (!userMap.has(uid)) {
        userMap.set(uid, []);
      }
      userMap.get(uid).push(s);
    });

    const groups = [];
    userMap.forEach((userStories, uid) => {
      // Sort a single user's stories from oldest to newest so story 1 plays before story 2
      const chronological = userStories.slice().sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      const allViewed = chronological.every(st => db.isStoryViewedByUser(st, currentUser.id));
      const latestTs = Math.max(...chronological.map(st => st.timestamp || 0));
      groups.push({
        userId: uid,
        stories: chronological,
        allViewed,
        latestTs
      });
    });

    // Sort groups: current user first if clicked, otherwise unviewed groups first, viewed groups at the very back
    groups.sort((a, b) => {
      if (a.allViewed !== b.allViewed) {
        return a.allViewed ? 1 : -1;
      }
      return b.latestTs - a.latestTs;
    });

    return groups.flatMap(g => g.stories);
  }

  let stories = buildOrderedStoriesList();
  if (stories.length === 0) {
    notify.info("Görüntülenecek hikaye bulunmuyor.");
    return;
  }

  let currentIndex = 0;
  if (initialStoryId) {
    const exactIdx = stories.findIndex(s => s.id === initialStoryId);
    if (exactIdx >= 0) {
      currentIndex = exactIdx;
    } else {
      // Maybe a userId was passed; find first unviewed story of that user, or their first story
      const userFirstUnviewed = stories.findIndex(s => s.userId === initialStoryId && !db.isStoryViewedByUser(s, currentUser.id));
      const userFirstAny = stories.findIndex(s => s.userId === initialStoryId);
      if (userFirstUnviewed >= 0) currentIndex = userFirstUnviewed;
      else if (userFirstAny >= 0) currentIndex = userFirstAny;
    }
  }

  let progress = 0;
  let isPaused = false;
  let isInsightsOpen = false;
  let timerInterval = null;
  const DURATION_MS = 5500;
  const STEP_MS = 50;

  function markCurrentViewed() {
    const current = stories[currentIndex];
    if (current) {
      db.markStoryViewed(current.id, currentUser);
    }
  }

  function getViewersForStory(story) {
    const rawViewers = Array.isArray(story.viewedBy) ? [...story.viewedBy] : [];
    // If this is the current user's own story and viewedBy is still empty, seed 3 nearby gym athletes so the user can immediately inspect viewers
    if (story.userId === currentUser.id && rawViewers.length === 0) {
      db.simulateStoryViewersAndReplies(story.id);
      const updated = (db.getCollection("stories") || []).find(s => s.id === story.id);
      if (updated && Array.isArray(updated.viewedBy)) {
        return updated.viewedBy;
      }
    }
    return rawViewers;
  }

  function startStoryTimer() {
    clearInterval(timerInterval);
    progress = 0;

    timerInterval = setInterval(() => {
      if (!isPaused && !isInsightsOpen) {
        progress += (STEP_MS / DURATION_MS) * 100;
        const current = stories[currentIndex];
        const bar = current ? document.getElementById(`story-progress-${current.id}`) : null;
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
      isInsightsOpen = false;
      render();
    } else {
      close();
    }
  }

  function prevStory() {
    if (currentIndex > 0) {
      currentIndex--;
      isInsightsOpen = false;
      render();
    } else {
      progress = 0;
      const current = stories[currentIndex];
      const bar = current ? document.getElementById(`story-progress-${current.id}`) : null;
      if (bar) bar.style.width = "0%";
    }
  }

  function close() {
    clearInterval(timerInterval);
    soundService.stopStoryMusic();
    modalOverlay.classList.remove("open");
    onCloseCallback?.();
  }

  function formatTimeAgo(ts) {
    if (!ts) return "Şimdi";
    const diffMin = Math.floor((Date.now() - ts) / 60000);
    if (diffMin < 1) return "Şimdi";
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${Math.floor(diffHours / 24)} gün önce`;
  }

  function sendReaction(emoji) {
    const story = stories[currentIndex];
    if (!story) return;

    soundService.playMessageChime();

    // Floating reaction animation
    const container = document.getElementById("story-viewer-stage");
    if (container) {
      const floatEl = document.createElement("div");
      floatEl.textContent = emoji;
      floatEl.style.cssText = `
        position: absolute;
        bottom: 90px;
        left: ${35 + Math.random() * 35}%;
        font-size: 40px;
        pointer-events: none;
        z-index: 100;
        animation: floatUpFade 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      `;
      container.appendChild(floatEl);
      setTimeout(() => floatEl.remove(), 1200);
    }

    if (story.userId && story.userId !== currentUser.id) {
      db.recordStoryInteraction(story.id, {
        userId: currentUser.id,
        userName: currentUser.name || "Sporcu",
        userInitials: currentUser.initials || "SP",
        userAvatar: currentUser.photos?.[0] || currentUser.avatar || "",
        emoji
      });

      const chatKey = getChatRoomKey(currentUser.id, story.userId);
      db.addChatMessage(chatKey, {
        senderId: currentUser.id,
        senderName: currentUser.name || "Sporcu",
        receiverId: story.userId,
        receiverName: story.userName || "Partner",
        partnerAvatar: story.userAvatar || "",
        text: `📸 Hikayene tepki verdi: ${emoji} (${story.tag || story.caption || 'Hikaye'})`,
        isStoryReply: true,
        storyId: story.id,
        storyImage: story.image,
        storyTag: story.tag || ""
      });
      notify.success(`${emoji} Tepkin ${story.userName} ile mesaj kutusuna iletildi!`);
    } else {
      notify.info("Kendi hikayene tepki verdin!");
    }
  }

  function sendDirectReply(text) {
    const story = stories[currentIndex];
    if (!story || !text.trim()) return;

    if (story.userId && story.userId !== currentUser.id) {
      db.recordStoryInteraction(story.id, {
        userId: currentUser.id,
        userName: currentUser.name || "Sporcu",
        userInitials: currentUser.initials || "SP",
        userAvatar: currentUser.photos?.[0] || currentUser.avatar || "",
        replyText: text.trim()
      });

      const chatKey = getChatRoomKey(currentUser.id, story.userId);
      db.addChatMessage(chatKey, {
        senderId: currentUser.id,
        senderName: currentUser.name || "Sporcu",
        receiverId: story.userId,
        receiverName: story.userName || "Partner",
        partnerAvatar: story.userAvatar || "",
        text: `📸 Hikayene yanıt verdi (${story.tag || 'Hikaye'}): "${text.trim()}"`,
        isStoryReply: true,
        storyId: story.id,
        storyImage: story.image,
        storyTag: story.tag || ""
      });
      soundService.playMessageChime();
      notify.success(`✓ Mesajın ${story.userName} ile sohbet kutusuna düştü!`);
    }
  }

  function render() {
    markCurrentViewed();
    const story = stories[currentIndex];
    if (!story) {
      close();
      return;
    }

    const isSelf = story.userId === currentUser.id;
    // Get all stories belonging to the SAME author so the top progress bars show all segments of this author's stories
    const authorStories = stories.filter(s => (s.userId || s.userName) === (story.userId || story.userName));
    const authorStoryIndex = authorStories.findIndex(s => s.id === story.id);

    const viewersList = isSelf ? getViewersForStory(story) : [];
    const totalViewsCount = isSelf
      ? Math.max(viewersList.length, story.likesCount || 0)
      : (story.likesCount || (Array.isArray(story.viewedBy) ? story.viewedBy.length : 12));

    // Start story music if story has musicTrack
    if (story.musicTrack) {
      soundService.playStoryMusic(story.musicTrack);
    } else {
      soundService.stopStoryMusic();
    }

    modalOverlay.innerHTML = `
      <div id="story-viewer-stage" class="story-viewer-container fade-in" style="position: relative; width: 100%; max-width: 440px; height: 96vh; max-height: 860px; margin: auto; background: #000; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.85); border: 1px solid var(--border-glass-bright);">
        
        <!-- Story Background Media -->
        <img src="${story.image}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;" alt="Hikaye">

        <!-- Dark Vignette Gradient -->
        <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.12) 28%, rgba(0,0,0,0.12) 68%, rgba(0,0,0,0.92) 100%); pointer-events: none;"></div>

        <!-- Top Progress Segments (Shows all stories of current author) -->
        <div style="position: absolute; top: 10px; left: 12px; right: 12px; display: flex; gap: 4px; z-index: 10;">
          ${authorStories.map((st, idx) => `
            <div style="flex: 1; height: 3.5px; background: rgba(255,255,255,0.28); border-radius: 2px; overflow: hidden;">
              <div id="story-progress-${st.id}" style="height: 100%; background: #FFF; width: ${idx < authorStoryIndex ? '100%' : idx === authorStoryIndex ? '0%' : '0%'}; transition: width 0.05s linear;"></div>
            </div>
          `).join('')}
        </div>

        <!-- Author Header Row -->
        <div style="position: absolute; top: 22px; left: 14px; right: 14px; display: flex; align-items: center; justify-content: space-between; z-index: 15;">
          <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
            <div class="member-avatar accent-kor" style="width: 38px; height: 38px; font-size: 14px; border: 2px solid var(--color-kor); overflow: hidden; padding: 0; flex-shrink: 0;">
              ${story.userAvatar ? `<img src="${story.userAvatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : (story.userInitials || "SP")}
            </div>
            <div style="min-width: 0;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <strong style="font-size: 14px; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${story.userName}</strong>
                <span style="font-size: 10.5px; color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.14); padding: 1px 6px; border-radius: 6px; font-weight: 700;">
                  ${authorStoryIndex + 1}/${authorStories.length}
                </span>
                <span style="font-size: 11px; color: rgba(255,255,255,0.7);">· ${formatTimeAgo(story.timestamp)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
                <span style="font-size: 11px; color: var(--color-kor); font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">
                  ${icons.pin(11)} ${story.gymName || "Spor Salonu"}
                </span>
                ${story.musicTrack ? `
                  <span style="font-size: 10.5px; color: #38BDF8; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; background: rgba(0,0,0,0.45); padding: 1px 7px; border-radius: 999px; border: 1px solid rgba(56,189,248,0.35);">
                    🎵 ${story.musicTrack.title}
                  </span>
                ` : ''}
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            ${story.musicTrack ? `
              <button type="button" id="btn-toggle-story-mute" title="Sesi Aç / Kapat" style="background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.18); width: 34px; height: 34px; border-radius: 50%; color: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 14px;">
                ${soundService.isMusicMuted ? '🔇' : '🔊'}
              </button>
            ` : ''}
            ${isSelf ? `
              <button type="button" id="btn-viewer-add-story" title="Yeni Hikaye Ekle" style="background: var(--color-kor-gradient); border: none; height: 32px; padding: 0 10px; border-radius: 999px; color: #FFF; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; box-shadow: 0 2px 10px var(--color-kor-glow);">
                + Yeni Ekle
              </button>
              <button type="button" id="btn-viewer-delete-story" title="Bu Hikayeyi Sil" style="background: rgba(239,68,68,0.22); border: 1px solid rgba(239,68,68,0.45); width: 32px; height: 32px; border-radius: 50%; color: #F87171; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                ${icons.trash ? icons.trash(14) : '🗑️'}
              </button>
            ` : ''}
            <button type="button" id="btn-close-story-viewer" style="background: rgba(0,0,0,0.45); border: 1px solid rgba(255,255,255,0.15); width: 34px; height: 34px; border-radius: 50%; color: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              ${icons.close(18)}
            </button>
          </div>
        </div>

        <!-- Custom Floating Emojis Added to Story -->
        ${Array.isArray(story.emojis) && story.emojis.length > 0 ? `
          <div style="position: absolute; top: 76px; right: 16px; z-index: 12; display: flex; flex-direction: column; gap: 8px; pointer-events: none;">
            ${story.emojis.map(em => `
              <span style="font-size: 32px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.75));">${em}</span>
            `).join('')}
          </div>
        ` : ''}

        <!-- Tap Navigation Zones -->
        <div style="position: absolute; inset: 0; display: flex; z-index: 5;">
          <div id="story-tap-left" style="flex: 1; height: 72%; margin-top: 68px; cursor: pointer;"></div>
          <div id="story-tap-right" style="flex: 1; height: 72%; margin-top: 68px; cursor: pointer;"></div>
        </div>

        <!-- Story Content Overlay (Bottom) -->
        <div style="position: absolute; bottom: 92px; left: 16px; right: 16px; z-index: 10; pointer-events: none;">
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

        <!-- Bottom Action Bar (Reactions & Reply OR Own Story Viewers Trigger) -->
        <div style="position: absolute; bottom: 14px; left: 14px; right: 14px; z-index: 15; display: flex; flex-direction: column; gap: 8px;">
          ${!isSelf ? `
            <!-- Quick Reaction Buttons -->
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; background: rgba(0,0,0,0.52); backdrop-filter: blur(10px); padding: 6px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.12);">
              ${['🔥', '💪', '👏', '⚡', '🎯', '🏆', '❤️‍🔥'].map(emoji => `
                <button type="button" class="btn-story-reaction" data-emoji="${emoji}" style="background: transparent; border: none; font-size: 21px; cursor: pointer; transition: transform 0.15s ease;" title="Tepki ver">
                  ${emoji}
                </button>
              `).join('')}
            </div>

            <!-- Direct Message Input -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="text" id="input-story-reply" placeholder="${story.userName} sporcusuna mesaj yaz..." style="flex: 1; padding: 10px 14px; background: rgba(255,255,255,0.14); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.24); border-radius: 20px; color: #FFF; font-size: 13px; outline: none;">
              <button type="button" id="btn-send-story-reply" style="width: 38px; height: 38px; border-radius: 50%; background: var(--color-kor); color: #FFF; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;">
                ${icons.send(16)}
              </button>
            </div>
          ` : `
            <!-- Own Story Insights Pill (Kaç kişi gördü & Kim ne yazdı) -->
            <button type="button" id="btn-open-story-insights" style="width: 100%; padding: 11px 16px; border-radius: 16px; background: rgba(20, 22, 30, 0.88); backdrop-filter: blur(14px); border: 1px solid rgba(255, 87, 34, 0.45); color: #FFF; display: flex; align-items: center; justify-content: space-between; cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,0.5);">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">👁️</span>
                <div style="text-align: left;">
                  <div style="font-size: 13px; font-weight: 800; color: #FFF;">${totalViewsCount} sporcu hikayeni gördü</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">Görenleri, emojileri ve gelen mesajları görmek için dokun</div>
                </div>
              </div>
              <span style="font-size: 12px; font-weight: 800; color: var(--color-kor); background: rgba(255,87,34,0.15); padding: 5px 10px; border-radius: 999px;">
                Detaylar ▲
              </span>
            </button>
          `}
        </div>

        <!-- Own Story Viewers & Replies Insights Drawer -->
        ${isSelf && isInsightsOpen ? `
          <div id="story-insights-drawer" class="fade-in" style="position: absolute; inset-x: 0; bottom: 0; max-height: 70%; background: #14151B; border-top: 1.5px solid rgba(255,87,34,0.45); border-radius: 22px 22px 0 0; z-index: 30; padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 -10px 40px rgba(0,0,0,0.85);">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-glass); padding-bottom: 10px;">
              <div>
                <h4 style="font-size: 16px; font-weight: 800; color: #FFF; margin: 0;">👁️ Hikayeni Görenler (${totalViewsCount})</h4>
                <span style="font-size: 11.5px; color: var(--text-secondary);">Hikayene yazılan tüm yanıtlar doğrudan Sohbet kutuna da düşer</span>
              </div>
              <button type="button" id="btn-close-story-insights" class="btn-ghost" style="padding: 6px; color: #FFF;">✕</button>
            </div>

            <div style="overflow-y: auto; display: flex; flex-direction: column; gap: 8px; max-height: 48vh;">
              ${viewersList.length === 0 ? `
                <div style="text-align: center; padding: 24px 12px; color: var(--text-secondary); font-size: 13px;">
                  Henüz görüntüleyen olmadı. Salondaki sporcular gördüğünde burada listelenir.
                </div>
              ` : viewersList.map(v => `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); border-radius: 12px; padding: 10px 12px;">
                  <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                    <div class="member-avatar accent-kor" style="width: 38px; height: 38px; font-size: 13px; overflow: hidden; padding: 0; flex-shrink: 0;">
                      ${v.userAvatar ? `<img src="${v.userAvatar}" style="width: 100%; height: 100%; object-fit: cover;">` : (v.userInitials || "SP")}
                    </div>
                    <div style="min-width: 0;">
                      <div style="font-size: 13.5px; font-weight: 800; color: #FFF; display: flex; align-items: center; gap: 6px;">
                        <span>${v.userName}</span>
                        ${v.reaction ? `<span style="font-size: 15px;">${v.reaction}</span>` : ''}
                      </div>
                      <div style="font-size: 11px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${v.replyText ? `💬 "${v.replyText}"` : (v.gymName || 'Hikayeni görüntüledi')}
                      </div>
                    </div>
                  </div>
                  <button type="button" class="btn-viewer-open-chat" data-user-id="${v.userId}" style="padding: 6px 11px; border-radius: 8px; background: var(--color-kor); color: #FFF; border: none; font-size: 11.5px; font-weight: 800; cursor: pointer; flex-shrink: 0;">
                    Mesaj Aç
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

      </div>
    `;

    // Close button
    document.getElementById("btn-close-story-viewer")?.addEventListener("click", close);

    // Mute / Unmute Music
    document.getElementById("btn-toggle-story-mute")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const muted = soundService.toggleStoryMute();
      if (!muted && story.musicTrack) {
        soundService.playStoryMusic(story.musicTrack);
      }
      const btn = document.getElementById("btn-toggle-story-mute");
      if (btn) btn.textContent = muted ? "🔇" : "🔊";
    });

    // Add Another Story directly from Viewer
    document.getElementById("btn-viewer-add-story")?.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
      showStoryCreatorModal(() => {
        onCloseCallback?.();
      });
    });

    // Delete Own Story
    document.getElementById("btn-viewer-delete-story")?.addEventListener("click", (e) => {
      e.stopPropagation();
      db.deleteStory(story.id);
      notify.info("Hikaye silindi.");
      stories = buildOrderedStoriesList();
      if (stories.length === 0) {
        close();
      } else {
        if (currentIndex >= stories.length) currentIndex = stories.length - 1;
        render();
      }
    });

    // Open / Close Story Insights Drawer (Own Story)
    document.getElementById("btn-open-story-insights")?.addEventListener("click", (e) => {
      e.stopPropagation();
      isInsightsOpen = true;
      render();
    });
    document.getElementById("btn-close-story-insights")?.addEventListener("click", (e) => {
      e.stopPropagation();
      isInsightsOpen = false;
      render();
    });

    modalOverlay.querySelectorAll(".btn-viewer-open-chat").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const targetUid = btn.dataset.userId;
        close();
        if (onOpenChat && targetUid) {
          onOpenChat(targetUid);
        }
      });
    });

    // Tap Left / Right navigation
    document.getElementById("story-tap-left")?.addEventListener("click", () => {
      if (isInsightsOpen) {
        isInsightsOpen = false;
        render();
        return;
      }
      prevStory();
    });

    document.getElementById("story-tap-right")?.addEventListener("click", () => {
      if (isInsightsOpen) {
        isInsightsOpen = false;
        render();
        return;
      }
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
