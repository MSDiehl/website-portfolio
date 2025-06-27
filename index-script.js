document.addEventListener("DOMContentLoaded", () => {
  const intro = document.querySelector(".intro");
  const about = document.querySelector(".about");
  requestAnimationFrame(() => {
    intro.style.opacity = "1";
    intro.style.transform = "translateY(0)";
  });
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    const aboutTop = about.getBoundingClientRect().top;
    if (scrollY > 50) {
      intro.style.opacity = "0";
    } else {
      intro.style.opacity = "1";
    }
    if (aboutTop < window.innerHeight * 0.75) {
      about.classList.add("visible");
    } else {
      about.classList.remove("visible");
    }
  });
});
