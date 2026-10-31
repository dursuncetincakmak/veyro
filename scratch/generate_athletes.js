import fs from 'fs';
import path from 'path';

const femaleFirstNames = [
  "Ece", "Zeynep", "Sinem", "İrem", "Damla", "Melisa", "Tuğba", "Yasemin", "Elif", "Beril",
  "Gizem", "Hazal", "Buse", "Cansu", "Pelin", "Derya", "Selin", "Ayşe", "Merve", "Duygu",
  "Begüm", "Simge", "Burcu", "Dilara", "Ezgi", "Aslı", "İpek", "Defne", "Başak", "Serra",
  "Yağmur", "Nil", "Bade", "Derin", "Leyla", "Sena", "Ceren", "Nehir", "Eylül", "Melda",
  "Pınar", "Gamze", "Bengü", "Rüya", "Melike", "Nazlı", "Ebru", "Deniz", "Ada", "Gözde",
  "Hande", "Aylin", "Berna", "Işıl", "Şevval", "Ceyda", "Bahar", "Buket", "Sude", "Esra",
  "Lara", "Alara", "İlayda", "Ecehan", "Sezen", "Nisa", "Büşra", "Hilal", "Sibel", "Selma",
  "Özge", "Öykü", "Melis", "Beliz", "Ecem", "Gülce", "Yeliz", "Banu", "Tülin", "Belgin",
  "Ayça", "Gülben", "Didem", "Feride", "Şeyma", "Zehra", "Efsun", "Su", "Mira", "Doğa",
  "Ceren", "Simay", "Pırıl", "Beste", "Dila", "Gülfem", "Asude", "Rana", "Sevde", "Esin"
];

const maleFirstNames = [
  "Can", "Kerem", "Burak", "Deniz", "Alp", "Tolga", "Berkay", "Mert", "Emre", "Barış",
  "Arda", "Kaan", "Doruk", "Efe", "Batu", "Çağlar", "Onur", "Ozan", "Serdar", "Koray",
  "Yiğit", "Görkem", "Uğur", "Volkan", "Taylan", "Cenk", "Berk", "Erdem", "Sinan", "Murat",
  "Hakan", "Tarık", "Emrecan", "Atakan", "Cem", "Buğra", "Göktuğ", "Kutay", "Tuna", "Sarp",
  "Bora", "Yağız", "Oğuz", "Rüzgar", "Kuzey", "Demir", "Çınar", "Atlas", "Pars", "Baran",
  "Furkan", "Batuhan", "Kadir", "Kemal", "Ali", "Ahmet", "Mehmet", "Mustafa", "Yasin", "Yusuf",
  "Eren", "Enes", "Umut", "Semih", "Cihan", "İlker", "Alper", "Taner", "Soner", "Caner",
  "Okan", "Levent", "Metin", "Cemil", "Selim", "Engin", "Selçuk", "Orkun", "Tarkan", "Aykut",
  "Gökhan", "Serkan", "Erkan", "Tuncay", "Kubilay", "Ayberk", "Görkem", "Yalçın", "Harun", "Oğuzhan",
  "Kayra", "Devrim", "Utku", "Bora", "Taha", "Ege", "Alpcan", "Baha", "Tayfun", "Yaman"
];

const lastNames = [
  "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım", "Öztürk", "Aydın", "Özdemir",
  "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek",
  "Polat", "Korkmaz", "Erdoğan", "Yavuz", "Aksoy", "Tekin", "Güler", "Yalçın", "Avcı", "Bulut",
  "Keskin", "Ünal", "Güneş", "Bozkurt", "Can", "Karaca", "Taş", "Coşkun", "Sarı", "Gök",
  "Uçar", "Acar", "Sever", "Soylu", "Duran", "Işık", "Kalkan", "Eren", "Demirci", "Kartal"
];

const femaleBios = [
  "Haftada 4 gün ağırlık, 1 gün kardiyo. Birlikte motive olacak ve set aralarında spotterlık yapacak partner arıyorum 💪",
  "Sabahları 07:00 seansları. Squat ve Hip Thrust odaklı çalışıyorum. Düzenli gelen arkadaşlar ekleyebilir ✨",
  "Pilates ve fonksiyonel fitness ile ilgileniyorum. Haftasonu koşu veya salonda partner iyi olur 🧘‍♀️",
  "Kilo verme ve sıkılaşma dönemindeyim. Birlikte kardiyo ve HIIT yapacak motivasyon partneri arıyorum.",
  "MACFit Kadıköy müdavimiyim. Bacak günlerinde birbirimize destek olacak kız arkadaş arıyorum 🏋️‍♀️",
  "Haftada 5 gün split antrenman. Disiplinli ve zamanında gelen partnerlerle çalışmayı seviyorum.",
  "Yeni başladım sayılır, form düzeltme ve temel hareketlerde motive olacak birini arıyorum 🌸",
  "Hypertrophy ve güç odaklı alt-üst vücut spliti yapıyorum. Karşılıklı yardımlaşma güzel olur.",
  "Crossfit ve fonksiyonel antrenmanlar vazgeçilmezim. Sabah enerjisiyle spora başlayanlar yazabilir ⚡",
  "Akşam iş çıkışı 19:30 seansları. Omuz ve sırt günlerinde süperset partneri."
];

const maleBios = [
  "Haftada 5 gün Push-Pull-Legs yapıyorum. Bench ve Squat'ta ağır kilolarda spotter partneri arıyorum 💪",
  "Sabah 07:30 veya akşam 19:00 seansları. Hedef hacim ve hipertrofi. Ciddi antrenman arkadaşı eklesin 🏋️‍♂️",
  "Crossfit ve calisthenics karışık gidiyorum. Güç antrenmanında sınırları zorlayacak partner arıyorum ⚡",
  "Kondisyon ve yağ yakımı odaklıyım. Birlikte tempolu kardiyo ve ağırlık kombinasyonu yapabiliriz.",
  "Powerlifting ve temel bileşik egzersizler (Squat, Bench, Deadlift). Disiplinli sporcular yazsın.",
  "Haftasonları sabah koşusu, hafta içi akşam Kadıköy salon seansları. Sürekli motive partner arıyorum.",
  "Sporda 3. yılım. Form ve tempo odaklı çalışıyorum, zamanı verimli kullanan biriyle eşleşmek isterim.",
  "İş çıkışı 18:30 seansları. Göğüs-kol ve sırt günlerinde tükeniş setleri için spotter lazım 🎯",
  "Fonksiyonel güç ve kondisyon antrenmanı. Birlikte PR deneyecek partner arıyorum 🔥",
  "Düzenli antrenman ve temiz beslenme yaşam tarzım. Salonda vakit kaybetmeden basacak dostlar eklesin."
];

const femalePhotoCollections = [
  [
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80"
  ]
];

const malePhotoCollections = [
  [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80"
  ]
];

const gyms = [
  { id: "map_gym_59319781", name: "MACFit Kadıköy", district: "Kadıköy", lat: 40.9902, lng: 29.0298, baseDist: 0.3 },
  { id: "gym_power_moda", name: "PowerGym Moda", district: "Moda", lat: 40.9850, lng: 29.0250, baseDist: 0.5 },
  { id: "gym_cadde_fit", name: "PlusFitness Caddebostan", district: "Caddebostan", lat: 40.9680, lng: 29.0620, baseDist: 2.1 },
  { id: "gym_atasehir_fit", name: "FitCity Ataşehir", district: "Ataşehir", lat: 40.9920, lng: 29.1150, baseDist: 4.2 },
  { id: "gym_uskudar_club", name: "Üsküdar GymClub", district: "Üsküdar", lat: 41.0260, lng: 29.0180, baseDist: 3.8 },
  { id: "gym_besiktas_mac", name: "MACFit Beşiktaş", district: "Beşiktaş", lat: 41.0420, lng: 29.0060, baseDist: 5.4 },
  { id: "gym_maltepe_sport", name: "Maltepe Sports Center", district: "Maltepe", lat: 40.9320, lng: 29.1350, baseDist: 6.8 }
];

const workouts = [
  { workoutType: "Bacak & Kalça", expectation: "Spotter partneri arıyor", note: "Bugün ağır squat ve RDL günü, motive olacak partner" },
  { workoutType: "Göğüs & Kol", expectation: "Ağır kilo partneri", note: "Bench press ve dumbbell press süpersetleri" },
  { workoutType: "Sırt & Biceps", expectation: "Set arası motivasyon", note: "Lat pulldown ve barbell row odaklı seans" },
  { workoutType: "Omuz & Karın", expectation: "Süperset partneri", note: "Overhead press ve lateral raise tükeniş setleri" },
  { workoutType: "Kardiyo & Core", expectation: "Kondisyon partneri", note: "5km tempolu koşu sonrası karın egzersizleri" },
  { workoutType: "Fonksiyonel & HIIT", expectation: "Yüksek tempo partneri", note: "Kettlebell, rope ve box jump seansı" }
];

const times = ["07:00", "07:30", "08:00", "12:30", "13:00", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
const days = ["Bugün", "Bugün", "Bugün", "Yarın", "Yarın", "Çarşamba", "Perşembe", "Cuma"];
const goalsList = [
  ["Kas", "Güç"],
  ["Kondisyon", "Kas"],
  ["Kilo Verme", "Sıkılaşma"],
  ["Sağlık", "Kondisyon"],
  ["Güç", "Kondisyon"],
  ["Kas", "Kondisyon"]
];
const levels = ["Orta", "Orta", "Orta", "İleri", "İleri", "Başlangıç"];
const preferredTimesList = [["Akşam"], ["Akşam", "Öğle"], ["Sabah"], ["Sabah", "Akşam"], ["Gece"]];

const athletes = [];

// 100 Female Athletes
for (let i = 0; i < 100; i++) {
  const fName = femaleFirstNames[i % femaleFirstNames.length];
  const lName = lastNames[(i * 3 + 7) % lastNames.length];
  const fullName = `${fName} ${lName}`;
  const gym = gyms[i % gyms.length];
  const w = workouts[i % workouts.length];
  const dOffset = ((i % 15) * 0.18 + gym.baseDist).toFixed(1);
  const latOffset = (Math.sin(i) * 0.015);
  const lngOffset = (Math.cos(i) * 0.018);

  athletes.push({
    id: `ath_f_${1000 + i}`,
    name: fullName,
    initials: `${fName[0]}${lName[0]}`.toUpperCase(),
    gender: "Kadın",
    age: 21 + (i % 13),
    verified: i % 5 !== 0,
    role: "user",
    phone: `+90 53${(i % 9) + 1} ${100 + (i * 7) % 900} ${10 + (i * 3) % 90} ${20 + (i * 5) % 80}`,
    email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@gmail.com`,
    bio: femaleBios[i % femaleBios.length],
    goals: goalsList[i % goalsList.length],
    level: levels[i % levels.length],
    preferredTimes: preferredTimesList[i % preferredTimesList.length],
    genderPref: "Herkes",
    gymId: gym.id,
    gymName: gym.name,
    district: gym.district,
    lat: Number((gym.lat + latOffset).toFixed(6)),
    lng: Number((gym.lng + lngOffset).toFixed(6)),
    distanceKm: Number(dOffset),
    photos: femalePhotoCollections[i % femalePhotoCollections.length],
    nextWorkout: {
      workoutType: w.workoutType,
      day: days[i % days.length],
      time: times[i % times.length],
      gymName: gym.name,
      expectation: w.expectation,
      note: w.note
    },
    onboarded: true,
    createdAt: Date.now() - (i + 1) * 86400000 * 2,
    lastLoginAt: Date.now() - (i % 6) * 3600000
  });
}

// 100 Male Athletes
for (let i = 0; i < 100; i++) {
  const fName = maleFirstNames[i % maleFirstNames.length];
  const lName = lastNames[(i * 5 + 11) % lastNames.length];
  const fullName = `${fName} ${lName}`;
  const gym = gyms[(i + 2) % gyms.length];
  const w = workouts[(i + 3) % workouts.length];
  const dOffset = (((i + 3) % 15) * 0.17 + gym.baseDist).toFixed(1);
  const latOffset = (Math.cos(i * 1.5) * 0.016);
  const lngOffset = (Math.sin(i * 1.5) * 0.017);

  athletes.push({
    id: `ath_m_${2000 + i}`,
    name: fullName,
    initials: `${fName[0]}${lName[0]}`.toUpperCase(),
    gender: "Erkek",
    age: 22 + (i % 14),
    verified: i % 4 !== 0,
    role: "user",
    phone: `+90 54${(i % 9) + 1} ${120 + (i * 11) % 880} ${11 + (i * 7) % 88} ${15 + (i * 9) % 80}`,
    email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@gmail.com`,
    bio: maleBios[i % maleBios.length],
    goals: goalsList[(i + 2) % goalsList.length],
    level: levels[(i + 1) % levels.length],
    preferredTimes: preferredTimesList[(i + 2) % preferredTimesList.length],
    genderPref: "Herkes",
    gymId: gym.id,
    gymName: gym.name,
    district: gym.district,
    lat: Number((gym.lat + latOffset).toFixed(6)),
    lng: Number((gym.lng + lngOffset).toFixed(6)),
    distanceKm: Number(dOffset),
    photos: malePhotoCollections[i % malePhotoCollections.length],
    nextWorkout: {
      workoutType: w.workoutType,
      day: days[(i + 2) % days.length],
      time: times[(i + 4) % times.length],
      gymName: gym.name,
      expectation: w.expectation,
      note: w.note
    },
    onboarded: true,
    createdAt: Date.now() - (i + 1) * 86400000 * 3,
    lastLoginAt: Date.now() - (i % 8) * 3600000
  });
}

// 25 Realistic Stories from nearby athletes
const nearbyStories = [
  {
    id: "story_nearby_1",
    userId: athletes[0].id,
    userName: athletes[0].name,
    userInitials: athletes[0].initials,
    userAvatar: athletes[0].photos[0],
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    tag: "💪 Bacak Günü PR",
    caption: "Squat PR denemesi başarılı! Salondayız 🔥",
    gymId: athletes[0].gymId,
    gymName: athletes[0].gymName,
    distanceKm: athletes[0].distanceKm,
    timestamp: Date.now() - 1 * 3600 * 1000,
    likesCount: 18,
    viewed: false
  },
  {
    id: "story_nearby_2",
    userId: athletes[101].id,
    userName: athletes[101].name,
    userInitials: athletes[101].initials,
    userAvatar: athletes[101].photos[0],
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80",
    tag: "⚡ Bench Press 100kg",
    caption: "Göğüs & Kol bitti! Akşam seansı için partner arayanlar DM atsın 🏋️",
    gymId: athletes[101].gymId,
    gymName: athletes[101].gymName,
    distanceKm: athletes[101].distanceKm,
    timestamp: Date.now() - 2 * 3600 * 1000,
    likesCount: 27,
    viewed: false
  },
  {
    id: "story_nearby_3",
    userId: athletes[1].id,
    userName: athletes[1].name,
    userInitials: athletes[1].initials,
    userAvatar: athletes[1].photos[0],
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80",
    tag: "🔥 Sabah Kardiyosu",
    caption: "Güne 5km tempolu koşu ve core antrenmanı ile başladık ✨",
    gymId: athletes[1].gymId,
    gymName: athletes[1].gymName,
    distanceKm: athletes[1].distanceKm,
    timestamp: Date.now() - 3 * 3600 * 1000,
    likesCount: 34,
    viewed: false
  },
  {
    id: "story_nearby_4",
    userId: athletes[102].id,
    userName: athletes[102].name,
    userInitials: athletes[102].initials,
    userAvatar: athletes[102].photos[0],
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80",
    tag: "🏋️ Ağır Siklet Seansı",
    caption: "Deadlift 180kg setleri. Spotter ve enerji yüksek!",
    gymId: athletes[102].gymId,
    gymName: athletes[102].gymName,
    distanceKm: athletes[102].distanceKm,
    timestamp: Date.now() - 4 * 3600 * 1000,
    likesCount: 22,
    viewed: false
  },
  {
    id: "story_nearby_5",
    userId: athletes[2].id,
    userName: athletes[2].name,
    userInitials: athletes[2].initials,
    userAvatar: athletes[2].photos[0],
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80",
    tag: "🥗 Post-Workout Shake",
    caption: "Ağır antrenman sonrası esneme ve protein shake zamanı 🎯",
    gymId: athletes[2].gymId,
    gymName: athletes[2].gymName,
    distanceKm: athletes[2].distanceKm,
    timestamp: Date.now() - 5 * 3600 * 1000,
    likesCount: 41,
    viewed: false
  },
  {
    id: "story_nearby_6",
    userId: athletes[103].id,
    userName: athletes[103].name,
    userInitials: athletes[103].initials,
    userAvatar: athletes[103].photos[0],
    image: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&auto=format&fit=crop&q=80",
    tag: "🏃‍♂️ 5K Tempo Koşusu",
    caption: "Moda sahilinde sabah koşusu bitti, şimdi salona geçiyoruz ⚡",
    gymId: athletes[103].gymId,
    gymName: athletes[103].gymName,
    distanceKm: athletes[103].distanceKm,
    timestamp: Date.now() - 6 * 3600 * 1000,
    likesCount: 19,
    viewed: false
  },
  {
    id: "story_nearby_7",
    userId: athletes[3].id,
    userName: athletes[3].name,
    userInitials: athletes[3].initials,
    userAvatar: athletes[3].photos[0],
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80",
    tag: "📍 Salondayız",
    caption: "Akşam bacak seansı için salondayım, partner arayanlar yazabilir!",
    gymId: athletes[3].gymId,
    gymName: athletes[3].gymName,
    distanceKm: athletes[3].distanceKm,
    timestamp: Date.now() - 7 * 3600 * 1000,
    likesCount: 30,
    viewed: false
  },
  {
    id: "story_nearby_8",
    userId: athletes[104].id,
    userName: athletes[104].name,
    userInitials: athletes[104].initials,
    userAvatar: athletes[104].photos[0],
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
    tag: "🎯 Günlük Hedef Tamam",
    caption: "Omuz ve kol süpersetleri tamamlandı. Hedefe bir adım daha 🏆",
    gymId: athletes[104].gymId,
    gymName: athletes[104].gymName,
    distanceKm: athletes[104].distanceKm,
    timestamp: Date.now() - 8 * 3600 * 1000,
    likesCount: 25,
    viewed: false
  }
];

const fileContent = `/**
 * Veyro - Hyper-Realistic Community Fitness Athletes Dataset (200 Profiles)
 * 100 Female & 100 Male Turkish fitness athletes with genuine bios, multiple photos,
 * realistic gyms, geographic coordinates, workout plans, and localized stories.
 */

export const COMMUNITY_ATHLETES_200 = ${JSON.stringify(athletes, null, 2)};

export const NEARBY_COMMUNITY_STORIES = ${JSON.stringify(nearbyStories, null, 2)};
`;

const outputPath = path.resolve('src/services/seedAthletes200.js');
fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`Generated ${athletes.length} athlete profiles and ${nearbyStories.length} stories at ${outputPath}`);
