import test from "node:test";
import assert from "node:assert/strict";
import { createPage, settle, click } from "./browser-fixture.js";

test("store modules keep catalog, search, cart, favorites, details and checkout connected", async () => {
  const burger = {
    id: 1,
    name: "Burger thử nghiệm",
    price: 25000,
    discountPercent: 10,
    ingredients: "phô mai, rau, sốt",
    category: { id: 1, name: "Burger" },
  };
  const drink = {
    id: 2,
    name: "Trà đào",
    price: 15000,
    category: { id: 2, name: "Drink" },
  };
  let rejectOrder = false;
  const page = createPage("index.html", {
    "/api/products": [burger, drink],
    "/api/products/sale": [burger],
    "/api/products/featured": [burger],
    "/api/products/new": [drink],
    "/api/products/combos": [],
    "/api/categories": [burger.category, drink.category],
    "/api/posts": [],
    "/api/account/favorites": [],
    "/api/account/favorites/1": null,
    "/api/account/wallet": { balance: 100000 },
    "/api/orders": () => {
      if (rejectOrder) throw new Error("Không đủ số dư ví.");
      return { id: 99 };
    },
  });
  try {
    await import("../public/js/pages/store.js");
    await settle();
    assert.match(
      document.querySelector("#featuredGrid").textContent,
      /Burger thử nghiệm/,
    );
    assert.match(document.querySelector("#postGrid").textContent, /Halloween/);
    assert.match(document.querySelector("#promoHeadline").textContent, /10%/);
    const search = document.querySelector("#productSearch");
    search.value = "Trà";
    search.dispatchEvent(new window.Event("input"));
    assert.equal(document.querySelectorAll("#searchGrid .card").length, 1);
    click('#featuredGrid [data-detail="1"]');
    assert.equal(document.querySelector("#productDialog").open, true);
    assert.ok(document.querySelector("#dialogContent [data-customization]"));
    click("#dialogContent [data-customization]");
    click('[data-add-customized="1"]');
    click('#featuredGrid [data-add="1"]');
    assert.equal(document.querySelector("#cartCount").textContent, "2");
    assert.equal(JSON.parse(localStorage.getItem("fasty-cart")).length, 2);
    click('#featuredGrid [data-favorite-id="1"]');
    await settle();
    assert.equal(
      document
        .querySelector('#featuredGrid [data-favorite-id="1"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      page.calls
        .find((call) => call.url === "/api/account/favorites/1")
        .headers.get("X-XSRF-TOKEN"),
      "test-csrf",
    );
    click("#cartButton");
    assert.equal(
      document.querySelector("#cartPanel").classList.contains("open"),
      true,
    );
    click("#checkoutButton");
    await settle();
    const form = document.querySelector("#checkoutForm");
    form.elements.customerName.value = "Khách thử nghiệm";
    form.elements.phone.value = "0900000000";
    form.elements.address.value = "Địa chỉ thử nghiệm";
    form.dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true }),
    );
    await settle();
    assert.equal(document.querySelector("#checkoutDialog").open, false);
    assert.deepEqual(JSON.parse(localStorage.getItem("fasty-cart")), []);
    assert.match(document.querySelector("#toast").textContent, /#99/);
    const orderCall = page.calls.find((call) => call.url === "/api/orders");
    assert.equal(JSON.parse(orderCall.body).items.length, 2);
    click('#featuredGrid [data-add="1"]');
    click("#checkoutButton");
    rejectOrder = true;
    form.dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true }),
    );
    await settle();
    assert.equal(JSON.parse(localStorage.getItem("fasty-cart")).length, 1);
    assert.match(
      document.querySelector("#toast").textContent,
      /Không đủ số dư/,
    );
    click('[data-remove="1"]');
    assert.equal(document.querySelector("#cartCount").textContent, "0");
    click(".footer-qr");
    assert.equal(document.querySelector("#zaloContactDialog").open, true);
  } finally {
    page.close();
  }
});
