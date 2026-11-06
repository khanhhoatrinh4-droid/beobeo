import { resetProductImage, previewProductImage } from "./image-upload.js";
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
export function editProduct(product) {
  resetProductImage();
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
export function editCategory(category) {
  showForm(
    "#categoryFormDialog",
    "#categoryForm",
    "#categoryFormTitle",
    category,
    ["name", "description"],
    "danh mục",
  );
}
export function editPost(post) {
  showForm(
    "#postFormDialog",
    "#postForm",
    "#postFormTitle",
    post,
    ["title", "slug", "excerpt", "content", "imageUrl"],
    "bài viết",
  );
}
export function objectFromForm(form, numeric = []) {
  const data = Object.fromEntries(new FormData(form));
  data.active = form.elements.active.checked;
  numeric.forEach(
    (key) => (data[key] = data[key] === "" ? null : Number(data[key])),
  );
  return data;
}
