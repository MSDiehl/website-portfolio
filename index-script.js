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

    // -------------------------
    // Contact form enhancements
    // -------------------------
    const form = document.getElementById("contact-form");
    const toast = document.getElementById("toast");
    const copyEmailBtn = document.getElementById("copy-email");
    const clearDraftBtn = document.getElementById("clear-draft");
    const sendBtn = document.getElementById("send-btn");
    const msg = document.getElementById("message");
    const msgCount = document.getElementById("message-count");
    const budget = document.getElementById("budget");
    const budgetLabel = document.getElementById("budget-label");

    const DRAFT_KEY = "portfolio_contact_draft_v1";
    const budgetLabels = ["Not sure", "$500–$1k", "$1k–$3k", "$3k–$7k", "$7k–$15k", "$15k+"];
    const reasonLabels = {
        role: "Job opportunity",
        freelance: "Freelance / contract",
        collab: "Collaboration",
        other: "Other",
    };

    function showToast(text) {
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add("show");
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(() => toast.classList.remove("show"), 2600);
    }

    function getEmailTo() {
        const mailto = document.getElementById("email-me")?.getAttribute("href") || "";
        if (mailto.startsWith("mailto:")) return mailto.replace("mailto:", "").split("?")[0];
        return copyEmailBtn?.dataset?.email || "your@email.com";
    }

    function setFieldError(inputEl, isError) {
        const field = inputEl?.closest?.(".field");
        if (!field) return;
        field.classList.toggle("is-error", Boolean(isError));
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function updateMessageCount() {
        if (!msg || !msgCount) return;
        msgCount.textContent = String(msg.value.length);
    }

    function updateBudgetLabel() {
        if (!budget || !budgetLabel) return;
        const idx = Number(budget.value);
        budgetLabel.textContent = budgetLabels[idx] || budgetLabels[0];
    }

    function loadDraft() {
        if (!form) return;
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            for (const [key, value] of Object.entries(data)) {
                const el = form.querySelector(`[name="${key}"]`);
                if (!el) continue;

                if (el.type === "radio") {
                    const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                    continue;
                }

                el.value = value;
            }
            updateMessageCount();
            updateBudgetLabel();
            showToast("Draft restored");
        } catch {
            // ignore
        }
    }

    let saveDraftTimer;
    function saveDraft() {
        if (!form) return;
        window.clearTimeout(saveDraftTimer);
        saveDraftTimer = window.setTimeout(() => {
            const data = {};
            const formData = new FormData(form);
            for (const [key, value] of formData.entries()) {
                if (key === "company") continue; // honeypot
                data[key] = value;
            }
            try {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
            } catch {
                // ignore
            }
        }, 120);
    }

    function clearDraft() {
        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch {
            // ignore
        }
        if (form) form.reset();
        updateMessageCount();
        updateBudgetLabel();
        showToast("Cleared");
    }

    async function copyEmail() {
        const email = getEmailTo();
        try {
            await navigator.clipboard.writeText(email);
            showToast("Email copied");
        } catch {
            showToast(email);
        }
    }

    function validateForm() {
        if (!form) return { ok: true };

        const requiredIds = ["reason", "timeline", "name", "email", "message"];
        let firstBad = null;

        requiredIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;

            const isBad = !el.value || (id === "email" && !isValidEmail(el.value));
            setFieldError(el, isBad);
            if (isBad && !firstBad) firstBad = el;
        });

        return { ok: !firstBad, firstBad };
    }

    function buildMailto() {
        const emailTo = getEmailTo();
        const fd = new FormData(form);
        const reasonKey = String(fd.get("reason") || "other");
        const reason = reasonLabels[reasonKey] || "Portfolio inquiry";
        const name = String(fd.get("name") || "").trim();
        const email = String(fd.get("email") || "").trim();
        const timeline = String(fd.get("timeline") || "").trim();
        const subjectLine = String(fd.get("subject") || "").trim();
        const message = String(fd.get("message") || "").trim();
        const pref = String(fd.get("pref") || "email");
        const budgetIdx = Number(fd.get("budget") || 0);
        const budgetText = budgetLabels[budgetIdx] || budgetLabels[0];

        const subject = subjectLine
            ? `Portfolio — ${subjectLine}`
            : `Portfolio — ${reason} (${name || "Anonymous"})`;

        const bodyLines = [
            `Name: ${name}`,
            `Email: ${email}`,
            `Reason: ${reason}`,
            `Timeline: ${timeline}`,
            `Preferred contact: ${pref}`,
            `Budget: ${budgetText}`,
            "",
            message,
        ];

        const body = bodyLines.join("\n");
        return `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    if (copyEmailBtn) copyEmailBtn.addEventListener("click", copyEmail);
    if (clearDraftBtn) clearDraftBtn.addEventListener("click", clearDraft);

    if (msg) {
        msg.addEventListener("input", () => {
            updateMessageCount();
            saveDraft();
        });
        updateMessageCount();
    }

    if (budget) {
        budget.addEventListener("input", () => {
            updateBudgetLabel();
            saveDraft();
        });
        updateBudgetLabel();
    }

    if (form) {
        form.addEventListener("input", saveDraft);
        form.addEventListener("change", saveDraft);
        loadDraft();

        form.addEventListener("submit", e => {
            e.preventDefault();

            // Honeypot: if filled, silently "succeed".
            const hp = document.getElementById("company");
            if (hp && hp.value) {
                showToast("Thanks! I'll reply soon.");
                return;
            }

            const { ok, firstBad } = validateForm();
            if (!ok) {
                showToast("Please check the highlighted fields.");
                firstBad?.focus?.();
                return;
            }

            sendBtn && (sendBtn.disabled = true);
            showToast("Opening your email client…");

            try {
                const mailto = buildMailto();
                window.location.href = mailto;
                clearDraft();
            } finally {
                window.setTimeout(() => {
                    if (sendBtn) sendBtn.disabled = false;
                }, 900);
            }
        });
    }
});
