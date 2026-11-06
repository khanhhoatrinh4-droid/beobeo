const state = {
  tab: "products",
  products: [],
  productPage: 1,
  categories: [],
  posts: [],
  orders: [],
  users: [],
};
const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const api = async (url, options = {}) => {
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  const headers = { ...(options.headers || {}) };
  if (token && options.method && options.method !== "GET")
    headers["X-XSRF-TOKEN"] = token;
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Lỗi ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
};
const notice = (message) => {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
};
const config = {
  products: {
    title: "Quản lý sản phẩm",
    hint: "Thực đơn, giá bán và trạng thái kinh doanh.",
    button: "＋ Thêm sản phẩm",
  },
  categories: {
    title: "Quản lý danh mục",
    hint: "Phân nhóm sản phẩm trong thực đơn.",
    button: "＋ Thêm danh mục",
  },
  posts: {
    title: "Quản lý bài viết",
    hint: "Soạn tin tức và nội dung hiển thị cho khách hàng.",
    button: "＋ Thêm bài viết",
  },
  orders: {
    title: "Quản lý đơn hàng",
    hint: "Theo dõi thông tin nhận hàng và trạng thái đơn.",
    button: "",
  },
  users: {
    title: "Quản lý người dùng",
    hint: "Tài khoản thành viên và trạng thái hoạt động.",
    button: "",
  },
};
const statusLabels = {
  PENDING: "Chờ xác nhận",
  AWAITING_PAYMENT: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị",
  READY: "Sẵn sàng",
  DELIVERING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};
const nextStatuses = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  AWAITING_PAYMENT: [],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["DELIVERING", "CANCELLED"],
  DELIVERING: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};
const selected = (actual, expected) => (actual === expected ? "selected" : "");
const PRODUCTS_PER_PAGE = 8;

async function loadData() {
  const [products, categories, posts, orders, users] = await Promise.all([
    api("/api/products/admin/all"),
    api("/api/categories/admin/all"),
    api("/api/posts/admin/all"),
    api("/api/admin/orders"),
    api("/api/admin/users"),
  ]);
  Object.assign(state, { products, categories, posts, orders, users });
  const categorySelect = document.querySelector("#productCategory");
  categorySelect.innerHTML =
    '<option value="">Chưa phân loại</option>' +
    categories
      .map(
        (category) =>
          `<option value="${category.id}">${esc(category.name)}</option>`,
      )
      .join("");
  const stats = await api("/api/admin/stats");
  document.querySelector("#statProducts").textContent = stats.products;
  document.querySelector("#statOrders").textContent = stats.orders;
  document.querySelector("#statUsers").textContent = stats.users;
  render();
}

function render() {
  const { title, hint, button } = config[state.tab];
  document.querySelector("#adminTitle").textContent = title;
  document.querySelector("#adminHint").textContent = hint;
  document.querySelector("#newRecord").textContent = button;
  document.querySelector("#newRecord").hidden = !button;
  configureFilter();
  renderRows();
}

function configureFilter() {
  const select = document.querySelector("#adminFilter");
  const choices = {
    products: [
      ["", "Tất cả trạng thái"],
      ["active", "Đang bán"],
      ["inactive", "Đã ẩn"],
    ],
    categories: [
      ["", "Tất cả trạng thái"],
      ["active", "Đang hiển thị"],
      ["inactive", "Đã ẩn"],
    ],
    posts: [
      ["", "Tất cả bài viết"],
      ["active", "Đã xuất bản"],
      ["inactive", "Bản nháp"],
    ],
    orders: [["", "Tất cả trạng thái"], ...Object.entries(statusLabels)],
    users: [
      ["", "Tất cả tài khoản"],
      ["active", "Đang hoạt động"],
      ["inactive", "Đã khóa"],
      ["ADMIN", "Quản trị viên"],
      ["CUSTOMER", "Thành viên"],
    ],
  }[state.tab];
  select.innerHTML = choices
    .map(
      ([value, label]) =>
        `<option value="${esc(value)}">${esc(label)}</option>`,
    )
    .join("");
  select.hidden = false;
  document.querySelector("#adminSearch").value = "";
  document.querySelector("#adminSearch").placeholder =
    `Tìm ${state.tab === "users" ? "tên, tài khoản, email, số điện thoại" : state.tab === "orders" ? "mã đơn, tên khách, số điện thoại" : "tên hoặc nội dung"}...`;
}

function filterRows(items, textOf, filterOf) {
  const query = document
    .querySelector("#adminSearch")
    .value.trim()
    .toLocaleLowerCase("vi");
  const filter = document.querySelector("#adminFilter").value;
  return items.filter(
    (item) =>
      (!query || textOf(item).toLocaleLowerCase("vi").includes(query)) &&
      (!filter || String(filterOf(item)) === filter),
  );
}

function renderRows() {
  const head = document.querySelector("#tableHead"),
    body = document.querySelector("#tableBody");
  document.querySelector("#productPagination").hidden = state.tab !== "products";
  if (state.tab === "products") {
    head.innerHTML =
      "<tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá bán</th><th>Trạng thái</th><th>Thao tác</th></tr>";
    const rows = filterRows(
      state.products,
      (p) => `${p.name} ${p.description || ""} ${p.category?.name || ""}`,
      (p) => (p.active ? "active" : "inactive"),
    );
    const totalPages = Math.max(1, Math.ceil(rows.length / PRODUCTS_PER_PAGE));
    state.productPage = Math.max(1, Math.min(state.productPage, totalPages));
    const start = (state.productPage - 1) * PRODUCTS_PER_PAGE;
    renderProductPagination(rows.length, totalPages, start);
    body.innerHTML =
      rows
        .slice(start, start + PRODUCTS_PER_PAGE)
        .map(
          (p) =>
            `
              <tr>
                <td>
                  <div class="table-product">
                    <img src="${esc(p.imageUrl || "")}" onerror="this.style.visibility='hidden'">
                    <span><b>${esc(p.name)}</b><small>#${p.id} · ${p.comboProduct ? "Combo" : "Món lẻ"}</small></span>
                  </div>
                </td>
                <td>${esc(p.category?.name || "—")}</td>
                <td><b>${money(p.price)}</b></td>
                <td><span class="status-pill ${p.active ? "good" : "muted"}">${p.active ? "Đang bán" : "Đã ẩn"}</span></td>
                <td>
                  <button class="table-action" data-edit-product="${p.id}">Sửa</button>
                  <button class="table-action danger" data-delete-product="${p.id}">Xóa</button>
                </td>
              </tr>
            `,
        )
        .join("") || empty(5);
  } else if (state.tab === "categories") {
    head.innerHTML =
      "<tr><th>Danh mục</th><th>Mô tả</th><th>Sản phẩm</th><th>Trạng thái</th><th>Thao tác</th></tr>";
    const rows = filterRows(
      state.categories,
      (c) => `${c.name} ${c.description || ""}`,
      (c) => (c.active ? "active" : "inactive"),
    );
    body.innerHTML =
      rows
        .map(
          (c) =>
            `
              <tr>
                <td><b>${esc(c.name)}</b><small class="cell-sub">#${c.id}</small></td>
                <td>${esc(c.description || "—")}</td>
                <td>${state.products.filter((p) => p.category?.id === c.id).length}</td>
                <td><span class="status-pill ${c.active ? "good" : "muted"}">${c.active ? "Đang hiển thị" : "Đã ẩn"}</span></td>
                <td>
                  <button class="table-action" data-edit-category="${c.id}">Sửa</button>
                  <button class="table-action danger" data-delete-category="${c.id}">Xóa</button>
                </td>
              </tr>
            `,
        )
        .join("") || empty(5);
  } else if (state.tab === "posts") {
    head.innerHTML =
      "<tr><th>Bài viết</th><th>Slug</th><th>Ngày tạo</th><th>Trạng thái</th><th>Thao tác</th></tr>";
    const rows = filterRows(
      state.posts,
      (p) => `${p.title} ${p.slug} ${p.excerpt || ""}`,
      (p) => (p.active ? "active" : "inactive"),
    );
    body.innerHTML =
      rows
        .map(
          (p) =>
            `
              <tr>
                <td><b>${esc(p.title)}</b><small class="cell-sub">${esc(p.excerpt || "")}</small></td>
                <td>${esc(p.slug)}</td>
                <td>${new Date(p.createdAt).toLocaleDateString("vi-VN")}</td>
                <td><span class="status-pill ${p.active ? "good" : "muted"}">${p.active ? "Đã xuất bản" : "Bản nháp"}</span></td>
                <td>
                  <button class="table-action" data-edit-post="${p.id}">Sửa</button>
                  <button class="table-action danger" data-delete-post="${p.id}">Xóa</button>
                </td>
              </tr>
            `,
        )
        .join("") || empty(5);
  } else if (state.tab === "orders") {
    head.innerHTML =
      "<tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th></tr>";
    const rows = filterRows(
      state.orders,
      (o) =>
        `${o.id} ${o.customerName} ${o.customerPhone} ${o.shippingAddress}`,
      (o) => o.status,
    );
    body.innerHTML =
      rows
        .map((o) => {
          const allowed = new Set([
            o.status,
            ...(nextStatuses[o.status] || []),
          ]);
          return `
            <tr>
              <td><b>#${o.id}</b><small class="cell-sub">${new Date(o.orderDate).toLocaleString("vi-VN")}</small></td>
              <td>
                <b>${esc(o.customerName || "Khách hàng")}</b>
                <small class="cell-sub">${esc(o.customerPhone || "")}</small>
                <small class="cell-sub">${esc(o.shippingAddress || "")}</small>
              </td>
              <td>${(o.items || []).map((i) => `${esc(i.productName)} × ${i.quantity}`).join("<br>")}</td>
              <td><b>${money(o.totalAmount)}</b><small class="cell-sub">${esc(o.paymentMethod)} · ${o.paid ? "Đã thanh toán" : "Chưa thanh toán"}</small></td>
              <td>
                <select class="status-select" data-order-status="${o.id}">
                  ${[...allowed].map((key) => `<option value="${key}" ${selected(o.status, key)}>${statusLabels[key] || key}</option>`).join("")}
                </select>
              </td>
            </tr>
          `;
        })
        .join("") || empty(5);
  } else {
    head.innerHTML =
      "<tr><th>Khách hàng</th><th>Tài khoản</th><th>Liên hệ</th><th>Vai trò</th><th>Trạng thái</th></tr>";
    const rows = filterRows(
      state.users,
      (u) => `${u.fullName} ${u.username} ${u.email} ${u.phone}`,
      (u) =>
        document.querySelector("#adminFilter").value === "ADMIN" ||
        document.querySelector("#adminFilter").value === "CUSTOMER"
          ? u.role
          : u.active
            ? "active"
            : "inactive",
    );
    body.innerHTML =
      rows
        .map(
          (u) =>
            `
              <tr>
                <td><b>${esc(u.fullName || u.username)}</b><small class="cell-sub">${esc(u.address || "Chưa có địa chỉ")}</small></td>
                <td>${esc(u.username)}</td>
                <td>${esc(u.email)}<small class="cell-sub">${esc(u.phone)}</small></td>
                <td><span class="status-pill">${esc(u.role)}</span></td>
                <td>
                  <button class="status-pill ${u.active ? "good" : "muted"} user-toggle" data-user-id="${u.id}" data-active="${!u.active}">
                    ${u.active ? "Đang hoạt động" : "Đã khóa"}
                  </button>
                </td>
              </tr>
            `,
        )
        .join("") || empty(5);
  }
}

function empty(columns) {
  return `<tr><td colspan="${columns}" class="empty-row">Không tìm thấy dữ liệu phù hợp.</td></tr>`;
}
function renderProductPagination(total, totalPages, start) {
  const pagination = document.querySelector("#productPagination");
  const firstPage = Math.max(1, Math.min(state.productPage - 2, totalPages - 4));
  const lastPage = Math.min(totalPages, firstPage + 4);
  const pages = [];
  for (let page = firstPage; page <= lastPage; page++) {
    pages.push(`<button type="button" data-product-page="${page}" aria-label="Trang ${page}" ${page === state.productPage ? 'aria-current="page"' : ""}>${page}</button>`);
  }
  pagination.innerHTML = `
    <span class="pagination-summary" role="status">Hiển thị ${total ? start + 1 : 0}–${Math.min(start + PRODUCTS_PER_PAGE, total)} / ${total} sản phẩm</span>
    <div class="pagination-controls">
      <button type="button" data-product-page="${state.productPage - 1}" ${state.productPage === 1 ? "disabled" : ""}>Trước</button>
      ${pages.join("")}
      <button type="button" data-product-page="${state.productPage + 1}" ${state.productPage === totalPages ? "disabled" : ""}>Sau</button>
    </div>`;
}
document.querySelector("#productPagination").addEventListener("click", (event) => {
  const button = event.target.closest("[data-product-page]");
  if (!button || button.disabled) return;
  state.productPage = Number(button.dataset.productPage);
  renderRows();
  document.querySelector(`[data-product-page="${state.productPage}"][aria-current]`)?.focus();
});
function showForm(dialogId, formId, titleId, record, fields, title) {
  const form = document.querySelector(formId);
  form.reset();
  form.elements.id.value = record?.id || "";
  fields.forEach((name) => {
    if (record?.[name] != null) form.elements[name].value = record[name];
  });
  form.elements.active.checked = record ? Boolean(record.active) : true;
  document.querySelector(titleId).textContent = record
    ? `Cập nhật ${title}`
    : `Thêm ${title}`;
  document.querySelector(dialogId).showModal();
}
function editProduct(product) {
  productImageVersion++;
  setProductImageBusy(false);
  document.querySelector("#productImageFile").value = "";
  document.querySelector("#productImageStatus").textContent = "";
  showForm(
    "#productFormDialog",
    "#productForm",
    "#productFormTitle",
    product,
    [
      "name",
      "description",
      "price",
      "originalPrice",
      "discountPercent",
      "preparationMinutes",
      "calories",
      "ingredients",
      "imageUrl",
    ],
    "sản phẩm",
  );
  document.querySelector("#productForm").elements.categoryId.value =
    product?.category?.id || "";
  for (const name of ["featured", "comboProduct"])
    document.querySelector("#productForm").elements[name].checked = Boolean(
      product?.[name],
    );
  previewProductImage();
}
function editCategory(category) {
  showForm(
    "#categoryFormDialog",
    "#categoryForm",
    "#categoryFormTitle",
    category,
    ["name", "description"],
    "danh mục",
  );
}
function editPost(post) {
  showForm(
    "#postFormDialog",
    "#postForm",
    "#postFormTitle",
    post,
    ["title", "slug", "excerpt", "content", "imageUrl"],
    "bài viết",
  );
}
function objectFromForm(form, numeric = []) {
  const data = Object.fromEntries(new FormData(form));
  data.active = form.elements.active.checked;
  numeric.forEach(
    (key) => (data[key] = data[key] === "" ? null : Number(data[key])),
  );
  return data;
}

let productImageVersion = 0;
let productImageBusy = false;
const productImageUrl = document.querySelector("#productImageUrl");
const productImageFile = document.querySelector("#productImageFile");
const productImageUpload = document.querySelector("#productImageUpload");
const productImageStatus = document.querySelector("#productImageStatus");
const productImagePreview = document.querySelector("#productImagePreview");

function previewProductImage() {
  const url = productImageUrl.value.trim();
  productImagePreview.hidden = !url;
  if (url) productImagePreview.src = url;
  else productImagePreview.removeAttribute("src");
}
productImagePreview.addEventListener("error", () => { productImagePreview.hidden = true; });
function setProductImageBusy(busy) {
  productImageBusy = busy;
  productImageUpload.setAttribute("aria-busy", String(busy));
  productImageFile.disabled = busy;
  productImageUrl.disabled = busy;
  document.querySelector('#productForm button[type="submit"]').disabled = busy;
}
async function uploadProductImage(files) {
  if (productImageBusy || !files.length) return;
  if (files.length !== 1) {
    productImageStatus.textContent = "Vui lòng chọn một ảnh cho sản phẩm.";
    return;
  }
  const file = files[0];
  if (!["image/jpeg", "image/png", "image/gif"].includes(file.type) || file.size > 5 * 1024 * 1024 || !file.size) {
    productImageStatus.textContent = "Vui lòng chọn ảnh JPG, PNG hoặc GIF có dung lượng tối đa 5 MB.";
    productImageFile.value = "";
    return;
  }
  const version = ++productImageVersion;
  const body = new FormData();
  body.append("file", file);
  setProductImageBusy(true);
  productImageStatus.textContent = "Đang tải ảnh lên…";
  try {
    const result = await api("/api/admin/images", { method: "POST", body });
    if (version !== productImageVersion) return;
    productImageUrl.value = result.imageUrl;
    previewProductImage();
    productImageStatus.textContent = `Đã tải ảnh ${file.name}. Bấm Lưu sản phẩm để lưu thay đổi.`;
  } catch (error) {
    if (version === productImageVersion) productImageStatus.textContent = error.message;
  } finally {
    if (version === productImageVersion) {
      setProductImageBusy(false);
      productImageFile.value = "";
    }
  }
}
productImageFile.addEventListener("change", () => uploadProductImage(productImageFile.files));
productImageUrl.addEventListener("input", previewProductImage);
for (const target of [productImageUpload, productImageUrl]) {
  target.addEventListener("dragover", (event) => {
    event.preventDefault();
    productImageUpload.classList.add("dragging");
  });
  target.addEventListener("dragleave", (event) => {
    if (!target.contains(event.relatedTarget)) productImageUpload.classList.remove("dragging");
  });
  target.addEventListener("drop", (event) => {
    event.preventDefault();
    productImageUpload.classList.remove("dragging");
    uploadProductImage(event.dataTransfer.files);
  });
}

document.querySelectorAll(".admin-tab").forEach((button) =>
  button.addEventListener("click", () => {
    const activeTab = document.querySelector(".admin-tab.active");
    activeTab.classList.remove("active");
    activeTab.setAttribute("aria-selected", "false");
    button.classList.add("active");
    button.setAttribute("aria-selected", "true");
    document.querySelector("#admin-panel").setAttribute("aria-labelledby", button.id);
    state.tab = button.dataset.tab;
    state.productPage = 1;
    render();
  }),
);
function resetProductPage() {
  state.productPage = 1;
  renderRows();
}
document.querySelector("#adminSearch").addEventListener("input", resetProductPage);
document.querySelector("#adminFilter").addEventListener("change", resetProductPage);
document
  .querySelector("#newRecord")
  .addEventListener("click", () =>
    ({
      products: () => editProduct(null),
      categories: () => editCategory(null),
      posts: () => editPost(null),
    })[state.tab]?.(),
  );
document
  .querySelectorAll("[data-admin-close]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      document.querySelector(`#${button.dataset.adminClose}FormDialog`).close(),
    ),
  );

document
  .querySelector("#productForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    if (productImageBusy) return;
    const form = event.currentTarget,
      id = form.elements.id.value;
    const data = objectFromForm(form, [
      "price",
      "originalPrice",
      "discountPercent",
      "preparationMinutes",
      "calories",
    ]);
    for (const key of ["featured", "comboProduct"])
      data[key] = form.elements[key].checked;
    data.category = data.categoryId ? { id: Number(data.categoryId) } : null;
    delete data.categoryId;
    try {
      await api(id ? `/api/products/${id}` : "/api/products", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      document.querySelector("#productFormDialog").close();
      notice("Đã lưu sản phẩm.");
      await loadData();
    } catch (error) {
      notice(error.message);
    }
  });
document
  .querySelector("#categoryForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget,
      id = form.elements.id.value,
      data = objectFromForm(form);
    try {
      await api(id ? `/api/categories/${id}` : "/api/categories", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      document.querySelector("#categoryFormDialog").close();
      notice("Đã lưu danh mục.");
      await loadData();
    } catch (error) {
      notice(error.message);
    }
  });
document
  .querySelector("#postForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget,
      id = form.elements.id.value,
      data = objectFromForm(form);
    try {
      await api(id ? `/api/posts/${id}` : "/api/posts", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      document.querySelector("#postFormDialog").close();
      notice("Đã lưu bài viết.");
      await loadData();
    } catch (error) {
      notice(error.message);
    }
  });

document.addEventListener("click", async (event) => {
  const target = event.target;
  try {
    if (target.closest("[data-edit-product]"))
      editProduct(
        state.products.find(
          (p) =>
            p.id ===
            Number(target.closest("[data-edit-product]").dataset.editProduct),
        ),
      );
    if (target.closest("[data-edit-category]"))
      editCategory(
        state.categories.find(
          (c) =>
            c.id ===
            Number(target.closest("[data-edit-category]").dataset.editCategory),
        ),
      );
    if (target.closest("[data-edit-post]"))
      editPost(
        state.posts.find(
          (p) =>
            p.id ===
            Number(target.closest("[data-edit-post]").dataset.editPost),
        ),
      );
    const deletion = [
      ["product", "/api/products/", "sản phẩm"],
      ["category", "/api/categories/", "danh mục"],
      ["post", "/api/posts/", "bài viết"],
    ].find(([kind]) => target.closest(`[data-delete-${kind}]`));
    if (deletion) {
      const [kind, url, label] = deletion,
        button = target.closest(`[data-delete-${kind}]`),
        id = button.getAttribute(`data-delete-${kind}`);
      if (confirm(`Xóa ${label} này?`)) {
        await api(`${url}${id}`, { method: "DELETE" });
        notice(`Đã xóa ${label}.`);
        await loadData();
      }
    }
    const user = target.closest("[data-user-id]");
    if (user) {
      await api(`/api/admin/users/${user.dataset.userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: user.dataset.active === "true" }),
      });
      notice("Đã cập nhật tài khoản.");
      await loadData();
    }
  } catch (error) {
    notice(error.message);
  }
});
document.addEventListener("change", async (event) => {
  const select = event.target.closest("[data-order-status]");
  if (!select) return;
  try {
    await api(`/api/orders/${select.dataset.orderStatus}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: select.value }),
    });
    notice("Đã cập nhật trạng thái đơn.");
    await loadData();
  } catch (error) {
    notice(error.message);
  }
});
document.querySelector("#adminDate").textContent = new Intl.DateTimeFormat(
  "vi-VN",
  { dateStyle: "full" },
).format(new Date());
loadData().catch((error) =>
  notice(`Không tải được dữ liệu quản trị: ${error.message}`),
);
