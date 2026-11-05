
const grids = {
  sale: document.querySelector('#saleGrid'),
  featured: document.querySelector('#featuredGrid'),
  combos: document.querySelector('#comboGrid')
};

let products = [];
let cart = [];

try {
  const savedCart = JSON.parse(
    localStorage.getItem('fasty-cart') || '[]'
  );

  cart = Array.isArray(savedCart) ? savedCart : [];
} catch (error) {
  console.warn('Không đọc được giỏ hàng đã lưu:', error);
  cart = [];
}

const money = n =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(Number(n) || 0);

const esc = s =>
  String(s ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));

function normalizeProducts(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.content)) {
    return data.content;
  }

  if (data && Array.isArray(data.products)) {
    return data.products;
  }

  if (data && Array.isArray(data.data)) {
    return data.data;
  }

  console.warn('API không trả về danh sách sản phẩm dạng mảng:', data);
  return [];
}

async function fetchProducts(endpoint) {
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(
      `Không tải được ${endpoint}: HTTP ${response.status}`
    );
  }

  return response.json();
}

function card(p) {
  const discount = Number(p.discountPercent) || 0;

  return `
    <article class="card">
      ${
        discount > 0
          ? `<span class="badge">-${discount}%</span>`
          : ''
      }

      <img
        src="${esc(p.imageUrl || '')}"
        alt="${esc(p.name)}"
        loading="lazy"
        onerror="this.style.visibility='hidden'"
      >

      <div class="card-body">
        <span class="category">
          ${esc(p.category?.name || 'Món ngon')}
        </span>

        <h3>${esc(p.name)}</h3>

        <p class="desc">${esc(p.description)}</p>

        <div>
          <span class="price">${money(p.price)}</span>

          ${
            p.originalPrice
              ? `<span class="old">${money(p.originalPrice)}</span>`
              : ''
          }
        </div>

        <div class="actions">
          <button class="small" data-detail="${esc(p.id)}">
            Chi tiết
          </button>

          <button class="small add" data-add="${esc(p.id)}">
            + Thêm
          </button>
        </div>
      </div>
    </article>
  `;
}

function combo(p) {
  const discount = Number(p.discountPercent) || 0;

  return `
    <article class="combo">
      <div>
        <span class="eyebrow">
          COMBO ${discount > 0 ? `GIẢM ${discount}%` : 'HOT'}
        </span>

        <h3>${esc(p.name)}</h3>

        <p>${esc(p.description)}</p>

        <strong class="price">${money(p.price)}</strong>
        <br>

        <button
          class="small add"
          data-add="${esc(p.id)}"
          style="margin-top:17px;max-width:125px"
        >
          Chọn combo
        </button>
      </div>

      <img
        src="${esc(p.imageUrl || '')}"
        alt="${esc(p.name)}"
        loading="lazy"
        onerror="this.style.visibility='hidden'"
      >
    </article>
  `;
}

async function load() {
  try {
    const [saleData, featuredData, combosData, allData] =
      await Promise.all([
        fetchProducts('/api/products/sale'),
        fetchProducts('/api/products/featured'),
        fetchProducts('/api/products/combos'),
        fetchProducts('/api/products')
      ]);

    const sale = normalizeProducts(saleData);
    const featured = normalizeProducts(featuredData);
    const combos = normalizeProducts(combosData);

    // Luôn đảm bảo products là một mảng trước khi gọi .find().
    products = normalizeProducts(allData);

    if (grids.sale) {
      grids.sale.innerHTML =
        sale.slice(0, 3).map(card).join('') ||
        '<p>Chưa có ưu đãi.</p>';
    }

    if (grids.featured) {
      grids.featured.innerHTML =
        featured.slice(0, 6).map(card).join('') ||
        '<p>Chưa có món nổi bật.</p>';
    }

    if (grids.combos) {
      grids.combos.innerHTML =
        combos.map(combo).join('') ||
        '<p>Chưa có combo.</p>';
    }
  } catch (error) {
    console.error('Lỗi tải sản phẩm:', error);

    Object.values(grids).forEach(grid => {
      if (grid) {
        grid.innerHTML =
          '<p>Không thể tải thực đơn. Vui lòng thử lại.</p>';
      }
    });
  }
}

function update() {
  localStorage.setItem('fasty-cart', JSON.stringify(cart));

  const countElement = document.querySelector('#cartCount');
  const totalElement = document.querySelector('#cartTotal');
  const itemsElement = document.querySelector('#cartItems');

  if (countElement) {
    countElement.textContent = cart.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );
  }

  if (totalElement) {
    totalElement.textContent = money(
      cart.reduce(
        (sum, item) =>
          sum +
          (Number(item.price) || 0) *
          (Number(item.quantity) || 0),
        0
      )
    );
  }

  if (itemsElement) {
    itemsElement.innerHTML = cart.length
      ? cart.map(item => `
          <div class="cart-item">
            <img
              src="${esc(item.imageUrl || '')}"
              alt="${esc(item.name)}"
              onerror="this.style.visibility='hidden'"
            >

            <div>
              <b>${esc(item.name)}</b>
              <small>
                ${money(item.price)} × ${Number(item.quantity) || 0}
              </small>
            </div>

            <button data-remove="${esc(item.id)}">Xóa</button>
          </div>
        `).join('')
      : '<p>Giỏ hàng đang trống. Chọn món ngon ngay nhé!</p>';
  }
}

function add(id) {
  const productId = Number(id);

  const product = products.find(
    item => Number(item.id) === productId
  );

  if (!product) {
    console.error(
      'Không tìm thấy sản phẩm trong danh sách API:',
      productId,
      products
    );

    toast('Không tìm thấy món ăn. Vui lòng tải lại trang.');
    return;
  }

  const existingItem = cart.find(
    item => Number(item.id) === Number(product.id)
  );

  if (existingItem) {
    existingItem.quantity =
      (Number(existingItem.quantity) || 0) + 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  update();
  toast(`Đã thêm ${product.name} vào giỏ`);
}

function detail(id) {
  const product = products.find(
    item => Number(item.id) === Number(id)
  );

  if (!product) {
    toast('Không tìm thấy thông tin món ăn.');
    return;
  }

  const dialogContent = document.querySelector('#dialogContent');
  const dialog = document.querySelector('#productDialog');

  if (!dialogContent || !dialog) {
    console.error('Không tìm thấy hộp thoại chi tiết sản phẩm.');
    return;
  }

  dialogContent.innerHTML = `
    <img
      class="dialog-image"
      src="${esc(product.imageUrl || '')}"
      alt="${esc(product.name)}"
      onerror="this.style.visibility='hidden'"
    >

    <div class="dialog-info">
      <span class="category">
        ${esc(product.category?.name || 'Món ngon')}
      </span>

      <h2>${esc(product.name)}</h2>

      <span class="price">${money(product.price)}</span>

      ${
        product.originalPrice
          ? `<span class="old">${money(product.originalPrice)}</span>`
          : ''
      }

      <p>${esc(product.description)}</p>
      <div class="product-facts">
        <span>⏱ ${Number(product.preparationMinutes) || 15} phút chế biến</span>
        ${product.calories ? `<span>🔥 ${Number(product.calories)} kcal</span>` : ''}
        ${product.ingredients ? `<span>🥬 ${esc(product.ingredients)}</span>` : ''}
        <span>✨ Chế biến tươi mới mỗi ngày</span>
      </div>

      <button class="primary-button" data-add="${esc(product.id)}">
        + Thêm vào giỏ
      </button>
    </div>
  `;

  dialog.showModal();
}

function toast(message) {
  const element = document.querySelector('#toast');

  if (!element) {
    console.log(message);
    return;
  }

  element.textContent = message;
  element.classList.add('show');

  setTimeout(() => {
    element.classList.remove('show');
  }, 2400);
}

async function checkout() {
  if (!cart.length) { toast('Giỏ hàng của bạn đang trống.'); return; }
  if (document.body.dataset.authenticated !== 'true') {
    window.location.href = '/login?required';
    return;
  }
  document.querySelector('#checkoutTotal').textContent = money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
  toggleCart(false);
  document.querySelector('#checkoutDialog').showModal();
}

document.querySelector('#checkoutForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const button = event.currentTarget.querySelector('[type="submit"]');
  button.disabled = true;
  button.textContent = 'Đang tạo đơn...';
  try {
    const response = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(csrfOptions().headers || {}) },
      body: JSON.stringify({ customerName: form.get('customerName'), phone: form.get('phone'), address: form.get('address'), paymentMethod: form.get('paymentMethod'), items: cart.map(item => ({ productId: item.id, quantity: item.quantity })) })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Không thể tạo đơn hàng.');
    if (result.paymentUrl) {
      window.location.assign(result.paymentUrl);
      return;
    }
    cart = []; update(); event.currentTarget.reset();
    document.querySelector('#checkoutDialog').close();
    toast(`Đặt hàng thành công! Mã đơn #${result.id}`);
  } catch (error) {
    toast(error.message || 'Lỗi kết nối. Vui lòng thử lại.');
  } finally {
    button.disabled = false; button.textContent = 'Xác nhận đặt hàng';
  }
});

function csrfOptions() {
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  return token ? { headers: { 'X-CSRF-TOKEN': token } } : {};
}
document.querySelector('[data-close-checkout]')?.addEventListener('click', () => document.querySelector('#checkoutDialog').close());

const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('revealed'); revealObserver.unobserve(entry.target); }
}), { threshold: 0.12 });
new MutationObserver(() => document.querySelectorAll('.card:not(.reveal-ready), .combo:not(.reveal-ready)').forEach((element, index) => {
  element.classList.add('reveal-ready');
  element.style.setProperty('--reveal-delay', `${Math.min(index % 3, 2) * 80}ms`);
  revealObserver.observe(element);
})).observe(document.body, { childList: true, subtree: true });

// Xử lý các nút thêm món, xem chi tiết và xóa món khỏi giỏ.
document.addEventListener('click', event => {
  const addButton = event.target.closest('[data-add]');
  const detailButton = event.target.closest('[data-detail]');
  const removeButton = event.target.closest('[data-remove]');

  if (addButton) {
    add(addButton.dataset.add);
  }

  if (detailButton) {
    detail(detailButton.dataset.detail);
  }

  if (removeButton) {
    cart = cart.filter(
      item => Number(item.id) !== Number(removeButton.dataset.remove)
    );

    update();
  }
});

// Mở và đóng giỏ hàng.
const panel = document.querySelector('#cartPanel');
const overlay = document.querySelector('#overlay');

function toggleCart(open) {
  if (panel) panel.classList.toggle('open', open);
  if (overlay) overlay.classList.toggle('open', open);
}

const cartButton = document.querySelector('#cartButton');
const closeCartButton = document.querySelector('#closeCart');

if (cartButton) {
  cartButton.onclick = () => toggleCart(true);
}

if (closeCartButton) {
  closeCartButton.onclick = () => toggleCart(false);
}

if (overlay) {
  overlay.onclick = () => toggleCart(false);
}

// Đóng hộp thoại chi tiết.
const dialogCloseButton = document.querySelector('.dialog-close');
const productDialog = document.querySelector('#productDialog');

if (dialogCloseButton && productDialog) {
  dialogCloseButton.onclick = () => productDialog.close();
}

// Nút thanh toán thử nghiệm.
const checkoutButton = document.querySelector('#checkoutButton');

if (checkoutButton) {
  checkoutButton.onclick = checkout;
}

// Khởi tạo giao diện.
update();
load();
const paymentResult = new URLSearchParams(window.location.search).get('payment');
if (paymentResult === 'success') { cart = []; update(); toast('Thanh toán VNPay thành công. Đơn hàng đang được xác nhận!'); }
if (paymentResult === 'failed') toast('Thanh toán chưa thành công hoặc đã bị hủy. Bạn có thể đặt lại đơn.');
