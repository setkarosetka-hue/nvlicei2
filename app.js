const SYSTEM_CONFIG = {
  version: "1.3.1",
  officiallyApproved: false,
  rulesVersion: "1.0",
  testMode: false
};

const CONSENT_STORAGE_KEY = "licei2_consent";
const MAINTENANCE_STORAGE_KEY = "licei2_maintenance";
const PUBLIC_PAGES = ["", "index.html", "consent.html", "login.html", "maintenance.html", "verify-email.html", "reset-password.html"];
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
const ROLE_NAMES = { admin: "Директор", teacher: "Вчитель", student: "Учень", parent: "Батьки", pending: "Очікує підтвердження" };

function getCurrentPage() {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 1] || "index.html";
}

function getSupabase() {
  return window.supabaseClient || null;
}

async function getCurrentUser() {
  const client = getSupabase();
  if (!client?.auth) return null;
  try {
    const { data, error } = await client.auth.getUser();
    if (error) { console.error("Помилка Supabase Auth:", error); return null; }
    return data?.user || null;
  } catch (error) {
    console.error("Помилка auth.getUser():", error);
    return null;
  }
}

async function getCurrentProfile() {
  const client = getSupabase();
  const user = await getCurrentUser();
  if (!client || !user) return null;
  try {
    const { data, error } = await client
      .from("profiles")
      .select("id, email, full_name, role, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle();
    if (error) { console.error("Помилка profiles:", error); return null; }
    return data || null;
  } catch (error) {
    console.error("Помилка завантаження профілю:", error);
    return null;
  }
}

async function getAuthenticatedProfile() {
  const user = await getCurrentUser();
  if (!user) return { user: null, profile: null };
  return { user, profile: await getCurrentProfile() };
}

function getRoleName(role) { return ROLE_NAMES[role] || "Користувач"; }
function isPublicPage() { return PUBLIC_PAGES.includes(getCurrentPage()); }

function getConsent() {
  try { return JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)); }
  catch { return null; }
}
function hasConsent() {
  const value = getConsent();
  return value?.accepted === true && value.version === SYSTEM_CONFIG.rulesVersion;
}
function saveConsent(type = "all") {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ accepted: true, type, version: SYSTEM_CONFIG.rulesVersion, acceptedAt: new Date().toISOString() }));
}
function clearConsent() { localStorage.removeItem(CONSENT_STORAGE_KEY); }

function showPendingAccess() {
  document.body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#071a33;color:#fff;font-family:Manrope,Arial,sans-serif">
      <section style="width:min(520px,100%);padding:32px;border:1px solid rgba(255,255,255,.14);border-radius:24px;background:rgba(255,255,255,.08);text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.22)">
        <div style="font-size:42px;margin-bottom:16px">⌛</div>
        <h1 style="margin:0 0 12px">Очікує підтвердження</h1>
        <p style="color:rgba(255,255,255,.72);line-height:1.6">Ваш профіль створено, але роль ще не підтверджена адміністрацією ліцею.</p>
        <button type="button" style="margin-top:22px;padding:12px 18px;border:0;border-radius:12px;background:#2868ff;color:#fff;font-weight:800;cursor:pointer" onclick="logout()">Вийти</button>
      </section>
    </main>`;
}

async function checkConsentAccess() {
  const page = getCurrentPage();
  if (["consent.html", "verify-email.html", "reset-password.html", "maintenance.html"].includes(page)) return true;
  if (!hasConsent()) { window.location.replace("consent.html"); return false; }
  return true;
}

async function checkAuthentication() {
  const page = getCurrentPage();
  if (PUBLIC_PAGES.includes(page) || ["consent.html", "verify-email.html", "reset-password.html"].includes(page)) return true;
  if (!(await getCurrentUser())) { window.location.replace("login.html"); return false; }
  return true;
}

async function checkRoleAccess() {
  const page = getCurrentPage();
  const allowedRoles = PAGE_ROLES[page];
  if (!allowedRoles) return true;

  const { profile } = await getAuthenticatedProfile();
  const role = profile?.role || "pending";

  if (role === "pending") { showPendingAccess(); return false; }
  if (!allowedRoles.includes(role)) {
    const destinations = { admin: "admin.html", teacher: "teacher.html", student: "student.html", parent: "parent.html" };
    window.location.replace(destinations[role] || "dashboard.html");
    return false;
  }
  return true;
}

async function logout() {
  try { await getSupabase()?.auth?.signOut({ scope: "global" }); }
  catch (error) { console.error("Помилка виходу:", error); }
  localStorage.removeItem("licei2_user");
  window.location.replace("login.html");
}

function getMaintenanceState() {
  try {
    const state = JSON.parse(localStorage.getItem(MAINTENANCE_STORAGE_KEY));
    if (state?.endTime && Date.now() >= Number(state.endTime)) { localStorage.removeItem(MAINTENANCE_STORAGE_KEY); return { enabled: false }; }
    return state || { enabled: false };
  } catch { return { enabled: false }; }
}
function isMaintenanceEnabled() { return Boolean(getMaintenanceState().enabled); }
function setMaintenanceState(enabled, message = "", endTime = null) {
  if (!enabled) { localStorage.removeItem(MAINTENANCE_STORAGE_KEY); return; }
  localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify({ enabled: true, message, endTime }));
}
async function checkMaintenance() {
  const page = getCurrentPage();
  if (["maintenance.html", "login.html", "consent.html", "verify-email.html", "reset-password.html"].includes(page)) return true;
  if (!isMaintenanceEnabled()) return true;
  const profile = await getCurrentProfile();
  if (profile?.role === "admin") return true;
  window.location.replace("maintenance.html");
  return false;
}

function toggleMenu() {
  document.querySelectorAll(".main-nav, .navigation").forEach(menu => menu.classList.toggle("active"));
}
function setupMobileMenu() {
  document.querySelectorAll(".mobile-menu, .mobile-menu-btn, [data-menu-toggle]").forEach(button => button.addEventListener("click", toggleMenu));
}
function setupLogoutButtons() {
  document.querySelectorAll("[data-logout], .logout-button, #logoutButton, #logoutBtn").forEach(button => button.addEventListener("click", event => { event.preventDefault(); logout(); }));
}
function setupConsentButtons() {
  [["acceptAllRules", "all"], ["acceptRequiredRules", "required"], ["acceptCustomRules", "custom"]].forEach(([id, type]) => {
    const button = document.getElementById(id);
    if (button) button.addEventListener("click", () => { saveConsent(type); window.location.href = "login.html"; });
  });
}
function updateUserElements(user, profile) {
  document.querySelectorAll("[data-user-email]").forEach(element => element.textContent = user?.email || profile?.email || "Не вказано");
  document.querySelectorAll("[data-user-name]").forEach(element => element.textContent = profile?.full_name || user?.email?.split("@")[0] || "Користувач");
  document.querySelectorAll("[data-user-role]").forEach(element => element.textContent = getRoleName(profile?.role));
}
function updateRoleLinks(role) {
  document.querySelectorAll("[data-role-only], [data-role-link]").forEach(element => {
    const value = element.dataset.roleOnly || element.dataset.roleLink || "";
    const allowed = value.split(",").map(item => item.trim());
    if (!allowed.includes(role)) element.remove();
  });
}
function updateYear() { document.querySelectorAll("[data-year], #currentYear").forEach(element => element.textContent = new Date().getFullYear()); }
function setupSystemStatus() { document.querySelectorAll("[data-system-status]").forEach(element => { element.textContent = SYSTEM_CONFIG.officiallyApproved ? "Офіційно підтверджено" : "У розробці"; }); }
function setupAnimations() { document.querySelectorAll(".animate-on-load, .fade-in, .card, .dashboard-card, .module-card").forEach((element, index) => element.style.animationDelay = `${Math.min(index * .05, .5)}s`); }

async function initializeUserInterface() {
  const { user, profile } = await getAuthenticatedProfile();
  if (!user || !profile) return;
  updateUserElements(user, profile);
  updateRoleLinks(profile.role || "pending");
}

async function initializeApp() {
  setupMobileMenu(); setupLogoutButtons(); setupConsentButtons(); updateYear(); setupSystemStatus(); setupAnimations();
  if (!(await checkConsentAccess())) return;
  if (!(await checkMaintenance())) return;
  if (!(await checkAuthentication())) return;
  if (!(await checkRoleAccess())) return;
  await initializeUserInterface();
  window.dispatchEvent(new CustomEvent("licei2:ready", { detail: { page: getCurrentPage(), version: SYSTEM_CONFIG.version } }));
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializeApp);
else initializeApp();

window.Licei2 = { SYSTEM_CONFIG, PAGE_ROLES, ROLE_NAMES, getCurrentPage, getSupabase, getCurrentUser, getCurrentProfile, getAuthenticatedProfile, logout, setMaintenanceState, getMaintenanceState, saveConsent, clearConsent };
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.getCurrentProfile = getCurrentProfile;
