import https from 'https';

const testUrls = [
  // Unsplash female fitness
  "https://images.unsplash.com/photo-1518611012118-696072aa579a",
  "https://images.unsplash.com/photo-1540497077202-7c8a3999166f",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
  "https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5",
  "https://images.unsplash.com/photo-1502680390469-be75c86b636f",
  "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61",
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5",
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155",
  "https://images.unsplash.com/photo-1518310383802-640c2de311b2",
  "https://images.unsplash.com/photo-1517838277536-f5f99be501cd",
  // Pexels female & male
  "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg",
  "https://images.pexels.com/photos/4716814/pexels-photo-4716814.jpeg",
  "https://images.pexels.com/photos/17210041/pexels-photo-17210041.jpeg",
  "https://images.pexels.com/photos/29259725/pexels-photo-29259725.jpeg",
  "https://images.pexels.com/photos/11183203/pexels-photo-11183203.jpeg",
  "https://images.pexels.com/photos/25596879/pexels-photo-25596879.jpeg",
  "https://images.pexels.com/photos/13030611/pexels-photo-13030611.jpeg",
  "https://images.pexels.com/photos/8038623/pexels-photo-8038623.jpeg",
  "https://images.pexels.com/photos/7900680/pexels-photo-7900680.jpeg",
  "https://images.pexels.com/photos/2294400/pexels-photo-2294400.jpeg",
  "https://images.pexels.com/photos/6550860/pexels-photo-6550860.jpeg",
  "https://images.pexels.com/photos/903171/pexels-photo-903171.jpeg",
  "https://images.pexels.com/photos/3888405/pexels-photo-3888405.jpeg",
  "https://images.pexels.com/photos/4720790/pexels-photo-4720790.jpeg",
  "https://images.pexels.com/photos/9644820/pexels-photo-9644820.jpeg",
  "https://images.pexels.com/photos/8874355/pexels-photo-8874355.jpeg",
  "https://images.pexels.com/photos/15917308/pexels-photo-15917308.jpeg",
  "https://images.pexels.com/photos/3838705/pexels-photo-3838705.jpeg"
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    const fullUrl = url.includes('?') ? url : `${url}?w=800&auto=format&fit=crop&q=80`;
    https.request(fullUrl, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
    }).on('error', () => resolve({ url, status: 0, ok: false })).end();
  });
}

async function run() {
  const results = await Promise.all(testUrls.map(checkUrl));
  const valid = results.filter(r => r.ok);
  console.log(`Valid: ${valid.length}/${testUrls.length}`);
  results.filter(r => !r.ok).forEach(r => console.log('Failed:', r.url, r.status));
}

run();
