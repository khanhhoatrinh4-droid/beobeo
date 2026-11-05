const grids = {
  sale: document.querySelector("#saleGrid"),
  newest: document.querySelector("#newGrid"),
  featured: document.querySelector("#featuredGrid"),
  combos: document.querySelector("#comboGrid"),
};

let products = [];
let cart = [];
let favoriteIds = new Set();

try {
  const savedCart = JSON.parse(localStorage.getItem("fasty-cart") || "[]");

  cart = Array.isArray(savedCart) ? savedCart : [];
} catch (error) {
  console.warn("Không đọc được giỏ hàng đã lưu:", error);
  cart = [];
}

const money = (n) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[c],
  );

function normalizeProducts(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.content)) {
    return data.content;
  }

  if (data && Array.isArray(data.products)) {
    return data.products;
  }

  if (data && Array.isArray(data.data)) {
    return data.data;
  }

  console.warn("API không trả về danh sách sản phẩm dạng mảng:", data);
  return [];
}

async function fetchProducts(endpoint) {
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Không tải được ${endpoint}: HTTP ${response.status}`);
  }

  return response.json();
}

function initCampaignCarousel() {
  const carousel = document.querySelector(".campaign-carousel");
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll(".campaign-slide")];
  const dots = [...carousel.querySelectorAll(".campaign-dots button")];
  if (slides.length < 2 || dots.length !== slides.length) return;
  let current = 0;
  let timer;
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      dots[i].classList.toggle("is-active", active);
      dots[i].setAttribute("aria-current", String(active));
    });
  };
  const restart = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(current + 1), 5000);
  };
  dots.forEach((dot, i) =>
    dot.addEventListener("click", () => {
      show(i);
      restart();
    }),
  );
  carousel.addEventListener("mouseenter", () => window.clearInterval(timer));
  carousel.addEventListener("mouseleave", restart);
  carousel.addEventListener("focusin", () => window.clearInterval(timer));
  carousel.addEventListener("focusout", restart);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  restart();
}

const fallbackCampaignPosts = [
  {
    title: "Halloween beobeo: Tiệc ma vui vẻ, combo ngon hết sẩy!",
    excerpt:
      "🎃 Mùa Halloween đã đến beobeo! Cùng khám phá các combo Bí Ngô Ma Thuật, Hội Ma Bạn Bè và Đại Tiệc Bí Ngô để tụ họp, thưởng thức món ngon và tận hưởng không khí lễ hội.",
    imageUrl: "/images/combo-family.jpg",
    createdAt: "2026-10-28",
  },
  {
    title: "Sắp diễn ra: Ngày hội săn ưu đãi 11/11 tại beobeo",
    excerpt:
      "🛍️ Đánh dấu lịch 11/11! beobeo chuẩn bị ngày hội săn deal với nhiều món ngon và combo hấp dẫn. Theo dõi website để cập nhật ưu đãi và điều kiện tham gia khi chương trình bắt đầu.",
    imageUrl: "/images/combo-two.jpg",
    createdAt: "2026-10-28",
  },
];

function renderPosts(posts) {
  const postGrid = document.querySelector("#postGrid");
  if (!postGrid) return;
  postGrid.innerHTML =
    posts
      .map(
        (post) => `
          <article class="story-card">
            ${post.imageUrl ? `<img src="${esc(post.imageUrl)}" alt="${esc(post.title)}" loading="lazy">` : ""}
            <div>
              <span class="category">TIN TỨC beobeo</span>
              <h3>${esc(post.title)}</h3>
              <p>${esc(post.excerpt || post.content || "")}</p>
              <small>${new Date(post.createdAt).toLocaleDateString("vi-VN")}</small>
            </div>
          </article>
        `,
      )
      .join("") || "<p>Chưa có bài viết mới.</p>";
}

function card(p) {
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

function combo(p) {
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

async function load() {
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
      fetchProducts("/api/products/sale"),
      fetchProducts("/api/products/featured"),
      fetchProducts("/api/products/combos"),
      fetchProducts("/api/products/new"),
      fetchProducts("/api/products"),
      fetchProducts("/api/categories"),
      fetchProducts("/api/posts"),
      document.body.dataset.authenticated === "true"
        ? fetchProducts("/api/account/favorites").catch(() => [])
        : Promise.resolve([]),
    ]);
    favoriteIds = new Set(
      normalizeProducts(favoriteData).map((product) => Number(product.id)),
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
    products = normalizeProducts(allData);
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

function favoriteButton(productId) {
  const active = favoriteIds.has(Number(productId));
  return `<button type="button" class="favorite-button${active ? " is-favorite" : ""}" data-favorite-id="${esc(productId)}" aria-label="${active ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}" aria-pressed="${active}">♥</button>`;
}

async function toggleFavorite(productId) {
  if (document.body.dataset.authenticated !== "true") {
    window.location.href = "/login?required";
    return;
  }
  const id = Number(productId);
  const currentlyFavorite = favoriteIds.has(id);
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  try {
    const response = await fetch(
      `/api/account/favorites/${encodeURIComponent(id)}`,
      {
        method: currentlyFavorite ? "DELETE" : "POST",
        headers: token ? { "X-XSRF-TOKEN": token } : {},
      },
    );
    if (!response.ok)
      throw new Error("Không cập nhật được danh sách yêu thích.");
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

initCampaignCarousel();

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
document
  .querySelector("#productSearch")
  ?.addEventListener("input", searchProducts);
document
  .querySelector("#categoryFilter")
  ?.addEventListener("change", searchProducts);

function update() {
  localStorage.setItem("fasty-cart", JSON.stringify(cart));

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

function add(id, customizations = []) {
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

function detail(id) {
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
  const isDrink = String(product.category?.name || "").toLowerCase() === "drink";
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
      ${!isDrink && drinks.length ? `
        <section class="detail-suggestions drink-suggestions">
          <h3>🥤 Đặt kèm cho trọn vị</h3>
          <p>Một món uống mát lạnh sẽ hợp với món này.</p>
          <div class="suggestion-list">${drinks.map(suggestionCard).join("")}</div>
        </section>
      ` : ""}
      ${related.length ? `
        <section class="detail-suggestions related-suggestions">
          <h3>🍽️ Có thể bạn cũng thích</h3>
          <div class="suggestion-list">${related.map(suggestionCard).join("")}</div>
        </section>
      ` : ""}
    </div>
  `;

  dialog.showModal();
}

function toast(message) {
  const element = document.querySelector("#toast");

  if (!element) {
    console.log(message);
    return;
  }

  element.textContent = message;
  element.classList.add("show");

  setTimeout(() => {
    element.classList.remove("show");
  }, 2400);
}

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
    const response = await fetch("/api/account/wallet", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Không tải được số dư ví.");
    const wallet = await response.json();
    note.textContent = `Số dư ví thành viên: ${money(wallet.balance)}. Tiền chỉ bị trừ khi đơn hàng được tạo thành công.`;
  } catch {
    note.textContent = "Chọn Ví thành viên để kiểm tra số dư khi xác nhận đơn.";
  }
}

document
  .querySelector("#checkoutForm")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const button = event.currentTarget.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = "Đang tạo đơn...";
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfOptions().headers || {}),
        },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          phone: form.get("phone"),
          address: form.get("address"),
          paymentMethod: form.get("paymentMethod"),
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            customizations: item.customizations || "",
          })),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(result.message || "Không thể tạo đơn hàng.");
      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }
      cart = [];
      update();
      event.currentTarget.reset();
      document.querySelector("#checkoutDialog").close();
      toast(`Đặt hàng thành công! Mã đơn #${result.id}`);
    } catch (error) {
      toast(error.message || "Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      button.disabled = false;
      button.textContent = "Xác nhận đặt hàng";
    }
  });

function csrfOptions() {
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  return token ? { headers: { "X-XSRF-TOKEN": token } } : {};
}
document
  .querySelector("[data-close-checkout]")
  ?.addEventListener("click", () =>
    document.querySelector("#checkoutDialog").close(),
  );

const revealObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        revealObserver.unobserve(entry.target);
      }
    }),
  { threshold: 0.12 },
);
new MutationObserver(() =>
  document
    .querySelectorAll(".card:not(.reveal-ready), .combo:not(.reveal-ready)")
    .forEach((element, index) => {
      element.classList.add("reveal-ready");
      element.style.setProperty(
        "--reveal-delay",
        `${Math.min(index % 3, 2) * 80}ms`,
      );
      revealObserver.observe(element);
    }),
).observe(document.body, { childList: true, subtree: true });

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
    cart = cart.filter(
      (item) => Number(item.id) !== Number(removeButton.dataset.remove),
    );

    update();
  }
});

// Mở và đóng giỏ hàng.
const panel = document.querySelector("#cartPanel");
const overlay = document.querySelector("#overlay");

function toggleCart(open) {
  if (panel) panel.classList.toggle("open", open);
  if (overlay) overlay.classList.toggle("open", open);
}

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

// Đóng hộp thoại chi tiết.
const productDialog = document.querySelector("#productDialog");
const productDialogCloseButton = productDialog?.querySelector(".dialog-close");

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

// Nút thanh toán thử nghiệm.
const checkoutButton = document.querySelector("#checkoutButton");

if (checkoutButton) {
  checkoutButton.onclick = checkout;
}

if (new URLSearchParams(window.location.search).get("openCart") === "1") {
  window.addEventListener("load", () => toggleCart(true), { once: true });
}

// Khởi tạo giao diện.
update();
load();
const paymentResult = new URLSearchParams(window.location.search).get(
  "payment",
);
const paymentProvider = new URLSearchParams(window.location.search).get(
  "provider",
);
if (paymentResult === "success") {
  cart = [];
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
