import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Real-Time Multi-Device Sync Plugin for local Wi-Fi phones and browsers
function veyroSyncPlugin() {
  const syncFile = path.resolve('./.veyro_sync_store.json');
  function readData() {
    try {
      if (fs.existsSync(syncFile)) return JSON.parse(fs.readFileSync(syncFile, 'utf-8'));
    } catch (e) {}
    return { chats: {}, users: [], appointments: [] };
  }
  function writeData(data) {
    try {
      fs.writeFileSync(syncFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {}
  }

  return {
    name: 'veyro-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/api/sync/chats')) {
          if (req.method === 'GET') {
            const data = readData();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data.chats || {}));
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const { chatKey, message } = JSON.parse(body);
                const data = readData();
                if (!data.chats) data.chats = {};
                if (!data.chats[chatKey]) data.chats[chatKey] = [];
                const existingIdx = data.chats[chatKey].findIndex(m => m.id === message.id);
                if (existingIdx >= 0) {
                  data.chats[chatKey][existingIdx] = { ...data.chats[chatKey][existingIdx], ...message };
                } else {
                  data.chats[chatKey].push(message);
                }
                writeData(data);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        } else if (req.url.startsWith('/api/sync/users')) {
          if (req.method === 'GET') {
            const data = readData();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data.users || []));
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const user = JSON.parse(body);
                const data = readData();
                if (!data.users) data.users = [];
                const idx = data.users.findIndex(u => u.id === user.id || (u.email && u.email === user.email) || (u.phone && u.phone === user.phone));
                if (idx >= 0) {
                  data.users[idx] = { ...data.users[idx], ...user };
                } else {
                  data.users.push(user);
                }
                writeData(data);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, user }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        } else if (req.url.startsWith('/api/sync/appointments')) {
          if (req.method === 'GET') {
            const data = readData();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data.appointments || []));
            return;
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const appointment = JSON.parse(body);
                const data = readData();
                if (!data.appointments) data.appointments = [];
                const idx = data.appointments.findIndex(a => a.id === appointment.id);
                if (idx >= 0) {
                  data.appointments[idx] = { ...data.appointments[idx], ...appointment };
                } else {
                  data.appointments.push(appointment);
                }
                writeData(data);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, appointment }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  base: './',
  root: './',
  publicDir: 'public',
  plugins: [veyroSyncPlugin()],
  server: {
    port: 3000,
    open: false,
    host: true,
    allowedHosts: true,
    watch: {
      ignored: ['**/android/**', '**/ios/**', '**/dist/**', '**/.veyro_sync_store.json']
    }
  },
  preview: {
    port: 3000,
    host: true,
    allowedHosts: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve('./index.html'),
        admin: path.resolve('./admin.html'),
        business: path.resolve('./business.html')
      }
    }
  }
});
