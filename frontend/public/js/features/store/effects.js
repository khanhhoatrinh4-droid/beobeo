export function initRevealEffects() {
  const revealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          revealObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.12 },
  );
  new MutationObserver(() =>
    document
      .querySelectorAll(".card:not(.reveal-ready), .combo:not(.reveal-ready)")
      .forEach((element, index) => {
        element.classList.add("reveal-ready");
        element.style.setProperty(
          "--reveal-delay",
          `${Math.min(index % 3, 2) * 80}ms`,
        );
        revealObserver.observe(element);
      }),
  ).observe(document.body, { childList: true, subtree: true });
}
