import { REAL_APPOINTMENTS } from '../../src/services/seedChats.js';

let aptStore = [...REAL_APPOINTMENTS];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(aptStore);
  }

  if (req.method === 'POST') {
    try {
      let apt = req.body;
      if (typeof apt === 'string') {
        apt = JSON.parse(apt);
      }
      if (apt && apt.id) {
        const exIdx = aptStore.findIndex(a => a.id === apt.id);
        if (exIdx >= 0) {
          aptStore[exIdx] = { ...aptStore[exIdx], ...apt };
        } else {
          aptStore.unshift(apt);
        }
      }
      return res.status(200).json({ success: true, count: aptStore.length, appointments: aptStore });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
