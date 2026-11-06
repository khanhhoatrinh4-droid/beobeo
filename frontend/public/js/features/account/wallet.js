import { money, esc } from "../../shared/format.js";
import { notify } from "./notice.js";

import { accountService } from "../../services/account-service.js";
const walletBalance = document.querySelector("#walletBalance");
const walletHistory = document.querySelector("#walletHistory");
async function loadWallet() {
  try {
    const wallet = await accountService.wallet();
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

export function initWallet() {
  document
    .querySelector("#walletTopupForm")
    .addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('[type="submit"]');
      button.disabled = true;
      try {
        const result = await accountService.topUp(
          Number(form.elements.amount.value),
        );
        window.location.assign(result.paymentUrl);
      } catch (error) {
        notify(error.message || "Lỗi kết nối. Vui lòng thử lại.");
        button.disabled = false;
      }
    });

  loadWallet();
  const topUpResult = new URLSearchParams(window.location.search).get("topup");
  if (topUpResult === "success") {
    notify("Nạp tiền thành công, số dư ví đã được cập nhật.");
    loadWallet();
  }
  if (topUpResult === "failed") {
    notify("Giao dịch nạp tiền chưa thành công. Số dư chưa thay đổi.");
    loadWallet();
  }
}
