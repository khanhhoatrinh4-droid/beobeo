import { money, esc } from "../../shared/format.js";

import { products } from "../../state/store-state.js";
import { toast } from "../../shared/toast.js";
export function detail(id) {
  const product = products.find((item) => Number(item.id) === Number(id));

  if (!product) {
    toast("Không tìm thấy thông tin món ăn.");
    return;
  }

  const dialogContent = document.querySelector("#dialogContent");
  const dialog = document.querySelector("#productDialog");

  if (!dialogContent || !dialog) {
    console.error("Không tìm thấy hộp thoại chi tiết sản phẩm.");
    return;
  }

  const related = products
    .filter(
      (item) =>
        Number(item.id) !== Number(product.id) &&
        Boolean(item.comboProduct) === Boolean(product.comboProduct) &&
        (item.category?.id && product.category?.id
          ? Number(item.category.id) === Number(product.category.id)
          : true),
    )
    .slice(0, 3);
  const isDrink =
    String(product.category?.name || "").toLowerCase() === "drink";
  const drinks = products
    .filter(
      (item) =>
        Number(item.id) !== Number(product.id) &&
        !item.comboProduct &&
        String(item.category?.name || "").toLowerCase() === "drink",
    )
    .slice(0, 4);
  const productText = `${product.name || ""} ${product.description || ""} ${product.ingredients || ""}`;
  const customizationOptions = [];
  if (/phô mai|cheddar|mozzarella|cheese/i.test(productText)) {
    customizationOptions.push("Thêm phô mai");
  }
  if (/rau|xà lách|lettuce|vegetable/i.test(productText)) {
    customizationOptions.push("Giảm rau", "Không rau");
  }
  if (/sốt|sauce|mayonnaise|tương/i.test(productText)) {
    customizationOptions.push("Thêm sốt");
  }
  if (/dưa muối|dưa chuột muối|dưa leo muối|pickle/i.test(productText)) {
    customizationOptions.push("Không dưa muối");
  }
  const suggestionCard = (item) => `
    <article class="suggestion-card">
      <img src="${esc(item.imageUrl || "")}" alt="${esc(item.name)}" onerror="this.style.visibility='hidden'">
      <div>
        <b>${esc(item.name)}</b>
        <small>${money(item.price)}</small>
      </div>
      <button type="button" data-add="${esc(item.id)}" aria-label="Thêm ${esc(item.name)}">+</button>
    </article>
  `;

  dialogContent.innerHTML = `
    <img
      class="dialog-image"
      src="${esc(product.imageUrl || "")}"
      alt="${esc(product.name)}"
      onerror="this.style.visibility='hidden'"
    >

    <div class="dialog-info">
      <span class="category">
        ${esc(product.category?.name || "Món ngon")}
      </span>

      <h2>${esc(product.name)}</h2>

      <span class="price">${money(product.price)}</span>

      ${
        product.originalPrice
          ? `<span class="old">${money(product.originalPrice)}</span>`
          : ""
      }

      <p>${esc(product.description)}</p>
      <div class="product-facts">
        <span>⏱ ${Number(product.preparationMinutes) || 15} phút chế biến</span>
        ${product.calories ? `<span>🔥 ${Number(product.calories)} kcal</span>` : ""}
        ${product.ingredients ? `<span>🥬 ${esc(product.ingredients)}</span>` : ""}
        <span>✨ Chế biến tươi mới mỗi ngày</span>
      </div>

      ${
        customizationOptions.length
          ? `<section class="product-customizations">
              <h3>Tùy chỉnh món</h3>
              <div class="customization-options">
                ${customizationOptions
                  .map(
                    (option) =>
                      `<label><input type="checkbox" data-customization value="${esc(option)}"><span>${esc(option)}</span></label>`,
                  )
                  .join("")}
              </div>
            </section>`
          : ""
      }

      <button class="primary-button" data-add-customized="${esc(product.id)}">
        + Thêm vào giỏ
      </button>
      ${
        !isDrink && drinks.length
          ? `
        <section class="detail-suggestions drink-suggestions">
          <h3>🥤 Đặt kèm cho trọn vị</h3>
          <p>Một món uống mát lạnh sẽ hợp với món này.</p>
          <div class="suggestion-list">${drinks.map(suggestionCard).join("")}</div>
        </section>
      `
          : ""
      }
      ${
        related.length
          ? `
        <section class="detail-suggestions related-suggestions">
          <h3>🍽️ Có thể bạn cũng thích</h3>
          <div class="suggestion-list">${related.map(suggestionCard).join("")}</div>
        </section>
      `
          : ""
      }
    </div>
  `;

  dialog.showModal();
}

export function initProductDetail() {
  // Đóng hộp thoại chi tiết.
  const productDialog = document.querySelector("#productDialog");
  const productDialogCloseButton =
    productDialog?.querySelector(".dialog-close");

  if (productDialogCloseButton && productDialog) {
    productDialogCloseButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      productDialog.close();
    });
    productDialog.addEventListener("click", (event) => {
      if (event.target !== productDialog) return;
      const bounds = productDialog.getBoundingClientRect();
      const clickedBackdrop =
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom;
      if (clickedBackdrop) productDialog.close();
    });
  }
}
