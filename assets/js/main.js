(() => {
    const q = (selector) => document.querySelector(selector);
    const qa = (selector) => Array.from(document.querySelectorAll(selector));
    const storage = {
        get(key, fallback = null) {
            try {
                const value = window.localStorage.getItem(key);
                return value ?? fallback;
            } catch {
                return fallback;
            }
        },
        set(key, value) {
            try {
                window.localStorage.setItem(key, value);
            } catch {
                // Ignore storage failures and keep the UI usable.
            }
        }
    };

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isReducedMotion = () => prefersReducedMotion.matches;
    const formatDateTime = new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
    const formatClock = new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit"
    });

    const flashButtonLabel = (button, label, duration = 1800) => {
        if (!button) return;
        const originalLabel = button.dataset.originalLabel || button.textContent || "";
        button.dataset.originalLabel = originalLabel;
        button.textContent = label;
        window.clearTimeout(button.flashTimeoutId ? Number(button.flashTimeoutId) : 0);
        const timeoutId = window.setTimeout(() => {
            button.textContent = originalLabel;
        }, duration);
        button.flashTimeoutId = String(timeoutId);
    };

    const copyText = async (text) => {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            return false;
        }

        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            return false;
        }
    };

    const buildJsonSnippet = (value) => {
        return `    ${JSON.stringify(value)},`;
    };

    const yearEl = q("#year");
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    const menuToggle = q(".menu-toggle");
    const nav = q(".site-nav");
    const topNavLinks = nav ? qa(".site-nav a") : [];
    const mobileDockLinks = qa(".mobile-dock a");
    const navLinks = [...topNavLinks, ...mobileDockLinks];
    const sections = qa("main section[id]");

    if (menuToggle && nav) {
        const setMenuOpen = (open) => {
            nav.classList.toggle("open", open);
            document.body.classList.toggle("nav-open", open);
            menuToggle.setAttribute("aria-expanded", String(open));
            menuToggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
        };

        menuToggle.addEventListener("click", () => {
            setMenuOpen(!nav.classList.contains("open"));
        });

        topNavLinks.forEach((link) => {
            link.addEventListener("click", () => setMenuOpen(false));
        });

        document.addEventListener("click", (event) => {
            const target = event.target;
            if (!(target instanceof Node) || window.innerWidth > 900 || !nav.classList.contains("open")) return;
            if (nav.contains(target) || menuToggle.contains(target)) return;
            setMenuOpen(false);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        });
    }

    const progressBar = q("#scroll-progress");
    const updateScrollProgress = () => {
        if (!progressBar) return;
        const scrollTop = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const percent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
        progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    };

    const counter = q("#love-counter");
    if (counter) {
        const startDate = counter.getAttribute("data-start-date");
        const daysEl = q("#days");
        const noteEl = q("#countdown-note");
        const nextAnniversaryEl = q("#next-anniversary");
        const streakEl = q("#streak-count");

        const formatMilestone = (months) => {
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;

            if (years <= 0) return `${months} tháng`;
            if (remainingMonths === 0) return `${years} năm`;
            return `${years} năm ${remainingMonths} tháng`;
        };

        if (startDate && daysEl) {
            const start = new Date(`${startDate}T00:00:00`);
            const now = new Date();
            const diffMs = now.getTime() - start.getTime();
            const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
            const weeks = Math.floor(days / 7);
            daysEl.textContent = String(days);

            if (noteEl) {
                noteEl.textContent = days > 0
                    ? `Mình đã đi cùng nhau ${days} ngày và anh vẫn muốn thương em nhiều thêm nữa.`
                    : "Mỗi ngày có em đều là một điều thật đẹp.";
            }

            if (streakEl) {
                streakEl.textContent = `${weeks} tuần`;
            }

            if (nextAnniversaryEl) {
                const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const nextMonthly = new Date(start.getFullYear(), start.getMonth(), start.getDate());

                while (nextMonthly <= nowDateOnly) {
                    nextMonthly.setMonth(nextMonthly.getMonth() + 1);
                }

                const monthsToNext =
                    (nextMonthly.getFullYear() - start.getFullYear()) * 12 +
                    (nextMonthly.getMonth() - start.getMonth());
                const daysUntilNext = Math.max(
                    0,
                    Math.ceil((nextMonthly.getTime() - nowDateOnly.getTime()) / (1000 * 60 * 60 * 24))
                );

                nextAnniversaryEl.textContent =
                    `${nextMonthly.toLocaleDateString("vi-VN")} · Còn ${daysUntilNext} ngày tới mốc ${formatMilestone(Math.max(1, monthsToNext))}`;
            }
        }
    }

    const themeToggle = q("#theme-toggle");
    const themeKey = "nhatdo-theme-mode";
    const applyTheme = (mode) => {
        const isNight = mode === "night";
        document.body.classList.toggle("night-mode", isNight);
        if (themeColorMeta) {
            themeColorMeta.setAttribute("content", isNight ? "#1e1628" : "#e84f86");
        }
        if (themeToggle) {
            themeToggle.textContent = isNight ? "Chuyển sang ban ngày" : "Bật chế độ đêm";
            themeToggle.setAttribute("aria-pressed", String(isNight));
        }
    };

    const storedTheme = storage.get(themeKey);
    const initialTheme = storedTheme || "day";
    applyTheme(initialTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            const currentMode = document.body.classList.contains("night-mode") ? "night" : "day";
            const nextMode = currentMode === "night" ? "day" : "night";
            applyTheme(nextMode);
            storage.set(themeKey, nextMode);
        });
    }

    const greetingEl = q("#greeting-chip");
    const liveClockEl = q("#live-clock");
    const visitCountEl = q("#visit-count");
    const visitCountKey = "nhatdo-visit-count";

    const updateGreetingAndClock = () => {
        const now = new Date();
        const hour = now.getHours();
        let greeting = "Chúc em một ngày dịu dàng";

        if (hour < 11) greeting = "Chào buổi sáng, người anh thương";
        else if (hour < 14) greeting = "Chúc em buổi trưa thật yên";
        else if (hour < 18) greeting = "Chiều nay nhớ cười thật xinh";
        else if (hour < 22) greeting = "Tối rồi, để anh thương thêm";
        else greeting = "Khuya rồi, ngủ ngoan em nhé";

        if (greetingEl) greetingEl.textContent = greeting;
        if (liveClockEl) liveClockEl.textContent = formatClock.format(now);
    };

    const currentVisits = Number(storage.get(visitCountKey, "0")) || 0;
    const nextVisitCount = currentVisits + 1;
    storage.set(visitCountKey, String(nextVisitCount));
    if (visitCountEl) {
        visitCountEl.textContent = `${nextVisitCount} lần`;
    }
    updateGreetingAndClock();
    window.setInterval(updateGreetingAndClock, 30000);

    const networkStatusEl = q("#network-status");
    const updateNetworkStatus = () => {
        if (!networkStatusEl) return;
        const isOnline = navigator.onLine;
        networkStatusEl.textContent = isOnline ? "Đang online" : "Tạm offline";
        networkStatusEl.classList.toggle("status-online", isOnline);
        networkStatusEl.classList.toggle("status-offline", !isOnline);
    };
    updateNetworkStatus();
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    const heartLayer = q("#heart-layer");
    const heartBurstBtn = q("#heart-burst-btn");
    const spawnHeartBurst = (count = 24) => {
        if (!heartLayer) return;
        const total = isReducedMotion() ? Math.min(10, Math.max(4, Math.floor(count / 3))) : count;
        const bottom = window.innerHeight - 28;

        for (let i = 0; i < total; i += 1) {
            const heart = document.createElement("span");
            heart.className = "heart-particle";
            heart.style.left = `${Math.random() * 100}%`;
            heart.style.top = `${bottom - Math.random() * 80}px`;
            heart.style.setProperty("--x", `${(Math.random() - 0.5) * 260}px`);
            heart.style.setProperty("--dur", `${1100 + Math.random() * 700}ms`);
            heartLayer.appendChild(heart);
            heart.addEventListener("animationend", () => heart.remove(), { once: true });
        }
    };

    if (heartBurstBtn) {
        heartBurstBtn.addEventListener("click", () => spawnHeartBurst(28));
    }

    const giftModal = q("#gift-modal");
    const openGiftBtn = q("#open-gift");
    const closeGiftBtn = q("#close-gift");
    const galleryModal = q("#gallery-modal");
    const syncBodyLock = () => {
        const isGiftOpen = !!giftModal?.classList.contains("open");
        const isGalleryOpen = !!galleryModal?.classList.contains("open");
        document.body.classList.toggle("no-scroll", isGiftOpen || isGalleryOpen);
    };

    const setGiftModal = (open) => {
        if (!giftModal) return;
        giftModal.classList.toggle("open", open);
        giftModal.setAttribute("aria-hidden", String(!open));
        syncBodyLock();
    };

    if (openGiftBtn) {
        openGiftBtn.addEventListener("click", () => {
            setGiftModal(true);
            spawnHeartBurst(18);
        });
    }

    if (closeGiftBtn) {
        closeGiftBtn.addEventListener("click", () => setGiftModal(false));
    }

    if (giftModal) {
        giftModal.addEventListener("click", (event) => {
            if (event.target === giftModal) {
                setGiftModal(false);
            }
        });
    }

    const journeyRange = q("#journey-range");
    const journeyTitle = q("#journey-title");
    const journeyDesc = q("#journey-desc");
    const journeyDate = q("#journey-date");
    const journeyData = [
        {
            title: "Lần đầu mình nói chuyện thật lâu",
            desc: "Một buổi tối rất bình thường, nhưng lại mở đầu cho một điều rất đặc biệt.",
            date: "Mốc 1 / 6"
        },
        {
            title: "Lần đầu anh nhận ra mình nhớ em",
            desc: "Chỉ vài giờ không thấy tin nhắn em, anh đã thấy thiếu thiếu cả ngày.",
            date: "Mốc 2 / 6"
        },
        {
            title: "Lần hẹn hò đầu tiên",
            desc: "Không cần nơi quá đẹp, chỉ cần đi cạnh em là đủ thành kỷ niệm.",
            date: "Mốc 3 / 6"
        },
        {
            title: "Khoảnh khắc em cười thật tươi",
            desc: "Anh ước có thể giữ lại nụ cười đó mãi trong mỗi ngày của mình.",
            date: "Mốc 4 / 6"
        },
        {
            title: "Khi mình cùng nhau vượt qua hiểu lầm",
            desc: "Yêu không phải không cãi nhau, mà là vẫn chọn ở lại và hiểu nhau hơn.",
            date: "Mốc 5 / 6"
        },
        {
            title: "Hôm nay và mai sau",
            desc: "Anh vẫn muốn nắm tay em đi thật lâu, qua tất cả điều bình thường của cuộc sống.",
            date: "Mốc 6 / 6"
        }
    ];

    const updateJourney = () => {
        if (!journeyRange || !journeyTitle || !journeyDesc || !journeyDate) return;
        const index = Math.max(0, Math.min(journeyData.length - 1, Number(journeyRange.value) - 1));
        const item = journeyData[index];
        journeyTitle.textContent = item.title;
        journeyDesc.textContent = item.desc;
        journeyDate.textContent = item.date;
    };

    if (journeyRange) {
        journeyRange.addEventListener("input", updateJourney);
        updateJourney();
    }

    const moodStorageKey = "nhatdo-mood-mode";
    const moodButtons = qa(".mood-chip");
    const moodResult = q("#mood-result");
    const moodBadge = q("#mood-badge");
    const moodTitle = q("#mood-title");
    const moodDesc = q("#mood-desc");
    const moodTip = q("#mood-tip");
    const moodData = {
        sweet: {
            label: "Vibe dịu dàng",
            title: "Một ngày thật nhẹ nhàng",
            desc: "Nếu hôm nay muốn bình yên, trang này sẽ dịu lại như một lá thư nhỏ và nhắc rằng mình vẫn đang có nhau.",
            tip: "Gợi ý nhỏ: thử bấm \"Thả tim\" rồi kéo xuống album để mở từng kỷ niệm lớn hơn.",
            color: "#e84f86"
        },
        dreamy: {
            label: "Vibe mơ mộng",
            title: "Một chút thơ, một chút mộng",
            desc: "Có những ngày chỉ muốn nghĩ về tương lai thật đẹp, nơi hai đứa đi qua nhiều thành phố và vẫn nắm tay nhau.",
            tip: "Gợi ý nhỏ: checklist bên cạnh hợp nhất cho những kế hoạch mình muốn thực hiện cùng nhau.",
            color: "#7f6dff"
        },
        playful: {
            label: "Vibe tinh nghịch",
            title: "Ngày vui thì nên đáng yêu hơn",
            desc: "Hôm nay có thể hơi nghịch một chút, thêm chút màu, thêm chút tim bay, thêm vài câu trêu em cho cả ngày bớt nhạt.",
            tip: "Gợi ý nhỏ: bấm đổi câu ngọt ngào vài lần để xem web trả lời em kiểu khác nhau.",
            color: "#ff9f55"
        },
        missing: {
            label: "Vibe nhớ em",
            title: "Nhớ một người là khi điều gì cũng dẫn về người đó",
            desc: "Những ngày bận rộn nhất đôi khi lại là lúc anh nhớ em nhiều nhất, chỉ muốn mở một góc nhỏ có tên em để thấy gần hơn.",
            tip: "Gợi ý nhỏ: lưu một lời nhắn mới trong sổ lưu bút để mai đọc lại vẫn thấy ấm.",
            color: "#5d8cf8"
        }
    };

    const applyMood = (moodKey) => {
        const mood = moodData[moodKey] || moodData.sweet;
        moodButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.mood === moodKey);
        });

        if (moodBadge) moodBadge.textContent = mood.label;
        if (moodTitle) moodTitle.textContent = mood.title;
        if (moodDesc) moodDesc.textContent = mood.desc;
        if (moodTip) moodTip.textContent = mood.tip;
        if (moodResult) moodResult.style.setProperty("--mood-accent", mood.color);

        storage.set(moodStorageKey, moodKey);
    };

    if (moodButtons.length) {
        const storedMood = storage.get(moodStorageKey, "sweet");
        applyMood(storedMood || "sweet");
        moodButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const moodKey = button.dataset.mood || "sweet";
                applyMood(moodKey);
            });
        });
    }

    const dreamStorageKey = "nhatdo-dream-list";
    const dreamItems = qa(".dream-item");
    const dreamProgressEl = q("#dream-progress");
    let dreamState = new Set();

    try {
        const storedDreams = JSON.parse(storage.get(dreamStorageKey, "[]") || "[]");
        if (Array.isArray(storedDreams)) {
            dreamState = new Set(storedDreams);
        }
    } catch {
        dreamState = new Set();
    }

    const renderDreams = () => {
        dreamItems.forEach((item) => {
            const key = item.dataset.key;
            const button = item.querySelector(".dream-toggle strong");
            const isDone = !!key && dreamState.has(key);
            item.classList.toggle("done", isDone);
            if (button) {
                button.textContent = isDone ? "Đã đánh dấu" : "Chạm để đánh dấu";
            }
        });

        if (dreamProgressEl) {
            dreamProgressEl.textContent = `${dreamState.size}/${dreamItems.length} hoàn thành`;
        }
    };

    dreamItems.forEach((item) => {
        const key = item.dataset.key;
        const toggle = item.querySelector(".dream-toggle");
        if (!key || !toggle) return;

        toggle.addEventListener("click", () => {
            if (dreamState.has(key)) {
                dreamState.delete(key);
            } else {
                dreamState.add(key);
                spawnHeartBurst(10);
            }

            storage.set(dreamStorageKey, JSON.stringify(Array.from(dreamState)));
            renderDreams();
        });
    });
    renderDreams();

    const quoteText = q("#love-quote-text");
    const newQuoteBtn = q("#new-quote");
    const quotes = [
        "Yêu em là quyết định nhẹ nhàng nhất mà anh từng làm trong đời.",
        "Giữa rất nhiều điều tốt đẹp, em vẫn là điều đẹp nhất với anh.",
        "Anh không cần một ngày hoàn hảo, anh chỉ cần một ngày có em.",
        "Mỗi ngày trôi qua, anh lại thấy thương em nhiều thêm một chút.",
        "Nếu phải chọn lại, anh vẫn sẽ chọn yêu em từ lần đầu tiên."
    ];

    let currentQuote = 0;
    const setQuote = (index) => {
        if (!quoteText) return;
        quoteText.textContent = quotes[index];
        currentQuote = index;
    };

    if (newQuoteBtn) {
        newQuoteBtn.addEventListener("click", () => {
            let next = Math.floor(Math.random() * quotes.length);
            if (next === currentQuote) {
                next = (next + 1) % quotes.length;
            }
            setQuote(next);
        });
    }

    const toggleLetterBtn = q("#toggle-letter");
    const letterEl = q("#love-letter");
    const fullLetter = letterEl ? letterEl.dataset.fullText || "" : "";
    let hasTypedLetter = false;

    const typeLetter = (text) => {
        if (!letterEl) return;
        if (isReducedMotion()) {
            letterEl.textContent = text;
            return;
        }

        let index = 0;
        const chars = Array.from(text);
        letterEl.textContent = "";
        const timer = window.setInterval(() => {
            if (index >= chars.length) {
                window.clearInterval(timer);
                return;
            }
            letterEl.textContent += chars[index];
            index += 1;
        }, 22);
    };

    if (toggleLetterBtn && letterEl) {
        toggleLetterBtn.addEventListener("click", () => {
            const isHidden = letterEl.classList.contains("is-hidden");
            if (isHidden) {
                letterEl.classList.remove("is-hidden");
                if (!hasTypedLetter) {
                    typeLetter(fullLetter);
                    hasTypedLetter = true;
                }
                toggleLetterBtn.textContent = "Đóng lá thư";
            } else {
                letterEl.classList.add("is-hidden");
                toggleLetterBtn.textContent = "Mở lá thư";
            }
        });
    }

    const revealItems = qa(".reveal");
    if (revealItems.length) {
        if (isReducedMotion()) {
            revealItems.forEach((item) => item.classList.add("visible"));
        } else {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("visible");
                        }
                    });
                },
                { threshold: 0.16 }
            );
            revealItems.forEach((item) => observer.observe(item));
        }
    }

    const setActiveNav = () => {
        const offset = 140;
        let activeId = "home";

        sections.forEach((section) => {
            const top = section.offsetTop - offset;
            if (window.scrollY >= top) {
                activeId = section.dataset.navGroup || section.id;
            }
        });

        navLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${activeId}`;
            link.classList.toggle("active", isActive);
            if (isActive) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    };

    const runScrollLinkedUpdates = () => {
        updateScrollProgress();
        setActiveNav();
    };

    let scrollRaf = 0;
    const scheduleScrollUpdates = () => {
        if (scrollRaf) return;
        scrollRaf = window.requestAnimationFrame(() => {
            scrollRaf = 0;
            runScrollLinkedUpdates();
        });
    };

    runScrollLinkedUpdates();
    window.addEventListener("scroll", scheduleScrollUpdates, { passive: true });
    window.addEventListener("resize", () => {
        if (window.innerWidth > 900 && nav) {
            nav.classList.remove("open");
            document.body.classList.remove("nav-open");
            if (menuToggle) {
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.setAttribute("aria-label", "Mở menu");
            }
        }
        runScrollLinkedUpdates();
    });

    const galleryItems = qa(".gallery-item");
    const galleryPhoto = q("#gallery-photo");
    const galleryTitle = q("#gallery-title");
    const galleryDetail = q("#gallery-detail");
    const closeGalleryBtn = q("#close-gallery");
    const galleryPrevBtn = q("#gallery-prev");
    const galleryNextBtn = q("#gallery-next");
    let activeGalleryIndex = 0;

    const openGallery = (index) => {
        if (!galleryModal || !galleryPhoto || !galleryTitle || !galleryDetail || !galleryItems.length) return;
        activeGalleryIndex = (index + galleryItems.length) % galleryItems.length;
        const item = galleryItems[activeGalleryIndex];
        const photoClass = item.dataset.photoClass || "photo-1";
        const caption = item.dataset.caption || "";
        const detail = item.dataset.detail || "";

        galleryPhoto.className = `lightbox-photo photo ${photoClass}`;
        galleryTitle.textContent = caption;
        galleryDetail.textContent = detail;
        galleryModal.classList.add("open");
        galleryModal.setAttribute("aria-hidden", "false");
        syncBodyLock();
    };

    const closeGallery = () => {
        if (!galleryModal) return;
        galleryModal.classList.remove("open");
        galleryModal.setAttribute("aria-hidden", "true");
        syncBodyLock();
    };

    const changeGallery = (direction) => {
        openGallery(activeGalleryIndex + direction);
    };

    galleryItems.forEach((item, index) => {
        item.addEventListener("click", () => openGallery(index));
        item.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openGallery(index);
            }
        });
    });

    if (closeGalleryBtn) {
        closeGalleryBtn.addEventListener("click", closeGallery);
    }

    if (galleryPrevBtn) {
        galleryPrevBtn.addEventListener("click", () => changeGallery(-1));
    }

    if (galleryNextBtn) {
        galleryNextBtn.addEventListener("click", () => changeGallery(1));
    }

    if (galleryModal) {
        galleryModal.addEventListener("click", (event) => {
            if (event.target === galleryModal) {
                closeGallery();
            }
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setGiftModal(false);
            closeGallery();
            return;
        }

        if (!galleryModal?.classList.contains("open")) return;
        if (event.key === "ArrowLeft") changeGallery(-1);
        if (event.key === "ArrowRight") changeGallery(1);
    });

    const shareLoveBtn = q("#share-love");
    if (shareLoveBtn) {
        shareLoveBtn.addEventListener("click", async () => {
            const url = window.location.href;
            const text = quoteText?.textContent || "Một góc nhỏ dành riêng cho người thương.";

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: document.title,
                        text,
                        url
                    });
                    flashButtonLabel(shareLoveBtn, "Đã mở chia sẻ");
                    return;
                } catch (error) {
                    if (error instanceof Error && error.name === "AbortError") {
                        return;
                    }
                }
            }

            const copied = await copyText(`${text} ${url}`);
            flashButtonLabel(shareLoveBtn, copied ? "Đã sao chép link" : "Không thể sao chép");
        });
    }

    const installAppBtn = q("#install-app");
    let deferredInstallPrompt = null;

    if (installAppBtn) {
        installAppBtn.addEventListener("click", async () => {
            if (!deferredInstallPrompt) return;
            deferredInstallPrompt.prompt();
            try {
                await deferredInstallPrompt.userChoice;
            } catch {
                // Ignore canceled installs.
            }
            deferredInstallPrompt = null;
            installAppBtn.classList.add("is-control-hidden");
        });
    }

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        installAppBtn?.classList.remove("is-control-hidden");
    });

    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        installAppBtn?.classList.add("is-control-hidden");
    });

    if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
        const swVersion = "20260405";
        const swClientVersionKey = "nhatdo-sw-client-version";
        let hasRefreshedForNewWorker = false;

        const activateWaitingWorker = (registration) => {
            registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        };

        const resetStaleWorkerAndCache = async () => {
            const previousVersion = storage.get(swClientVersionKey, "");
            if (previousVersion === swVersion) return;

            try {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map((registration) => registration.unregister()));

                if ("caches" in window) {
                    const cacheKeys = await caches.keys();
                    await Promise.all(
                        cacheKeys
                            .filter((key) => key.startsWith("nhatdo-love-"))
                            .map((key) => caches.delete(key))
                    );
                }
            } catch {
                // Ignore cleanup failures and continue with fresh registration.
            }

            storage.set(swClientVersionKey, swVersion);
        };

        const registerWorker = () => navigator.serviceWorker
            .register(`service-worker.js?v=${swVersion}`, { updateViaCache: "none" })
            .then((registration) => {
                registration.update();
                activateWaitingWorker(registration);

                registration.addEventListener("updatefound", () => {
                    const installing = registration.installing;
                    if (!installing) return;
                    installing.addEventListener("statechange", () => {
                        if (installing.state === "installed") {
                            activateWaitingWorker(registration);
                        }
                    });
                });
            });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (hasRefreshedForNewWorker) return;
            hasRefreshedForNewWorker = true;
            window.location.reload();
        });

        resetStaleWorkerAndCache()
            .then(() => registerWorker())
            .catch(() => {
                // Keep the site working even if the service worker cannot register.
            });
    }

    const form = q("#guestbook-form");
    const messageInput = q("#message");
    const notesList = q("#notes-list");
    const formStatus = q("#form-status");
    const reloadNotesBtn = q("#reload-notes");
    const copyNoteLineBtn = q("#copy-note-line");
    const notesCountEl = q("#notes-count");
    const noteFilterButtons = qa(".filter-chip");
    const notesFilePath = "assets/data/notes.json";
    const localNotesKey = "nhatdo-local-notes";
    const isFileProtocol = window.location.protocol === "file:";
    let currentNotesFilter = "all";
    let fileNotes = [];
    let localNotes = [];

    const readLocalNotes = () => {
        try {
            const parsed = JSON.parse(storage.get(localNotesKey, "[]") || "[]");
            if (!Array.isArray(parsed)) return [];
            return parsed
                .filter((item) => item && typeof item.text === "string")
                .map((item) => ({
                    id: typeof item.id === "string" ? item.id : String(Date.now()),
                    text: item.text.trim(),
                    createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString()
                }))
                .filter((item) => item.text);
        } catch {
            return [];
        }
    };

    const persistLocalNotes = () => {
        storage.set(localNotesKey, JSON.stringify(localNotes));
    };

    const renderEmptyNotes = (message) => {
        if (!notesList) return;
        notesList.innerHTML = "";
        const empty = document.createElement("li");
        empty.className = "note-card";
        empty.textContent = message;
        notesList.appendChild(empty);
    };

    const getMergedNotes = () => {
        const localItems = localNotes.map((note) => ({
            ...note,
            source: "local"
        }));
        const fileItems = fileNotes.map((note, index) => ({
            id: `file-${index}`,
            text: note,
            createdAt: "",
            source: "file"
        }));
        return [...localItems, ...fileItems];
    };

    const renderNotes = () => {
        if (!notesList) return;
        const mergedNotes = getMergedNotes();
        const filteredNotes = mergedNotes.filter((note) => currentNotesFilter === "all" || note.source === currentNotesFilter);

        if (notesCountEl) {
            notesCountEl.textContent = currentNotesFilter === "all"
                ? `${mergedNotes.length} lời nhắn`
                : `${filteredNotes.length}/${mergedNotes.length} lời nhắn`;
        }

        if (!filteredNotes.length) {
            const emptyMessage = currentNotesFilter === "local"
                ? "Chưa có lời nhắn nào lưu trên máy này."
                : currentNotesFilter === "file"
                    ? "Chưa đọc được lời nhắn nào từ file."
                    : "Chưa có lời nhắn nào. Hãy lưu một lời nhắn mới nhé.";
            renderEmptyNotes(emptyMessage);
            return;
        }

        notesList.innerHTML = "";
        filteredNotes.forEach((note) => {
            const li = document.createElement("li");
            li.className = `note-card ${note.source}`;

            const meta = document.createElement("div");
            meta.className = "note-meta";

            const source = document.createElement("span");
            source.className = "note-source";
            source.textContent = note.source === "local" ? "Trên máy này" : "Từ file";
            meta.appendChild(source);

            if (note.createdAt) {
                const time = document.createElement("span");
                time.className = "note-time";
                time.textContent = formatDateTime.format(new Date(note.createdAt));
                meta.appendChild(time);
            }

            const text = document.createElement("p");
            text.textContent = note.text;

            li.appendChild(meta);
            li.appendChild(text);
            notesList.appendChild(li);
        });
    };

    const setNotesFilter = (filter) => {
        currentNotesFilter = filter;
        noteFilterButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.filter === filter);
        });
        renderNotes();
    };

    const loadNotesFromFile = async () => {
        if (isFileProtocol) {
            return { ok: false, notes: [] };
        }

        try {
            const response = await fetch(notesFilePath, { cache: "no-store" });
            if (!response.ok) {
                return { ok: false, notes: [] };
            }

            const data = await response.json();
            return {
                ok: true,
                notes: Array.isArray(data.notes) ? data.notes.filter((note) => typeof note === "string") : []
            };
        } catch {
            return { ok: false, notes: [] };
        }
    };

    const refreshNotes = async (announce = true) => {
        const result = await loadNotesFromFile();
        fileNotes = result.notes;
        renderNotes();

        if (formStatus && announce) {
            formStatus.textContent = result.ok
                ? "Đã tải lại danh sách từ assets/data/notes.json."
                : "Không đọc được notes.json lúc này, nhưng note lưu trên trình duyệt vẫn hoạt động bình thường.";
        }
    };

    localNotes = readLocalNotes();
    renderNotes();
    if (isFileProtocol && formStatus) {
        formStatus.textContent = "Bạn đang mở trang trực tiếp từ file nên notes.json có thể không đọc được. Phần lưu note trên trình duyệt vẫn hoạt động bình thường.";
    }
    refreshNotes(false);

    noteFilterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.filter || "all";
            setNotesFilter(filter);
        });
    });

    if (reloadNotesBtn) {
        reloadNotesBtn.addEventListener("click", () => {
            refreshNotes();
        });
    }

    if (copyNoteLineBtn && messageInput) {
        copyNoteLineBtn.addEventListener("click", async () => {
            const value = messageInput.value.trim();
            if (!value) {
                if (formStatus) {
                    formStatus.textContent = "Hãy nhập một lời nhắn trước khi sao chép dòng JSON.";
                }
                return;
            }

            const snippet = buildJsonSnippet(value);
            const copied = await copyText(snippet);
            if (formStatus) {
                formStatus.textContent = copied
                    ? `Đã sao chép dòng JSON: ${snippet}`
                    : `Không thể sao chép tự động. Bạn có thể thêm dòng này vào notes.json: ${snippet}`;
            }
        });
    }

    if (form && messageInput) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const value = messageInput.value.trim();

            if (!value) {
                if (formStatus) {
                    formStatus.textContent = "Hãy nhập một lời nhắn trước khi lưu.";
                }
                return;
            }

            localNotes.unshift({
                id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                text: value,
                createdAt: new Date().toISOString()
            });
            persistLocalNotes();
            setNotesFilter("all");
            renderNotes();
            messageInput.value = "";
            spawnHeartBurst(12);

            if (formStatus) {
                formStatus.textContent = "Đã lưu lời nhắn trên trình duyệt này. Bạn vẫn có thể bấm \"Sao chép JSON\" nếu muốn chép sang file.";
            }
        });
    }
})();
