import { state } from "../state/admin-state.js";
import { esc } from "../shared/format.js";
import { adminService } from "../services/admin-service.js";
import {
  render,
  renderRows,
  initAdminPagination,
} from "../features/admin/table.js";
import {
  editProduct,
  editCategory,
  editPost,
  objectFromForm,
} from "../features/admin/forms.js";
import { productImageBusy } from "../features/admin/image-upload.js";

initAdminPagination();
const notice = (message) => {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
};
async function loadData() {
  const [products, categories, posts, orders, users] = await Promise.all([
    adminService.products(),
    adminService.categories(),
    adminService.posts(),
    adminService.orders(),
    adminService.users(),
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
  const stats = await adminService.stats();
  document.querySelector("#statProducts").textContent = stats.products;
  document.querySelector("#statOrders").textContent = stats.orders;
  document.querySelector("#statUsers").textContent = stats.users;
  render();
}

document.querySelectorAll(".admin-tab").forEach((button) =>
  button.addEventListener("click", () => {
    const activeTab = document.querySelector(".admin-tab.active");
    activeTab.classList.remove("active");
    activeTab.setAttribute("aria-selected", "false");
    button.classList.add("active");
    button.setAttribute("aria-selected", "true");
    document
      .querySelector("#admin-panel")
      .setAttribute("aria-labelledby", button.id);
    state.tab = button.dataset.tab;
    state.productPage = 1;
    render();
  }),
);
function resetProductPage() {
  state.productPage = 1;
  renderRows();
}
document
  .querySelector("#adminSearch")
  .addEventListener("input", resetProductPage);
document
  .querySelector("#adminFilter")
  .addEventListener("change", resetProductPage);
document.querySelector("#newRecord").addEventListener("click", () =>
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
      await adminService.save("product", id, data);
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
      await adminService.save("category", id, data);
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
      await adminService.save("post", id, data);
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
      ["product", "sản phẩm"],
      ["category", "danh mục"],
      ["post", "bài viết"],
    ].find(([kind]) => target.closest(`[data-delete-${kind}]`));
    if (deletion) {
      const [kind, label] = deletion,
        button = target.closest(`[data-delete-${kind}]`),
        id = button.getAttribute(`data-delete-${kind}`);
      if (confirm(`Xóa ${label} này?`)) {
        await adminService.remove(kind, id);
        notice(`Đã xóa ${label}.`);
        await loadData();
      }
    }
    const user = target.closest("[data-user-id]");
    if (user) {
      await adminService.setUserActive(
        user.dataset.userId,
        user.dataset.active === "true",
      );
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
    await adminService.setOrderStatus(select.dataset.orderStatus, select.value);
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
