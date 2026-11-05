const shell = document.querySelector(".account-shell");
const profileForm = document.querySelector("#profileForm");
const ordersContainer = document.querySelector("#customerOrders");
const toastNode = document.querySelector("#accountToast");
const walletBalance = document.querySelector("#walletBalance");
const walletHistory = document.querySelector("#walletHistory");
const favoriteProducts = document.querySelector("#favoriteProducts");
const orderPagination = document.querySelector("#orderPagination");
const orderPageInfo = document.querySelector("#orderPageInfo");
const previousOrders = document.querySelector("#previousOrders");
const nextOrders = document.querySelector("#nextOrders");
let currentOrderPage = 0;
let totalOrderPages = 0;
const orderPageSize = 4;
const orderStatusLabels = {
  PENDING: "Chờ xác nhận",
  AWAITING_PAYMENT: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị",
  READY: "Sẵn sàng",
  DELIVERING: "Đang giao",
  COMPLETED: "Đã giao",
  CANCELLED: "Đã hủy",
};
const paymentLabels = {
  CASH: "Tiền mặt khi nhận hàng",
  VNPAY: "VNPay",
  BANK_TRANSFER: "Chuyển khoản",
  WALLET: "Ví thành viên",
  MOMO: "MoMo",
  ZALOPAY: "ZaloPay",
};
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function notify(message) {
  toastNode.textContent = message;
  toastNode.classList.add("show");
  window.setTimeout(() => toastNode.classList.remove("show"), 2400);
}

function csrfHeaders() {
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  return token ? { "X-XSRF-TOKEN": token } : {};
}

function initializeProfile() {
  profileForm.elements.fullName.value = shell.dataset.currentName || "";
  profileForm.elements.email.value = shell.dataset.currentEmail || "";
  profileForm.elements.phone.value = shell.dataset.currentPhone || "";
  profileForm.elements.address.value = shell.dataset.currentAddress || "";
  document.querySelector("#profileUsername").value =
    shell.dataset.currentUsername || "Tài khoản thành viên";
}

async function saveProfile(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(profileForm));
  try {
    const response = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...csrfHeaders() },
      body: JSON.stringify(values),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(result.message || "Không thể cập nhật thông tin.");
    shell.dataset.currentName = result.fullName || "";
    shell.dataset.currentEmail = result.email || "";
    shell.dataset.currentPhone = result.phone || "";
    shell.dataset.currentAddress = result.address || "";
    notify("Đã lưu thông tin tài khoản.");
  } catch (error) {
    notify(error.message || "Lỗi kết nối. Vui lòng thử lại.");
  }
}

function renderOrders(pageData) {
  const orders = pageData.content || [];
  currentOrderPage = pageData.page || 0;
  totalOrderPages = pageData.totalPages || 0;
  document.querySelector("#orderSummary").textContent =
    `${pageData.totalElements || 0} đơn hàng đã đặt`;
  orderPagination.hidden = totalOrderPages <= 1;
  orderPageInfo.textContent = totalOrderPages
    ? `Trang ${currentOrderPage + 1} / ${totalOrderPages}`
    : "";
  previousOrders.disabled = currentOrderPage <= 0;
  nextOrders.disabled = currentOrderPage >= totalOrderPages - 1;
  if (!orders.length) {
    ordersContainer.innerHTML =
      '<div class="orders-empty"><span>🛍️</span>Bạn chưa có đơn hàng nào.<br><a href="/#menu">Khám phá thực đơn →</a></div>';
    return;
  }
  ordersContainer.innerHTML = orders
    .map((order) => {
      const date = order.orderDate
        ? new Date(order.orderDate).toLocaleString("vi-VN", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "";
      const items = (order.items || [])
        .map(
          (item) =>
            `<div class="order-line"><span>${esc(item.product?.name || "Sản phẩm")} × ${Number(item.quantity) || 0}</span><b>${money(item.subtotal)}</b></div>`,
        )
        .join("");
      const status =
        orderStatusLabels[order.status] || order.status || "Đang xử lý";
      const paidByWallet = order.paymentMethod === "WALLET" && order.paid;
      const canCancel =
        order.status === "PENDING" && (!order.paid || paidByWallet);
      const paymentState =
        order.status === "CANCELLED" && paidByWallet
          ? " · Đã hoàn tiền vào ví"
          : order.paid
            ? " · Đã thanh toán"
            : "";
      return `
      <article class="order-card">
        <div class="order-card-head">
          <div>
            <span class="order-number">Đơn hàng #${esc(order.id)}</span>
            <small class="order-date">${esc(date)}</small>
          </div>
          <span class="order-status" data-status="${esc(order.status)}">${esc(status)}</span>
        </div>
        <div class="order-items">
          ${items || '<div class="order-line">Chưa có thông tin món</div>'}
        </div>
        <div class="order-delivery">
          📍 ${esc(order.shippingAddress || "Chưa có địa chỉ giao hàng")}
          <br>
          Thanh toán: ${esc(paymentLabels[order.paymentMethod] || order.paymentMethod || "—")}
          ${paymentState}
        </div>
        <div class="order-card-foot">
          <span>${(order.items || []).reduce((total, item) => total + (Number(item.quantity) || 0), 0)} món</span>
          <strong class="order-total">${money(order.totalAmount)}</strong>
          ${canCancel ? `<button type="button" class="cancel-order" data-cancel-order="${esc(order.id)}">Yêu cầu hủy</button>` : ""}
        </div>
      </article>
    `;
    })
    .join("");
}

async function loadOrders(page = currentOrderPage) {
  ordersContainer.innerHTML =
    '<div class="orders-loading">Đang tải đơn hàng…</div>';
  try {
    const response = await fetch(`/api/orders?page=${page}`, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Không tải được lịch sử đơn hàng.");
    const result = await response.json();
    if (Array.isArray(result)) {
      renderOrders({
        content: result.slice(page * orderPageSize, (page + 1) * orderPageSize),
        page,
        totalElements: result.length,
        totalPages: Math.ceil(result.length / orderPageSize),
      });
    } else {
      renderOrders(result);
    }
  } catch (error) {
    ordersContainer.innerHTML = `<div class="orders-empty">${esc(error.message)}</div>`;
  }
}

async function loadWallet() {
  try {
    const response = await fetch("/api/account/wallet", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Không tải được ví thành viên.");
    const wallet = await response.json();
    walletBalance.textContent = money(wallet.balance);
    const transactions = wallet.transactions || [];
    walletHistory.innerHTML = transactions.length
      ? transactions
          .map((tx) => {
            const date = new Date(tx.createdAt).toLocaleString("vi-VN", {
              dateStyle: "short",
              timeStyle: "short",
            });
            const orderId = String(tx.reference || "").replace(
              /^(REFUND-)?ORDER-/,
              "#",
            );
            const label =
              tx.status === "SPENT"
                ? `Thanh toán đơn ${orderId}`
                : tx.status === "REFUNDED"
                  ? `Hoàn tiền đơn ${orderId}`
                  : tx.status === "SUCCESS"
                ? "Thành công"
                : tx.status === "FAILED"
                  ? "Thất bại"
                  : "Đang chờ";
            const sign =
              tx.status === "SUCCESS" || tx.status === "REFUNDED"
                ? "+"
                : tx.status === "SPENT"
                  ? "−"
                  : "";
            return `<div class="wallet-row" data-status="${esc(tx.status)}"><span>${esc(label)}<small>${esc(date)}</small></span><strong>${sign}${money(tx.amount)}</strong></div>`;
          })
          .join("")
      : '<div class="orders-empty">Chưa có giao dịch nạp tiền.</div>';
  } catch (error) {
    walletBalance.textContent = "Chưa tải được";
    walletHistory.innerHTML = `<div class="orders-empty">${esc(error.message)}</div>`;
  }
}

async function loadFavorites() {
  favoriteProducts.innerHTML =
    '<div class="orders-loading">Đang tải sản phẩm yêu thích…</div>';
  try {
    const response = await fetch("/api/account/favorites", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Không tải được sản phẩm yêu thích.");
    const products = await response.json();
    favoriteProducts.innerHTML = products.length
      ? products
          .map(
            (product) =>
              `
                <article class="favorite-product">
                  <img src="${esc(product.imageUrl || "")}" alt="${esc(product.name)}" onerror="this.style.visibility='hidden'">
                  <div>
                    <b>${esc(product.name)}</b>
                    <small>${money(product.price)}</small>
                  </div>
                  <div class="favorite-product-actions">
                    <button type="button" class="favorite-order-button" data-order-favorite="${esc(product.id)}">Đặt lại</button>
                    <button type="button" data-remove-favorite="${esc(product.id)}">Bỏ lưu</button>
                  </div>
                </article>
              `,
          )
          .join("")
      : '<div class="orders-empty"><span>♥</span>Bạn chưa lưu món nào.<br><a href="/#menu">Khám phá thực đơn →</a></div>';
  } catch (error) {
    favoriteProducts.innerHTML = `<div class="orders-empty">${esc(error.message)}</div>`;
  }
}

document
  .querySelector("#walletTopupForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const response = await fetch("/api/account/wallet/top-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ amount: Number(form.elements.amount.value) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.message || "Không thể tạo giao dịch nạp tiền.");
      window.location.assign(result.paymentUrl);
    } catch (error) {
      notify(error.message || "Lỗi kết nối. Vui lòng thử lại.");
      button.disabled = false;
    }
  });

initializeProfile();
profileForm.addEventListener("submit", saveProfile);
document.querySelector("#refreshOrders").addEventListener("click", loadOrders);
previousOrders.addEventListener("click", () => {
  if (currentOrderPage > 0) loadOrders(currentOrderPage - 1);
});
nextOrders.addEventListener("click", () => {
  if (currentOrderPage + 1 < totalOrderPages) loadOrders(currentOrderPage + 1);
});
document
  .querySelector("#refreshFavorites")
  .addEventListener("click", loadFavorites);
favoriteProducts.addEventListener("click", async (event) => {
  const orderButton = event.target.closest("[data-order-favorite]");
  if (orderButton) {
    orderButton.disabled = true;
    try {
      const productResponse = await fetch(
        `/api/products/${encodeURIComponent(orderButton.dataset.orderFavorite)}`,
        { headers: { Accept: "application/json" } },
      );
      if (!productResponse.ok) {
        throw new Error("Món này hiện không còn bán.");
      }
      const product = await productResponse.json();
      let cart;
      try {
        cart = JSON.parse(localStorage.getItem("fasty-cart") || "[]");
      } catch {
        cart = [];
      }
      if (!Array.isArray(cart)) cart = [];
      const existing = cart.find(
        (item) =>
          Number(item.id) === Number(product.id) && !item.customizations,
      );
      if (existing) {
        existing.quantity = (Number(existing.quantity) || 0) + 1;
      } else {
        cart.push({ ...product, quantity: 1, customizations: "" });
      }
      localStorage.setItem("fasty-cart", JSON.stringify(cart));
      window.location.assign("/?openCart=1");
    } catch (error) {
      notify(error.message || "Không thể đặt lại món này.");
      orderButton.disabled = false;
    }
    return;
  }
  const button = event.target.closest("[data-remove-favorite]");
  if (!button) return;
  button.disabled = true;
  try {
    const response = await fetch(
      `/api/account/favorites/${encodeURIComponent(button.dataset.removeFavorite)}`,
      {
        method: "DELETE",
        headers: csrfHeaders(),
      },
    );
    if (!response.ok) throw new Error("Không thể bỏ sản phẩm khỏi danh sách.");
    notify("Đã bỏ món khỏi yêu thích.");
    await loadFavorites();
  } catch (error) {
    notify(error.message);
    button.disabled = false;
  }
});
ordersContainer.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-cancel-order]");
  if (!button) return;
  button.disabled = true;
  try {
    const response = await fetch(
      `/api/orders/${encodeURIComponent(button.dataset.cancelOrder)}/cancel`,
      {
        method: "PATCH",
        headers: { ...csrfHeaders(), Accept: "application/json" },
      },
    );
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(result.message || "Không thể hủy đơn hàng.");
    notify("Đơn hàng đã được hủy.");
    await loadOrders();
  } catch (error) {
    notify(error.message || "Lỗi kết nối. Vui lòng thử lại.");
    button.disabled = false;
  }
});
loadOrders();
loadWallet();
loadFavorites();
const topUpResult = new URLSearchParams(window.location.search).get("topup");
if (topUpResult === "success") {
  notify("Nạp tiền thành công, số dư ví đã được cập nhật.");
  loadWallet();
}
if (topUpResult === "failed") {
  notify("Giao dịch nạp tiền chưa thành công. Số dư chưa thay đổi.");
  loadWallet();
}
