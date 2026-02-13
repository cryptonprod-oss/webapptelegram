const productsContainer = document.getElementById('products');
const productSelect = document.getElementById('productId');
const orderForm = document.getElementById('order-form');
const statusText = document.getElementById('status');

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price);
}

function renderProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
      <article class="card">
        <img class="card-cover" src="${product.imageUrl}" alt="${product.title}" loading="lazy" />
        <div class="card-body">
          <h3>${product.title}</h3>
          <p>${product.description}</p>
          <div class="price-row">
            <p class="price">${formatPrice(product.priceRub)} ₽</p>
            <span class="tag">${product.period}</span>
          </div>
        </div>
      </article>
    `
    )
    .join('');

  productSelect.innerHTML =
    '<option value="">Выберите тариф</option>' +
    products
      .map(
        (product) =>
          `<option value="${product.id}">${product.title} — ${formatPrice(product.priceRub)} ₽</option>`
      )
      .join('');
}

async function loadProducts() {
  const response = await fetch('/api/products');
  const products = await response.json();
  renderProducts(products);
}

async function submitOrder(event) {
  event.preventDefault();
  statusText.textContent = 'Оформляем заказ...';

  const formData = new FormData(orderForm);
  const payload = Object.fromEntries(formData.entries());

  const response = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    statusText.textContent = data.message || 'Ошибка отправки заявки.';
    statusText.style.color = '#ff8c8c';
    return;
  }

  statusText.textContent = data.message;
  statusText.style.color = '#72e3a6';

  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert('Заявка принята! Откроем чат с менеджером.');
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
orderForm.addEventListener('submit', submitOrder);
