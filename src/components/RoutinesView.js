/**
 * Veyro - Hareketler (Partner-Matched Workout Routine, Set Tracker & Rest Timer) View
 * Logic:
 * - Checks if the current logged-in athlete has an active/upcoming partner workout appointment.
 * - If matched/scheduled: automatically selects that day's workout routine (Bacak, Göğüs, Sırt, Omuz, Kol, Kardiyo)
 *   and displays the real partner's name, gym, and time at the top.
 * - If no active partner workout exists yet: displays the "Hadi Eşleş!" luxury call-to-action
 *   directing the athlete to Discover (Keşfet) to match with a workout partner first (with optional library preview).
 */

import { db } from '../services/db.js';
import { auth } from '../services/auth.js';
import { notify } from '../services/notification.js';
import { soundService } from '../services/soundService.js';
import { icons } from './icons.js';

const ROUTINE_PROGRAMS = {
  bacak: {
    id: "bacak",
    title: "Bacak Günü (Squat & Quad)",
    partnerNote: "Partner Seansı · Alt Vücut & Güç",
    sessionTitle: "Bacak Seansı (Hipertrofi & Güç)",
    exercises: [
      {
        id: "ex-b1",
        name: "Barbell Back Squat",
        category: "Bacak",
        target: "Quadriceps & Gluteus",
        defaultSets: 4,
        defaultReps: "8-10",
        tempo: { neg: "3 sn İniş", pause: "1 sn Dip", pos: "1 sn İtiş" },
        steps: [
          "1. Kurulum: Barı üst trapez kaslarına yerleştirin, ayakları omuz genişliğinden hafif açık konumlandırın.",
          "2. İniş (Eksantrik): Nefes alarak kalçayı geriye ve aşağı indirin; dizler ayak parmak uçlarıyla aynı yönde ilerlemeli.",
          "3. İtiş (Konsantrik): Topuklardan ve ayak ortasından yeri iterek güçlüce başlangıç pozisyonuna yükselin."
        ],
        tips: "Topukları yerden kesmeyin, dizlerin içe çökmesini (valgus) önleyin. Partneriniz son 2 tekrarda bel/göğüs hizasından spotter olmalı.",
        warning: "Bel çukurunu (lomber nötr) koruyun, alt noktada omurgayı yuvarlamayın."
      },
      {
        id: "ex-b2",
        name: "Leg Press 45°",
        category: "Bacak",
        target: "Quadriceps",
        defaultSets: 4,
        defaultReps: "12",
        tempo: { neg: "3 sn İniş", pause: "0 sn", pos: "1.5 sn İtiş" },
        steps: [
          "1. Kurulum: Sırtınızı ve kalçanızı pedlere tam yaslayın, ayakları platformun ortasına omuz genişliğinde yerleştirin.",
          "2. İniş: Güvenlik kilitlerini açın ve dizler 90 dereceye gelene kadar kontrollü şekilde indirin.",
          "3. İtiş: Dizleri tam kilitlemeden (mikro bükülü bırakarak) ağırlığı yukarı itin."
        ],
        tips: "Dizleri üst noktada tamamen kilitlemeyin; bu gerilimi kas üzerinde tutar ve eklemi korur.",
        warning: "Kalçanızın koltuktan kalkmasına izin vermeyin, aksi halde alt bele aşırı yük biner."
      },
      {
        id: "ex-b3",
        name: "Romanya Deadlift'i (RDL)",
        category: "Bacak",
        target: "Hamstrings & Glutes",
        defaultSets: 3,
        defaultReps: "10-12",
        tempo: { neg: "3 sn İniş", pause: "1 sn Gerilim", pos: "1 sn Çekiş" },
        steps: [
          "1. Kurulum: Barı üstten tutuşla kavrayın, dizleri hafifçe kırıp sabitleyin.",
          "2. Hip Hinge: Barı bacaklarınıza temas edecek kadar yakın tutarak kalçayı doğrudan geriye doğru itin.",
          "3. Kalkış: Arka bacakta (hamstring) tam gerilimi hissettiğinizde kalçayı ileri sıkarak dik konuma dönün."
        ],
        tips: "Hareketi belinizle eğilerek değil, kalçayı arkadaki duvara değdirmeye çalışır gibi başlatın.",
        warning: "Bar vücuttan uzaklaşırsa omurga yükü artar; barı kaval kemiğine yakın sürün."
      },
      {
        id: "ex-b4",
        name: "Standing Calf Raise",
        category: "Bacak",
        target: "Gastrocnemius & Soleus",
        defaultSets: 4,
        defaultReps: "15-20",
        tempo: { neg: "2 sn İniş", pause: "2 sn Tepe", pos: "1 sn Yükseliş" },
        steps: [
          "1. Kurulum: Ayak parmak köklerini platformun kenarına yerleştirin, topuklar boşlukta kalsın.",
          "2. Esneme: Topukları mümkün olduğunca aşağı indirerek baldır kaslarını tam esnetin.",
          "3. Sıkıştırma: Parmak uçlarında en tepeye çıkıp 2 saniye tam kasılma sağlayın."
        ],
        tips: "Kalf kası kısa yaylanan tekrarlara değil, tam esneme ve tepe noktada beklemeye yanıt verir.",
        warning: "Dizleri bükerek yaylanmayın, hareketi sadece ayak bileği ekleminden gerçekleştirin."
      }
    ]
  },
  gogus: {
    id: "gogus",
    title: "Göğüs & Triceps İtiş",
    partnerNote: "Partner Seansı · Üst Vücut İtiş",
    sessionTitle: "Göğüs & Kol Seansı (Üst Vücut İtiş)",
    exercises: [
      {
        id: "ex-g1",
        name: "Barbell Bench Press",
        category: "Göğüs",
        target: "Pectoralis Major",
        defaultSets: 4,
        defaultReps: "8-10",
        tempo: { neg: "2.5 sn İniş", pause: "1 sn Göğüs", pos: "1 sn İtiş" },
        steps: [
          "1. Kurulum: Kürek kemiklerini birbirine yaklaştırıp aşağı bastırın (skapular retraksiyon), ayakları yere sağlam basın.",
          "2. İniş: Barı kontrolle alt-orta göğüs çizgisine indirin, dirsekler gövdeyle ~45-60° açı yapsın.",
          "3. İtiş: Barı hafif geriye (göz hizasına) doğru kavisli bir yörüngede güçlüce itin."
        ],
        tips: "Partneriniz barı rack'ten alırken (lift-off) ve son zorlu tekrarlarda mutlaka baş ucunuzda spotter olmalı.",
        warning: "Dirsekleri 90 derece yana açmayın; omuz (rotator cuff) sıkışmasına yol açar."
      },
      {
        id: "ex-g2",
        name: "Incline Dumbbell Press (30°)",
        category: "Göğüs",
        target: "Üst Göğüs (Klaviküler Baş)",
        defaultSets: 4,
        defaultReps: "10-12",
        tempo: { neg: "3 sn İniş", pause: "1 sn", pos: "1 sn İtiş" },
        steps: [
          "1. Kurulum: Sehpayı 30 derece eğime ayarlayın (45° üstü yükü ön omuza kaydırır).",
          "2. İniş: Dambılları göğüs kafesini açarak omuzların hemen dışına kadar kontrollü indirin.",
          "3. İtiş: Üst noktada dambılları birbirine çarpmadan göğsü sıkarak yukarı itin."
        ],
        tips: "Ağır setlerde partneriniz dambılları dirseklerinizden destekleyerek başlangıç pozisyonuna almanıza yardımcı olabilir.",
        warning: "Belinizi sehpadan aşırı kaldırıp düz bench press açısına dönüştürmeyin."
      },
      {
        id: "ex-g3",
        name: "Cable Crossover (High-to-Low)",
        category: "Göğüs",
        target: "Alt & İç Göğüs Lifleri",
        defaultSets: 3,
        defaultReps: "12-15",
        tempo: { neg: "2 sn Açılış", pause: "1.5 sn Sıkıştırma", pos: "1.5 sn Kapama" },
        steps: [
          "1. Kurulum: Makaraları en üst konuma ayarlayın, bir ayağınızı denge için yarım adım öne alın.",
          "2. Sıkıştırma: Dirseklerdeki hafif bükülmeyi koruyarak ellerinizi alt karın önünde birleştirin.",
          "3. Dönüş: Göğüs kaslarındaki gerilimi kaybetmeden kolları yavaşça başlangıç açısına açın."
        ],
        tips: "Tepe noktada elleri birleştirdiğinizde 1.5 saniye bekleyip göğsü maksimum sıkıştırın.",
        warning: "Ağırlığı kollarınızla preslemeyin; bir ağaca sarılır gibi geniş kavis çizin."
      },
      {
        id: "ex-g4",
        name: "Rope Triceps Pushdown",
        category: "Triceps",
        target: "Triceps Lateral & Medial Baş",
        defaultSets: 4,
        defaultReps: "12-15",
        tempo: { neg: "2 sn Kalkış", pause: "1 sn Dip", pos: "1 sn İtiş" },
        steps: [
          "1. Kurulum: Üst kollarınızı gövdenizin iki yanına sabitleyin, hafifçe öne eğilin.",
          "2. İtiş: Halatı aşağı iterken alt noktada bilekleri dışa doğru ayırarak triceps'i tam kilitleyin.",
          "3. Dönüş: Dirsekleri ileri-geri oynatmadan sadece ön kolu 90 dereceye kadar yükseltin."
        ],
        tips: "Son sette partnerinizle birlikte ağırlığı %25 düşürüp tükenişe kadar 'Drop Set' uygulayın.",
        warning: "Dirsekleriniz öne kaçarsa hareket arka koldan çıkıp omuz ve göğse biner."
      }
    ]
  },
  sirt: {
    id: "sirt",
    title: "Sırt & Biceps Çekiş",
    partnerNote: "Partner Seansı · Üst Vücut Çekiş",
    sessionTitle: "Sırt & Biceps Seansı (V-Taper Çekiş)",
    exercises: [
      {
        id: "ex-s1",
        name: "Wide-Grip Lat Pulldown",
        category: "Sırt",
        target: "Latissimus Dorsi (Kanat)",
        defaultSets: 4,
        defaultReps: "10-12",
        tempo: { neg: "3 sn Salış", pause: "1 sn Göğüs", pos: "1 sn Çekiş" },
        steps: [
          "1. Kurulum: Barı omuz genişliğinin 1.5 katı genişlikte tutun, diz pedini bacaklarınıza tam kilitleyin.",
          "2. Çekiş: Önce omuzları aşağı bastırın, ardından dirsekleri kalçanıza doğru çekerek barı üst göğse indirin.",
          "3. Salış: Kanat kaslarının tam açılmasına izin vererek barı kontrollüce yukarı bırakın."
        ],
        tips: "Barı ellerinizle değil, dirseklerinizle aşağı çektiğinizi hayal edin; ön kol kasılmasını azaltır.",
        warning: "Barı ense arkasına çekmeyin; boyun omurları ve omuz kapsülü için risklidir."
      },
      {
        id: "ex-s2",
        name: "Barbell Bent-Over Row",
        category: "Sırt",
        target: "Orta Sırt, Rhomboidler & Lat",
        defaultSets: 4,
        defaultReps: "8-10",
        tempo: { neg: "2 sn İniş", pause: "1 sn Tepe", pos: "1 sn Çekiş" },
        steps: [
          "1. Kurulum: Kalçadan 45 derece öne eğilin, omurgayı düz ve karın kaslarını sıkı tutun.",
          "2. Çekiş: Barı alt göğüs / üst karın boşluğuna doğru çekip kürek kemiklerini birbirine kenetleyin.",
          "3. İniş: Gövde açısını bozmadan barı diz hizasına kadar kontrollü indirin."
        ],
        tips: "Gövdenizin yukarı-aşağı sallanmaması için partneriniz sırt açınızı yandan kontrol etmeli.",
        warning: "Beliniz yorulup kamburlaşırsa ağırlığı düşürün."
      },
      {
        id: "ex-s3",
        name: "Seated Cable Row (V-Bar)",
        category: "Sırt",
        target: "Kalınlık & Alt Trapez",
        defaultSets: 3,
        defaultReps: "12",
        tempo: { neg: "3 sn Uzama", pause: "1 sn Sıkıştırma", pos: "1 sn Çekiş" },
        steps: [
          "1. Kurulum: Ayakları platforma yerleştirin, dizler hafif bükülü ve göğüs dik olsun.",
          "2. Çekiş: V-aparatı göbek deliğine doğru çekerken omuzları geriye alın.",
          "3. Uzama: Belden aşırı öne yatmadan kürek kemiklerinin hafifçe açılmasına izin verin."
        ],
        tips: "Çekiş sonunda 1 saniye bekleyip sırtınızın ortasındaki bir kalemi sıkıştırıyormuş gibi kasın.",
        warning: "Belinizi sarkaç gibi ileri-geri sallayarak momentum kullanmayın."
      },
      {
        id: "ex-s4",
        name: "EZ-Bar Barbell Curl",
        category: "Biceps",
        target: "Biceps Brachii",
        defaultSets: 4,
        defaultReps: "10-12",
        tempo: { neg: "3 sn İniş", pause: "1 sn Tepe", pos: "1 sn Kaldırış" },
        steps: [
          "1. Kurulum: EZ-Bar'ı iç veya dış kıvrımdan kavrayın, dirsekleri gövde yanına sabitleyin.",
          "2. Kaldırış: Sadece ön kolu hareket ettirerek barı omuz hizasına kaldırın ve biceps'i sıkın.",
          "3. İniş: 3 saniye boyunca dirence karşı koyarak kollar tam açılana dek yavaşça indirin."
        ],
        tips: "Son 2 tekrarda partneriniz barın ortasından parmak ucuyla minimum destek vererek negatif tekrarı tamamlatsın.",
        warning: "Belinizi geriye atarak ağırlığı savurmayın."
      }
    ]
  },
  omuz: {
    id: "omuz",
    title: "Omuz & Core (3D Deltoid)",
    partnerNote: "Partner Seansı · Omuz & Core",
    sessionTitle: "Omuz & Core Seansı (3D Deltoid)",
    exercises: [
      {
        id: "ex-o1",
        name: "Seated Dumbbell Shoulder Press",
        category: "Omuz",
        target: "Anterior & Lateral Deltoid",
        defaultSets: 4,
        defaultReps: "8-10",
        tempo: { neg: "2.5 sn İniş", pause: "0 sn", pos: "1 sn İtiş" },
        steps: [
          "1. Kurulum: Dik sırt destekli sehpaya oturun, dambılları kulak hizasında tutun.",
          "2. Dirsek Açısı: Dirsekleri tam yana değil, 30 derece öne (skapular düzleme) alın.",
          "3. İtiş: Dambılları baş üstünde birbirine çarptırmadan güçlüce yukarı itin."
        ],
        tips: "Partneriniz ilk tekrarda dambılları omuz hizasına alırken bilek altından destek vermeli.",
        warning: "Boynunuzu ileri uzatmayın, başınızı sehpaya yaslı tutun."
      },
      {
        id: "ex-o2",
        name: "Dumbbell Lateral Raise",
        category: "Omuz",
        target: "Lateral Deltoid (Yan Omuz)",
        defaultSets: 4,
        defaultReps: "12-15",
        tempo: { neg: "3 sn İniş", pause: "1 sn Tepe", pos: "1 sn Açış" },
        steps: [
          "1. Kurulum: Ayakta gövdeyi 10 derece hafif öne eğin, dirsekleri çok hafif bükün.",
          "2. Açış: Dambılları tam yana değil, hafif öne doğru (saat 10 ve 2 yönüne) omuz hizasına kaldırın.",
          "3. İniş: Yan omuzdaki gerilimi kaybetmeden bacakların hafif önüne kontrollü indirin."
        ],
        tips: "Ağırlığı ellerinizle değil, dirseklerinizle tavana doğru kaldırıyormuş gibi düşünün.",
        warning: "Omuzlarınızı kulaklarınıza doğru çekmeyin; yük trapez kasına kaçar."
      },
      {
        id: "ex-o3",
        name: "Rope Face Pull",
        category: "Omuz",
        target: "Arka Omuz & Rotator Cuff",
        defaultSets: 4,
        defaultReps: "15",
        tempo: { neg: "2 sn Dönüş", pause: "1.5 sn Sıkıştırma", pos: "1 sn Çekiş" },
        steps: [
          "1. Kurulum: Makarayı üst göğüs/yüz hizasına ayarlayın, halatı başparmaklar geriyi gösterecek şekilde tutun.",
          "2. Çekiş: Halatı alnınıza doğru çekerken elleri iki yana açıp dış rotasyon (çift biceps pozu gibi) yapın.",
          "3. Sıkıştırma: Arka omuz ve üst sırtı 1.5 saniye sıkıp kontrollü bırakın."
        ],
        tips: "Sağlıklı omuz eklemi ve dik duruş için her üst vücut haftasında vazgeçilmez harekettir.",
        warning: "Çok ağır yük seçip belinizle geriye asılmayın."
      }
    ]
  },
  kol: {
    id: "kol",
    title: "Kol & Süperset (Biceps & Triceps)",
    partnerNote: "Partner Seansı · Kol Hipertrofisi",
    sessionTitle: "Kol Seansı (Biceps & Triceps Pump)",
    exercises: [
      {
        id: "ex-k1",
        name: "Incline Dumbbell Curl",
        category: "Kol",
        target: "Biceps Uzun Baş (Tepe Noktası)",
        defaultSets: 4,
        defaultReps: "10-12",
        tempo: { neg: "3 sn İniş", pause: "1 sn Esneme", pos: "1 sn Kaldırış" },
        steps: [
          "1. Kurulum: 45-60 derece eğimli sehpaya sırtınızı yaslayın, kollarınız yanlardan serbestçe aşağı sarksın.",
          "2. Kaldırış: Dirsekleri geride sabit tutarak avuç içleri yukarı bakacak şekilde dambılları kaldırın.",
          "3. İniş: Biceps uzun başında tam gerilimi hissedene kadar 3 saniyede yavaşça indirin."
        ],
        tips: "Dirseklerin öne gelmesine izin vermeyin; bu hareketin sırrı dip noktadaki maksimum esnemedir.",
        warning: "Omuz kapsülünü korumak için dip noktada ağırlığı aniden bırakmayın."
      },
      {
        id: "ex-k2",
        name: "EZ-Bar Skullcrusher (Alna Triceps)",
        category: "Kol",
        target: "Triceps Uzun & Lateral Baş",
        defaultSets: 4,
        defaultReps: "10-12",
        tempo: { neg: "3 sn İniş", pause: "1 sn", pos: "1 sn İtiş" },
        steps: [
          "1. Kurulum: Düz sehpaya uzanın, EZ-Bar'ı kollar yere dik (veya hafif baş gerisine eğimli) olacak şekilde tutun.",
          "2. İniş: Dirsekleri iki yana açmadan sadece ön kolları bükerek barı alnınızın hemen gerisine indirin.",
          "3. İtiş: Üst kol açısını koruyarak triceps gücüyle barı başlangıç noktasına itin."
        ],
        tips: "Partneriniz baş ucunuzda durarak barı alıp vermeli ve son tekrarlarda güvenlik sağlamalı.",
        warning: "Dirseklerin dışa açılmasını önleyin, bilekleri düz tutun."
      },
      {
        id: "ex-k3",
        name: "Hammer Curl (Halat veya Dambıl)",
        category: "Kol",
        target: "Brachialis & Ön Kol",
        defaultSets: 3,
        defaultReps: "12-15",
        tempo: { neg: "2.5 sn İniş", pause: "1 sn Tepe", pos: "1 sn Kaldırış" },
        steps: [
          "1. Kurulum: Avuç içleri birbirine bakacak (nötr/çekiç tutuş) şekilde dambılları kavrayın.",
          "2. Kaldırış: Bilekleri döndürmeden ağırlığı omuz hizasına kaldırıp 1 saniye sıkın.",
          "3. İniş: Kontrollü şekilde başlangıç pozisyonuna indirin."
        ],
        tips: "Kol kalınlığını dıştan artıran brachialis kasını en iyi hedefleyen harekettir.",
        warning: "Gövde salınımı yapmadan omuzları sabit tutun."
      }
    ]
  },
  kardiyo: {
    id: "kardiyo",
    title: "Kardiyo & HIIT Kondisyon",
    partnerNote: "Partner Seansı · Yağ Yakımı & Atletik Performans",
    sessionTitle: "HIIT & Atletik Kondisyon Seansı",
    exercises: [
      {
        id: "ex-c1",
        name: "Kettlebell Swing",
        category: "Kardiyo",
        target: "Arka Zincir, Kalça & Kardiyo",
        defaultSets: 4,
        defaultReps: "20",
        tempo: { neg: "1 sn Geri", pause: "0 sn", pos: "1 sn Patlayıcı" },
        steps: [
          "1. Kurulum: Ayakları omuz genişliğinden biraz açık tutun, kettlebell'i iki elle kavrayın.",
          "2. Hip Hinge: Dizleri hafif kırıp kalçayı geriye itin, ağırlığı bacak arasına alın.",
          "3. Patlayıcı İtiş: Kalçayı sertçe ileri kilitleyerek kettlebell'i göğüs hizasına savurun."
        ],
        tips: "Ağırlığı kollarınızla kaldırmayın; güç tamamen kalça (glute) patlamasından gelmeli.",
        warning: "Omurgayı daima nötr tutun, alt noktada belinizi yuvarlamayın."
      },
      {
        id: "ex-c2",
        name: "Rowing Ergometer (Kürek İnterval)",
        category: "Kardiyo",
        target: "Tüm Vücut & VO2 Max",
        defaultSets: 4,
        defaultReps: "250m Sprint",
        tempo: { neg: "2 sn Dönüş", pause: "0 sn", pos: "1 sn Güçlü Çekiş" },
        steps: [
          "1. Sıra Kuralı: Önce bacaklarla itin (%60 güç), sonra gövdeyi hafif geriye yatırın (%20), en son kolları göğse çekin (%20).",
          "2. Dönüş: Önce kolları uzatın, gövdeyi öne alın ve son olarak dizleri bükerek başlangıca kayın.",
          "3. Partner Yarışı: Partnerinizle 250 metre sprint atıp 45 saniye dinlenerek 4 tur tamamlayın."
        ],
        tips: "Partnerinizle sıra tabanlı veya yan yana kürek makinelerinde 250m zaman yarışı yapın!",
        warning: "Bacaklar düzelmeden kollarla çekmeye başlamayın."
      },
      {
        id: "ex-c3",
        name: "Plank & Core Stabilizasyon",
        category: "Kardiyo",
        target: "Transversus Abdominis & Core",
        defaultSets: 3,
        defaultReps: "60 sn",
        tempo: { neg: "İzometrik", pause: "60 sn Sabit", pos: "Nefes Kontrolü" },
        steps: [
          "1. Kurulum: Dirsekleri tam omuzların altına yerleştirin, ayak parmak uçlarında yükselin.",
          "2. Hizalama: Baş, sırt ve topuklar tek bir düz çizgi oluşturmalı; kalçayı ve karnı sıkın.",
          "3. Süre: Partnerinizle aynı anda kronometreyi başlatıp 60 saniye formu bozmadan koruyun."
        ],
        tips: "Dirseklerinizi ayak parmaklarınıza doğru çekiyormuş gibi zemini sıkıca kavrayın.",
        warning: "Belinizin aşağı çökmesine izin vermeyin."
      }
    ]
  }
};

function detectRoutineKeyFromWorkout(workoutText = "") {
  const t = String(workoutText).toLowerCase();
  if (t.includes("göğüs") || t.includes("gogus") || t.includes("bench") || t.includes("itiş")) return "gogus";
  if (t.includes("sırt") || t.includes("sirt") || t.includes("çekiş") || t.includes("lat")) return "sirt";
  if (t.includes("omuz") || t.includes("deltoid")) return "omuz";
  if (t.includes("kol") || t.includes("biceps") || t.includes("triceps")) return "kol";
  if (t.includes("kardiyo") || t.includes("hiit") || t.includes("koşu") || t.includes("kondisyon")) return "kardiyo";
  if (t.includes("bacak") || t.includes("squat") || t.includes("quad")) return "bacak";
  return "bacak";
}

export function renderRoutinesView(container, onBack, onGoDiscover) {
  let activeTab = "video"; // 'video' | 'visual' | 'tips'
  let selectedRoutineKey = "bacak";
  let selectedAppointmentId = null;
  let previewLibraryWithoutMatch = false;
  let lastAutoMappedAptId = null;

  let timerSeconds = 45;
  let timerInterval = null;
  let isTimerRunning = false;
  const checkedSets = {};

  function getActiveUserAppointments() {
    const currentUser = auth.getCurrentUser() || {};
    const uid = currentUser.id;
    const allApts = db.getCollection("appointments") || [];
    const legacyDemoIds = new Set(["apt_mert_bacak_today", "apt_selin_invite_pending", "apt_burak_past_history"]);

    return allApts.filter(a => {
      if (legacyDemoIds.has(a.id) && !a.isExplicitDemo) return false;
      const isMine = uid
        ? (a.userId === uid || a.partnerId === uid || a.userId === "current-user" || a.partnerId === "current-user")
        : (a.userId === "current-user" || a.partnerId === "current-user");
      if (!isMine) return false;
      const otherId = a.userId === uid ? a.partnerId : a.userId;
      if (uid && otherId && db.isBlocked(uid, otherId)) return false;
      return a.status === "accepted" || a.status === "pending" || a.status === "incoming_request";
    });
  }

  function formatTime(sec) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  function startTimer() {
    if (isTimerRunning) {
      clearInterval(timerInterval);
      isTimerRunning = false;
      render();
      return;
    }

    isTimerRunning = true;
    render();

    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        const clockEl = document.getElementById("rest-timer-clock");
        if (clockEl) clockEl.textContent = formatTime(timerSeconds);
      } else {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerSeconds = 45;
        soundService.playSuccessChime();
        notify.success("Dinlenme süresi bitti! Sıradaki sete geçin.");
        render();
      }
    }, 1000);
  }

  function adjustTimer(deltaSeconds) {
    timerSeconds = Math.max(5, Math.min(300, timerSeconds + deltaSeconds));
    const clockEl = document.getElementById("rest-timer-clock");
    if (clockEl) clockEl.textContent = formatTime(timerSeconds);
  }

  function resetTimer(defaultSec = 45) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerSeconds = defaultSec;
    render();
  }

  function render() {
    const currentUser = auth.getCurrentUser() || {};
    const allUsers = db.getCollection("users") || [];
    const activeAppointments = getActiveUserAppointments();

    // If the user has NO matched workout appointment yet and hasn't clicked library preview -> show "Hadi Eşleş!"
    if (activeAppointments.length === 0 && !previewLibraryWithoutMatch) {
      container.innerHTML = `
        <div class="routines-page fade-in">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div>
              <h2 style="font-size: 24px; font-weight: 800; color: var(--text-main); margin: 0 0 4px 0;">Günün Hareketleri</h2>
              <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">Partnerinle planladığın antrenmana özel hareket akışı</p>
            </div>
          </div>

          <div class="routines-empty-match-card" style="background: linear-gradient(155deg, rgba(255, 87, 34, 0.12) 0%, var(--bg-surface-elevated) 60%); border: 1px solid rgba(255, 87, 34, 0.35); border-radius: 22px; padding: 32px 22px; text-align: center; box-shadow: 0 16px 36px rgba(0,0,0,0.45); margin: 8px 0 18px 0;">
            <div style="width: 68px; height: 68px; border-radius: 20px; background: var(--color-kor-gradient); color: #FFF; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(255, 87, 34, 0.4);">
              ${icons.flame(34)}
            </div>

            <span style="display: inline-block; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-kor); background: rgba(255, 87, 34, 0.14); border: 1px solid rgba(255, 87, 34, 0.3); padding: 4px 12px; border-radius: 999px; margin-bottom: 10px;">
              PARTNER ANTRENMAN SİSTEMİ
            </span>

            <h3 style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 0 0 10px 0; line-height: 1.25;">
              Henüz Eşleşmiş Bir Antrenmanın Yok — Hadi Eşleş!
            </h3>

            <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.55; max-width: 340px; margin: 0 auto 22px auto;">
              Hareketler alanı, <strong>kiminle ne sporu yapacaksan</strong> (Bacak, Göğüs, Sırt, Omuz, Kol veya Kardiyo) o günün hareketlerini ve set sayacını otomatik olarak karşına çıkarır.
            </p>

            <div style="display: flex; flex-direction: column; gap: 10px; max-width: 290px; margin: 0 auto;">
              <button type="button" class="btn-kor" id="btn-routines-go-match" style="padding: 14px 20px; font-size: 14.5px; font-weight: 800; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 22px rgba(255, 87, 34, 0.38);">
                ${icons.users(18)} <span>Hadi Eşleş! (Partner Bul)</span>
              </button>

              <button type="button" class="btn-ghost" id="btn-routines-preview-library" style="padding: 10px 14px; font-size: 12.5px; font-weight: 700; color: var(--text-secondary); border: 1px solid var(--border-glass); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                ${icons.dumbbell(15)} <span>Hareket Kütüphanesine Göz At</span>
              </button>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); border-radius: 14px; padding: 12px; text-align: center;">
              <div style="color: var(--color-kor); font-weight: 800; font-size: 13px; margin-bottom: 3px;">1. Partner Seç</div>
              <span style="font-size: 11px; color: var(--text-secondary);">Keşfet'ten sporcuyu bul</span>
            </div>
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); border-radius: 14px; padding: 12px; text-align: center;">
              <div style="color: var(--color-kor); font-weight: 800; font-size: 13px; margin-bottom: 3px;">2. Bölgeyi Planla</div>
              <span style="font-size: 11px; color: var(--text-secondary);">Göğüs, Bacak, Sırt seç</span>
            </div>
            <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); border-radius: 14px; padding: 12px; text-align: center;">
              <div style="color: var(--color-kor); font-weight: 800; font-size: 13px; margin-bottom: 3px;">3. Setleri Başlat</div>
              <span style="font-size: 11px; color: var(--text-secondary);">O günün hareketleri açılsın</span>
            </div>
          </div>
        </div>
      `;

      container.querySelector("#btn-routines-go-match")?.addEventListener("click", () => {
        if (onGoDiscover) {
          onGoDiscover();
        } else if (window.veyro && window.veyro.switchToTab) {
          window.veyro.switchToTab("discover");
        } else if (onBack) {
          onBack();
        }
      });

      container.querySelector("#btn-routines-preview-library")?.addEventListener("click", () => {
        previewLibraryWithoutMatch = true;
        render();
      });
      return;
    }

    // Determine active appointment & auto-select its workout program
    let activeApt = null;
    if (activeAppointments.length > 0) {
      if (!selectedAppointmentId || !activeAppointments.some(a => a.id === selectedAppointmentId)) {
        selectedAppointmentId = activeAppointments[0].id;
      }
      activeApt = activeAppointments.find(a => a.id === selectedAppointmentId) || activeAppointments[0];
      if (activeApt && lastAutoMappedAptId !== activeApt.id) {
        lastAutoMappedAptId = activeApt.id;
        selectedRoutineKey = detectRoutineKeyFromWorkout(activeApt.workoutType);
      }
    }

    const routine = ROUTINE_PROGRAMS[selectedRoutineKey] || ROUTINE_PROGRAMS.bacak;
    const exercises = routine.exercises;

    // Resolve partner details if matched
    let partnerName = "";
    let partnerInitials = "SP";
    let partnerAvatar = "";
    let partnerBannerSubtitle = routine.partnerNote;

    if (activeApt) {
      const isUserCreator = activeApt.userId === currentUser.id || activeApt.userId === "current-user";
      const partnerId = isUserCreator ? activeApt.partnerId : activeApt.userId;
      const partnerObj = allUsers.find(u => u.id === partnerId);
      partnerName = partnerObj?.name || (isUserCreator ? activeApt.partnerName : activeApt.userName) || "Partner";
      partnerInitials = partnerObj?.initials || partnerName.substring(0, 2).toUpperCase();
      partnerAvatar = (partnerObj?.photos && partnerObj.photos[0]) || partnerObj?.avatar || "";
      partnerBannerSubtitle = `${partnerName} ile · ${activeApt.date || 'Bugün'} ${activeApt.time || ''} · ${activeApt.gymName || 'Spor Salonu'}`;
    }

    let totalSets = 0;
    let completedSets = 0;
    exercises.forEach(ex => {
      totalSets += ex.defaultSets;
      for (let s = 0; s < ex.defaultSets; s++) {
        if (checkedSets[`${ex.id}_s${s}`]) completedSets++;
      }
    });
    const progressPct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

    container.innerHTML = `
      <div class="routines-page fade-in">
        <!-- Top Nav Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <button class="btn-ghost" id="btn-routines-back" style="padding: 6px;" aria-label="Geri">
            ${icons.chevronLeft(22)}
          </button>
          <div style="text-align: center;">
            <h3 style="font-size: 18px; font-weight: 800; color: var(--text-main); margin: 0;">${routine.title}</h3>
            <span style="font-size: 11.5px; color: var(--text-secondary);">${partnerBannerSubtitle}</span>
          </div>
          <div style="width: 28px;"></div>
        </div>

        <!-- Matched Partner Workout Banner -->
        ${activeApt ? `
          <div style="background: linear-gradient(135deg, rgba(255, 87, 34, 0.14) 0%, rgba(20, 22, 28, 0.96) 100%); border: 1px solid rgba(255, 87, 34, 0.35); border-radius: 16px; padding: 12px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
              ${partnerAvatar
                ? `<img src="${partnerAvatar}" alt="${partnerName}" style="width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-kor); flex-shrink: 0;">`
                : `<div style="width: 42px; height: 42px; border-radius: 50%; background: var(--color-kor-gradient); color: #FFF; font-weight: 800; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${partnerInitials}</div>`
              }
              <div style="min-width: 0;">
                <div style="font-size: 10.5px; font-weight: 800; color: var(--color-kor); text-transform: uppercase; letter-spacing: 0.04em;">
                  GÜNÜN EŞLEŞMİŞ ANTRENMANI
                </div>
                <div style="font-size: 14px; font-weight: 800; color: #FFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${partnerName} ile ${activeApt.workoutType || routine.title}
                </div>
                <div style="font-size: 11.5px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${activeApt.date || 'Bugün'} · ${activeApt.time || '19:00'} · ${activeApt.gymName || 'Spor Salonu'}
                </div>
              </div>
            </div>
            <span class="badge badge-kor" style="flex-shrink: 0; font-size: 10px; padding: 4px 8px;">
              ${activeApt.status === 'accepted' ? 'Eşleşti' : 'Davet Aktif'}
            </span>
          </div>
          ${activeAppointments.length > 1 ? `
            <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 8px; scrollbar-width: none;">
              ${activeAppointments.map(apt => {
                const isCreator = apt.userId === currentUser.id || apt.userId === "current-user";
                const pName = isCreator ? apt.partnerName : apt.userName;
                return `
                  <button type="button" class="apt-switch-pill" data-apt-id="${apt.id}" style="padding: 5px 10px; font-size: 11px; font-weight: 700; border-radius: 999px; white-space: nowrap; border: 1px solid ${apt.id === activeApt.id ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${apt.id === activeApt.id ? 'rgba(255,87,34,0.18)' : 'var(--bg-surface-elevated)'}; color: #FFF; cursor: pointer;">
                    ${pName || 'Partner'} · ${apt.workoutType || 'Antrenman'} (${apt.date || ''})
                  </button>
                `;
              }).join('')}
            </div>
          ` : ''}
        ` : `
          <div style="background: rgba(255, 87, 34, 0.1); border: 1px solid rgba(255, 87, 34, 0.3); border-radius: 14px; padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <span style="font-size: 12px; color: var(--text-main);">Önizleme modundasın. Kendi antrenmanın için partnerle eşleş!</span>
            <button type="button" class="btn-kor" id="btn-banner-go-match" style="padding: 6px 12px; font-size: 11.5px; font-weight: 800; border-radius: 8px; white-space: nowrap; width: auto;">
              Hadi Eşleş
            </button>
          </div>
        `}

        <!-- Routine Selector Dropdown / Pills -->
        <div class="routine-picker-bar" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 12px; scrollbar-width: none;">
          ${Object.values(ROUTINE_PROGRAMS).map(prog => `
            <button class="routine-split-pill ${prog.id === selectedRoutineKey ? 'active' : ''}" data-routine="${prog.id}" style="padding: 6px 12px; font-size: 11.5px; font-weight: 700; border-radius: 20px; white-space: nowrap; cursor: pointer; border: 1px solid ${prog.id === selectedRoutineKey ? 'var(--color-kor)' : 'var(--border-glass)'}; background: ${prog.id === selectedRoutineKey ? 'var(--color-kor-gradient)' : 'var(--bg-surface-elevated)'}; color: #FFF; transition: all 0.2s ease;">
              ${prog.title}
            </button>
          `).join('')}
        </div>

        <!-- Routine Video / Timer Hero Card -->
        <div class="routine-hero-card" style="position: relative; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <div>
              <span class="badge badge-kor" style="margin-bottom: 4px; display: inline-flex; align-items: center; gap: 4px;">
                <span class="live-pulse" style="width: 6px; height: 6px;"></span> Canlı Seans
              </span>
              <h4 style="font-size: 18px; font-weight: 800; color: #FFF; margin: 0;">${routine.sessionTitle}</h4>
            </div>
            <div class="timer-clock" id="rest-timer-clock">${formatTime(timerSeconds)}</div>
          </div>

          <!-- Progress Bar -->
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 700;">
              <span>İlerleme: ${completedSets} / ${totalSets} Set Tamamlandı</span>
              <span style="color: var(--color-kor);">${progressPct}%</span>
            </div>
            <div style="height: 6px; width: 100%; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${progressPct}%; background: var(--color-kor-gradient); transition: width 0.3s ease; box-shadow: 0 0 8px var(--color-kor-glow);"></div>
            </div>
          </div>

          <!-- Rest Timer Controls -->
          <div class="timer-widget" style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.3); border-radius: 12px; padding: 10px 14px;">
            <div>
              <div class="timer-label" style="font-size: 12px; font-weight: 800; color: #FFF;">Set Arası Dinlenme Sayacı</div>
              <span style="font-size: 11px; color: var(--text-muted);">Önerilen: 45 saniye</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <button class="btn-ghost" id="btn-timer-minus" title="-15 sn" style="padding: 5px 8px; font-size: 11px; font-weight: 800; color: var(--text-secondary); background: rgba(255,255,255,0.06); border-radius: 6px;">
                -15s
              </button>
              <button class="btn-timer-toggle" id="btn-toggle-rest-timer" aria-label="Sayacı Başlat / Durdur" style="width: 36px; height: 36px; border-radius: 50%; background: var(--color-kor-gradient); color: #FFF; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px var(--color-kor-glow);">
                ${isTimerRunning ? icons.pause(18) : icons.play(18)}
              </button>
              <button class="btn-ghost" id="btn-timer-plus" title="+15 sn" style="padding: 5px 8px; font-size: 11px; font-weight: 800; color: var(--text-secondary); background: rgba(255,255,255,0.06); border-radius: 6px;">
                +15s
              </button>
              <button class="btn-ghost" id="btn-timer-reset" title="Sıfırla" style="padding: 6px; color: var(--text-muted); display: flex; align-items: center;">
                ${icons.rotateCcw(15)}
              </button>
            </div>
          </div>
        </div>

        <!-- Subtabs: Video / Görsel / İpuçları -->
        <div class="routine-subtabs" style="margin-bottom: 14px;">
          <button class="routine-subtab-btn ${activeTab === 'video' ? 'active' : ''}" data-subtab="video">
            ${icons.activity(14)} Video & Tempo
          </button>
          <button class="routine-subtab-btn ${activeTab === 'visual' ? 'active' : ''}" data-subtab="visual">
            ${icons.target(14)} Görsel Form
          </button>
          <button class="routine-subtab-btn ${activeTab === 'tips' ? 'active' : ''}" data-subtab="tips">
            ${icons.bulb(14)} İpuçları
          </button>
        </div>

        <!-- Exercises List -->
        <div class="exercises-list" style="display: flex; flex-direction: column; gap: 14px;">
          ${exercises.map((ex, index) => {
            return `
              <div class="exercise-item-card" data-ex-id="${ex.id}" style="background: var(--bg-surface-elevated); border: 1px solid var(--border-glass); border-radius: var(--radius-lg); padding: 16px;">
                <div class="exercise-header-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                  <div class="exercise-info-left" style="display: flex; align-items: center; gap: 12px;">
                    <div class="exercise-icon-wrap" style="width: 38px; height: 38px; border-radius: 10px; background: rgba(255, 87, 34, 0.12); color: var(--color-kor); display: flex; align-items: center; justify-content: center;">
                      ${icons.dumbbell(20)}
                    </div>
                    <div class="exercise-titles">
                      <h4 style="font-size: 15px; font-weight: 800; color: #FFF; margin: 0 0 2px 0;">${index + 1}. ${ex.name}</h4>
                      <p style="font-size: 11.5px; color: var(--text-secondary); margin: 0;">Hedef: ${ex.defaultSets} set · ${ex.defaultReps} tekrar · <span style="color: var(--color-kor); font-weight: 700;">${ex.target}</span></p>
                    </div>
                  </div>
                  <span style="color: var(--text-muted);">${icons.chevronRight(18)}</span>
                </div>

                <!-- SUBTAB 1: VIDEO & TEMPO PREVIEW -->
                ${activeTab === 'video' ? `
                  <div class="exercise-video-card" style="margin-top: 10px; border-radius: 12px; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 87, 34, 0.3); padding: 12px; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                      <span style="font-size: 11px; font-weight: 800; color: var(--color-kor); text-transform: uppercase; display: flex; align-items: center; gap: 5px;">
                        ${icons.play(13)} Egzersiz Tempo Rehberi (Kadans)
                      </span>
                      <span style="font-size: 10.5px; color: var(--color-cyan, #00E5FF); background: rgba(0, 229, 255, 0.1); padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                        ${ex.target}
                      </span>
                    </div>
                    <div class="workout-tempo-box" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; text-align: center; margin-bottom: 8px;">
                      <div style="background: rgba(255,255,255,0.05); padding: 6px 4px; border-radius: 6px;">
                        <span style="font-size: 10px; color: var(--text-secondary); display: block;">Negatif (İniş)</span>
                        <strong style="font-size: 13px; color: #FFF;">${ex.tempo.neg}</strong>
                      </div>
                      <div style="background: rgba(255,255,255,0.05); padding: 6px 4px; border-radius: 6px;">
                        <span style="font-size: 10px; color: var(--text-secondary); display: block;">Duraklama</span>
                        <strong style="font-size: 13px; color: #FFF;">${ex.tempo.pause}</strong>
                      </div>
                      <div style="background: rgba(255,255,255,0.05); padding: 6px 4px; border-radius: 6px;">
                        <span style="font-size: 10px; color: var(--text-secondary); display: block;">Pozitif (İtiş)</span>
                        <strong style="font-size: 13px; color: var(--color-kor);">${ex.tempo.pos}</strong>
                      </div>
                    </div>
                    <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4; display: flex; align-items: center; gap: 6px;">
                      ${icons.bulb(13)} <span>Nefes kuralı: Yükü kaldırırken (itişte) ağızdan verin, indirirken burundan derin nefes alın.</span>
                    </div>
                  </div>
                ` : ''}

                <!-- SUBTAB 2: VISUAL BIOMECHANICAL FORM GUIDE -->
                ${activeTab === 'visual' ? `
                  <div class="exercise-visual-card" style="margin-top: 10px; border-radius: 12px; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(0, 229, 255, 0.25); padding: 12px; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                      <span style="font-size: 11px; font-weight: 800; color: var(--color-cyan, #00E5FF); text-transform: uppercase; display: flex; align-items: center; gap: 5px;">
                        ${icons.target(13)} Biyomekanik Form ve Açı Aşamaları
                      </span>
                      <span style="font-size: 10px; color: var(--text-muted); font-weight: 700;">3 Fazlı Rehber</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px; font-size: 11.5px; line-height: 1.4; color: var(--text-main);">
                      ${ex.steps.map(step => `
                        <div style="display: flex; gap: 6px; align-items: flex-start;">
                          <span style="color: var(--color-kor); font-weight: 800;">•</span>
                          <span>${step}</span>
                        </div>
                      `).join('')}
                    </div>
                    <div style="margin-top: 8px; padding: 6px 10px; background: rgba(244, 63, 94, 0.12); border-left: 3px solid var(--color-rose); border-radius: 4px; font-size: 11px; color: #FFF; display: flex; align-items: center; gap: 6px;">
                      ${icons.alertTriangle(14)}
                      <span><strong>Kritik Uyarı:</strong> ${ex.warning}</span>
                    </div>
                  </div>
                ` : ''}

                <!-- SUBTAB 3: COACH TIPS -->
                ${activeTab === 'tips' ? `
                  <div style="margin-top: 10px; margin-bottom: 12px; font-size: 12px; color: var(--text-paper); background: rgba(255, 87, 34, 0.08); border: 1px solid rgba(255, 87, 34, 0.2); padding: 10px 14px; border-radius: 10px; display: flex; align-items: center; gap: 8px;">
                    <div style="color: var(--color-kor); flex-shrink: 0;">${icons.bulb(16)}</div>
                    <div>
                      <strong style="color: #FFF;">Antrenör Tavsiyesi:</strong> ${ex.tips}
                    </div>
                  </div>
                ` : ''}

                <!-- Interactive Set Trackers -->
                <div class="exercise-sets-tracker" style="display: flex; flex-direction: column; gap: 6px;">
                  ${Array.from({ length: ex.defaultSets }).map((_, sIdx) => {
                    const setKey = `${ex.id}_s${sIdx}`;
                    const isChecked = Boolean(checkedSets[setKey]);
                    return `
                      <div class="set-row-item ${isChecked ? 'completed-row' : ''}" style="display: flex; align-items: center; justify-content: space-between; background: ${isChecked ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${isChecked ? 'rgba(0, 229, 255, 0.3)' : 'var(--border-glass)'}; border-radius: 8px; padding: 8px 12px; transition: all 0.2s ease;">
                        <span class="set-tag" style="font-size: 12px; font-weight: 800; color: ${isChecked ? 'var(--color-cyan, #00E5FF)' : '#FFF'};">Set ${sIdx + 1}</span>
                        <span class="set-reps-weight" style="font-size: 12px; color: var(--text-secondary);">${ex.defaultReps} tekrar</span>
                        <button class="set-check-btn ${isChecked ? 'checked' : ''}" data-set-key="${setKey}" aria-label="Seti tamamla" style="width: 28px; height: 28px; border-radius: 6px; border: 1px solid ${isChecked ? 'var(--color-kor)' : 'rgba(255,255,255,0.2)'}; background: ${isChecked ? 'var(--color-kor)' : 'transparent'}; color: #FFF; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease;">
                          ${isChecked ? icons.check(16) : ''}
                        </button>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <p style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 14px; line-height: 1.4;">
          Antrenman partnerinizle senkronize seans. Her set tamamlandığında dinlenme sayacı otomatik başlar.
        </p>
      </div>
    `;

    // Switch between active appointments if user has multiple
    container.querySelectorAll(".apt-switch-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedAppointmentId = btn.dataset.aptId;
        render();
      });
    });

    // Banner "Hadi Eşleş" button when in preview mode
    container.querySelector("#btn-banner-go-match")?.addEventListener("click", () => {
      if (onGoDiscover) {
        onGoDiscover();
      } else if (window.veyro && window.veyro.switchToTab) {
        window.veyro.switchToTab("discover");
      }
    });

    // Routine selector buttons
    container.querySelectorAll(".routine-split-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedRoutineKey = btn.dataset.routine;
        render();
      });
    });

    // Back click
    document.getElementById("btn-routines-back")?.addEventListener("click", () => {
      if (activeAppointments.length === 0 && previewLibraryWithoutMatch) {
        previewLibraryWithoutMatch = false;
        render();
      } else if (onBack) {
        onBack();
      }
    });

    // Subtabs click
    container.querySelectorAll(".routine-subtab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.subtab;
        render();
      });
    });

    // Timer buttons
    document.getElementById("btn-toggle-rest-timer")?.addEventListener("click", startTimer);
    document.getElementById("btn-timer-plus")?.addEventListener("click", () => adjustTimer(15));
    document.getElementById("btn-timer-minus")?.addEventListener("click", () => adjustTimer(-15));
    document.getElementById("btn-timer-reset")?.addEventListener("click", () => resetTimer(45));

    // Set check clicks
    container.querySelectorAll(".set-check-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.setKey;
        checkedSets[key] = !checkedSets[key];
        const isNowChecked = checkedSets[key];

        if (isNowChecked) {
          soundService.playMessageChime();
          resetTimer(45);
          startTimer();
          notify.success("Set tamamlandı! 45 sn dinlenme sayacı başladı.");
        }
        render();
      });
    });
  }

  render();
}
