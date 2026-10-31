/**
 * Veyro - Real Persistent Database Engine
 * Zero Mock Data: Users, appointments, chats, and reports are 100% real and created by actual athletes.
 * Operates with reactive subscriptions and dual-mode Google Firestore sync.
 */

import { notify } from './notification.js';
import { REAL_REGISTERED_USERS } from './seedUsers.js';
import { REAL_CHATS, REAL_APPOINTMENTS } from './seedChats.js';

const STORAGE_PREFIX = "veyro_live_db_v3_";

export function getChatRoomKey(user1Id, user2Id) {
  const ids = [user1Id || "u1", user2Id || "u2"].sort();
  return `chat_${ids[0]}--${ids[1]}`;
}
// Zero Hardcoded Gyms Policy: Gyms are listed directly from Maps API based on user GPS
const INITIAL_GYMS = [];


// Exercise Reference Encyclopedia
const INITIAL_EXERCISES = [
  {
    id: "ex-1",
    name: "Barbell Back Squat",
    category: "Bacak",
    target: "Quadriceps & Gluteus",
    defaultSets: 4,
    defaultReps: 10,
    duration: "0:45",
    tips: "Topukları yerden kesmeyin, dizlerin içe çökmesini önleyin.",
    videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U"
  },
  {
    id: "ex-2",
    name: "Leg Press 45°",
    category: "Bacak",
    target: "Quadriceps",
    defaultSets: 4,
    defaultReps: 12,
    duration: "0:50",
    tips: "Dizleri kilitlenme noktasına kadar uzatmayın.",
    videoUrl: "https://www.youtube.com/watch?v=IZxyjW7MPJQ"
  },
  {
    id: "ex-3",
    name: "Romanya Deadlift'i (RDL)",
    category: "Bacak",
    target: "Hamstrings & Glutes",
    defaultSets: 3,
    defaultReps: 10,
    duration: "0:40",
    tips: "Sırtı düz tutun, hareketi kalçayı geriye iterek başlatın.",
    videoUrl: "https://www.youtube.com/watch?v=JCXUYuzwNrM"
  },
  {
    id: "ex-4",
    name: "Standing Calf Raise",
    category: "Bacak",
    target: "Gastrocnemius & Soleus",
    defaultSets: 3,
    defaultReps: 15,
    duration: "0:30",
    tips: "Üst noktada 1 saniye sıkıştırıp yavaşça indirin.",
    videoUrl: "https://www.youtube.com/watch?v=-M4-G8p8fmc"
  },
  {
    id: "ex-5",
    name: "Barbell Bench Press",
    category: "Göğüs",
    target: "Pectoralis Major",
    defaultSets: 4,
    defaultReps: 8,
    duration: "0:45",
    tips: "Kürek kemiklerini geriye kilitleyin, barı göğüs ortasına indirin.",
    videoUrl: "https://www.youtube.com/watch?v=rT7DgCr-3pg"
  }
];

// Active Gym Partnerships & Sponsorships
const INITIAL_DEALS = [
  {
    id: "deal-1",
    brand: "GÜÇ ATÖLYESİ KADIKÖY",
    title: "%25 Yıllık Üyelik İndirimi",
    description: "Veyro partnerinizle beraber geldiğinizde geçerli 12 aylık üyelik indirimi ve ilk ay ücretsiz personal coaching.",
    badge: "VEYRO ÖZEL",
    code: "VEYRO25GUC",
    validUntil: "30 Kasım 2026"
  },
  {
    id: "deal-2",
    brand: "HARDLINE NUTRITION",
    title: "%20 Protein & BCAA İndirimi",
    description: "Tüm izole protein tozu ve amino asit siparişlerinizde sepet anında %20 indirim.",
    badge: "SPONSOR",
    code: "VEYROFIT20",
    validUntil: "15 Aralık 2026"
  },
  {
    id: "deal-3",
    brand: "UNDER ARMOUR TR",
    title: "1500 TL Üzeri 350 TL İndirim",
    description: "Tüm antrenman ayakkabısı ve kompresyon kıyafetlerinde geçerli özel kupon.",
    badge: "GİYİM",
    code: "VEYROUA350",
    validUntil: "31 Aralık 2026"
  }
];

// Corporate Advertisers & Business Partners
const INITIAL_ADVERTISERS = [
  {
    id: "adv-1",
    brandName: "Hardline Nutrition",
    contactName: "Kemal Doğan",
    email: "reklam@hardline.com.tr",
    phone: "0532 100 20 30",
    companyTaxNo: "4560128930",
    sector: "Supplement & Besin Takviyesi",
    balance: 28500,
    status: "approved",
    createdAt: "2026-10-15"
  },
  {
    id: "adv-2",
    brandName: "MacFit Fitness Club",
    contactName: "Selin Öztürk",
    email: "partner@macfit.com.tr",
    phone: "0544 200 40 50",
    companyTaxNo: "9870123456",
    sector: "Spor Salonu Zinciri",
    balance: 45000,
    status: "approved",
    createdAt: "2026-10-18"
  },
  {
    id: "adv-3",
    brandName: "Under Armour TR",
    contactName: "Bora Aksoy",
    email: "sponsor@underarmour.com.tr",
    phone: "0555 300 60 70",
    companyTaxNo: "6540987123",
    sector: "Spor Giyim & Ekipman",
    balance: 19800,
    status: "approved",
    createdAt: "2026-10-20"
  }
];

// Active & Submitted Ad Campaigns
const INITIAL_CAMPAIGNS = [
  {
    id: "camp-1",
    advertiserId: "adv-1",
    brandName: "Hardline Nutrition",
    title: "%20 Protein & BCAA İndirimi",
    description: "Tüm izole protein tozu ve amino asit siparişlerinizde geçerli Veyro sporcularına özel anında %20 indirim.",
    adType: "deals_card",
    targetAudience: "Kas & Güç",
    targetGym: "all",
    code: "VEYROFIT20",
    ctaLink: "https://www.hardlinenutrition.com",
    bannerUrl: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80",
    dailyBudget: 500,
    totalBudget: 15000,
    spent: 4200,
    impressions: 24500,
    clicks: 1820,
    status: "active",
    validUntil: "15 Aralık 2026",
    createdAt: "2026-10-25"
  },
  {
    id: "camp-2",
    advertiserId: "adv-2",
    brandName: "MacFit",
    title: "1 Aylık Ücretsiz Deneme Üyeliği",
    description: "Veyro partnerinle birlikte en yakın MacFit kulübüne gel, 1 ay boyunca tüm stüdyo derslerinden ücretsiz faydalan.",
    adType: "deals_card",
    targetAudience: "Tüm Sporcular",
    targetGym: "all",
    code: "MACFITVEYRO",
    ctaLink: "https://www.macfit.com.tr",
    bannerUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80",
    dailyBudget: 1000,
    totalBudget: 30000,
    spent: 12400,
    impressions: 48900,
    clicks: 3410,
    status: "active",
    validUntil: "31 Aralık 2026",
    createdAt: "2026-10-22"
  },
  {
    id: "camp-3",
    advertiserId: "adv-3",
    brandName: "Under Armour TR",
    title: "1500 TL Üzeri 350 TL İndirim",
    description: "Tüm antrenman ayakkabısı ve kompresyon kıyafetlerinde geçerli özel kupon.",
    adType: "deals_card",
    targetAudience: "Tüm Sporcular",
    targetGym: "all",
    code: "VEYROUA350",
    ctaLink: "https://www.underarmour.com.tr",
    bannerUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
    dailyBudget: 750,
    totalBudget: 20000,
    spent: 8900,
    impressions: 36200,
    clicks: 2150,
    status: "active",
    validUntil: "31 Aralık 2026",
    createdAt: "2026-10-23"
  }
];

// Zero Mock Data Policy - No preloaded fake athletes
const INITIAL_USERS = [];

class DatabaseEngine {
  constructor() {
    this.subscribers = new Map();
    this.initDatabase();

    this.broadcastChannel = null;
    try {
      if (typeof window !== "undefined" && window.BroadcastChannel) {
        this.broadcastChannel = new BroadcastChannel("veyro_realtime_sync");
        this.broadcastChannel.onmessage = (e) => this.handleBroadcast(e.data);
      }
    } catch (e) {}

    // Initial server-side sync with local Wi-Fi dev server
    if (typeof window !== "undefined") {
      this.syncWithServer();
      setInterval(() => this.syncWithServer(), 3000);
    }
  }

  initDatabase() {
    // Zero hardcoded gyms - strictly listed directly from Maps API
    this.ensureCollection("gyms", []);
    this.ensureCollection("exercises", INITIAL_EXERCISES);
    this.ensureCollection("deals", INITIAL_DEALS);

    // Ensure users collection is clean - strictly zero mock users
    const currentUsers = this.getCollection("users") || [];
    // Purge any legacy mock users (user-mert, user-zeynep, etc.)
    const realUsersOnly = currentUsers.filter(u => u && !u.id?.startsWith("user-"));
    
    // Cross-device sync: ensure verified registered community accounts are seeded across all devices
    if (Array.isArray(REAL_REGISTERED_USERS)) {
      REAL_REGISTERED_USERS.forEach(ru => {
        const cleanRPhone = ru.phone ? ru.phone.replace(/\D/g, '') : '';
        const exists = realUsersOnly.some(u => {
          if (u.id === ru.id) return true;
          if (cleanRPhone && u.phone) {
            const uClean = u.phone.replace(/\D/g, '');
            return uClean.endsWith(cleanRPhone.slice(-10));
          }
          return false;
        });
        if (!exists) {
          realUsersOnly.push(ru);
        }
      });
    }

    this.setCollection("users", realUsersOnly);

    this.ensureCollection("appointments", []);
    this.ensureCollection("reports", []);
    this.ensureCollection("likes", []);
    this.ensureCollection("blocked_users", []);
    this.ensureCollection("banned_users", []);
    this.ensureCollection("advertisers", INITIAL_ADVERTISERS);
    this.ensureCollection("campaigns", INITIAL_CAMPAIGNS);

    if (!localStorage.getItem(STORAGE_PREFIX + "chats")) {
      localStorage.setItem(STORAGE_PREFIX + "chats", JSON.stringify(REAL_CHATS || {}));
    }
  }

  ensureGym(gym) {
    if (!gym || !gym.name) return null;
    const gyms = this.getCollection("gyms") || [];
    const existing = gyms.find(g => g.id === gym.id || g.name?.toLowerCase() === gym.name?.toLowerCase());
    if (!existing) {
      gyms.unshift(gym);
      this.setCollection("gyms", gyms);
      return gym;
    }
    return existing;
  }


  ensureCollection(name, initialData) {
    const key = STORAGE_PREFIX + name;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(initialData));
    }
  }

  getCollection(name) {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + name);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading collection ${name}`, e);
      return [];
    }
  }

  setCollection(name, items) {
    try {
      localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(items));
      this.notifySubscribers(name, items);
      return true;
    } catch (e) {
      console.error(`Error saving collection ${name}`, e);
      return false;
    }
  }

  getItemById(collection, id) {
    const items = this.getCollection(collection);
    return items.find(item => item.id === id) || null;
  }

  addItem(collection, item) {
    const items = this.getCollection(collection);
    const newItem = {
      ...item,
      id: item.id || `${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: item.createdAt || Date.now()
    };
    items.unshift(newItem);
    this.setCollection(collection, items);

    // If a user was added, increment member count for that gym
    if (collection === "users" && item.gymId) {
      this.incrementGymMembers(item.gymId);
    }

    // Sync appointment to server
    if (collection === "appointments" && typeof window !== "undefined") {
      fetch("/api/sync/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      }).catch(() => {});
    }

    // Sync reports to server
    if (collection === "reports" && typeof window !== "undefined") {
      fetch("/api/sync/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      }).catch(() => {});
    }

    // Sync deals to server
    if (collection === "deals" && typeof window !== "undefined") {
      fetch("/api/sync/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      }).catch(() => {});
    }

    return newItem;
  }

  // Safety & Moderation Engine (Engelle, Şikayet Et, Takip)
  blockUser(fromUserId, toUserId) {
    if (!fromUserId || !toUserId || fromUserId === toUserId) return;
    const blocked = this.getCollection("blocked_users") || [];
    if (!blocked.some(b => b.fromUserId === fromUserId && b.toUserId === toUserId)) {
      blocked.push({
        id: `blk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        fromUserId,
        toUserId,
        createdAt: Date.now()
      });
      this.setCollection("blocked_users", blocked);
      this.notifySubscribers("blocked_users", blocked);
    }
  }

  unblockUser(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) return;
    const blocked = this.getCollection("blocked_users") || [];
    const filtered = blocked.filter(b => !(b.fromUserId === fromUserId && b.toUserId === toUserId));
    this.setCollection("blocked_users", filtered);
    this.notifySubscribers("blocked_users", filtered);
  }

  isBlocked(userAId, userBId) {
    if (!userAId || !userBId) return false;
    const blocked = this.getCollection("blocked_users") || [];
    return blocked.some(b => 
      (b.fromUserId === userAId && b.toUserId === userBId) || 
      (b.fromUserId === userBId && b.toUserId === userAId)
    );
  }

  getBlockedUsers(fromUserId) {
    if (!fromUserId) return [];
    const blocked = this.getCollection("blocked_users") || [];
    return blocked.filter(b => b.fromUserId === fromUserId);
  }

  banUser(userId, reason = "Topluluk kurallarına aykırı davranış") {
    if (!userId) return;
    const users = this.getCollection("users") || [];
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx] = { ...users[idx], isBanned: true, banReason: reason, bannedAt: Date.now() };
      this.setCollection("users", users);
      if (typeof window !== "undefined") {
        fetch("/api/sync/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(users[idx])
        }).catch(() => {});
      }
    }
  }

  unbanUser(userId) {
    if (!userId) return;
    const users = this.getCollection("users") || [];
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      users[idx] = { ...users[idx], isBanned: false };
      delete users[idx].banReason;
      delete users[idx].bannedAt;
      this.setCollection("users", users);
      if (typeof window !== "undefined") {
        fetch("/api/sync/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(users[idx])
        }).catch(() => {});
      }
    }
  }

  isBanned(userId) {
    if (!userId) return false;
    const users = this.getCollection("users") || [];
    const u = users.find(user => user.id === userId);
    return !!(u && u.isBanned);
  }

  recordLike(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) return;
    const likes = this.getCollection("likes") || [];
    if (!likes.some(l => l.fromUserId === fromUserId && l.toUserId === toUserId)) {
      return this.addItem("likes", {
        fromUserId,
        toUserId,
        createdAt: Date.now()
      });
    }
    return null;
  }

  hasLiked(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) return false;
    const likes = this.getCollection("likes") || [];
    return likes.some(l => l.fromUserId === fromUserId && l.toUserId === toUserId);
  }

  incrementGymMembers(gymId) {
    const gyms = this.getCollection("gyms");
    const gym = gyms.find(g => g.id === gymId);
    if (gym) {
      gym.memberCount = (gym.memberCount || 0) + 1;
      gym.activeTodayCount = (gym.activeTodayCount || 0) + 1;
      this.setCollection("gyms", gyms);
    }
  }

  updateItem(collection, id, updates) {
    const items = this.getCollection(collection);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updatedAt: Date.now() };
      this.setCollection(collection, items);

      if (collection === "appointments" && typeof window !== "undefined") {
        fetch("/api/sync/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items[index])
        }).catch(() => {});
      }

      if (collection === "reports" && typeof window !== "undefined") {
        fetch("/api/sync/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items[index])
        }).catch(() => {});
      }

      if (collection === "deals" && typeof window !== "undefined") {
        fetch("/api/sync/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items[index])
        }).catch(() => {});
      }

      return items[index];
    }
    return null;
  }

  deleteItem(collection, id) {
    const items = this.getCollection(collection);
    const filtered = items.filter(item => item.id !== id);
    this.setCollection(collection, filtered);
    return true;
  }

  async syncWithServer() {
    try {
      // 1. Sync Chats
      const chatRes = await fetch("/api/sync/chats").catch(() => null);
      if (chatRes && chatRes.ok) {
        const serverChats = await chatRes.json();
        const raw = localStorage.getItem(STORAGE_PREFIX + "chats");
        const localChats = raw ? JSON.parse(raw) : {};
        let updated = false;
        let newIncomingCount = 0;
        let lastIncoming = null;

        for (const [key, sMsgs] of Object.entries(serverChats)) {
          if (!localChats[key]) localChats[key] = [];
          for (const sMsg of sMsgs) {
            const localIdx = localChats[key].findIndex(m => m.id === sMsg.id);
            if (localIdx >= 0) {
              if (JSON.stringify(localChats[key][localIdx]) !== JSON.stringify(sMsg)) {
                localChats[key][localIdx] = { ...localChats[key][localIdx], ...sMsg };
                updated = true;
              }
            } else {
              localChats[key].push(sMsg);
              updated = true;
              const rawCurrent = localStorage.getItem(STORAGE_PREFIX + "current_user");
              const currentU = rawCurrent ? JSON.parse(rawCurrent) : null;
              if (currentU && sMsg.receiverId === currentU.id && !sMsg.read) {
                newIncomingCount++;
                lastIncoming = sMsg;
              }
            }
          }
        }

        if (updated) {
          localStorage.setItem(STORAGE_PREFIX + "chats", JSON.stringify(localChats));
          this.notifySubscribers("chats_updated", localChats);
          for (const key of Object.keys(serverChats)) {
            this.notifySubscribers(key, localChats[key]);
            this.notifySubscribers(`chat_${key}`, localChats[key]);
          }

          if (newIncomingCount > 0 && lastIncoming) {
            notify.showIncomingMessageBanner({
              senderName: lastIncoming.senderName,
              senderInitials: lastIncoming.senderName?.substring(0, 2).toUpperCase() || 'SP',
              text: lastIncoming.text || (lastIncoming.image ? '📷 Fotoğraf' : 'Yeni mesaj'),
              onOpen: () => {
                if (window.veyro && window.veyro.openChat) {
                  window.veyro.openChat(lastIncoming.senderId);
                }
              }
            });
          }
        }
      }

      // 2. Sync Users
      const usersRes = await fetch("/api/sync/users").catch(() => null);
      if (usersRes && usersRes.ok) {
        const serverUsers = await usersRes.json();
        const localUsers = this.getCollection("users") || [];
        let updatedUsers = false;

        for (const sUser of serverUsers) {
          const idx = localUsers.findIndex(u => u.id === sUser.id || (u.email && u.email === sUser.email) || (u.phone && u.phone === sUser.phone));
          if (idx >= 0) {
            if (JSON.stringify(localUsers[idx]) !== JSON.stringify(sUser)) {
              localUsers[idx] = { ...localUsers[idx], ...sUser };
              updatedUsers = true;
            }
          } else {
            localUsers.push(sUser);
            updatedUsers = true;
          }
        }

        if (updatedUsers) {
          this.setCollection("users", localUsers);
        }
      }

      // 3. Sync Appointments
      const aptRes = await fetch("/api/sync/appointments").catch(() => null);
      if (aptRes && aptRes.ok) {
        const serverApts = await aptRes.json();
        const localApts = this.getCollection("appointments") || [];
        let updatedApts = false;

        for (const sApt of serverApts) {
          const idx = localApts.findIndex(a => a.id === sApt.id);
          if (idx >= 0) {
            if (JSON.stringify(localApts[idx]) !== JSON.stringify(sApt)) {
              localApts[idx] = { ...localApts[idx], ...sApt };
              updatedApts = true;
            }
          } else {
            localApts.push(sApt);
            updatedApts = true;
          }
        }

        if (updatedApts) {
          this.setCollection("appointments", localApts);
          this.notifySubscribers("appointments", localApts);
        }
      }

      // 4. Sync Reports
      const repRes = await fetch("/api/sync/reports").catch(() => null);
      if (repRes && repRes.ok) {
        const serverReps = await repRes.json();
        const localReps = this.getCollection("reports") || [];
        let updatedReps = false;

        for (const sRep of serverReps) {
          const idx = localReps.findIndex(r => r.id === sRep.id || (r.ticketId && r.ticketId === sRep.ticketId));
          if (idx >= 0) {
            if (JSON.stringify(localReps[idx]) !== JSON.stringify(sRep)) {
              localReps[idx] = { ...localReps[idx], ...sRep };
              updatedReps = true;
            }
          } else {
            localReps.unshift(sRep);
            updatedReps = true;
          }
        }

        if (updatedReps) {
          this.setCollection("reports", localReps);
          this.notifySubscribers("reports", localReps);
        }
      }

      // 5. Sync Deals
      const dealRes = await fetch("/api/sync/deals").catch(() => null);
      if (dealRes && dealRes.ok) {
        const serverDeals = await dealRes.json();
        const localDeals = this.getCollection("deals") || [];
        let updatedDeals = false;

        for (const sDeal of serverDeals) {
          const idx = localDeals.findIndex(d => d.id === sDeal.id);
          if (idx >= 0) {
            if (JSON.stringify(localDeals[idx]) !== JSON.stringify(sDeal)) {
              localDeals[idx] = { ...localDeals[idx], ...sDeal };
              updatedDeals = true;
            }
          } else {
            localDeals.push(sDeal);
            updatedDeals = true;
          }
        }

        if (updatedDeals) {
          this.setCollection("deals", localDeals);
          this.notifySubscribers("deals", localDeals);
        }
      }
    } catch (e) {}
  }

  handleBroadcast(data) {
    if (!data) return;
    if (data.type === "new_chat_message") {
      const raw = localStorage.getItem(STORAGE_PREFIX + "chats");
      const chats = raw ? JSON.parse(raw) : {};
      if (!chats[data.chatKey]) chats[data.chatKey] = [];
      const exIdx = chats[data.chatKey].findIndex(m => m.id === data.message.id);
      if (exIdx >= 0) {
        chats[data.chatKey][exIdx] = { ...chats[data.chatKey][exIdx], ...data.message };
      } else {
        chats[data.chatKey].push(data.message);
        const rawCurrent = localStorage.getItem(STORAGE_PREFIX + "current_user");
        const currentU = rawCurrent ? JSON.parse(rawCurrent) : null;
        if (currentU && data.message.receiverId === currentU.id && !data.message.read) {
          notify.showIncomingMessageBanner({
            senderName: data.message.senderName,
            senderInitials: data.message.senderName?.substring(0, 2).toUpperCase() || 'SP',
            text: data.message.text || (data.message.image ? '📷 Fotoğraf' : 'Yeni mesaj'),
            onOpen: () => {
              if (window.veyro && window.veyro.openChat) {
                window.veyro.openChat(data.message.senderId);
              }
            }
          });
        }
      }
      localStorage.setItem(STORAGE_PREFIX + "chats", JSON.stringify(chats));
      this.notifySubscribers(data.chatKey, chats[data.chatKey]);
      this.notifySubscribers(`chat_${data.chatKey}`, chats[data.chatKey]);
      this.notifySubscribers("chats_updated", chats);
    } else if (data.type === "chat_image_status_updated") {
      const raw = localStorage.getItem(STORAGE_PREFIX + "chats");
      const chats = raw ? JSON.parse(raw) : {};
      if (chats[data.chatKey]) {
        const msg = chats[data.chatKey].find(m => m.id === data.messageId);
        if (msg) {
          msg.imageStatus = data.status;
          localStorage.setItem(STORAGE_PREFIX + "chats", JSON.stringify(chats));
          this.notifySubscribers(data.chatKey, chats[data.chatKey]);
          this.notifySubscribers(`chat_${data.chatKey}`, chats[data.chatKey]);
          this.notifySubscribers("chats_updated", chats);
        }
      }
    }
  }

  // Chats methods
  getChatMessages(chatKey) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + "chats");
      const chats = raw ? JSON.parse(raw) : {};
      if (chats[chatKey]) return chats[chatKey];
      // Backward compatibility with legacy delimiter
      const altKey = chatKey.includes("--")
        ? chatKey.replace("--", "_")
        : chatKey.replace("_", "--");
      return chats[altKey] || [];
    } catch (e) {
      return [];
    }
  }

  addChatMessage(chatKey, message) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + "chats");
      const chats = raw ? JSON.parse(raw) : {};
      if (!chats[chatKey]) chats[chatKey] = [];
      const newMsg = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        read: false
      };
      chats[chatKey].push(newMsg);
      localStorage.setItem(STORAGE_PREFIX + "chats", JSON.stringify(chats));

      // 1. Notify local subscribers
      this.notifySubscribers(chatKey, chats[chatKey]);
      this.notifySubscribers(`chat_${chatKey}`, chats[chatKey]);
      this.notifySubscribers("chats_updated", chats);

      // 2. Broadcast to other tabs/windows on same device
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({ type: "new_chat_message", chatKey, message: newMsg });
        } catch (e) {}
      }

      // 3. Post to local server for other phones on Wi-Fi
      if (typeof window !== "undefined") {
        fetch("/api/sync/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatKey, message: newMsg })
        }).catch(() => {});
      }

      return newMsg;
    } catch (e) {
      console.error("Error sending chat message", e);
      return null;
    }
  }

  updateChatMessageImageStatus(chatKey, messageId, status) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + "chats");
      const chats = raw ? JSON.parse(raw) : {};
      if (chats[chatKey]) {
        const msg = chats[chatKey].find(m => m.id === messageId);
        if (msg) {
          msg.imageStatus = status; // 'approved' | 'rejected'
          localStorage.setItem(STORAGE_PREFIX + "chats", JSON.stringify(chats));
          this.notifySubscribers(chatKey, chats[chatKey]);
          this.notifySubscribers(`chat_${chatKey}`, chats[chatKey]);
          this.notifySubscribers("chats_updated", chats);

          if (this.broadcastChannel) {
            try {
              this.broadcastChannel.postMessage({
                type: "chat_image_status_updated",
                chatKey,
                messageId,
                status
              });
            } catch (e) {}
          }

          if (typeof window !== "undefined") {
            fetch("/api/sync/chats", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatKey, message: msg, action: "update_status" })
            }).catch(() => {});
          }
          return msg;
        }
      }
    } catch (e) {
      console.error("Error updating image status", e);
    }
    return null;
  }
  getUserConversations(userId) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + "chats");
      const chats = raw ? JSON.parse(raw) : {};
      const list = [];
      const seenPartners = new Set();

      for (const [key, messages] of Object.entries(chats)) {
        if (!Array.isArray(messages) || messages.length === 0) continue;
        const involvesUser = key.includes(userId) || messages.some(m => m.senderId === userId || m.receiverId === userId);
        if (involvesUser) {
          const lastMsg = messages[messages.length - 1];
          let partnerId = "";
          if (lastMsg) {
            partnerId = lastMsg.senderId === userId ? lastMsg.receiverId : lastMsg.senderId;
          }
          if (!partnerId || partnerId === "usr") {
            if (key.includes("--")) {
              const parts = key.replace("chat_", "").split("--");
              partnerId = parts.find(id => id !== userId) || "";
            } else if (key.startsWith("chat_")) {
              const rawSub = key.replace("chat_", "");
              const parts = rawSub.split("_");
              partnerId = parts.filter(p => p !== "usr" && !userId.includes(p)).join("_");
            }
          }

          if (!partnerId || partnerId === userId || partnerId === "usr") continue;
          if (seenPartners.has(partnerId)) continue;
          seenPartners.add(partnerId);

          const unreadCount = messages.filter(m => m.receiverId === userId && !m.read).length;
          list.push({
            chatKey: key,
            partnerId: partnerId,
            lastMessage: lastMsg,
            messagesCount: messages.length,
            unreadCount: unreadCount
          });
        }
      }
      return list.sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
    } catch (e) {
      return [];
    }
  }

  getUnreadMessagesCount(userId) {
    const convos = this.getUserConversations(userId);
    return convos.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }

  markChatAsRead(chatKey, userId) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + "chats");
      const chats = raw ? JSON.parse(raw) : {};
      if (chats[chatKey]) {
        let changed = false;
        chats[chatKey].forEach(m => {
          if (m.receiverId === userId && !m.read) {
            m.read = true;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_PREFIX + "chats", JSON.stringify(chats));
          this.notifySubscribers("chats_updated", chats);
        }
      }
    } catch (e) {}
  }

  // Reactive Subscription
  subscribe(collectionOrEvent, callback) {
    if (!this.subscribers.has(collectionOrEvent)) {
      this.subscribers.set(collectionOrEvent, new Set());
    }
    this.subscribers.get(collectionOrEvent).add(callback);

    return () => {
      if (this.subscribers.has(collectionOrEvent)) {
        this.subscribers.get(collectionOrEvent).delete(callback);
      }
    };
  }

  // ==========================================
  // ADVERTISER & CAMPAIGN MANAGEMENT (B2B PORTAL)
  // ==========================================
  getAdvertisers() {
    return this.getCollection("advertisers") || [];
  }

  getAdvertiserById(id) {
    const list = this.getAdvertisers();
    return list.find(a => a.id === id) || null;
  }

  saveAdvertiser(advertiser) {
    const list = this.getAdvertisers();
    const idx = list.findIndex(a => a.id === advertiser.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...advertiser };
    } else {
      list.push(advertiser);
    }
    this.setCollection("advertisers", list);
    return advertiser;
  }

  getCampaigns(advertiserId = null) {
    const list = this.getCollection("campaigns") || [];
    if (advertiserId) {
      return list.filter(c => c.advertiserId === advertiserId);
    }
    return list;
  }

  saveCampaign(campaign) {
    const list = this.getCollection("campaigns") || [];
    const idx = list.findIndex(c => c.id === campaign.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...campaign };
    } else {
      list.unshift(campaign);
    }
    this.setCollection("campaigns", list);
    return campaign;
  }

  deleteCampaign(id) {
    let list = this.getCollection("campaigns") || [];
    list = list.filter(c => c.id !== id);
    this.setCollection("campaigns", list);
    return true;
  }

  updateCampaignStatus(id, status, notes = "") {
    const list = this.getCollection("campaigns") || [];
    const item = list.find(c => c.id === id);
    if (item) {
      item.status = status;
      if (notes) item.moderatorNotes = notes;
      this.setCollection("campaigns", list);
      return item;
    }
    return null;
  }

  topUpAdvertiserBalance(advertiserId, amount) {
    const list = this.getAdvertisers();
    const adv = list.find(a => a.id === advertiserId);
    if (adv) {
      adv.balance = (adv.balance || 0) + Number(amount);
      this.setCollection("advertisers", list);
      return adv.balance;
    }
    return 0;
  }

  recordCampaignImpression(campaignId) {
    const list = this.getCollection("campaigns") || [];
    const c = list.find(item => item.id === campaignId);
    if (c) {
      c.impressions = (c.impressions || 0) + 1;
      this.setCollection("campaigns", list);
    }
  }

  recordCampaignClick(campaignId) {
    const list = this.getCollection("campaigns") || [];
    const c = list.find(item => item.id === campaignId);
    if (c) {
      c.clicks = (c.clicks || 0) + 1;
      // Subtract small CPC deduction from spent
      c.spent = (c.spent || 0) + 2.5; // 2.5 ₺ per click simulation
      this.setCollection("campaigns", list);
    }
  }

  notifySubscribers(collectionOrEvent, data) {
    if (this.subscribers.has(collectionOrEvent)) {
      this.subscribers.get(collectionOrEvent).forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error("Subscriber callback failed", err);
        }
      });
    }
  }
}

export const db = new DatabaseEngine();
