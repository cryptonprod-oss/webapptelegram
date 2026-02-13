const openAnastasiaButton = document.getElementById('open-anastasia');
const storefront = document.getElementById('storefront');
const productsContainer = document.getElementById('products');
const productSelect = document.getElementById('productId');
const orderForm = document.getElementById('order-form');
const statusText = document.getElementById('status');

let productsCache = [];

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price);
}

function renderProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
      <article class="product-card">
        <img class="gallery-main" src="${product.imageUrl}" alt="${product.title}" loading="lazy" />
        <div class="gallery-strip">
          ${product.galleryUrls
            .map((url) => `<img src="${url}" alt="${product.title}" loading="lazy" />`)
            .join('')}
        </div>

        <div class="product-body">
          <div class="product-top">
            <h3 class="product-title">${product.title}</h3>
            <p class="price">${formatPrice(product.priceRub)} ₽</p>
          </div>
          <p>${product.description}</p>
          <p class="product-meta">Период: ${product.period}</p>
          <div class="buy-row">
            <button class="primary buy-product" type="button" data-id="${product.id}">Купить</button>
          </div>
        </div>
      </article>
    `
    )
    .join('');

  productSelect.innerHTML =
    '<option value="">Выберите товар</option>' +
    products
      .map(
        (product) =>
          `<option value="${product.id}">${product.title} — ${formatPrice(product.priceRub)} ₽</option>`
      )
      .join('');

  document.querySelectorAll('.buy-product').forEach((button) => {
    button.addEventListener('click', () => {
      productSelect.value = button.dataset.id;
      document.getElementById('checkout').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

async function loadProducts() {
  const response = await fetch('/api/products');
  const products = await response.json();
  productsCache = products;
}

function openStorefrontForAnastasia() {
  const filtered = productsCache.filter((item) => item.channelName === 'Анастасия');
  renderProducts(filtered);
  storefront.classList.remove('hidden');
  storefront.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function submitOrder(event) {
  event.preventDefault();
  statusText.textContent = 'Обрабатываем покупку...';

  const formData = new FormData(orderForm);
  const payload = Object.fromEntries(formData.entries());

  const response = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    statusText.textContent = data.message || 'Ошибка оформления.';
    statusText.style.color = '#cc1f1a';
    return;
  }

  statusText.textContent = data.message;
  statusText.style.color = '#007a2f';

  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert('Покупка оформлена! Откроем чат менеджера.');
    window.Telegram.WebApp.openTelegramLink('https://t.me/durov');
  }

  orderForm.reset();
}

function initTelegramWebApp() {
  if (!window.Telegram?.WebApp) return;
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

initTelegramWebApp();
loadProducts();
openAnastasiaButton.addEventListener('click', openStorefrontForAnastasia);
orderForm.addEventListener('submit', submitOrder);
