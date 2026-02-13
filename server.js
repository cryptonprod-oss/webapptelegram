const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

const products = [
  {
    id: 1,
    title: 'Доступ в приватный чат Pro Traders',
    description: 'Ежедневные торговые идеи, разбор сделок и Q&A в закрытом чате.',
    priceRub: 2990,
    period: '30 дней',
    type: 'chat',
    imageUrl:
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 2,
    title: 'VIP канал с сигналами',
    description: 'Сигналы, аналитика и уведомления в приватном Telegram-канале.',
    priceRub: 4990,
    period: '30 дней',
    type: 'channel',
    imageUrl:
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 3,
    title: 'Пакет MAX: чат + канал',
    description: 'Полный доступ ко всем материалам и приоритетная поддержка.',
    priceRub: 6990,
    period: '30 дней',
    type: 'bundle',
    imageUrl:
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80'
  }
];

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=UTF-8' });
  res.end(JSON.stringify(payload));
}

function serveStatic(req, res) {
  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const safePath = path.normalize(requestPath).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { ok: false, message: 'Доступ запрещён.' });
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { ok: false, message: 'Файл не найден.' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function handleOrder(req, res) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    try {
      const parsed = JSON.parse(body || '{}');
      const { fullName, telegramUsername, productId } = parsed;

      if (!fullName || !telegramUsername || !productId) {
        sendJson(res, 400, { ok: false, message: 'Заполните все поля и выберите продукт.' });
        return;
      }

      const product = products.find((item) => item.id === Number(productId));
      if (!product) {
        sendJson(res, 404, { ok: false, message: 'Продукт не найден.' });
        return;
      }

      sendJson(res, 200, {
        ok: true,
        message: 'Заявка отправлена. Мы свяжемся с вами в Telegram в ближайшее время.',
        order: { fullName, telegramUsername, product }
      });
    } catch {
      sendJson(res, 400, { ok: false, message: 'Невалидный JSON.' });
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/products') {
    sendJson(res, 200, products);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/order') {
    handleOrder(req, res);
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { ok: false, message: 'Метод не поддерживается.' });
});

server.listen(port, () => {
  console.log(`Mini App запущен: http://localhost:${port}`);
});
