const SYSTEM_CONFIG = {
version: "1.3.0",
officiallyApproved: false,
rulesVersion: "1.0",
testMode: false
};

const PUBLIC_PAGES = [
"index.html",
"consent.html",
"login.html",
"maintenance.html",
"verify-email.html",
"reset-password.html"
];

const PAGE_ROLES = {
"admin.html": ["admin"],
"teacher.html": ["teacher", "admin"],
"student.html": ["student", "admin"],
"parent.html": ["parent", "admin"],
"dashboard.html": ["admin", "teacher", "student", "parent"],
"schedule.html": ["admin", "teacher", "student", "parent"],
"homework.html": ["admin", "teacher", "student", "parent"],
"tests.html": ["admin", "teacher", "student", "parent"],
"events.html": ["admin", "teacher", "student", "parent"],
"attendance.html": ["admin", "teacher", "student", "parent"],
"messages.html": ["admin", "teacher", "student", "parent"],
"announcements.html": ["admin", "teacher", "student", "parent"]
};

const ROLE_NAMES = {
admin: "Директор",
teacher: "Вчитель",
student: "Учень",
parent: "Батько / Мати",
pending: "Очікує підтвердження"
};

function getCurrentPage() {
const path = window.location.pathname.split("/");
return path[path.length - 1] || "index.html";
}

function getSupabase() {
if (!window.supabaseClient) {
console.error("Supabase client не знайдений.");
return null;
}

return window.supabaseClient;

}

async function getCurrentUser() {
const supabase = getSupabase();

if (!supabase) return null;

try {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error) {
        console.error("Помилка отримання користувача:", error);
        return null;
    }

    return user || null;
} catch (error) {
    console.error("Помилка auth.getUser:", error);
    return null;
}

}

async function getCurrentProfile() {
const supabase = getSupabase();
const user = await getCurrentUser();

if (!supabase || !user) return null;

try {
    const { data, error } = await supabase
        .from("profiles")
        .select("id,email,full_name,role,created_at,updated_at")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Помилка профілю:", error);
        return null;
    }

    return data || null;
} catch (error) {
    console.error("Помилка завантаження профілю:", error);
    return null;
}

}

function isPublicPage() {
return PUBLIC_PAGES.includes(getCurrentPage());
}

function hasConsent() {
return localStorage.getItem("licei2_consent") === SYSTEM_CONFIG.rulesVersion;
}

function saveConsent() {
localStorage.setItem("licei2_consent", SYSTEM_CONFIG.rulesVersion);
}

function clearConsent() {
localStorage.removeItem("licei2_consent");
}

function checkConsentAccess() {
const page = getCurrentPage();

if (
    page === "consent.html" ||
    page === "verify-email.html" ||
    page === "reset-password.html" ||
    page === "maintenance.html"
) {
    return true;
}

if (!hasConsent()) {
    window.location.replace("consent.html");
    return false;
}

return true;

}

async function checkAuthentication() {
const page = getCurrentPage();

if (
    PUBLIC_PAGES.includes(page) ||
    page === "consent.html" ||
    page === "verify-email.html" ||
    page === "reset-password.html"
) {
    return true;
}

const user = await getCurrentUser();

if (!user) {
    window.location.replace("login.html");
    return false;
}

return true;

}

async function checkRoleAccess() {
const page = getCurrentPage();
const allowedRoles = PAGE_ROLES[page];

if (!allowedRoles) return true;

const profile = await getCurrentProfile();

if (!profile) {
    window.location.replace("login.html");
    return false;
}

const role = profile.role || "pending";

if (role === "pending") {
    showPendingAccess();
    return false;
}

if (!allowedRoles.includes(role)) {
    window.location.replace("dashboard.html");
    return false;
}

return true;

}

function showPendingAccess() {
document.body.innerHTML = "<div style=" min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; background:#07111f; color:#fff; font-family:Arial,sans-serif; "> <div style=" width:min(520px,100%); padding:32px; border-radius:24px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); text-align:center; "> <div style="font-size:52px;margin-bottom:15px;">⏳</div> <h1 style="margin:0 0 12px;">Очікується підтвердження</h1> <p style="opacity:.75;line-height:1.6;"> Ваш акаунт створено, але роль ще не підтверджена адміністрацією ліцею. </p> <button onclick="logout()" style=" margin-top:20px; border:0; border-radius:14px; padding:13px 20px; cursor:pointer; "> Вийти </button> </div> </div>";
}

async function logout() {
const supabase = getSupabase();

try {
    if (supabase) {
        await supabase.auth.signOut({ scope: "global" });
    }
} catch (error) {
    console.error("Помилка виходу:", error);
}

localStorage.removeItem("licei2_user");
window.location.replace("login.html");

}

function getMaintenanceState() {
try {
const raw = localStorage.getItem("licei2_maintenance");

    if (!raw) {
        return {
            enabled: false,
            message: "",
            endTime: null
        };
    }

    const state = JSON.parse(raw);

    if (state.endTime && Date.now() >= Number(state.endTime)) {
        localStorage.removeItem("licei2_maintenance");

        return {
            enabled: false,
            message: "",
            endTime: null
        };
    }

    return {
        enabled: Boolean(state.enabled),
        message: state.message || "",
        endTime: state.endTime || null
    };
} catch {
    return {
        enabled: false,
        message: "",
        endTime: null
    };
}

}

function isMaintenanceEnabled() {
return getMaintenanceState().enabled;
}

function setMaintenanceState(enabled, message = "", endTime = null) {
if (!enabled) {
localStorage.removeItem("licei2_maintenance");
return;
}

localStorage.setItem(
    "licei2_maintenance",
    JSON.stringify({
        enabled: true,
        message,
        endTime
    })
);

}

async function checkMaintenance() {
const page = getCurrentPage();

if (
    page === "maintenance.html" ||
    page === "login.html" ||
    page === "consent.html" ||
    page === "verify-email.html" ||
    page === "reset-password.html"
) {
    return true;
}

const state = getMaintenanceState();

if (!state.enabled) return true;

const profile = await getCurrentProfile();

if (profile && profile.role === "admin") {
    return true;
}

window.location.replace("maintenance.html");
return false;

}

function updateUserElements(user, profile) {
const emailElements = document.querySelectorAll("[data-user-email]");
const nameElements = document.querySelectorAll("[data-user-name]");
const roleElements = document.querySelectorAll("[data-user-role]");

emailElements.forEach(element => {
    element.textContent = user?.email || "Не вказано";
});

nameElements.forEach(element => {
    element.textContent =
        profile?.full_name ||
        user?.email?.split("@")[0] ||
        "Користувач";
});

roleElements.forEach(element => {
    element.textContent =
        ROLE_NAMES[profile?.role] ||
        profile?.role ||
        "Очікує підтвердження";
});

}

function setupLogoutButtons() {
document.querySelectorAll("[data-logout]").forEach(button => {
button.addEventListener("click", event => {
event.preventDefault();
logout();
});
});
}

function setupMobileMenu() {
const toggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-mobile-menu]");

if (!toggle || !menu) return;

toggle.addEventListener("click", () => {
    menu.classList.toggle("open");
    toggle.classList.toggle("active");
});

menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.classList.remove("active");
    });
});

}

function setupAnimations() {
const elements = document.querySelectorAll(
".animate-on-load, .fade-in, .card, .dashboard-card, .module-card"
);

elements.forEach((element, index) => {
    element.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;
});

}

function updateYear() {
document.querySelectorAll("[data-year]").forEach(element => {
element.textContent = new Date().getFullYear();
});
}

function setupSystemStatus() {
document.querySelectorAll("[data-system-status]").forEach(element => {
element.textContent = "Система працює";
element.classList.add("online");
});
}

function setupNavigation() {
document.querySelectorAll("[data-page]").forEach(element => {
const page = element.dataset.page;

    if (!page) return;

    element.addEventListener("click", event => {
        event.preventDefault();
        window.location.href = page;
    });
});

}

function handlePendingLogin(profile) {
if (!profile) return false;

if (profile.role === "pending") {
    showPendingAccess();
    return true;
}

return false;

}

function setupAuthListener() {
const supabase = getSupabase();

if (!supabase) return;

supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
        localStorage.removeItem("licei2_user");

        if (!PUBLIC_PAGES.includes(getCurrentPage())) {
            window.location.replace("login.html");
        }
    }

    if (event === "SIGNED_IN" && session?.user) {
        localStorage.setItem(
            "licei2_user",
            JSON.stringify({
                id: session.user.id,
                email: session.user.email
            })
        );
    }
});

}

async function initializeUserInterface() {
const user = await getCurrentUser();

if (!user) return;

const profile = await getCurrentProfile();

updateUserElements(user, profile);

const role = profile?.role;

document.querySelectorAll("[data-role-only]").forEach(element => {
    const allowed = element.dataset.roleOnly
        .split(",")
        .map(value => value.trim());

    element.style.display = allowed.includes(role) ? "" : "none";
});

document.querySelectorAll("[data-role-link]").forEach(element => {
    const allowed = element.dataset.roleLink
        .split(",")
        .map(value => value.trim());

    if (!allowed.includes(role)) {
        element.remove();
    }
});

}

async function initializeApp() {
if (!window.supabaseClient) {
console.warn("Supabase ще не готовий. Очікуємо...");
}

setupMobileMenu();
setupLogoutButtons();
setupAnimations();
setupNavigation();
updateYear();
setupSystemStatus();

if (!checkConsentAccess()) return;

if (!(await checkMaintenance())) return;

if (!(await checkAuthentication())) return;

if (!(await checkRoleAccess())) return;

await initializeUserInterface();

setupAuthListener();

document.documentElement.dataset.appReady = "true";

window.dispatchEvent(
    new CustomEvent("licei2:ready", {
        detail: {
            version: SYSTEM_CONFIG.version,
            page: getCurrentPage()
        }
    })
);

}

if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", initializeApp);
} else {
initializeApp();
}

window.Licei2 = {
SYSTEM_CONFIG,
PUBLIC_PAGES,
PAGE_ROLES,
ROLE_NAMES,
getCurrentPage,
getSupabase,
getCurrentUser,
getCurrentProfile,
logout,
getMaintenanceState,
isMaintenanceEnabled,
setMaintenanceState,
saveConsent,
clearConsent
};

window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.getCurrentProfile = getCurrentProfile;
window.getSupabase = getSupabase;
window.setMaintenanceState = setMaintenanceState;
window.getMaintenanceState = getMaintenanceState;
window.isMaintenanceEnabled = isMaintenanceEnabled;