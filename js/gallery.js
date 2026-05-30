(function () {
  "use strict";

  const filters = document.querySelectorAll(".gallery-filter");
  const sections = document.querySelectorAll(".gallery-section");
  const items = document.querySelectorAll(".gallery-item");

  if (!filters.length) return;

  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.filter;

      filters.forEach((b) => b.classList.toggle("is-active", b === btn));

      sections.forEach((section) => {
        if (type === "all") {
          section.hidden = false;
          return;
        }
        const isPhotoSection = section.querySelector('[data-type="photo"]');
        const isPlanSection = section.querySelector('[data-type="plan"]');
        if (type === "photo") section.hidden = !isPhotoSection;
        if (type === "plan") section.hidden = !isPlanSection;
      });

      items.forEach((item) => {
        if (type === "all") {
          item.classList.remove("is-hidden");
        } else {
          item.classList.toggle("is-hidden", item.dataset.type !== type);
        }
      });
    });
  });
})();
