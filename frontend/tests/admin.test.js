import test from "node:test";
import assert from "node:assert/strict";
import { createPage, settle, click } from "./browser-fixture.js";

test("admin entry preserves 8-item pagination, filtering and product submission", async () => {
  const products = Array.from({ length: 17 }, (_, i) => ({
    id: i + 1,
    name: "Món " + (i + 1),
    price: 25000,
    active: true,
  }));
  let saved;
  const page = createPage("admin.html", {
    "/api/products/admin/all": products,
    "/api/categories/admin/all": [],
    "/api/posts/admin/all": [],
    "/api/admin/orders": [],
    "/api/admin/users": [],
    "/api/admin/stats": { products: 17, orders: 0, users: 0 },
    "/api/products": (options) => {
      saved = JSON.parse(options.body);
      return { id: 18, ...saved };
    },
  });
  try {
    await import("../public/js/pages/admin.js");
    await settle();
    assert.equal(
      document.querySelectorAll("#tableBody [data-edit-product]").length,
      8,
    );
    click('[data-product-page="3"]');
    assert.equal(
      document.querySelectorAll("#tableBody [data-edit-product]").length,
      1,
    );
    const search = document.querySelector("#adminSearch");
    search.value = "Món 1";
    search.dispatchEvent(new window.Event("input"));
    assert.equal(
      document.querySelector('[aria-current="page"]').textContent,
      "1",
    );
    click("#newRecord");
    const form = document.querySelector("#productForm");
    form.elements.name.value = "Món mới";
    form.elements.price.value = "30000";
    form.dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true }),
    );
    await settle();
    assert.equal(saved.name, "Món mới");
    assert.equal(saved.price, 30000);
    assert.equal(saved.discountPercent, 0);
    assert.equal(document.querySelector("#productFormDialog").open, false);
  } finally {
    page.close();
  }
});
