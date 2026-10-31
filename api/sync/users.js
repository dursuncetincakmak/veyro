import { REAL_REGISTERED_USERS } from '../../src/services/seedUsers.js';

let usersStore = [...REAL_REGISTERED_USERS];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(usersStore);
  }

  if (req.method === 'POST') {
    try {
      let user = req.body;
      if (typeof user === 'string') {
        user = JSON.parse(user);
      }
      if (user && (user.id || user.phone || user.email)) {
        const cleanPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
        const last10 = cleanPhone.slice(-10);
        const idx = usersStore.findIndex(u => 
          u.id === user.id || 
          (last10.length === 10 && u.phone && u.phone.replace(/\D/g, '').endsWith(last10)) ||
          (user.email && u.email && u.email.toLowerCase() === user.email.toLowerCase())
        );
        if (idx >= 0) {
          usersStore[idx] = { ...usersStore[idx], ...user };
        } else {
          usersStore.push(user);
        }
      }
      return res.status(200).json({ success: true, count: usersStore.length, users: usersStore });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
