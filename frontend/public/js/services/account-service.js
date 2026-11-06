import { request, sendJson } from "./http.js";

export const accountService = {
  saveProfile: (data) =>
    sendJson(
      "/api/account/profile",
      "PUT",
      data,
      "Không thể cập nhật thông tin.",
    ),
  wallet: () =>
    request("/api/account/wallet", {
      errorMessage: "Không tải được ví thành viên.",
    }),
  topUp: (amount) =>
    sendJson(
      "/api/account/wallet/top-ups",
      "POST",
      { amount },
      "Không thể tạo giao dịch nạp tiền.",
    ),
  favorites: () =>
    request("/api/account/favorites", {
      errorMessage: "Không tải được sản phẩm yêu thích.",
    }),
  setFavorite: (id, favorite) =>
    request("/api/account/favorites/" + encodeURIComponent(id), {
      method: favorite ? "POST" : "DELETE",
      errorMessage: "Không cập nhật được danh sách yêu thích.",
    }),
};
