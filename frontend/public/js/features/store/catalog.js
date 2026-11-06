import { esc } from "../../shared/format.js";

import {
  products,
  setProducts,
  setFavorites,
} from "../../state/store-state.js";
import {
  catalogService,
  normalizeProducts,
} from "../../services/catalog-service.js";
import { accountService } from "../../services/account-service.js";
import { card, combo } from "./product-card.js";
import { renderPosts, fallbackCampaignPosts } from "./campaigns.js";
const grids = {
  sale: document.querySelector("#saleGrid"),
  newest: document.querySelector("#newGrid"),
  featured: document.querySelector("#featuredGrid"),
  combos: document.querySelector("#comboGrid"),
};

export async function load() {
  try {
    const [
      saleData,
      featuredData,
      combosData,
      newestData,
      allData,
      categories,
      posts,
      favoriteData,
    ] = await Promise.all([
      catalogService.sale(),
      catalogService.featured(),
      catalogService.combos(),
      catalogService.newest(),
      catalogService.all(),
      catalogService.categories(),
      catalogService.posts(),
      document.body.dataset.authenticated === "true"
        ? accountService.favorites().catch(() => [])
        : Promise.resolve([]),
    ]);
    setFavorites(
      new Set(
        normalizeProducts(favoriteData).map((product) => Number(product.id)),
      ),
    );

    const sale = normalizeProducts(saleData);
    const featured = normalizeProducts(featuredData);
    const combos = normalizeProducts(combosData);
    const newest = normalizeProducts(newestData);

    const promoHeadline = document.querySelector("#promoHeadline");
    const promoSubline = document.querySelector("#promoSubline");
    const promoDiscount = document.querySelector("#promoDiscount");
    const maxDiscount = Math.max(
      0,
      ...sale.map((product) => Number(product.discountPercent) || 0),
    );
    if (promoHeadline)
      promoHeadline.textContent = maxDiscount
        ? `Giảm đến ${maxDiscount}% món ngon!`
        : "Món ngon, giá thật vui!";
    if (promoSubline)
      promoSubline.textContent = sale.length
        ? `${sale.length} món đang có ưu đãi — đặt ngay kẻo lỡ!`
        : "Khám phá món mới và combo hấp dẫn tại beobeo.";
    if (promoDiscount)
      promoDiscount.textContent = maxDiscount ? `-${maxDiscount}%` : "HOT";

    // Luôn đảm bảo products là một mảng trước khi gọi .find().
    setProducts(normalizeProducts(allData));
    const categoryFilter = document.querySelector("#categoryFilter");
    if (categoryFilter)
      categoryFilter.innerHTML += normalizeProducts(categories)
        .map(
          (category) =>
            `<option value="${esc(category.id)}">${esc(category.name)}</option>`,
        )
        .join("");
    const publishedPosts = normalizeProducts(posts);
    renderPosts(publishedPosts.length ? publishedPosts : fallbackCampaignPosts);

    if (grids.sale) {
      grids.sale.innerHTML =
        sale.slice(0, 3).map(card).join("") || "<p>Chưa có ưu đãi.</p>";
    }

    if (grids.featured) {
      grids.featured.innerHTML =
        featured.slice(0, 6).map(card).join("") ||
        "<p>Chưa có món nổi bật.</p>";
    }

    if (grids.newest) {
      grids.newest.innerHTML =
        newest.map(card).join("") ||
        "<p>Sắp có món mới. Bạn xem thử thực đơn nổi bật nhé!</p>";
    }

    if (grids.combos) {
      grids.combos.innerHTML =
        combos.map(combo).join("") || "<p>Chưa có combo.</p>";
    }
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error);
    renderPosts(fallbackCampaignPosts);

    Object.values(grids).forEach((grid) => {
      if (grid) {
        grid.innerHTML = "<p>Không thể tải thực đơn. Vui lòng thử lại.</p>";
      }
    });
  }
}

function searchProducts() {
  const searchInput = document.querySelector("#productSearch");
  const categoryFilter = document.querySelector("#categoryFilter");
  const query = (searchInput?.value || "").trim().toLocaleLowerCase("vi");
  const categoryId = categoryFilter?.value || "";
  const selectedCategory = (
    categoryFilter?.selectedOptions?.[0]?.textContent || ""
  )
    .trim()
    .toLocaleLowerCase("vi");
  const wantsCombos =
    query.split(/\s+/).includes("combo") || selectedCategory.includes("combo");
  const grid = document.querySelector("#searchGrid");
  const label = document.querySelector("#searchResultLabel");
  if (!grid) return;
  const searching = Boolean(query || categoryId);
  grid.hidden = !searching;
  if (!searching) {
    label.textContent = "";
    grid.innerHTML = "";
    return;
  }
  const results = products.filter((product) => {
    const name = (product.name || "").toLocaleLowerCase("vi");
    return (
      (wantsCombos || !product.comboProduct) &&
      (!query || name.includes(query)) &&
      (!categoryId || String(product.category?.id || "") === categoryId)
    );
  });
  label.textContent = results.length
    ? `Tìm thấy ${results.length} món phù hợp`
    : "Không tìm thấy món phù hợp. Thử từ khóa khác nhé.";
  grid.innerHTML = results.map(card).join("");
}
export function initCatalog() {
  document
    .querySelector("#productSearch")
    ?.addEventListener("input", searchProducts);
  document
    .querySelector("#categoryFilter")
    ?.addEventListener("change", searchProducts);

  return load();
}
