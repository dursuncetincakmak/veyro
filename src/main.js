/**
 * Veyro - Core Mobile Application Entry Point & State Router
 */

import './styles/main.css';
import './styles/onboarding.css';
import './styles/discover.css';
import './styles/appointments.css';
import './styles/routines.css';
import './styles/chat.css';
import './styles/deals.css';
import './styles/admin.css';
import './styles/modal.css';

import { auth } from './services/auth.js';
import { db } from './services/db.js';
import { notify } from './services/notification.js';
import { gymPlacesService } from './services/gymPlacesService.js';
import { locationService } from './services/location.js';

import { renderHeader } from './components/Header.js';
import { renderTabBar } from './components/TabBar.js';
import { renderDiscoverView } from './components/DiscoverView.js';
import { renderAppointmentsView } from './components/AppointmentsView.js';
import { renderRoutinesView } from './components/RoutinesView.js';
import { renderDealsView } from './components/DealsView.js';

import { createOnboardingModal } from './components/OnboardingModal.js';
import { showProfileDetailModal } from './components/ProfileDetailModal.js';
import { showChatModal } from './components/ChatModal.js';
import { showChatInboxModal } from './components/ChatInboxModal.js';
import { renderAdminPortal } from './components/AdminPortal.js';
import { showEditProfileModal } from './components/EditProfileModal.js';
import { showVerificationModal } from './components/VerificationModal.js';
import { showLiveWorkoutRoom } from './components/LiveWorkoutRoom.js';
import { showAttendanceModal } from './components/AttendanceModal.js';
import { showCreateAppointmentModal } from './components/CreateAppointmentModal.js';
import { icons } from './components/icons.js';

class VeyroApp {
  constructor() {
    this.currentTab = 'discover'; // 'discover' | 'appointments' | 'routines' | 'deals'
    this.isAdminOpen = false;
    this.init();
  }

  init() {
    this.appRoot = document.getElementById("app-root");
    if (!this.appRoot) {
      console.error("Root element #app-root not found.");
      return;
    }

    this.renderShell();

    // Check if first-time onboarding is needed
    const user = auth.getCurrentUser();
    if (!user || !user.onboarded) {
      this.openOnboarding();
    } else {
      this.renderCurrentView();
    }

    // Subscribe to DB updates for real-time reactive sync
    db.subscribe("appointments", () => {
      this.updateTabBar();
      if (this.currentTab === "appointments") this.renderCurrentView();
    });

    db.subscribe("deals", () => {
      if (this.currentTab === "deals") this.renderCurrentView();
    });

    db.subscribe("auth_state_changed", () => {
      this.updateHeader();
    });

    db.subscribe("chats_updated", () => {
      this.updateHeader();
    });

    // Secure Admin Route listener (#admin)
    window.addEventListener("hashchange", () => this.checkHashRoute());
    this.checkHashRoute();
  }

  checkHashRoute() {
    if (window.location.hash === "#admin" || window.location.hash === "#veyro-admin") {
      if (auth.isAdmin()) {
        this.openAdminPortal();
      } else {
        const pwd = prompt("Veyro Yönetici Girişi: Lütfen yönetici şifresini girin (Test şifresi: veyro2026admin):");
        if (pwd) {
          const res = auth.loginAdmin(pwd);
          if (res.success) {
            notify.success("Yönetici girişi başarılı!");
            this.updateHeader();
            this.openAdminPortal();
          } else {
            notify.error("Hatalı yönetici şifresi!");
            window.location.hash = "";
          }
        } else {
          window.location.hash = "";
        }
      }
    }
  }

  renderShell() {
    this.appRoot.innerHTML = `
      <div id="header-container"></div>
      <main class="main-content" id="view-container"></main>
      <div id="tabbar-container"></div>
      <div id="modal-container"></div>
      <div id="admin-container"></div>
    `;

    this.headerContainer = document.getElementById("header-container");
    this.viewContainer = document.getElementById("view-container");
    this.tabbarContainer = document.getElementById("tabbar-container");
    this.modalContainer = document.getElementById("modal-container");
    this.adminContainer = document.getElementById("admin-container");

    this.updateHeader();
    this.updateTabBar();
  }


  updateHeader() {
    renderHeader(
      this.headerContainer,
      () => this.openGymSwitcher(),
      () => this.openUserProfileMenu(),
      () => this.handleAdminAccess(),
      () => this.openChatInbox()
    );
  }

  openChatInbox() {
    showChatInboxModal((partnerId) => this.openChat(partnerId));
  }

  updateTabBar() {
    renderTabBar(this.tabbarContainer, this.currentTab, (tab) => {
      this.currentTab = tab;
      this.updateTabBar();
      this.renderCurrentView();
    });
  }

  renderCurrentView() {
    if (!this.viewContainer) return;

    if (this.currentTab === 'discover') {
      renderDiscoverView(
        this.viewContainer,
        (selectedUser) => this.openUserProfile(selectedUser),
        (targetUser) => this.openCreateAppointment(targetUser),
        (partnerId) => this.openChat(partnerId)
      );
    }
 else if (this.currentTab === 'appointments') {
      renderAppointmentsView(
        this.viewContainer,
        () => {
          this.currentTab = 'routines';
          this.updateTabBar();
          this.renderCurrentView();
        },
        (partnerId) => this.openChat(partnerId),
        (appointment, partner) => this.openLiveSession(appointment, partner),
        (appointment, partner) => this.openAttendance(appointment, partner)
      );
    } else if (this.currentTab === 'routines') {
      renderRoutinesView(this.viewContainer, () => {
        this.currentTab = 'appointments';
        this.updateTabBar();
        this.renderCurrentView();
      });
    } else if (this.currentTab === 'deals') {
      renderDealsView(this.viewContainer);
    }
  }

  openOnboarding() {
    createOnboardingModal(this.modalContainer, () => {
      this.modalContainer.innerHTML = "";
      this.updateHeader();
      this.renderCurrentView();
    });
  }

  openUserProfile(user) {
    showProfileDetailModal(
      user,
      (target) => this.openCreateAppointment(target),
      () => {}
    );
  }

  openCreateAppointment(partner, onComplete) {
    if (!partner) return;
    showCreateAppointmentModal(
      partner,
      () => {
        onComplete?.(false);
        this.renderCurrentView();
      },
      (appointment) => {
        onComplete?.(true, appointment);
        this.renderCurrentView();
      }
    );
  }

  openChat(partnerId) {
    showChatModal(partnerId, () => {});
  }

  openLiveSession(appointment, partner) {
    showLiveWorkoutRoom(
      appointment,
      partner,
      () => this.renderCurrentView(),
      (apt, p) => this.openAttendance(apt, p)
    );
  }

  openAttendance(appointment, partner) {
    showAttendanceModal(
      appointment,
      partner,
      () => this.renderCurrentView(),
      () => {}
    );
  }

  async openGymSwitcher() {
    const user = auth.getCurrentUser() || {};
    const coords = await locationService.getCurrentPosition();

    let switcherOverlay = document.getElementById("gym-switcher-overlay");
    if (!switcherOverlay) {
      switcherOverlay = document.createElement("div");
      switcherOverlay.id = "gym-switcher-overlay";
      switcherOverlay.className = "modal-overlay";
      document.body.appendChild(switcherOverlay);
    }

    // Query live Maps places
    notify.info("Haritadan yakındaki spor salonları taranıyor...");
    let liveGyms = await gymPlacesService.fetchNearbyGymsFromMaps(coords);
    const dbGyms = db.getCollection("gyms") || [];
    const combined = [...liveGyms];
    dbGyms.forEach(dbg => {
      if (!combined.some(g => g.name?.toLowerCase() === dbg.name?.toLowerCase())) {
        combined.push(dbg);
      }
    });

    const gyms = locationService.sortGymsByDistance(combined, coords);

    switcherOverlay.innerHTML = `
      <div class="modal-drawer fade-in">
        <div class="drawer-pill-bar"></div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main);">Spor Salonunu Değiştir</h3>
          <button class="btn-ghost" id="btn-close-gym-switcher" style="padding: 6px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
          Haritadaki gerçek spor salonları GPS konumunuza göre listelendi:
        </p>

        <div class="gym-search-bar" style="margin-bottom: 12px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="input-switcher-gym-search" class="gym-search-input" placeholder="Haritada salon ara (Örn: MacFit, Beşiktaş)">
        </div>

        <div class="gym-list-container" id="switcher-gym-list" style="max-height: 50vh; overflow-y: auto;">
          <div class="gym-item-card ${!user.gymId || user.gymId === 'all' ? 'selected' : ''}" data-switch-gym="all">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--bg-surface-card); display: flex; align-items: center; justify-content: center; color: var(--color-kor);">
                ${icons.flame(20)}
              </div>
              <div class="gym-info-col">
                <h4 style="display: flex; align-items: center; gap: 6px;">${icons.pin(14)} Yakınımdaki Tüm Sporcular (Önerilen)</h4>
                <p>Canlı GPS konumuna göre çevrendeki tüm salonlardan partnerler</p>
              </div>
            </div>
            <div class="gym-check-circle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>

          ${gyms.map(g => `
            <div class="gym-item-card ${g.id === user.gymId ? 'selected' : ''}" data-switch-gym="${g.id}">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--bg-surface-card); display: flex; align-items: center; justify-content: center; color: var(--color-kor);">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div class="gym-info-col">
                  <h4>${g.name}</h4>
                  <p>${g.district} · <strong style="color: var(--color-kor);">${g.distanceText || (g.distanceMeters + ' m')}</strong></p>
                </div>
              </div>
              <div class="gym-check-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    switcherOverlay.classList.add("open");

    const close = () => switcherOverlay.classList.remove("open");
    document.getElementById("btn-close-gym-switcher")?.addEventListener("click", close);

    const attachCardListeners = (currentList) => {
      switcherOverlay.querySelectorAll("[data-switch-gym]").forEach(card => {
        card.addEventListener("click", () => {
          const targetGymId = card.dataset.switchGym;
          if (targetGymId === "all") {
            auth.setGym("all");
            notify.success("Yakındaki tüm sporcular listeleniyor!");
          } else {
            const selected = currentList.find(g => g.id === targetGymId);
            if (selected) {
              db.ensureGym(selected);
              auth.setGym(selected.id);
              notify.success(`✓ Aktif salon ${selected.name} olarak seçildi!`);
            }
          }
          close();
          this.updateHeader();
          this.renderCurrentView();
        });
      });
    };

    attachCardListeners(gyms);

    // Live search on Maps
    const searchInput = document.getElementById("input-switcher-gym-search");
    const listBox = document.getElementById("switcher-gym-list");
    let searchDebounce = null;

    searchInput?.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      clearTimeout(searchDebounce);

      if (q.length < 2) {
        // Restore default list
        renderSwitcherList(gyms);
        return;
      }

      if (listBox) {
        listBox.innerHTML = `
          <div style="padding: 20px; text-align: center; color: var(--color-kor); font-size: 12.5px; font-weight: 700;">
            <span class="live-pulse" style="display: inline-block; width: 8px; height: 8px; margin-right: 6px;"></span>
            Haritadan aranıyor: "${q}"...
          </div>
        `;
      }

      searchDebounce = setTimeout(async () => {
        const found = await gymPlacesService.searchGymsOnMaps(q, coords);
        renderSwitcherList(found);
      }, 350);
    });

    const renderSwitcherList = (list) => {
      if (!listBox) return;
      if (list.length === 0) {
        listBox.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">
            Haritada bu isimle spor salonu bulunamadı.
          </div>
        `;
        return;
      }
      listBox.innerHTML = list.map(g => `
        <div class="gym-item-card ${g.id === user.gymId ? 'selected' : ''}" data-switch-gym="${g.id}">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--bg-surface-card); display: flex; align-items: center; justify-content: center; color: var(--color-kor);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="gym-info-col">
              <h4>${g.name}</h4>
              <p>${g.district} · <strong style="color: var(--color-kor);">${g.distanceText || (g.distanceMeters + ' m')}</strong> · Maps</p>
            </div>
          </div>
          <div class="gym-check-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
      `).join('');
      attachCardListeners(list);
    };
  }

  openUserProfileMenu() {
    const user = auth.getCurrentUser() || { name: "Sporcu", initials: "SP", phone: "", verified: false };

    let menuOverlay = document.getElementById("user-menu-overlay");
    if (!menuOverlay) {
      menuOverlay = document.createElement("div");
      menuOverlay.id = "user-menu-overlay";
      menuOverlay.className = "modal-overlay";
      document.body.appendChild(menuOverlay);
    }

    menuOverlay.innerHTML = `
      <div class="modal-drawer fade-in">
        <div class="drawer-pill-bar"></div>
        <div style="text-align: center; margin-bottom: 20px;">
          <div class="profile-large-avatar" style="width: 64px; height: 64px; font-size: 22px;">
            ${user.initials || (user.name ? user.name.substring(0, 2).toUpperCase() : "SP")}
          </div>
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-top: 8px;">${user.name}</h3>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">${user.phone || user.email || ''}</p>
          
          ${user.verified ? `
            <div style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 6px 14px; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: var(--radius-full);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#10B981">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span style="font-size: 12px; font-weight: 700; color: var(--color-emerald);">Telefon Onaylandı (SMS Doğrulandı)</span>
            </div>
          ` : `
            <span class="badge badge-paper" style="font-size: 11px; color: var(--color-amber); display: inline-flex; align-items: center; gap: 4px;">
              ${icons.alert(12)} Telefon Doğrulaması Bekliyor
            </span>
          `}
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
          <button class="btn-secondary" id="btn-menu-edit-profile" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
            ${icons.edit(14)} Profili & Hedefleri Düzenle
          </button>
          
          ${!user.verified ? `
            <button class="btn-secondary" id="btn-menu-verify" style="border-color: var(--color-amber); color: var(--color-amber); display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
              ${icons.phone(14)} Telefon / SMS Doğrulaması Yap
            </button>
          ` : ''}

          <button class="btn-secondary" id="btn-menu-open-admin" style="border-color: var(--color-kor); color: var(--color-kor); font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
            ${icons.settings(14)} Yönetici Masası (Admin Paneli)
          </button>

          <button class="btn-secondary" id="btn-menu-signout" style="color: var(--color-rose); display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
            ${icons.logout(14)} Çıkış Yap
          </button>
        </div>

        <button class="btn-secondary" id="btn-close-user-menu" style="width: 100%;">
          Kapat
        </button>
      </div>
    `;

    menuOverlay.classList.add("open");

    const close = () => menuOverlay.classList.remove("open");
    document.getElementById("btn-close-user-menu")?.addEventListener("click", close);

    // Edit Profile
    document.getElementById("btn-menu-edit-profile")?.addEventListener("click", () => {
      close();
      showEditProfileModal(() => {
        this.updateHeader();
        this.renderCurrentView();
      });
    });

    // Verification (only if unverified)
    document.getElementById("btn-menu-verify")?.addEventListener("click", () => {
      close();
      showVerificationModal('phone', user.phone, () => {
        this.updateHeader();
        this.renderCurrentView();
      });
    });

    // Admin Portal
    document.getElementById("btn-menu-open-admin")?.addEventListener("click", () => {
      close();
      this.handleAdminAccess();
    });

    // Sign out
    document.getElementById("btn-menu-signout")?.addEventListener("click", () => {
      close();
      auth.signOut();
      notify.info("Oturum kapatıldı.");
      this.openOnboarding();
    });
  }

  handleAdminAccess() {
    if (auth.isAdmin()) {
      this.openAdminPortal();
    } else {
      this.showAdminLoginModal();
    }
  }

  showAdminLoginModal() {
    let overlay = document.getElementById("admin-login-modal-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "admin-login-modal-overlay";
      overlay.className = "modal-overlay";
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-drawer fade-in" style="max-height: 85vh;">
        <div class="drawer-pill-bar"></div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0; display: inline-flex; align-items: center; gap: 8px;">
            ${icons.lock(18)} Veyro Yönetici Girişi
          </h3>
          <button class="btn-ghost" id="btn-close-admin-login" style="padding: 6px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.45; margin-bottom: 16px;">
          Salon yönetimi, moderatör masası, SMS/E-posta ağ geçitleri, Google Maps ve Firebase anahtarları için yönetici yetkilendirmesi gereklidir.
        </p>

        <div style="margin-bottom: 14px;">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: block; margin-bottom: 6px;">
            Yönetici Şifresi
          </label>
          <input type="password" id="input-admin-password-modal" placeholder="Şifrenizi girin"
            style="width: 100%; border-radius: 12px; padding: 14px 16px; font-size: 14px; background: var(--bg-surface-elevated); color: #FFF; border: 1.5px solid var(--border-glass); outline: none;">
        </div>

        <div style="margin-bottom: 18px; text-align: center;">
          <button class="btn-ghost" id="btn-quick-fill-admin-pwd" type="button" style="padding: 6px 12px; font-size: 11.5px; font-weight: 700; color: var(--color-kor); background: rgba(255, 87, 34, 0.12); border: 1px solid rgba(255, 87, 34, 0.3); border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            ${icons.key(13)} Test Şifresini Doldur (veyro2026admin)
          </button>
        </div>

        <button class="btn-kor" id="btn-submit-admin-login-modal" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
          ${icons.rocket(15)} Yönetici Masasına Gir
        </button>
      </div>
    `;

    overlay.classList.add("open");

    const close = () => overlay.classList.remove("open");
    document.getElementById("btn-close-admin-login")?.addEventListener("click", close);

    const pwdInput = document.getElementById("input-admin-password-modal");
    setTimeout(() => pwdInput?.focus(), 150);

    document.getElementById("btn-quick-fill-admin-pwd")?.addEventListener("click", () => {
      if (pwdInput) pwdInput.value = "veyro2026admin";
    });

    const attemptLogin = () => {
      const pwd = pwdInput?.value.trim() || "";
      if (!pwd) {
        notify.error("Lütfen yönetici şifresini girin.");
        return;
      }
      const res = auth.loginAdmin(pwd);
      if (res.success) {
        notify.success("✓ Yönetici girişi başarılı!");
        close();
        this.updateHeader();
        this.openAdminPortal();
      } else {
        notify.error("Hatalı yönetici şifresi! (Test şifresi: veyro2026admin)");
        if (pwdInput) pwdInput.style.borderColor = "var(--color-rose)";
      }
    };

    document.getElementById("btn-submit-admin-login-modal")?.addEventListener("click", attemptLogin);
    pwdInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") attemptLogin();
    });
  }

  openAdminPortal() {
    renderAdminPortal(
      this.adminContainer,
      () => {
        this.adminContainer.innerHTML = "";
        this.updateHeader();
        this.renderCurrentView();
      }
    );
  }
}

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.veyro = new VeyroApp();
});
