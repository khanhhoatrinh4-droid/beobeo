const toastNode = document.querySelector("#accountToast");
export function notify(message) {
  toastNode.textContent = message;
  toastNode.classList.add("show");
  window.setTimeout(() => toastNode.classList.remove("show"), 2400);
}
