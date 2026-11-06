import { esc } from "../../shared/format.js";

import { favoriteIds } from "../../state/store-state.js";
import { accountService } from "../../services/account-service.js";
import { toast } from "../../shared/toast.js";
export function favoriteButton(productId) {
  const active = favoriteIds.has(Number(productId));
  return `<button type="button" class="favorite-button${active ? " is-favorite" : ""}" data-favorite-id="${esc(productId)}" aria-label="${active ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}" aria-pressed="${active}">♥</button>`;
}

export async function toggleFavorite(productId) {
  if (document.body.dataset.authenticated !== "true") {
    window.location.href = "/login?required";
    return;
  }
  const id = Number(productId);
  const currentlyFavorite = favoriteIds.has(id);
  try {
    await accountService.setFavorite(id, !currentlyFavorite);
    if (currentlyFavorite) favoriteIds.delete(id);
    else favoriteIds.add(id);
    document
      .querySelectorAll(`[data-favorite-id="${CSS.escape(String(id))}"]`)
      .forEach((button) => {
        const active = favoriteIds.has(id);
        button.classList.toggle("is-favorite", active);
        button.setAttribute("aria-pressed", String(active));
        button.setAttribute(
          "aria-label",
          active ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích",
        );
      });
    toast(
      currentlyFavorite
        ? "Đã bỏ món khỏi yêu thích."
        : "Đã lưu món vào danh sách yêu thích.",
    );
  } catch (error) {
    toast(error.message);
  }
}
