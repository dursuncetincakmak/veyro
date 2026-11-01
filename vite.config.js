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

  function attachSyncMiddleware(server) {
    const handleSync = (req, res, next) => {
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
              const userLast10 = user.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';
              const idx = data.users.findIndex(u => {
                if (u.id === user.id) return true;
                if (u.email && user.email && u.email.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
                if (userLast10 && userLast10.length === 10 && u.phone) {
                  const uLast10 = u.phone.replace(/\D/g, '').slice(-10);
                  if (uLast10 === userLast10) return true;
                }
                return false;
              });
              if (idx >= 0) {
                data.users[idx] = { ...data.users[idx], ...user };
              } else {
                data.users.push(user);
              }
              writeData(data);

              // Keep seedUsers.js updated so all devices have access offline
              try {
                const seedFile = path.resolve('./src/services/seedUsers.js');
                fs.writeFileSync(seedFile, 'export const REAL_REGISTERED_USERS = ' + JSON.stringify(data.users, null, 2) + ';\n', 'utf-8');
              } catch (e) {}

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
      } else if (req.url.startsWith('/api/sync/reports')) {
        if (req.method === 'GET') {
          const data = readData();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data.reports || []));
          return;
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const report = JSON.parse(body);
              const data = readData();
              if (!data.reports) data.reports = [];
              const idx = data.reports.findIndex(r => r.id === report.id);
              if (idx >= 0) {
                data.reports[idx] = { ...data.reports[idx], ...report };
              } else {
                data.reports.push(report);
              }
              writeData(data);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, report }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
      } else if (req.url.startsWith('/api/sync/deals')) {
        if (req.method === 'GET') {
          const data = readData();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data.deals || []));
          return;
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const deal = JSON.parse(body);
              const data = readData();
              if (!data.deals) data.deals = [];
              const idx = data.deals.findIndex(d => d.id === deal.id);
              if (idx >= 0) {
                data.deals[idx] = { ...data.deals[idx], ...deal };
              } else {
                data.deals.push(deal);
              }
              writeData(data);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, deal }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
      } else if (req.url.startsWith('/api/google-places')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const apiKey = payload.apiKey || process.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDDfUrc7b9z2Ho0cjvgEn7Ag7VWFILHAG4';
            const textQuery = payload.textQuery || 'spor salonu fitness';
            const lat = Number(payload.lat) || 41.1603;
            const lng = Number(payload.lng) || 27.7989;
            const radius = Number(payload.radius) || 10000;

            const gRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating'
              },
              body: JSON.stringify({
                textQuery,
                locationBias: {
                  circle: {
                    center: { latitude: lat, longitude: lng },
                    radius: radius
                  }
                }
              })
            });

            const data = await gRes.json();
            res.statusCode = gRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }
      next();
    };

    if (server.middlewares && server.middlewares.stack) {
      server.middlewares.stack.unshift({ route: '', handle: handleSync });
    } else {
      server.middlewares.use(handleSync);
    }
  }

  return {
    name: 'veyro-sync-plugin',
    configureServer(server) {
      attachSyncMiddleware(server);
    },
    configurePreviewServer(server) {
      attachSyncMiddleware(server);
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
