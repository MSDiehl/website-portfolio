window.addEventListener("scroll", () => {
  const intro = document.querySelector(".intro");
  const about = document.querySelector(".about");
  const scrollY = window.scrollY;

  if (scrollY > 50) {
    intro.style.opacity = "0";
  } else {
    intro.style.opacity = "1";
  }

  if (scrollY > window.innerHeight / 2) {
    about.style.opacity = "1";
    about.style.transform = "translateY(0)";
  } else {
    about.style.opacity = "0";
    about.style.transform = "translateY(50px)";
  }
});
