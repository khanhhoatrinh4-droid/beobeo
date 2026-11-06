import { adminService } from "../../services/admin-service.js";
let productImageVersion = 0;
export let productImageBusy = false;
const productImageUrl = document.querySelector("#productImageUrl");
const productImageFile = document.querySelector("#productImageFile");
const productImageUpload = document.querySelector("#productImageUpload");
const productImageStatus = document.querySelector("#productImageStatus");
const productImagePreview = document.querySelector("#productImagePreview");

export function previewProductImage() {
  const url = productImageUrl.value.trim();
  productImagePreview.hidden = !url;
  if (url) productImagePreview.src = url;
  else productImagePreview.removeAttribute("src");
}
productImagePreview.addEventListener("error", () => {
  productImagePreview.hidden = true;
});
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
  if (
    !["image/jpeg", "image/png", "image/gif"].includes(file.type) ||
    file.size > 5 * 1024 * 1024 ||
    !file.size
  ) {
    productImageStatus.textContent =
      "Vui lòng chọn ảnh JPG, PNG hoặc GIF có dung lượng tối đa 5 MB.";
    productImageFile.value = "";
    return;
  }
  const version = ++productImageVersion;
  setProductImageBusy(true);
  productImageStatus.textContent = "Đang tải ảnh lên…";
  try {
    const result = await adminService.uploadImage(file);
    if (version !== productImageVersion) return;
    productImageUrl.value = result.imageUrl;
    previewProductImage();
    productImageStatus.textContent = `Đã tải ảnh ${file.name}. Bấm Lưu sản phẩm để lưu thay đổi.`;
  } catch (error) {
    if (version === productImageVersion)
      productImageStatus.textContent = error.message;
  } finally {
    if (version === productImageVersion) {
      setProductImageBusy(false);
      productImageFile.value = "";
    }
  }
}
productImageFile.addEventListener("change", () =>
  uploadProductImage(productImageFile.files),
);
productImageUrl.addEventListener("input", previewProductImage);
for (const target of [productImageUpload, productImageUrl]) {
  target.addEventListener("dragover", (event) => {
    event.preventDefault();
    productImageUpload.classList.add("dragging");
  });
  target.addEventListener("dragleave", (event) => {
    if (!target.contains(event.relatedTarget))
      productImageUpload.classList.remove("dragging");
  });
  target.addEventListener("drop", (event) => {
    event.preventDefault();
    productImageUpload.classList.remove("dragging");
    uploadProductImage(event.dataTransfer.files);
  });
}

export function resetProductImage() {
  productImageVersion++;
  setProductImageBusy(false);
  productImageFile.value = "";
  productImageStatus.textContent = "";
}
