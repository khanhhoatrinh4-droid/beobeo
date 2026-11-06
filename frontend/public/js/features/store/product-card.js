import { money, esc } from "../../shared/format.js";

import { favoriteButton } from "./favorites.js";
export function card(p) {
  const discount = Number(p.discountPercent) || 0;

  return `
    <article class="card">
      ${favoriteButton(p.id)}
      ${discount > 0 ? `<span class="badge">-${discount}%</span>` : ""}

      <img
        src="${esc(p.imageUrl || "")}"
        alt="${esc(p.name)}"
        loading="lazy"
        onerror="this.style.visibility='hidden'"
      >

      <div class="card-body">
        <span class="category">
          ${esc(p.category?.name || "Món ngon")}
        </span>

        <h3>${esc(p.name)}</h3>

        <p class="desc">${esc(p.description)}</p>

        <div>
          <span class="price">${money(p.price)}</span>

          ${
            p.originalPrice
              ? `<span class="old">${money(p.originalPrice)}</span>`
              : ""
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

export function combo(p) {
  const discount = Number(p.discountPercent) || 0;

  return `
    <article class="combo">
      ${favoriteButton(p.id)}
      <div>
        <span class="eyebrow">
          COMBO ${discount > 0 ? `GIẢM ${discount}%` : "HOT"}
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
        src="${esc(p.imageUrl || "")}"
        alt="${esc(p.name)}"
        loading="lazy"
        onerror="this.style.visibility='hidden'"
      >
    </article>
  `;
}
