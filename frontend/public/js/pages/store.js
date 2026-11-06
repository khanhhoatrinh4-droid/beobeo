import { initCatalog } from "../features/store/catalog.js";
import { initCampaignCarousel } from "../features/store/campaigns.js";
import { initCart, add, remove } from "../features/store/cart.js";
import { detail, initProductDetail } from "../features/store/product-detail.js";
import { toggleFavorite } from "../features/store/favorites.js";
import { initCheckout } from "../features/store/checkout.js";
import { initContact } from "../features/store/contact.js";
import { initRevealEffects } from "../features/store/effects.js";

// Xử lý các nút thêm món, xem chi tiết và xóa món khỏi giỏ.
document.addEventListener("click", (event) => {
  const customizedButton = event.target.closest("[data-add-customized]");
  const addButton = event.target.closest("[data-add]");
  const detailButton = event.target.closest("[data-detail]");
  const removeButton = event.target.closest("[data-remove]");
  const favorite = event.target.closest("[data-favorite-id]");

  if (customizedButton) {
    const choices = Array.from(
      document.querySelectorAll("#dialogContent [data-customization]:checked"),
    ).map((input) => input.value);
    add(customizedButton.dataset.addCustomized, choices);
    document.querySelector("#productDialog")?.close();
    return;
  }

  if (favorite) toggleFavorite(favorite.dataset.favoriteId);

  if (addButton) {
    add(addButton.dataset.add);
  }

  if (detailButton) {
    detail(detailButton.dataset.detail);
  }

  if (removeButton) {
    remove(removeButton.dataset.remove);
  }
});

initCampaignCarousel();
initRevealEffects();
initCart();
initProductDetail();
initCheckout();
initContact();
initCatalog();
