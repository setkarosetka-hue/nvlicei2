const SYSTEM_CONFIG = {
    version: "1.0.0",
    officiallyApproved: false,
    rulesVersion: "1.0",
    testMode: false
};

const CONSENT_STORAGE_KEY = "lyceum2_consent";
const MAINTENANCE_STORAGE_KEY = "lyceum2_maintenance";

const PUBLIC_PAGES = [
    "",
    "index.html",
    "consent.html",
    "login.html",
    "maintenance.html"
];

const PAGE_ROLES = {
    "admin.html": ["admin"],
    "teacher.html": ["teacher", "admin"],
    "student.html": ["student", "admin"],
    "parent.html": ["parent", "admin"]
};


function getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf("/") + 1) || "index.html";
}


async function getCurrentUser() {
    if (
        typeof supabaseClient === "undefined" ||
        !supabaseClient ||
        !supabaseClient.auth
    ) {
        return null;
    }

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    return user || null;
}


async function getCurrentProfile() {
    const user = await getCurrentUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error("Profile error:", error);
        return null;
    }

    return data;
}


async function isLoggedIn() {
    const user = await getCurrentUser();
    return !!user;
}


function getConsent() {
    try {
        return JSON.parse(
            localStorage.getItem(CONSENT_STORAGE_KEY)
        );
    } catch {
        return null;
    }
}


function hasValidConsent() {
    const consent = getConsent();

    return (
        consent &&
        consent.version === SYSTEM_CONFIG.rulesVersion &&
        consent.accepted === true
    );
}


function saveConsent(type = "all") {
    localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify({
            accepted: true,
            type: type,
            version: SYSTEM_CONFIG.rulesVersion,
            acceptedAt: new Date().toISOString()
        })
    );
}


function redirectTo(page) {
    window.location.href = page;
}


async function logout() {
    try {
        if (
            typeof supabaseClient !== "undefined" &&
            supabaseClient?.auth
        ) {
            await supabaseClient.auth.signOut();
        }
    } catch (error) {
        console.error("Logout error:", error);
    }

    localStorage.removeItem("lyceum2_user");

    window.location.href = "login.html";
}


function getMaintenanceState() {
    try {
        return JSON.parse(
            localStorage.getItem(MAINTENANCE_STORAGE_KEY)
        );
    } catch {
        return null;
    }
}


function isMaintenanceEnabled() {
    const maintenance = getMaintenanceState();

    return !!(
        maintenance &&
        maintenance.enabled === true
    );
}


function setMaintenanceState(enabled, reason = "", endTime = "") {
    localStorage.setItem(
        MAINTENANCE_STORAGE_KEY,
        JSON.stringify({
            enabled: enabled,
            reason: reason,
            endTime: endTime,
            updatedAt: new Date().toISOString()
        })
    );
}


async function checkMaintenance() {
    if (!isMaintenanceEnabled()) {
        return false;
    }

    const page = getCurrentPage();

    if (page === "maintenance.html") {
        return true;
    }

    const profile = await getCurrentProfile();

    if (profile?.role === "admin") {
        return false;
    }

    if (!PUBLIC_PAGES.includes(page)) {
        window.location.href = "maintenance.html";
        return true;
    }

    return true;
}


async function checkAuthentication() {
    const page = getCurrentPage();

    if (PUBLIC_PAGES.includes(page)) {
        return true;
    }

    const loggedIn = await isLoggedIn();

    if (!loggedIn) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}


async function checkRoleAccess() {
    const page = getCurrentPage();

    if (!PAGE_ROLES[page]) {
        return true;
    }

    const profile = await getCurrentProfile();

    if (!profile) {
        window.location.href = "login.html";
        return false;
    }

    const allowedRoles = PAGE_ROLES[page];

    if (!allowedRoles.includes(profile.role)) {
        const rolePages = {
            admin: "admin.html",
            teacher: "teacher.html",
            student: "student.html",
            parent: "parent.html"
        };

        const destination =
            rolePages[profile.role] || "dashboard.html";

        window.location.href = destination;

        return false;
    }

    return true;
}


function toggleMenu() {
    const nav = document.querySelector(".main-nav");

    if (!nav) {
        return;
    }

    nav.classList.toggle("active");
}


function setupMobileMenu() {
    const menuButton = document.querySelector(
        ".menu-toggle"
    );

    if (menuButton) {
        menuButton.addEventListener(
            "click",
            toggleMenu
        );
    }
}


function setupScrollAnimations() {
    const elements = document.querySelectorAll(
        ".card, .feature-card, .stat-card, .section"
    );

    if (!("IntersectionObserver" in window)) {
        elements.forEach(element => {
            element.classList.add("visible");
        });

        return;
    }

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1
        }
    );

    elements.forEach(element => {
        observer.observe(element);
    });
}


function updateYear() {
    document
        .querySelectorAll("[data-year], #currentYear")
        .forEach(element => {
            element.textContent =
                new Date().getFullYear();
        });
}


function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("uk-UA", {
        dateStyle: "short",
        timeStyle: "short"
    });
}


function getRoleName(role) {
    const roles = {
        admin: "Адміністратор",
        teacher: "Вчитель",
        student: "Учень",
        parent: "Батько / мати"
    };

    return roles[role] || "Користувач";
}


async function updateUserElements() {
    const profile = await getCurrentProfile();

    document
        .querySelectorAll("[data-user-name]")
        .forEach(element => {
            element.textContent =
                profile?.full_name ||
                profile?.email ||
                "Користувач";
        });

    document
        .querySelectorAll("[data-user-email]")
        .forEach(element => {
            element.textContent =
                profile?.email || "";
        });

    document
        .querySelectorAll("[data-user-role]")
        .forEach(element => {
            element.textContent =
                getRoleName(profile?.role);
        });
}


function setupLogoutButtons() {
    document
        .querySelectorAll("[data-logout], .logout-button")
        .forEach(button => {
            button.addEventListener(
                "click",
                async event => {
                    event.preventDefault();
                    await logout();
                }
            );
        });
}


function setupConsentButtons() {
    const allButton =
        document.getElementById("acceptAllRules");

    const requiredButton =
        document.getElementById("acceptRequiredRules");

    const customButton =
        document.getElementById("acceptCustomRules");

    if (allButton) {
        allButton.addEventListener("click", () => {
            saveConsent("all");
            window.location.href = "login.html";
        });
    }

    if (requiredButton) {
        requiredButton.addEventListener("click", () => {
            saveConsent("required");
            window.location.href = "login.html";
        });
    }

    if (customButton) {
        customButton.addEventListener("click", () => {
            saveConsent("custom");
            window.location.href = "login.html";
        });
    }
}


function updateSystemStatus() {
    const elements =
        document.querySelectorAll("[data-system-status]");

    elements.forEach(element => {

        if (SYSTEM_CONFIG.officiallyApproved) {
            element.textContent =
                "Офіційно підтверджено";
        } else {
            element.textContent =
                "У розробці";
        }

    });
}


async function initializeApp() {

    setupMobileMenu();
    setupScrollAnimations();
    updateYear();
    setupLogoutButtons();
    setupConsentButtons();
    updateSystemStatus();

    const page = getCurrentPage();

    if (page !== "login.html") {
        await checkMaintenance();
    }

    const authenticated =
        await checkAuthentication();

    if (!authenticated) {
        return;
    }

    const roleAccess =
        await checkRoleAccess();

    if (!roleAccess) {
        return;
    }

    await updateUserElements();
}


document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);