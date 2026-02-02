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

    // -------------------------
    // Intro role rotator (robust)
    // -------------------------
    const roles = Array.from(document.querySelectorAll(".role"));

    if (roles.length) {
        // Ensure one role is active on load (prevents "blank" state)
        let roleIndex = roles.findIndex(r => r.classList.contains("active"));
        if (roleIndex < 0) {
            roleIndex = 0;
            roles[0].classList.add("active");
        }

        // Only rotate if there are multiple roles
        if (roles.length > 1) {
            setInterval(() => {
            roles[roleIndex].classList.remove("active");
            roleIndex = (roleIndex + 1) % roles.length;
            roles[roleIndex].classList.add("active");
            }, 2600);
        }
    }

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
            const card = button.closest(".project-card");
            const details = card?.querySelector(".project-details");
            if (!details) return;

            const isOpen = !details.hasAttribute("hidden");

            if (isOpen) {
                details.setAttribute("hidden", "");
                button.setAttribute("aria-expanded", "false");
                button.innerHTML = `<i class="fa-solid fa-circle-info"></i> Learn more`;
            } else {
                details.removeAttribute("hidden");
                button.setAttribute("aria-expanded", "true");
                button.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Close`;
            }
        });
    });

    // -------------------------
    // About bubble "physics"
    // -------------------------
    (function initAboutBubbleMotion() {
        const bubble = document.querySelector(".about-bubble");
        const cards = Array.from(document.querySelectorAll(".about-card"));
        if (!bubble || cards.length === 0) return;

        // Respect reduced motion
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        if (reduceMotion) return;

        // helpers
        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
        const rand = (a, b) => a + Math.random() * (b - a);

        let bounds = null;

        function computeBounds() {
            const r = bubble.getBoundingClientRect();
            const radius = Math.min(r.width, r.height) / 2;

            // Keep bubbles comfortably inside (padding + rim)
            const safePadding = Math.max(30, radius * 0.10);
            bounds = {
                radius,
                safeRadius: radius - safePadding,
            };
        }

        computeBounds();
        window.addEventListener("resize", computeBounds);

        // Build per-card state
        const state = cards.map((el, idx) => {
            const startX = Number(el.dataset.x || 50);
            const startY = Number(el.dataset.y || 50);

            // Map 0..100 into -1..1 around center, then scale into safeRadius
            const nx = (startX - 50) / 50; // -1..1
            const ny = (startY - 50) / 50; // -1..1

            const x = nx * bounds.safeRadius * 0.94;
            const y = ny * bounds.safeRadius * 0.94;

            const s = {
                el,
                x,
                y,
                vx: rand(-0.35, 0.35),
                vy: rand(-0.35, 0.35),
                // a moving "noise target" to drift toward
                tx: x + rand(-30, 30),
                ty: y + rand(-30, 30),
                tChangeAt: performance.now() + rand(700, 1400),

                hover: false,
                boostUntil: 0,

                r: 0, // will be set after layout
            };

            // Hover logic
            el.addEventListener("mouseenter", () => {
                s.hover = true;
                el.classList.add("is-hover");
            });
            el.addEventListener("mouseleave", () => {
                s.hover = false;
                el.classList.remove("is-hover");
            });

            // Click/keyboard "impulse" logic
            const boost = () => {
                const now = performance.now();

                // 1 second burst
                s.boostUntil = now + 1000;

                el.classList.add("is-boost");
                window.setTimeout(() => el.classList.remove("is-boost"), 220);

                // impulse in a random direction (gentle but noticeable)
                const angle = Math.random() * Math.PI * 2;
                const strength = rand(90, 140); // px/sec impulse (not crazy)

                s.vx += Math.cos(angle) * strength;
                s.vy += Math.sin(angle) * strength;

                // pick a new target so it doesn't "snap back"
                s.tx = rand(-bounds.safeRadius * 0.70, bounds.safeRadius * 0.70);
                s.ty = rand(-bounds.safeRadius * 0.70, bounds.safeRadius * 0.70);

                // delay next target change a bit so it feels like it "coasts"
                s.tChangeAt = now + rand(1200, 2200);
            };

            el.addEventListener("click", boost);
            el.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    boost();
                }
            });

            return s;
        });

        function syncRadii() {
            for (const s of state) {
                // offsetWidth is stable + matches your responsive clamp sizing
                s.r = (s.el.offsetWidth || 160) / 2;
            }
        }
        syncRadii();
        window.addEventListener("resize", () => {
            computeBounds();
            syncRadii();
        });

        let last = performance.now();

        function tick(now) {
            // dt in seconds (stable + smooth)
            const dt = clamp((now - last) / 1000, 0.001, 0.033);
            last = now;

            // ---------- Tunables (speed + feel) ----------
            const steer = 0.34;            // slightly faster drift than before
            const targetStep = 140;       // how far targets move each change (px)
            const restitution = 0.88;      // bounce (0.0 = no bounce, 1.0 = perfectly elastic)
            const sepSlop = 0.5;           // helps prevent micro-jitter when barely touching

            // 1) Wander + integrate (no DOM writes yet)
            for (const s of state) {
                const wanderMin = s.hover ? 2400 : 1800;
                const wanderMax = s.hover ? 4200 : 3200;

                if (now > s.tChangeAt) {
                    s.tChangeAt = now + rand(wanderMin, wanderMax);

                    s.tx = clamp(
                        s.x + rand(-targetStep, targetStep),
                        -bounds.safeRadius * 1.00,
                        bounds.safeRadius * 1.00
                    );
                    s.ty = clamp(
                        s.y + rand(-targetStep, targetStep),
                        -bounds.safeRadius * 1.00,
                        bounds.safeRadius * 1.00
                    );
                }

                // Smooth steering (px/sec^2)
                const ax = (s.tx - s.x) * steer;
                const ay = (s.ty - s.y) * steer;

                s.vx += ax * dt;
                s.vy += ay * dt;

                // Damping (hover = calmer)
                const baseDamp = s.hover ? 0.90 : 0.86;
                const damp = Math.pow(baseDamp, dt * 60);
                s.vx *= damp;
                s.vy *= damp;

                // Click boost fade feel stays the same
                if (now < s.boostUntil) {
                    const boostDamp = Math.pow(0.94, dt * 60);
                    s.vx *= boostDamp;
                    s.vy *= boostDamp;
                }

                // Speed cap (slightly higher than before)
                const maxV = (s.hover ? 38 : 52) + (now < s.boostUntil ? 130 : 0);
                const speed = Math.hypot(s.vx, s.vy);
                if (speed > maxV) {
                    const k = maxV / speed;
                    s.vx *= k;
                    s.vy *= k;
                }

                // Integrate position (px)
                s.x += s.vx * dt;
                s.y += s.vy * dt;
            }

            // 2) Collisions (pairwise)
            // Equal-mass circle collisions: push apart + bounce along the collision normal
            for (let i = 0; i < state.length; i++) {
                for (let j = i + 1; j < state.length; j++) {
                    const a = state[i];
                    const b = state[j];

                    const dx = b.x - a.x;
                    const dy = b.y - a.y;

                    const dist = Math.hypot(dx, dy) || 0.0001;
                    const minDist = (a.r + b.r) - sepSlop;

                    if (dist >= minDist) continue;

                    // Normalized collision normal
                    const nx = dx / dist;
                    const ny = dy / dist;

                    // --- Separate (resolve overlap) ---
                    const overlap = minDist - dist;
                    const push = overlap / 2;

                    a.x -= nx * push;
                    a.y -= ny * push;
                    b.x += nx * push;
                    b.y += ny * push;

                    // --- Bounce velocities ---
                    // Relative velocity along normal
                    const rvx = b.vx - a.vx;
                    const rvy = b.vy - a.vy;
                    const relVel = rvx * nx + rvy * ny;

                    // If already separating, skip bounce
                    if (relVel > 0) continue;

                    // Impulse for equal masses: j = -(1+e) * relVel / 2
                    const jImpulse = -(1 + restitution) * relVel / 2;

                    const ix = jImpulse * nx;
                    const iy = jImpulse * ny;

                    a.vx -= ix;
                    a.vy -= iy;
                    b.vx += ix;
                    b.vy += iy;

                    // Small tangential damping to avoid “infinite pinball”
                    const tx = -ny;
                    const ty = nx;
                    const relTan = (rvx * tx + rvy * ty);
                    const friction = 0.02; // tiny
                    a.vx += tx * relTan * friction;
                    a.vy += ty * relTan * friction;
                    b.vx -= tx * relTan * friction;
                    b.vy -= ty * relTan * friction;
                }
            }

            // 3) Keep inside the big bubble boundary (soft)
            const limit = bounds.safeRadius * 1;

            for (const s of state) {
                const dist = Math.hypot(s.x, s.y);
                // include mini bubble radius so it doesn't clip the rim
                const edge = limit - s.r * 0.15;

                if (dist > edge) {
                    const ux = s.x / dist;
                    const uy = s.y / dist;
                    const overshoot = dist - edge;

                    s.x -= ux * overshoot * 0.85;
                    s.y -= uy * overshoot * 0.85;

                    const dot = s.vx * ux + s.vy * uy;
                    if (dot > 0) {
                        s.vx -= dot * ux * 1.05;
                        s.vy -= dot * uy * 1.05;
                    }
                }
            }

            // 4) Apply to DOM (one pass)
            for (const s of state) {
                s.el.style.setProperty("--tx", `${s.x.toFixed(2)}px`);
                s.el.style.setProperty("--ty", `${s.y.toFixed(2)}px`);
            }

            requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    })();

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
        return copyEmailBtn?.dataset?.email || "diehl.malachi990@gmail.com";
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
