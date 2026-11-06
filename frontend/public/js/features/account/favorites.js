import { money, esc } from "../../shared/format.js";
import { notify } from "./notice.js";

import { accountService } from "../../services/account-service.js";
import { catalogService } from "../../services/catalog-service.js";
import { readCart, saveCart } from "../../services/cart-storage.js";
const favoriteProducts = document.querySelector("#favoriteProducts");
async function loadFavorites() {
  favoriteProducts.innerHTML =
    '<div class="orders-loading">Đang tải sản phẩm yêu thích…</div>';
  try {
    const products = await accountService.favorites();
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

export function initFavorites() {
  document
    .querySelector("#refreshFavorites")
    .addEventListener("click", loadFavorites);
  favoriteProducts.addEventListener("click", async (event) => {
    const orderButton = event.target.closest("[data-order-favorite]");
    if (orderButton) {
      orderButton.disabled = true;
      try {
        const product = await catalogService.product(
          orderButton.dataset.orderFavorite,
        );
        const cart = readCart();
        const existing = cart.find(
          (item) =>
            Number(item.id) === Number(product.id) && !item.customizations,
        );
        if (existing) {
          existing.quantity = (Number(existing.quantity) || 0) + 1;
        } else {
          cart.push({ ...product, quantity: 1, customizations: "" });
        }
        saveCart(cart);
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
      await accountService.setFavorite(button.dataset.removeFavorite, false);
      notify("Đã bỏ món khỏi yêu thích.");
      await loadFavorites();
    } catch (error) {
      notify(error.message);
      button.disabled = false;
    }
  });

  loadFavorites();
}
