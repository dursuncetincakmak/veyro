let reportsStore = [
  {
    id: "rep_sample_1",
    ticketId: "#REP-SAFE26",
    reporterId: "usr_1730000000000",
    reporterName: "Sistem Denetimi",
    reportedUserId: "usr_fake_sample",
    reportedUserName: "Şüpheli Profil",
    reason: "Sahte Profil / Yanıltıcı Bilgi",
    details: "Fotoğraflar internetten alınmış görünüyor, antrenman davetlerine yanıt vermiyor.",
    status: "İşlem Yapıldı",
    actionTaken: "Profil incelemeye alındı ve geçici olarak gizlendi.",
    createdAt: Date.now() - 86400000
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
    return res.status(200).json(reportsStore);
  }

  if (req.method === 'POST') {
    try {
      let report = req.body;
      if (typeof report === 'string') {
        report = JSON.parse(report);
      }
      if (report && (report.id || report.ticketId)) {
        const idx = reportsStore.findIndex(r => r.id === report.id || r.ticketId === report.ticketId);
        if (idx >= 0) {
          reportsStore[idx] = { ...reportsStore[idx], ...report, updatedAt: Date.now() };
        } else {
          reportsStore.unshift({ ...report, createdAt: report.createdAt || Date.now() });
        }
      }
      return res.status(200).json({ success: true, count: reportsStore.length, reports: reportsStore });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
