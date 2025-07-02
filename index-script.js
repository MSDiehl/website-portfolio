document.addEventListener("DOMContentLoaded", () => {
    const intro = document.querySelector(".intro");
    const about = document.querySelector(".about");
    const projects = document.querySelector(".projects");
    const contact = document.querySelector(".contact");
    const techLogos = document.querySelectorAll(".tech-logos i");
    const learnMoreButtons = document.querySelectorAll(".learn-more");

    requestAnimationFrame(() => {
        intro.style.opacity = "1";
        intro.style.transform = "translateY(0)";
    });

    function handleScroll() {
        const scrollY = window.scrollY;
        const aboutTop = about.getBoundingClientRect().top;
        const projectsTop = projects.getBoundingClientRect().top;
        const contactTop = contact.getBoundingClientRect().top;
        intro.style.opacity = scrollY > 50 ? "0" : "1";

        if (aboutTop < window.innerHeight * 0.75) {
            about.classList.add("visible");
        } else {
            about.classList.remove("visible");
        }

        if (projectsTop < window.innerHeight * 0.75) {
            projects.classList.add("visible");
        } else {
            projects.classList.remove("visible");
        }

        if (contactTop < window.innerHeight * 0.75) {
            contact.classList.add("visible");
        } else {
            contact.classList.remove("visible");
        }

        techLogos.forEach(img => {
            const imgTop = img.getBoundingClientRect().top;
            if (imgTop < window.innerHeight * 0.85) {
                img.classList.add("visible");
            }
        });
    }

    window.addEventListener("scroll", handleScroll);

    learnMoreButtons.forEach(button => {
        button.addEventListener("click", () => {
            const details = button.nextElementSibling;
            details.classList.toggle("expanded");
        });
    });
});
