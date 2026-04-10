(() => {
    const AUTH_STORAGE_KEY = "nhatdo-access-token";
    const AUTH_STORAGE_VALUE = "granted-20260410b";
    // Lightweight client-side gate for static hosting.
    // Add or edit accounts here using normal text.
    const LIGHTWEIGHT_CREDENTIALS = [
        { username: "lethiyennhi", password: "10082006" }
    ];

    const normalizeUsername = (value) => value.trim().toLowerCase();

    const isAuthenticated = () => {
        try {
            return (
                window.sessionStorage.getItem(AUTH_STORAGE_KEY) === AUTH_STORAGE_VALUE ||
                window.localStorage.getItem(AUTH_STORAGE_KEY) === AUTH_STORAGE_VALUE
            );
        } catch {
            return false;
        }
    };

    const persistAccess = (rememberOnDevice) => {
        try {
            window.sessionStorage.setItem(AUTH_STORAGE_KEY, AUTH_STORAGE_VALUE);
            if (rememberOnDevice) {
                window.localStorage.setItem(AUTH_STORAGE_KEY, AUTH_STORAGE_VALUE);
            } else {
                window.localStorage.removeItem(AUTH_STORAGE_KEY);
            }
        } catch {
            // Keep the gate usable even if storage is unavailable.
        }
    };

    const clearAccess = () => {
        try {
            window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
            window.localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {
            // Ignore storage cleanup failures.
        }
    };

    const redirectTo = (path) => {
        window.location.replace(path);
    };

    const verifyCredentials = async (username, password) => {
        const normalizedUsername = normalizeUsername(username);
        const normalizedPassword = password;
        if (!normalizedUsername || !normalizedPassword) return false;

        return LIGHTWEIGHT_CREDENTIALS.some((credential) =>
            normalizeUsername(credential.username) === normalizedUsername &&
            credential.password === normalizedPassword
        );
    };

    const listCredentials = () => LIGHTWEIGHT_CREDENTIALS.map((credential) => ({
        username: credential.username,
        password: credential.password
    }));

    const setStatus = (statusEl, message, tone = "") => {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.classList.remove("is-error", "is-success");
        if (tone) {
            statusEl.classList.add(tone);
        }
    };

    const mountSignInForm = ({
        formSelector = "#signin-form",
        usernameSelector = "#signin-username",
        passwordSelector = "#signin-password",
        rememberSelector = "#signin-remember",
        statusSelector = "#signin-status",
        submitSelector = "#signin-submit",
        successPath = "index.html"
    } = {}) => {
        const form = document.querySelector(formSelector);
        const usernameInput = document.querySelector(usernameSelector);
        const passwordInput = document.querySelector(passwordSelector);
        const rememberInput = document.querySelector(rememberSelector);
        const statusEl = document.querySelector(statusSelector);
        const submitButton = document.querySelector(submitSelector);

        if (!form || !usernameInput || !passwordInput) return;

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const username = usernameInput.value;
            const password = passwordInput.value;
            if (!username.trim() || !password) {
                setStatus(statusEl, "Nhập đủ tài khoản và mật khẩu để mở trang nhé.", "is-error");
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Đang kiểm tra...";
            }

            setStatus(statusEl, "Đang xác minh quyền truy cập...");

            try {
                const isValid = await verifyCredentials(username, password);
                if (!isValid) {
                    setStatus(statusEl, "Tài khoản hoặc mật khẩu chưa đúng, thử lại nhé.", "is-error");
                    passwordInput.value = "";
                    passwordInput.focus();
                    return;
                }

                persistAccess(Boolean(rememberInput?.checked));
                if (!isAuthenticated()) {
                    setStatus(statusEl, "Trình duyệt đang chặn lưu phiên đăng nhập, nên chưa thể mở khóa ổn định.", "is-error");
                    return;
                }
                setStatus(statusEl, "Mở khóa thành công, đang đưa bạn vào trang chính...", "is-success");
                window.setTimeout(() => redirectTo(successPath), 320);
            } catch {
                setStatus(statusEl, "Trình duyệt này chưa hỗ trợ lớp khóa này. Hãy thử bằng trình duyệt mới hơn.", "is-error");
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "Mở khóa trang";
                }
            }
        });
    };

    const bindSignOut = ({
        triggerSelector = "[data-sign-out]",
        redirectPath = "signin.html"
    } = {}) => {
        document.querySelectorAll(triggerSelector).forEach((trigger) => {
            trigger.addEventListener("click", () => {
                clearAccess();
                redirectTo(redirectPath);
            });
        });
    };

    window.NhatDoAuth = {
        clearAccess,
        isAuthenticated,
        mountSignInForm,
        persistAccess,
        listCredentials,
        bindSignOut,
        requireAccess(signInPath = "signin.html") {
            if (!isAuthenticated()) {
                redirectTo(signInPath);
            }
        },
        redirectIfAuthenticated(successPath = "index.html") {
            if (isAuthenticated()) {
                redirectTo(successPath);
            }
        }
    };
})();
