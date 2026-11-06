export function initContact() {
  const zaloContactDialog = document.querySelector("#zaloContactDialog");
  document.querySelectorAll("[data-open-zalo]").forEach((button) => {
    button.addEventListener("click", () => {
      if (zaloContactDialog && !zaloContactDialog.open)
        zaloContactDialog.showModal();
    });
  });
  document.querySelector("[data-close-zalo]")?.addEventListener("click", () => {
    zaloContactDialog?.close();
  });
  zaloContactDialog?.addEventListener("click", (event) => {
    const bounds = zaloContactDialog.getBoundingClientRect();
    if (
      event.target === zaloContactDialog &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    ) {
      zaloContactDialog.close();
    }
  });
}
