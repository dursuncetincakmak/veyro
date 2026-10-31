let dealsStore = [
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
    brand: "MACFIT & FITNESSPARK",
    title: "1 Günlük Misafir Girişi Ücretsiz",
    description: "Partnerinizle beraber seçili kulüplerde tüm gün ücretsiz antrenman ve spa kullanımı.",
    badge: "ÜCRETSİZ GİRİŞ",
    code: "VEYROPASS",
    validUntil: "31 Aralık 2026"
  }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(dealsStore);
  }

  if (req.method === 'POST') {
    try {
      let deal = req.body;
      if (typeof deal === 'string') {
        deal = JSON.parse(deal);
      }
      if (deal && deal.id) {
        const idx = dealsStore.findIndex(d => d.id === deal.id);
        if (idx >= 0) {
          dealsStore[idx] = { ...dealsStore[idx], ...deal };
        } else {
          dealsStore.unshift(deal);
        }
      }
      return res.status(200).json({ success: true, count: dealsStore.length, deals: dealsStore });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query || {};
      if (id) {
        dealsStore = dealsStore.filter(d => d.id !== id);
      }
      return res.status(200).json({ success: true, count: dealsStore.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
