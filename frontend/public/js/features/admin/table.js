import { state } from "../../state/admin-state.js";
import { money, esc } from "../../shared/format.js";
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

export function render() {
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

export function renderRows() {
  const head = document.querySelector("#tableHead"),
    body = document.querySelector("#tableBody");
  document.querySelector("#productPagination").hidden =
    state.tab !== "products";
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
  const firstPage = Math.max(
    1,
    Math.min(state.productPage - 2, totalPages - 4),
  );
  const lastPage = Math.min(totalPages, firstPage + 4);
  const pages = [];
  for (let page = firstPage; page <= lastPage; page++) {
    pages.push(
      `<button type="button" data-product-page="${page}" aria-label="Trang ${page}" ${page === state.productPage ? 'aria-current="page"' : ""}>${page}</button>`,
    );
  }
  pagination.innerHTML = `
    <span class="pagination-summary" role="status">Hiển thị ${total ? start + 1 : 0}–${Math.min(start + PRODUCTS_PER_PAGE, total)} / ${total} sản phẩm</span>
    <div class="pagination-controls">
      <button type="button" data-product-page="${state.productPage - 1}" ${state.productPage === 1 ? "disabled" : ""}>Trước</button>
      ${pages.join("")}
      <button type="button" data-product-page="${state.productPage + 1}" ${state.productPage === totalPages ? "disabled" : ""}>Sau</button>
    </div>`;
}
export function initAdminPagination() {
  document
    .querySelector("#productPagination")
    .addEventListener("click", (event) => {
      const button = event.target.closest("[data-product-page]");
      if (!button || button.disabled) return;
      state.productPage = Number(button.dataset.productPage);
      renderRows();
      document
        .querySelector(
          `[data-product-page="${state.productPage}"][aria-current]`,
        )
        ?.focus();
    });
}
