import { request, sendJson } from "./http.js";

const resources = {
  product: "/api/products",
  category: "/api/categories",
  post: "/api/posts",
};

export const adminService = {
  products: () => request("/api/products/admin/all"),
  categories: () => request("/api/categories/admin/all"),
  posts: () => request("/api/posts/admin/all"),
  orders: () => request("/api/admin/orders"),
  users: () => request("/api/admin/users"),
  stats: () => request("/api/admin/stats"),
  save: (kind, id, data) =>
    sendJson(
      resources[kind] + (id ? "/" + encodeURIComponent(id) : ""),
      id ? "PUT" : "POST",
      data,
    ),
  remove: (kind, id) =>
    request(resources[kind] + "/" + encodeURIComponent(id), {
      method: "DELETE",
    }),
  setUserActive: (id, active) =>
    sendJson(
      "/api/admin/users/" + encodeURIComponent(id) + "/status",
      "PATCH",
      { active },
    ),
  setOrderStatus: (id, status) =>
    sendJson("/api/orders/" + encodeURIComponent(id) + "/status", "PATCH", {
      status,
    }),
  uploadImage: (file) => {
    const body = new FormData();
    body.append("file", file);
    return request("/api/admin/images", { method: "POST", body });
  },
};
