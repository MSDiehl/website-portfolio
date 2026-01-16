document.addEventListener("DOMContentLoaded", () => {
    const intro = document.querySelector(".intro");
    const about = document.querySelector(".about");
    const projects = document.querySelector(".projects");
    const contact = document.querySelector(".contact");
    const techLogos = document.querySelectorAll(".tech-logos i");
    const learnMoreButtons = document.querySelectorAll(".learn-more");
    
    const SOCIAL_LINKS = {
        linkedin: "https://www.linkedin.com/in/malachi-diehl-04b961251/",
        github: "https://github.com/MSDiehl",
    };

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

    // Basic rate limit (client-side) to reduce bot spam and accidental double-submits.
    const RATE_KEY = "portfolio_contact_last_submit_v1";
    const RATE_WINDOW_MS = 15_000;

    function isRateLimited() {
        try {
            const last = Number(localStorage.getItem(RATE_KEY) || 0);
            return Date.now() - last < RATE_WINDOW_MS;
        } catch {
            return false;
        }
    }

    function markSubmitted() {
        try {
            localStorage.setItem(RATE_KEY, String(Date.now()));
        } catch {
            // ignore
        }
    }

    function getLinkedInUrl() {
        const link = document.querySelector('.social[aria-label="LinkedIn"]');
        const href = link?.getAttribute?.('href') || "";
        return href && href !== "#" ? href : "";
    }

    function ensureFallbackPanel() {
        if (!form) return null;
        let panel = form.querySelector(".contact-fallback");
        if (panel) return panel;

        const note = form.querySelector(".form-note");
        panel = document.createElement("div");
        panel.className = "contact-fallback";
        panel.innerHTML = `
            <div class="fallback-head">
                <strong>Having trouble?</strong>
                <span class="fallback-sub">Copy the message below and send it manually.</span>
            </div>
            <label class="fallback-field">
                <span class="fallback-label">Message</span>
                <textarea class="fallback-text" rows="6" readonly></textarea>
            </label>
            <div class="fallback-actions">
                <a class="btn btn-primary fallback-mailto" href="#" target="_self">
                    <i class="fa-solid fa-envelope"></i>
                    Open email link
                </a>
                <button class="btn btn-ghost fallback-copy" type="button">
                    <i class="fa-regular fa-copy"></i>
                    Copy message
                </button>
            </div>
            <div class="fallback-meta"></div>
        `;

        if (note && note.parentNode) note.parentNode.insertBefore(panel, note.nextSibling);
        else form.appendChild(panel);

        const copyBtn = panel.querySelector(".fallback-copy");
        copyBtn?.addEventListener("click", async () => {
            const text = panel.querySelector(".fallback-text")?.value || "";
            try {
                await navigator.clipboard.writeText(text);
                showToast("Message copied");
            } catch {
                showToast("Select + copy the message");
            }
        });

        return panel;
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
        const mailto = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        return {
            mailto,
            emailTo,
            subject,
            body,
            pref,
            plainText: `To: ${emailTo}\nSubject: ${subject}\n\n${body}`,
        };
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

            if (isRateLimited()) {
                showToast("Please wait a moment before sending again.");
                return;
            }

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

            const { mailto, plainText, pref } = buildMailto();
            markSubmitted();

            // Always prepare a fallback panel (helps when mailto is blocked/no mail app).
            const fallback = ensureFallbackPanel();
            if (fallback) {
                const ta = fallback.querySelector(".fallback-text");
                const link = fallback.querySelector(".fallback-mailto");
                const meta = fallback.querySelector(".fallback-meta");
                if (ta) ta.value = plainText;
                if (link) link.setAttribute("href", mailto);
                if (meta) {
                    const li = getLinkedInUrl();
                    meta.innerHTML = li
                        ? `Prefer LinkedIn? Open it and paste your message: <a href="${li}" target="_blank" rel="noreferrer">LinkedIn</a>`
                        : "";
                }
                fallback.classList.remove("show");
            }

            // If they prefer LinkedIn, copy the message and open LinkedIn.
            if (pref === "linkedin") {
                const li = getLinkedInUrl();
                (async () => {
                    try {
                        await navigator.clipboard.writeText(plainText);
                        showToast("Message copied — opening LinkedIn…");
                    } catch {
                        showToast("Opening LinkedIn…");
                    }
                    if (li) window.open(li, "_blank", "noopener,noreferrer");
                    else if (fallback) fallback.classList.add("show");
                    clearDraft();
                })().finally(() => {
                    window.setTimeout(() => {
                        if (sendBtn) sendBtn.disabled = false;
                    }, 700);
                });
                return;
            }

            showToast("Opening your email client…");

            try {
                window.location.href = mailto;
                // If mailto is blocked or no client is configured, show the fallback.
                window.setTimeout(() => {
                    fallback?.classList.add("show");
                }, 900);
                clearDraft();
            } finally {
                window.setTimeout(() => {
                    if (sendBtn) sendBtn.disabled = false;
                }, 900);
            }
        });
    }

    document.querySelectorAll(".social[data-link]").forEach(button => {
        button.addEventListener("click", () => {
            const key = button.dataset.link;
            const url = SOCIAL_LINKS[key];

            if (!url) {
            console.warn(`No URL configured for ${key}`);
            return;
            }

            window.open(url, "_blank", "noopener");
        });
    });
});
