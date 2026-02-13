const http = require('http');
const fs = require('fs');
const path = require('path');

const defaultPort = 3000;
const requestedPort = Number(process.env.PORT) || defaultPort;
const publicDir = path.join(__dirname, 'public');

const products = [
  {
    id: 1,
    channelName: 'Анастасия',
    title: 'Базовый доступ в канал Анастасии',
    description: 'Ежедневные посты, подборки и личные рекомендации в закрытом канале.',
    priceRub: 2990,
    period: '30 дней',
    type: 'channel',
    imageUrl:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 2,
    channelName: 'Анастасия',
    title: 'VIP-доступ + еженедельные эфиры',
    description: 'Все материалы канала + закрытые эфиры с разбором и личными ответами.',
    priceRub: 4990,
    period: '30 дней',
    type: 'vip',
    imageUrl:
      'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1400&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1467043153537-a4fba2cd39ef?auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    id: 3,
    channelName: 'Анастасия',
    title: 'Premium: канал + приватный чат',
    description: 'Максимальный пакет: канал, чат с комьюнити и приоритетная поддержка.',
    priceRub: 6990,
    period: '30 дней',
    type: 'bundle',
    imageUrl:
      'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1400&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1475180098004-ca77a66827be?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80'
    ]
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
        message: `Заявка на «${product.title}» принята. Мы свяжемся с вами в Telegram в ближайшее время.`,
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

function startServer(portToTry, retriesLeft = 10) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (process.env.PORT) {
        console.error(`Порт ${portToTry} уже занят. Укажите другой порт: PORT=3001 npm start`);
        process.exit(1);
      }

      if (retriesLeft <= 0) {
        console.error('Не удалось найти свободный порт. Освободите порт 3000 или укажите PORT вручную.');
        process.exit(1);
      }

      const nextPort = portToTry + 1;
      console.warn(`Порт ${portToTry} занят, пробуем ${nextPort}...`);
      startServer(nextPort, retriesLeft - 1);
      return;
    }

    console.error('Ошибка запуска сервера:', err);
    process.exit(1);
  });

  server.listen(portToTry, () => {
    console.log(`Mini App запущен: http://localhost:${portToTry}`);
  });
}

startServer(requestedPort);
