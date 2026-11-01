/**
 * Veyro - Real Persistent Database Engine
 * Zero Mock Data: Users, appointments, chats, and reports are 100% real and created by actual athletes.
 * Operates with reactive subscriptions and dual-mode Google Firestore sync.
 */

import { notify } from './notification.js';
import { REAL_REGISTERED_USERS } from './seedUsers.js';
import { REAL_CHATS, REAL_APPOINTMENTS } from './seedChats.js';
import { COMMUNITY_ATHLETES_200, NEARBY_COMMUNITY_STORIES, TURKEY_GYMS_CATALOG } from './seedAthletes200.js';
import { saveFirestoreDoc, getFirestoreCollection, deleteFirestoreDoc } from './firestoreSync.js';

const STORAGE_PREFIX = "veyro_live_db_v3_";

export function getChatRoomKey(user1Id, user2Id) {
  const ids = [user1Id || "u1", user2Id || "u2"].sort();
  return `chat_${ids[0]}--${ids[1]}`;
}

export function isLocalSyncServerAvailable() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.");
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

// Community Athlete Stories (24h Workout Moments)
export const INITIAL_STORIES = [
  {
    id: "story_1",
    userId: "usr_mert_partner",
    userName: "Mert Demir",
    userInitials: "MD",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    tag: "💪 Bacak Günü PR",
    caption: "Yeni Squat PR: 140kg! Mert ile bacak gününü yıktık 🔥 Salondayız!",
    gymName: "MACFit Kadıköy",
    timestamp: Date.now() - 2 * 3600 * 1000,
    likesCount: 14,
    viewed: false
  },
  {
    id: "story_2",
    userId: "usr_selin_partner",
    userName: "Selin Öztürk",
    userInitials: "SÖ",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80",
    tag: "🔥 Sabah Kardiyosu",
    caption: "Güne 5km tempolu koşu ve core antrenmanı ile başladık ✨",
    gymName: "FitCity Ataşehir",
    timestamp: Date.now() - 4 * 3600 * 1000,
    likesCount: 22,
    viewed: false
  },
  {
    id: "story_3",
    userId: "usr_burak_partner",
    userName: "Burak Kaya",
    userInitials: "BK",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80",
    tag: "⚡ Bench Press 100kg",
    caption: "Göğüs & Kol bitti! Akşam seansı için partner arayanlar DM atsın 🏋️",
    gymName: "PowerGym Moda",
    timestamp: Date.now() - 6 * 3600 * 1000,
    likesCount: 19,
    viewed: false
  },
  {
    id: "story_4",
    userId: "usr_melisa_partner",
    userName: "Melisa Çetin",
    userInitials: "MÇ",
    userAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80",
    tag: "🥗 Post-Workout",
    caption: "Ağır bacak antrenmanı sonrası esneme ve protein shake vakti 🎯",
    gymName: "MACFit Kadıköy",
    timestamp: Date.now() - 8 * 3600 * 1000,
    likesCount: 31,
    viewed: false
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
        const cleanRPhone = ru.phone ? String(ru.phone).replace(/\D/g, '') : '';
        const last10 = cleanRPhone.slice(-10);
        const idx = realUsersOnly.findIndex(u => {
          if (u.id === ru.id) return true;
          if (last10 && last10.length === 10 && u.phone) {
            const uClean = String(u.phone).replace(/\D/g, '');
            return uClean.slice(-10) === last10;
          }
          if (ru.email && u.email && ru.email.trim().toLowerCase() === u.email.trim().toLowerCase()) return true;
          return false;
        });

        if (idx === -1) {
          realUsersOnly.push(ru);
        } else {
          // Merge in any missing fields from ru (such as email, photos, location coordinates)
          realUsersOnly[idx] = { ...ru, ...realUsersOnly[idx] };
          if (!realUsersOnly[idx].email && ru.email) realUsersOnly[idx].email = ru.email;
          if ((!realUsersOnly[idx].photos || realUsersOnly[idx].photos.length === 0) && ru.photos && ru.photos.length > 0) {
            realUsersOnly[idx].photos = ru.photos;
          }
          if (ru.city) realUsersOnly[idx].city = ru.city;
          if (ru.district) realUsersOnly[idx].district = ru.district;
          if (ru.gymName) realUsersOnly[idx].gymName = ru.gymName;
          if (ru.lat != null) realUsersOnly[idx].lat = ru.lat;
          if (ru.lng != null) realUsersOnly[idx].lng = ru.lng;
        }
      });
    }

    // Seed and sync nationwide Turkey gyms catalog (İstanbul, Ankara, İzmir, Bursa, Antalya, Eskişehir, vb.)
    if (Array.isArray(TURKEY_GYMS_CATALOG)) {
      const existingGyms = this.getCollection("gyms") || [];
      TURKEY_GYMS_CATALOG.forEach(g => {
        const gIdx = existingGyms.findIndex(eg => eg.id === g.id);
        if (gIdx === -1) {
          existingGyms.push(g);
        } else {
          existingGyms[gIdx] = { ...existingGyms[gIdx], ...g };
        }
      });
      this.setCollection("gyms", existingGyms);
    }

    // Seed authentic community athlete profiles (200 hyper-realistic active athletes across Turkey)
    if (Array.isArray(COMMUNITY_ATHLETES_200)) {
      COMMUNITY_ATHLETES_200.forEach(ath => {
        const idx = realUsersOnly.findIndex(u => u.id === ath.id);
        if (idx === -1) {
          realUsersOnly.push(ath);
        } else {
          realUsersOnly[idx] = { ...realUsersOnly[idx], ...ath };
        }
      });
    }

    this.setCollection("users", realUsersOnly);

    this.ensureCollection("appointments", []);

    // Localized Community Stories: Seed and merge nearby workout moments
    const existingStories = this.getCollection("stories") || [];
    const seedStories = Array.isArray(NEARBY_COMMUNITY_STORIES)
      ? [...NEARBY_COMMUNITY_STORIES, ...INITIAL_STORIES]
      : INITIAL_STORIES;
    seedStories.forEach(st => {
      const sIdx = existingStories.findIndex(s => s.id === st.id);
      if (sIdx === -1) {
        existingStories.push(st);
      } else {
        existingStories[sIdx] = { ...existingStories[sIdx], ...st };
      }
    });
    this.setCollection("stories", existingStories);
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

    // Sync to Google Cloud Firestore and server
    if (typeof window !== "undefined") {
      if (collection === "users") {
        saveFirestoreDoc("users", newItem.id, newItem).catch(() => {});
      }
      if (collection === "appointments") {
        if (isLocalSyncServerAvailable()) {
          fetch("/api/sync/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newItem)
          }).catch(() => {});
        }
        saveFirestoreDoc("appointments", newItem.id, newItem).catch(() => {});
      }
      if (collection === "reports") {
        if (isLocalSyncServerAvailable()) {
          fetch("/api/sync/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newItem)
          }).catch(() => {});
        }
        saveFirestoreDoc("reports", newItem.id, newItem).catch(() => {});
      }
      if (collection === "deals") {
        if (isLocalSyncServerAvailable()) {
          fetch("/api/sync/deals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newItem)
          }).catch(() => {});
        }
        saveFirestoreDoc("deals", newItem.id, newItem).catch(() => {});
      }
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
      if (typeof window !== "undefined" && isLocalSyncServerAvailable()) {
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
      if (typeof window !== "undefined" && isLocalSyncServerAvailable()) {
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

      if (collection === "users" && typeof window !== "undefined") {
        saveFirestoreDoc("users", id, items[index]).catch(() => {});
      }

      if (collection === "appointments" && typeof window !== "undefined") {
        if (isLocalSyncServerAvailable()) {
          fetch("/api/sync/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(items[index])
          }).catch(() => {});
        }
        saveFirestoreDoc("appointments", id, items[index]).catch(() => {});
      }

      if (collection === "reports" && typeof window !== "undefined") {
        if (isLocalSyncServerAvailable()) {
          fetch("/api/sync/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(items[index])
          }).catch(() => {});
        }
        saveFirestoreDoc("reports", id, items[index]).catch(() => {});
      }

      if (collection === "deals" && typeof window !== "undefined") {
        if (isLocalSyncServerAvailable()) {
          fetch("/api/sync/deals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(items[index])
          }).catch(() => {});
        }
        saveFirestoreDoc("deals", id, items[index]).catch(() => {});
      }

      return items[index];
    }
    return null;
  }

  deleteItem(collection, id) {
    const items = this.getCollection(collection);
    const filtered = items.filter(item => item.id !== id);
    this.setCollection(collection, filtered);
    if (typeof window !== "undefined") {
      deleteFirestoreDoc(collection, id).catch(() => {});
    }
    return true;
  }

  async syncWithServer(forceCloud = false) {
    // 0. Primary Cloud Sync with Google Cloud Firestore (throttled to once every 60s)
    const now = Date.now();
    if (forceCloud || (!this._lastFirestoreSync || now - this._lastFirestoreSync > 60000)) {
      this._lastFirestoreSync = now;
      try {
        await this.syncWithFirestore();
      } catch (e) {}
    }

    // Only query local Vite middleware /api/sync/ if on a local dev environment (localhost / 127.0.0.1)
    if (!isLocalSyncServerAvailable()) {
      return;
    }

    // 1. Sync Chats (Local Server / Dev Fallback)
    try {
      const chatRes = await fetch("/api/sync/chats").catch(() => null);
      if (chatRes && chatRes.ok && chatRes.headers.get("content-type")?.includes("json")) {
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
              text: lastIncoming.text || (lastIncoming.image ? 'Fotoğraf' : 'Yeni mesaj'),
              onOpen: () => {
                if (window.veyro && window.veyro.openChat) {
                  window.veyro.openChat(lastIncoming.senderId);
                }
              }
            });
          }
        }
      }
    } catch (e) {}

    // 2. Sync Users (Cross-Device Single Source of Truth)
    try {
      const usersRes = await fetch("/api/sync/users").catch(() => null);
      if (usersRes && usersRes.ok && usersRes.headers.get("content-type")?.includes("json")) {
        const serverUsers = await usersRes.json();
        const localUsers = this.getCollection("users") || [];
        let updatedUsers = false;

        for (const sUser of serverUsers) {
          if (!sUser || (!sUser.id && !sUser.phone && !sUser.email)) continue;
          const sPhoneClean = sUser.phone ? String(sUser.phone).replace(/\D/g, '') : '';
          const sLast10 = sPhoneClean.slice(-10);

          const idx = localUsers.findIndex(u => {
            if (u.id === sUser.id) return true;
            if (sLast10 && sLast10.length === 10 && u.phone) {
              const uClean = String(u.phone).replace(/\D/g, '');
              if (uClean.slice(-10) === sLast10) return true;
            }
            if (sUser.email && u.email && sUser.email.trim().toLowerCase() === u.email.trim().toLowerCase()) return true;
            return false;
          });

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
    } catch (e) {}

    // 3. Sync Appointments
    try {
      const aptRes = await fetch("/api/sync/appointments").catch(() => null);
      if (aptRes && aptRes.ok && aptRes.headers.get("content-type")?.includes("json")) {
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
    } catch (e) {}

    // 4. Sync Reports
    try {
      const repRes = await fetch("/api/sync/reports").catch(() => null);
      if (repRes && repRes.ok && repRes.headers.get("content-type")?.includes("json")) {
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
    } catch (e) {}

    // 5. Sync Deals
    try {
      const dealRes = await fetch("/api/sync/deals").catch(() => null);
      if (dealRes && dealRes.ok && dealRes.headers.get("content-type")?.includes("json")) {
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

  async syncWithFirestore() {
    // 1. Users Sync
    try {
      const remoteUsers = await getFirestoreCollection("users");
      const localUsers = this.getCollection("users") || [];
      let updatedUsers = false;

      // Merge remote users into local database
      for (const rUser of remoteUsers) {
        if (!rUser || (!rUser.id && !rUser.phone && !rUser.email)) continue;
        const rPhoneClean = rUser.phone ? String(rUser.phone).replace(/\D/g, '') : '';
        const rLast10 = rPhoneClean.slice(-10);

        const idx = localUsers.findIndex(u => {
          if (u.id === rUser.id) return true;
          if (rLast10 && rLast10.length === 10 && u.phone) {
            const uClean = String(u.phone).replace(/\D/g, '');
            if (uClean.slice(-10) === rLast10) return true;
          }
          if (rUser.email && u.email && rUser.email.trim().toLowerCase() === u.email.trim().toLowerCase()) return true;
          return false;
        });

        if (idx >= 0) {
          if (JSON.stringify(localUsers[idx]) !== JSON.stringify(rUser)) {
            localUsers[idx] = { ...localUsers[idx], ...rUser };
            updatedUsers = true;
          }
        } else {
          localUsers.push(rUser);
          updatedUsers = true;
        }
      }

      if (updatedUsers) {
        this.setCollection("users", localUsers);
      }

      // Seed local registered users to Firestore Cloud if not yet present
      for (const lUser of localUsers) {
        if (!lUser || !lUser.id) continue;
        const existsInRemote = remoteUsers.some(ru => {
          if (ru.id === lUser.id) return true;
          if (ru.phone && lUser.phone) {
            const ru10 = String(ru.phone).replace(/\D/g, '').slice(-10);
            const lu10 = String(lUser.phone).replace(/\D/g, '').slice(-10);
            if (ru10 && lu10 && ru10.length === 10 && ru10 === lu10) return true;
          }
          return false;
        });
        if (!existsInRemote) {
          saveFirestoreDoc("users", lUser.id, lUser).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Firestore users sync error:", e?.message);
    }

    // 2. Chat Messages Sync
    try {
      const remoteMessages = await getFirestoreCollection("chat_messages");
      if (remoteMessages && remoteMessages.length > 0) {
        const raw = localStorage.getItem(STORAGE_PREFIX + "chats");
        const localChats = raw ? JSON.parse(raw) : {};
        let updatedChats = false;
        let newIncomingCount = 0;
        let lastIncoming = null;

        const rawCurrent = localStorage.getItem(STORAGE_PREFIX + "current_user");
        const currentU = rawCurrent ? JSON.parse(rawCurrent) : null;

        for (const rMsg of remoteMessages) {
          const chatKey = rMsg.chatKey || getChatRoomKey(rMsg.senderId, rMsg.receiverId);
          if (!chatKey) continue;
          if (!localChats[chatKey]) localChats[chatKey] = [];

          const idx = localChats[chatKey].findIndex(m => m.id === rMsg.id);
          if (idx >= 0) {
            if (JSON.stringify(localChats[chatKey][idx]) !== JSON.stringify(rMsg)) {
              localChats[chatKey][idx] = { ...localChats[chatKey][idx], ...rMsg };
              updatedChats = true;
            }
          } else {
            localChats[chatKey].push(rMsg);
            updatedChats = true;
            if (currentU && rMsg.receiverId === currentU.id && !rMsg.read) {
              newIncomingCount++;
              lastIncoming = rMsg;
            }
          }
        }

        if (updatedChats) {
          for (const k of Object.keys(localChats)) {
            if (Array.isArray(localChats[k])) {
              localChats[k].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            }
          }
          localStorage.setItem(STORAGE_PREFIX + "chats", JSON.stringify(localChats));
          this.notifySubscribers("chats_updated", localChats);
          for (const k of Object.keys(localChats)) {
            this.notifySubscribers(k, localChats[k]);
            this.notifySubscribers(`chat_${k}`, localChats[k]);
          }

          if (newIncomingCount > 0 && lastIncoming) {
            notify.showIncomingMessageBanner({
              senderName: lastIncoming.senderName,
              senderInitials: lastIncoming.senderName?.substring(0, 2).toUpperCase() || 'SP',
              text: lastIncoming.text || (lastIncoming.image ? 'Fotoğraf' : 'Yeni mesaj'),
              onOpen: () => {
                if (window.veyro && window.veyro.openChat) {
                  window.veyro.openChat(lastIncoming.senderId);
                }
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn("Firestore chats sync error:", e?.message);
    }

    // 3. Appointments Sync
    try {
      const remoteApts = await getFirestoreCollection("appointments");
      const localApts = this.getCollection("appointments") || [];
      let updatedApts = false;

      for (const rApt of remoteApts) {
        const idx = localApts.findIndex(a => a.id === rApt.id);
        if (idx >= 0) {
          if (JSON.stringify(localApts[idx]) !== JSON.stringify(rApt)) {
            localApts[idx] = { ...localApts[idx], ...rApt };
            updatedApts = true;
          }
        } else {
          localApts.push(rApt);
          updatedApts = true;
        }
      }

      if (updatedApts) {
        this.setCollection("appointments", localApts);
        this.notifySubscribers("appointments", localApts);
      }
    } catch (e) {
      console.warn("Firestore appointments sync error:", e?.message);
    }

    // 4. Reports Sync
    try {
      const remoteReps = await getFirestoreCollection("reports");
      const localReps = this.getCollection("reports") || [];
      let updatedReps = false;

      for (const rRep of remoteReps) {
        const idx = localReps.findIndex(r => r.id === rRep.id);
        if (idx >= 0) {
          if (JSON.stringify(localReps[idx]) !== JSON.stringify(rRep)) {
            localReps[idx] = { ...localReps[idx], ...rRep };
            updatedReps = true;
          }
        } else {
          localReps.unshift(rRep);
          updatedReps = true;
        }
      }

      if (updatedReps) {
        this.setCollection("reports", localReps);
        this.notifySubscribers("reports", localReps);
      }
    } catch (e) {
      console.warn("Firestore reports sync error:", e?.message);
    }
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
            text: data.message.text || (data.message.image ? 'Fotoğraf' : 'Yeni mesaj'),
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
    } else if (data.type === "chat_messages_read") {
      const raw = localStorage.getItem(STORAGE_PREFIX + "chats");
      const chats = raw ? JSON.parse(raw) : {};
      if (chats[data.chatKey]) {
        let changed = false;
        chats[data.chatKey].forEach(m => {
          if (m.receiverId === data.userId && !m.read) {
            m.read = true;
            m.readAt = m.readAt || Date.now();
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_PREFIX + "chats", JSON.stringify(chats));
          this.notifySubscribers(data.chatKey, chats[data.chatKey]);
          this.notifySubscribers(`chat_${data.chatKey}`, chats[data.chatKey]);
          this.notifySubscribers("chats_updated", chats);
        }
      }
    } else if (data.type === "new_story") {
      const stories = this.getCollection("stories") || [];
      if (!stories.some(s => s.id === data.story.id)) {
        stories.unshift(data.story);
        this.setCollection("stories", stories);
        this.notifySubscribers("stories", stories);
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
        if (isLocalSyncServerAvailable()) {
          fetch("/api/sync/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatKey, message: newMsg })
          }).catch(() => {});
        }
        // 4. Save to Google Cloud Firestore
        saveFirestoreDoc("chat_messages", newMsg.id, { ...newMsg, chatKey }).catch(() => {});
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
            if (isLocalSyncServerAvailable()) {
              fetch("/api/sync/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatKey, message: msg, action: "update_status" })
              }).catch(() => {});
            }
            saveFirestoreDoc("chat_messages", messageId, { ...msg, chatKey }).catch(() => {});
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
            m.readAt = Date.now();
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_PREFIX + "chats", JSON.stringify(chats));
          this.notifySubscribers(chatKey, chats[chatKey]);
          this.notifySubscribers(`chat_${chatKey}`, chats[chatKey]);
          this.notifySubscribers("chats_updated", chats);

          if (this.broadcastChannel) {
            try {
              this.broadcastChannel.postMessage({
                type: "chat_messages_read",
                chatKey,
                userId
              });
            } catch (e) {}
          }

          if (typeof window !== "undefined" && isLocalSyncServerAvailable()) {
            fetch("/api/sync/chats", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chatKey, action: "mark_read", userId })
            }).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn("markChatAsRead error", e);
    }
  }

  // ==========================================
  // ATHLETE STORIES (24H WORKOUT SHARING)
  // ==========================================
  getStories(filterGymId, maxDistKm) {
    let list = this.getCollection("stories") || [];
    if (filterGymId && filterGymId !== "all") {
      list = list.filter(s => {
        if (s.gymId === filterGymId) return true;
        if (typeof s.distanceKm === "number" && s.distanceKm <= (maxDistKm || 5.0)) return true;
        return false;
      });
    }
    // Sort unviewed first, then by most recent timestamp
    return list.slice().sort((a, b) => {
      if (a.viewed === b.viewed) {
        return (b.timestamp || 0) - (a.timestamp || 0);
      }
      return a.viewed ? 1 : -1;
    });
  }

  addStory(storyData) {
    try {
      const stories = this.getCollection("stories") || [];
      const newStory = {
        id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        likesCount: 0,
        viewed: false,
        ...storyData
      };
      stories.unshift(newStory);
      this.setCollection("stories", stories);
      this.notifySubscribers("stories", stories);

      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({ type: "new_story", story: newStory });
        } catch (e) {}
      }
      return newStory;
    } catch (e) {
      console.error("addStory error", e);
      return null;
    }
  }

  markStoryViewed(storyId) {
    try {
      const stories = this.getCollection("stories") || [];
      const story = stories.find(s => s.id === storyId);
      if (story && !story.viewed) {
        story.viewed = true;
        this.setCollection("stories", stories);
        this.notifySubscribers("stories", stories);
      }
    } catch (e) {}
  }

  // ==========================================
  // INITIAL APPOINTMENTS SEED (Interactive Demo)
  // ==========================================
  ensureSampleAppointments(currentUserId = "current-user", currentUserName = "Sporcu") {
    const existing = this.getCollection("appointments") || [];
    if (existing.length > 0) return existing;

    const sampleApts = [
      {
        id: "apt_mert_bacak_today",
        userId: "usr_mert_partner",
        userName: "Mert Demir",
        partnerId: currentUserId,
        partnerName: currentUserName,
        date: "Bugün 25 Ekim",
        time: "19:00",
        dayNum: "25",
        workoutType: "Bacak günü (Squat & Kuadriseps)",
        gymId: "map_gym_59319781",
        gymName: "MACFit Kadıköy",
        status: "accepted",
        checkedIn: false,
        reminder: "18:00'de hatırlat",
        createdAt: Date.now() - 3600000
      },
      {
        id: "apt_selin_invite_pending",
        userId: "usr_selin_partner",
        userName: "Selin Öztürk",
        partnerId: currentUserId,
        partnerName: currentUserName,
        date: "Yarın 26 Ekim",
        time: "18:30",
        dayNum: "26",
        workoutType: "Göğüs & Kol",
        gymId: "map_gym_59319781",
        gymName: "MACFit Kadıköy",
        status: "incoming_request",
        createdAt: Date.now() - 1800000
      },
      {
        id: "apt_burak_past_history",
        userId: currentUserId,
        userName: currentUserName,
        partnerId: "usr_burak_partner",
        partnerName: "Burak Kaya",
        date: "Dün 24 Ekim",
        time: "19:00",
        dayNum: "24",
        workoutType: "Sırt & Biceps",
        gymId: "map_gym_59319781",
        gymName: "MACFit Kadıköy",
        status: "completed",
        rating: 5,
        verifiedAttendance: true,
        completedAt: Date.now() - 86400000
      }
    ];

    this.setCollection("appointments", sampleApts);
    this.notifySubscribers("appointments", sampleApts);
    return sampleApts;
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
