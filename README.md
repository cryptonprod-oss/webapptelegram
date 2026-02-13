# Telegram Mini App: Apple-style витрина приватного канала

Мини‑приложение для Telegram в строгой стилистике (в духе Apple):
- сначала выбор канала **«Анастасия»**,
- затем открывается витрина товаров с фото,
- внизу кнопка **«Купить»**.

## Запуск
1. Установи Node.js 18+.
2. Выполни в папке проекта:
   ```bash
   npm install
   npm start
   ```
3. Открой `http://localhost:3000`.

## Как это работает
- `GET /api/products` — отдает товары витрины.
- `POST /api/order` — принимает покупку и возвращает подтверждение.

## Что менять под себя
- В `server.js` редактируй массив `products`:
  - `channelName` — название автора/канала,
  - `title`, `description`, `priceRub`, `period`,
  - `imageUrl` — главное фото,
  - `galleryUrls` — 3 мини-фото в карточке.
- В `public/app.js` замени ссылку менеджера:
  - сейчас: `https://t.me/durov`.

## Подключение к Telegram
1. Создай бота через `@BotFather`.
2. В `Bot Settings` → `Menu Button` укажи HTTPS URL приложения.
3. Открой бота и нажми кнопку меню.
