import test from "node:test";
import assert from "node:assert/strict";
import { request, sendJson } from "../public/js/services/http.js";

test("HTTP handles JSON, CSRF, FormData, empty responses and account errors", async () => {
  globalThis.document = { querySelector: () => ({ content: "csrf-value" }) };
  let sent;
  globalThis.fetch = async (url, options) => {
    sent = { url, ...options };
    return Response.json({ id: 7 });
  };
  assert.deepEqual(await sendJson("/api/products", "POST", { price: 25000 }), {
    id: 7,
  });
  assert.equal(sent.headers.get("X-XSRF-TOKEN"), "csrf-value");
  assert.equal(sent.headers.get("Content-Type"), "application/json");
  assert.equal(JSON.parse(sent.body).price, 25000);
  await request("/api/products");
  assert.equal(sent.headers.has("X-XSRF-TOKEN"), false);
  const image = new FormData();
  image.append("file", new Blob(["image"]), "image.png");
  await request("/api/admin/images", { method: "POST", body: image });
  assert.equal(sent.body, image);
  assert.equal(sent.headers.has("Content-Type"), false);
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(
    await request("/api/account/favorites/7", { method: "DELETE" }),
    null,
  );
  globalThis.fetch = async () =>
    Response.json(
      { code: "ACCOUNT_INACTIVE", message: "Tài khoản không hoạt động." },
      { status: 403 },
    );
  await assert.rejects(
    request("/api/account/profile"),
    (error) =>
      error.status === 403 &&
      error.code === "ACCOUNT_INACTIVE" &&
      error.message.includes("không hoạt động"),
  );
});
