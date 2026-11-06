import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

export function createPage(template, routes) {
  const html = readFileSync(
    new URL("../src/templates/" + template, import.meta.url),
    "utf8",
  );
  const dom = new JSDOM(html, { url: "http://localhost:8080/" });
  const calls = [];
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    FormData: dom.window.FormData,
    MutationObserver: dom.window.MutationObserver,
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
    },
    CSS: { escape: String },
  });
  dom.window.matchMedia = () => ({ matches: true });
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  document.body.dataset.authenticated = "true";
  document.querySelector('meta[name="_csrf"]').content = "test-csrf";
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, ...options });
    const route = routes[url];
    if (route === undefined) throw new Error("Unexpected API request: " + url);
    const data = typeof route === "function" ? await route(options) : route;
    return new Response(data === null ? null : JSON.stringify(data), {
      status: data === null ? 204 : 200,
    });
  };
  return { dom, calls, close: () => dom.window.close() };
}

export const settle = () => new Promise((resolve) => setImmediate(resolve));
export function click(selector) {
  const button = document.querySelector(selector);
  if (!button) throw new Error("Missing control: " + selector);
  button.click();
}
