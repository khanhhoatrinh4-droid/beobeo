import { request, sendJson } from "./http.js";

export const orderService = {
  create: (data) =>
    sendJson("/api/orders", "POST", data, "Không thể tạo đơn hàng."),
  list: (page) =>
    request("/api/orders?page=" + encodeURIComponent(page), {
      errorMessage: "Không tải được lịch sử đơn hàng.",
    }),
  cancel: (id) =>
    request("/api/orders/" + encodeURIComponent(id) + "/cancel", {
      method: "PATCH",
      errorMessage: "Không thể hủy đơn hàng.",
    }),
};
