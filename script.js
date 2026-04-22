function initSlideshow(slideshow) {
  const slides = Array.from(slideshow.querySelectorAll("[data-slide]"));
  const slideStage = slideshow.querySelector(".about-slides");
  const dotsContainer = slideshow.querySelector(".slideshow-dots");
  const prevButton = slideshow.querySelector("[data-prev]");
  const nextButton = slideshow.querySelector("[data-next]");
  const interval = Number(slideshow.dataset.interval || 5200);

  if (!slides.length || !slideStage || !dotsContainer) {
    return;
  }

  let activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  let timerId = null;

  if (activeIndex < 0) {
    activeIndex = 0;
    slides[0].classList.add("is-active");
  }

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "slideshow-dot";
    dot.setAttribute("aria-label", `Show slide ${index + 1}`);
    dot.addEventListener("click", () => {
      setActiveSlide(index);
      restartTimer();
    });
    dotsContainer.appendChild(dot);
    return dot;
  });

  function syncStageHeight() {
    window.requestAnimationFrame(() => {
      slideStage.style.height = `${slides[activeIndex].offsetHeight}px`;
    });
  }

  function setActiveSlide(nextIndex) {
    activeIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
      dot.setAttribute("aria-selected", String(index === activeIndex));
    });

    syncStageHeight();
  }

  function goToNext() {
    setActiveSlide(activeIndex + 1);
  }

  function goToPrevious() {
    setActiveSlide(activeIndex - 1);
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    timerId = window.setInterval(goToNext, interval);
  }

  function restartTimer() {
    startTimer();
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      goToPrevious();
      restartTimer();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      goToNext();
      restartTimer();
    });
  }

  window.addEventListener("resize", syncStageHeight);

  slides.forEach((slide) => {
    const image = slide.querySelector("img");
    if (!image) {
      return;
    }

    if (image.complete) {
      syncStageHeight();
      return;
    }

    image.addEventListener("load", syncStageHeight, { once: true });
  });

  setActiveSlide(activeIndex);
  startTimer();
}

function initScrollReveals() {
  const revealSelector = [
    ".reveal-on-scroll",
    ".page-hero",
    ".page-section",
    ".page-card",
    ".blog-card",
    ".blog-post-hero",
    ".blog-post-content",
    ".archive-filter-panel",
    ".feature-card",
    ".stat-card",
    ".info-card",
    ".contact-card",
    ".quote-panel",
    ".cta-banner",
    ".about-slideshow-panel",
    ".section-heading",
  ].join(", ");

  const revealItems = Array.from(document.querySelectorAll(revealSelector));

  if (!revealItems.length) {
    return;
  }

  revealItems.forEach((item) => item.classList.add("reveal-on-scroll"));

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -70px 0px",
    }
  );

  revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 0.08}s`);
    observer.observe(item);
  });
}

function initArchiveFilters() {
  const filters = document.querySelector("[data-archive-filters]");
  const results = document.querySelector("[data-archive-results]");
  const emptyMessage = document.querySelector("[data-archive-empty]");

  if (!filters || !results) {
    return;
  }

  const posts = Array.from(results.querySelectorAll("[data-archive-post]"));
  const dateFilter = filters.querySelector("[data-filter-date]");
  const topicFilter = filters.querySelector("[data-filter-topic]");
  const readFilter = filters.querySelector("[data-filter-read]");
  const ratingFilter = filters.querySelector("[data-filter-rated]");

  function sortPosts(visiblePosts) {
    const dateValue = dateFilter.value;
    const readValue = readFilter.value;
    const ratingValue = ratingFilter.value;

    visiblePosts.sort((firstPost, secondPost) => {
      if (ratingValue === "highest" || ratingValue === "4-plus" || ratingValue === "favourites") {
        return Number(secondPost.dataset.rating) - Number(firstPost.dataset.rating);
      }

      if (readValue !== "any") {
        const readKey = readValue === "week" ? "readsWeek" : readValue === "month" ? "readsMonth" : "readsOverall";
        return Number(secondPost.dataset[readKey]) - Number(firstPost.dataset[readKey]);
      }

      const firstDate = new Date(firstPost.dataset.date);
      const secondDate = new Date(secondPost.dataset.date);
      return dateValue === "Oldest first" ? firstDate - secondDate : secondDate - firstDate;
    });
  }

  function applyFilters() {
    const topicValue = topicFilter.value;
    const ratingValue = ratingFilter.value;
    const now = new Date();
    const visiblePosts = posts.filter((post) => {
      const postDate = new Date(post.dataset.date);
      const isThisMonth = postDate.getFullYear() === now.getFullYear() && postDate.getMonth() === now.getMonth();
      const isThisYear = postDate.getFullYear() === now.getFullYear();
      const matchesDate =
        dateFilter.value === "This month" ? isThisMonth : dateFilter.value === "This year" ? isThisYear : true;
      const matchesTopic = topicValue === "all" || post.dataset.topic === topicValue;
      const matchesRating =
        ratingValue === "4-plus" ? Number(post.dataset.rating) >= 4 :
        ratingValue === "favourites" ? post.dataset.favourite === "true" :
        true;

      return matchesDate && matchesTopic && matchesRating;
    });

    sortPosts(visiblePosts);

    posts.forEach((post) => {
      post.hidden = !visiblePosts.includes(post);
    });

    visiblePosts.forEach((post) => results.appendChild(post));

    if (emptyMessage) {
      emptyMessage.hidden = visiblePosts.length > 0;
      results.appendChild(emptyMessage);
    }
  }

  filters.addEventListener("change", applyFilters);
  applyFilters();
}

document.addEventListener("DOMContentLoaded", () => {
  const slideshows = document.querySelectorAll("[data-slideshow]");
  slideshows.forEach(initSlideshow);
  initArchiveFilters();
  initScrollReveals();
});
