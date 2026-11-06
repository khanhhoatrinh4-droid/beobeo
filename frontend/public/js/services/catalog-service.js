import { request } from "./http.js";

export function normalizeProducts(data) {
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

export const catalogService = {
  all: () => request("/api/products"),
  sale: () => request("/api/products/sale"),
  featured: () => request("/api/products/featured"),
  combos: () => request("/api/products/combos"),
  newest: () => request("/api/products/new"),
  categories: () => request("/api/categories"),
  posts: () => request("/api/posts"),
  product: (id) =>
    request("/api/products/" + encodeURIComponent(id), {
      errorMessage: "Món này hiện không còn bán.",
    }),
};
