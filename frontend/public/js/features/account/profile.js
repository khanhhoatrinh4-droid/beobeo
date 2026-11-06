import { accountService } from "../../services/account-service.js";
import { notify } from "./notice.js";
const shell = document.querySelector(".account-shell");
const profileForm = document.querySelector("#profileForm");
function initializeProfile() {
  profileForm.elements.fullName.value = shell.dataset.currentName || "";
  profileForm.elements.email.value = shell.dataset.currentEmail || "";
  profileForm.elements.phone.value = shell.dataset.currentPhone || "";
  profileForm.elements.address.value = shell.dataset.currentAddress || "";
  document.querySelector("#profileUsername").value =
    shell.dataset.currentUsername || "Tài khoản thành viên";
}

async function saveProfile(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(profileForm));
  try {
    const result = await accountService.saveProfile(values);
    shell.dataset.currentName = result.fullName || "";
    shell.dataset.currentEmail = result.email || "";
    shell.dataset.currentPhone = result.phone || "";
    shell.dataset.currentAddress = result.address || "";
    notify("Đã lưu thông tin tài khoản.");
  } catch (error) {
    notify(error.message || "Lỗi kết nối. Vui lòng thử lại.");
  }
}

export function initProfile() {
  initializeProfile();
  profileForm.addEventListener("submit", saveProfile);
}
