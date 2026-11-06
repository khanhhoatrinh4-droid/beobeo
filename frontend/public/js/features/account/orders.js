import { money, esc } from "../../shared/format.js";
import { notify } from "./notice.js";

import { orderService } from "../../services/order-service.js";
const ordersContainer = document.querySelector("#customerOrders");
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
    const result = await orderService.list(page);
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

export function initOrders() {
  document
    .querySelector("#refreshOrders")
    .addEventListener("click", () => loadOrders());
  previousOrders.addEventListener("click", () => {
    if (currentOrderPage > 0) loadOrders(currentOrderPage - 1);
  });
  nextOrders.addEventListener("click", () => {
    if (currentOrderPage + 1 < totalOrderPages)
      loadOrders(currentOrderPage + 1);
  });

  ordersContainer.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-cancel-order]");
    if (!button) return;
    button.disabled = true;
    try {
      await orderService.cancel(button.dataset.cancelOrder);
      notify("Đơn hàng đã được hủy.");
      await loadOrders();
    } catch (error) {
      notify(error.message || "Lỗi kết nối. Vui lòng thử lại.");
      button.disabled = false;
    }
  });
  loadOrders();
}
