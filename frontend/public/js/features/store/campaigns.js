import { esc } from "../../shared/format.js";

export function initCampaignCarousel() {
  const carousel = document.querySelector(".campaign-carousel");
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll(".campaign-slide")];
  const dots = [...carousel.querySelectorAll(".campaign-dots button")];
  if (slides.length < 2 || dots.length !== slides.length) return;
  let current = 0;
  let timer;
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
      dots[i].classList.toggle("is-active", active);
      dots[i].setAttribute("aria-current", String(active));
    });
  };
  const restart = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => show(current + 1), 5000);
  };
  dots.forEach((dot, i) =>
    dot.addEventListener("click", () => {
      show(i);
      restart();
    }),
  );
  carousel.addEventListener("mouseenter", () => window.clearInterval(timer));
  carousel.addEventListener("mouseleave", restart);
  carousel.addEventListener("focusin", () => window.clearInterval(timer));
  carousel.addEventListener("focusout", restart);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  restart();
}

export const fallbackCampaignPosts = [
  {
    title: "Halloween beobeo: Tiệc ma vui vẻ, combo ngon hết sẩy!",
    excerpt:
      "🎃 Mùa Halloween đã đến beobeo! Cùng khám phá các combo Bí Ngô Ma Thuật, Hội Ma Bạn Bè và Đại Tiệc Bí Ngô để tụ họp, thưởng thức món ngon và tận hưởng không khí lễ hội.",
    imageUrl: "/images/combo-family.jpg",
    createdAt: "2026-10-28",
  },
  {
    title: "Sắp diễn ra: Ngày hội săn ưu đãi 11/11 tại beobeo",
    excerpt:
      "🛍️ Đánh dấu lịch 11/11! beobeo chuẩn bị ngày hội săn deal với nhiều món ngon và combo hấp dẫn. Theo dõi website để cập nhật ưu đãi và điều kiện tham gia khi chương trình bắt đầu.",
    imageUrl: "/images/combo-two.jpg",
    createdAt: "2026-10-28",
  },
];

export function renderPosts(posts) {
  const postGrid = document.querySelector("#postGrid");
  if (!postGrid) return;
  postGrid.innerHTML =
    posts
      .map(
        (post) => `
          <article class="story-card">
            ${post.imageUrl ? `<img src="${esc(post.imageUrl)}" alt="${esc(post.title)}" loading="lazy">` : ""}
            <div>
              <span class="category">TIN TỨC beobeo</span>
              <h3>${esc(post.title)}</h3>
              <p>${esc(post.excerpt || post.content || "")}</p>
              <small>${new Date(post.createdAt).toLocaleDateString("vi-VN")}</small>
            </div>
          </article>
        `,
      )
      .join("") || "<p>Chưa có bài viết mới.</p>";
}
