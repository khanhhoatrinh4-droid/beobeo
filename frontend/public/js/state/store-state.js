import { readCart } from "../services/cart-storage.js";

export let products = [];
export let cart = readCart();
export let favoriteIds = new Set();

export function setProducts(value) {
  products = value;
}
export function setCart(value) {
  cart = value;
}
export function setFavorites(value) {
  favoriteIds = value;
}
