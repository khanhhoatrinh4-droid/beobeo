import { money } from "../../shared/format.js";
import { toast } from "../../shared/toast.js";
import { cart, setCart } from "../../state/store-state.js";
import { orderService } from "../../services/order-service.js";
import { accountService } from "../../services/account-service.js";
import { toggleCart, update } from "./cart.js";
async function checkout() {
  if (!cart.length) {
    toast("Giỏ hàng của bạn đang trống.");
    return;
  }
  if (document.body.dataset.authenticated !== "true") {
    window.location.href = "/login?required";
    return;
  }
  document.querySelector("#checkoutTotal").textContent = money(
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  toggleCart(false);
  document.querySelector("#checkoutDialog").showModal();
  loadCheckoutWalletBalance();
}

async function loadCheckoutWalletBalance() {
  const note = document.querySelector("#walletCheckoutBalance");
  if (!note) return;
  note.textContent = "Đang tải số dư ví…";
  try {
    const wallet = await accountService.wallet();
    note.textContent = `Số dư ví thành viên: ${money(wallet.balance)}. Tiền chỉ bị trừ khi đơn hàng được tạo thành công.`;
  } catch {
    note.textContent = "Chọn Ví thành viên để kiểm tra số dư khi xác nhận đơn.";
  }
}

export function initCheckout() {
  document
    .querySelector("#checkoutForm")
    ?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formElement = event.currentTarget;
      const form = new FormData(formElement);
      const button = formElement.querySelector('[type="submit"]');
      let orderCreated = false;
      let createdOrderId = null;
      button.disabled = true;
      button.textContent = "Đang tạo đơn...";
      try {
        const result = await orderService.create({
          customerName: form.get("customerName"),
          phone: form.get("phone"),
          address: form.get("address"),
          paymentMethod: form.get("paymentMethod"),
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            customizations: item.customizations || "",
          })),
        });
        orderCreated = true;
        createdOrderId = result.id;
        if (result.paymentUrl) {
          toast(
            `Đơn hàng #${result.id} đã được tạo. Đang chuyển đến cổng thanh toán.`,
          );
          window.setTimeout(
            () => window.location.assign(result.paymentUrl),
            500,
          );
          return;
        }
        setCart([]);
        update();
        formElement.reset();
        document.querySelector("#checkoutDialog").close();
        toast(`Đặt hàng thành công! Mã đơn #${result.id}`);
      } catch (error) {
        if (orderCreated) {
          setCart([]);
          update();
          formElement.reset();
          document.querySelector("#checkoutDialog").close();
          toast(`Đặt hàng thành công! Mã đơn #${createdOrderId}`);
          console.error(
            "Đơn đã lưu nhưng có lỗi khi cập nhật giao diện:",
            error,
          );
        } else {
          toast(error.message || "Lỗi kết nối. Vui lòng thử lại.");
        }
      } finally {
        button.disabled = false;
        button.textContent = "Xác nhận đặt hàng";
      }
    });

  document
    .querySelector("[data-close-checkout]")
    ?.addEventListener("click", () =>
      document.querySelector("#checkoutDialog").close(),
    );

  document
    .querySelector("#checkoutButton")
    ?.addEventListener("click", checkout);
  const paymentResult = new URLSearchParams(window.location.search).get(
    "payment",
  );
  const paymentProvider = new URLSearchParams(window.location.search).get(
    "provider",
  );
  if (paymentResult === "success") {
    setCart([]);
    update();
    toast(
      `Thanh toán ${paymentProvider || "VNPay"} thành công. Đơn hàng đang được xác nhận!`,
    );
  }
  if (paymentResult === "failed")
    toast("Thanh toán chưa thành công hoặc đã bị hủy. Bạn có thể đặt lại đơn.");
  if (paymentResult === "pending")
    toast(
      "Đã quay về beobeo. Đơn hàng sẽ được xác nhận khi cổng thanh toán gửi kết quả.",
    );
}
