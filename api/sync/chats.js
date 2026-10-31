import { REAL_CHATS } from '../../src/services/seedChats.js';

let chatsStore = { ...REAL_CHATS };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(chatsStore);
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      const { chatKey, message, action } = body;
      if (chatKey && message) {
        if (!chatsStore[chatKey]) chatsStore[chatKey] = [];
        const exIdx = chatsStore[chatKey].findIndex(m => m.id === message.id);
        if (exIdx >= 0) {
          chatsStore[chatKey][exIdx] = { ...chatsStore[chatKey][exIdx], ...message };
        } else {
          chatsStore[chatKey].push(message);
        }
      }
      return res.status(200).json({ success: true, chats: chatsStore });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
