import { money, esc } from "../../shared/format.js";

import { products, cart, setCart } from "../../state/store-state.js";
import { saveCart } from "../../services/cart-storage.js";
import { toast } from "../../shared/toast.js";
export function update() {
  try {
    saveCart(cart);
  } catch (error) {
    console.warn("Không lưu được giỏ hàng trên thiết bị:", error);
  }

  const countElement = document.querySelector("#cartCount");
  const totalElement = document.querySelector("#cartTotal");
  const itemsElement = document.querySelector("#cartItems");

  if (countElement) {
    countElement.textContent = cart.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0,
    );
  }

  if (totalElement) {
    totalElement.textContent = money(
      cart.reduce(
        (sum, item) =>
          sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
        0,
      ),
    );
  }

  if (itemsElement) {
    itemsElement.innerHTML = cart.length
      ? cart
          .map(
            (item) => `
          <div class="cart-item">
            <img
              src="${esc(item.imageUrl || "")}"
              alt="${esc(item.name)}"
              onerror="this.style.visibility='hidden'"
            >

            <div>
              <b>${esc(item.name)}</b>
              <small>
                ${money(item.price)} × ${Number(item.quantity) || 0}
              </small>
              ${item.customizations ? `<small class="cart-customizations">${esc(item.customizations)}</small>` : ""}
            </div>

            <button data-remove="${esc(item.id)}">Xóa</button>
          </div>
        `,
          )
          .join("")
      : "<p>Giỏ hàng đang trống. Chọn món ngon ngay nhé!</p>";
  }
}

export function add(id, customizations = []) {
  const productId = Number(id);

  const product = products.find((item) => Number(item.id) === productId);

  if (!product) {
    console.error(
      "Không tìm thấy sản phẩm trong danh sách API:",
      productId,
      products,
    );

    toast("Không tìm thấy món ăn. Vui lòng tải lại trang.");
    return;
  }

  const customizationText = Array.isArray(customizations)
    ? customizations.join(", ")
    : String(customizations || "");
  const existingItem = cart.find(
    (item) =>
      Number(item.id) === Number(product.id) &&
      String(item.customizations || "") === customizationText,
  );

  if (existingItem) {
    existingItem.quantity = (Number(existingItem.quantity) || 0) + 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
      customizations: customizationText,
    });
  }

  update();
  toast(`Đã thêm ${product.name} vào giỏ`);
}

export function remove(id) {
  setCart(cart.filter((item) => Number(item.id) !== Number(id)));
  update();
}
// Mở và đóng giỏ hàng.
const panel = document.querySelector("#cartPanel");
const overlay = document.querySelector("#overlay");

export function toggleCart(open) {
  if (panel) panel.classList.toggle("open", open);
  if (overlay) overlay.classList.toggle("open", open);
}

export function initCart() {
  const cartButton = document.querySelector("#cartButton");
  const closeCartButton = document.querySelector("#closeCart");

  if (cartButton) {
    cartButton.onclick = () => toggleCart(true);
  }

  if (closeCartButton) {
    closeCartButton.onclick = () => toggleCart(false);
  }

  if (overlay) {
    overlay.onclick = () => toggleCart(false);
  }

  if (new URLSearchParams(window.location.search).get("openCart") === "1") {
    toggleCart(true);
  }
  update();
}
