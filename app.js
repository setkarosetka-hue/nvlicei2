const SYSTEM_CONFIG = {
version: '1.1.0',
officiallyApproved: false,
rulesVersion: '1.0',
testMode: false
};

const CONSENT_STORAGE_KEY = 'lyceum2_consent';
const MAINTENANCE_STORAGE_KEY = 'lyceum2_maintenance';

const PUBLIC_PAGES = [
'',
'index.html',
'consent.html',
'login.html',
'maintenance.html',
'verify-email.html',
'reset-password.html'
];

const PAGE_ROLES = {
'admin.html': ['admin'],
'teacher.html': ['teacher', 'admin'],
'student.html': ['student', 'admin'],
'parent.html': ['parent', 'admin'],
'messages.html': ['admin', 'teacher', 'student', 'parent'],
'announcements.html': ['admin', 'teacher', 'student', 'parent'],
'schedule.html': ['admin', 'teacher', 'student', 'parent'],
'homework.html': ['admin', 'teacher', 'student', 'parent'],
'tests.html': ['admin', 'teacher', 'student', 'parent'],
'events.html': ['admin', 'teacher', 'student', 'parent'],
'attendance.html': ['admin', 'teacher', 'student', 'parent']
};

const ROLE_NAMES = {
admin: 'Адміністратор',
teacher: 'Вчитель',
student: 'Учень',
parent: 'Батьки',
teacher_pending: 'Вчитель — очікує підтвердження',
student_pending: 'Учень — очікує підтвердження',
parent_pending: 'Батьки — очікує підтвердження',
pending: 'Очікує підтвердження'
};

function getCurrentPage() {
const path = location.pathname;
return path.substring(path.lastIndexOf('/') + 1) || 'index.html';
}

async function getCurrentUser() {
if (typeof supabaseClient === 'undefined' || !supabaseClient?.auth) {
return null;
}

try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error('Auth error:', error);
        return null;
    }

    return data?.user || null;
} catch (error) {
    console.error('Auth error:', error);
    return null;
}

}

async function getCurrentProfile() {
const user = await getCurrentUser();

if (!user || typeof supabaseClient === 'undefined') {
    return null;
}

try {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Profile error:', error);
        return null;
    }

    return data;
} catch (error) {
    console.error('Profile error:', error);
    return null;
}

}

async function isLoggedIn() {
return !!(await getCurrentUser());
}

function getRoleName(role) {
return ROLE_NAMES[role] || 'Користувач';
}

function isPendingRole(role) {
return [
'pending',
'teacher_pending',
'student_pending',
'parent_pending'
].includes(role);
}

function getRequestedRole(role) {
if (role === 'teacher_pending') return 'teacher';
if (role === 'student_pending') return 'student';
if (role === 'parent_pending') return 'parent';

return null;

}

function getRequestedRoleName(role) {
const requestedRole = getRequestedRole(role);

return {
    teacher: 'Вчитель',
    student: 'Учень',
    parent: 'Батьки'
}[requestedRole] || 'роль';

}

function getRoleHome(role) {
const pages = {
admin: 'admin.html',
teacher: 'teacher.html',
student: 'student.html',
parent: 'parent.html'
};

return pages[role] || 'login.html';

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

return !!(
    consent?.accepted &&
    consent.version === SYSTEM_CONFIG.rulesVersion
);

}

function saveConsent(type = 'all') {
localStorage.setItem(
CONSENT_STORAGE_KEY,
JSON.stringify({
accepted: true,
type,
version: SYSTEM_CONFIG.rulesVersion,
acceptedAt: new Date().toISOString()
})
);
}

async function logout() {
try {
if (
typeof supabaseClient !== 'undefined' &&
supabaseClient?.auth
) {
await supabaseClient.auth.signOut();
}
} catch (error) {
console.error('Logout error:', error);
}

localStorage.removeItem('lyceum2_user');

location.href = 'login.html';

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
return !!getMaintenanceState()?.enabled;
}

function setMaintenanceState(
enabled,
reason = '',
endTime = ''
) {
localStorage.setItem(
MAINTENANCE_STORAGE_KEY,
JSON.stringify({
enabled,
reason,
endTime,
updatedAt: new Date().toISOString()
})
);
}

async function checkMaintenance() {
if (!isMaintenanceEnabled()) {
return false;
}

const page = getCurrentPage();

if (page === 'maintenance.html') {
    return true;
}

if (PUBLIC_PAGES.includes(page)) {
    return false;
}

const profile = await getCurrentProfile();

if (profile?.role === 'admin') {
    return false;
}

location.href = 'maintenance.html';

return true;

}

async function checkAuthentication() {
const page = getCurrentPage();

if (PUBLIC_PAGES.includes(page)) {
    return true;
}

const loggedIn = await isLoggedIn();

if (!loggedIn) {
    location.href = 'login.html';
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
    location.href = 'login.html';
    return false;
}

const role = profile.role;

if (isPendingRole(role)) {
    location.href = 'login.html';
    return false;
}

const allowedRoles = PAGE_ROLES[page];

if (!allowedRoles.includes(role)) {
    location.href = getRoleHome(role);
    return false;
}

return true;

}

function toggleMenu() {
document
.querySelectorAll('.navigation, .main-nav')
.forEach(nav => {
nav.classList.toggle('mobile-open');
});
}

function setupMobileMenu() {
document
.querySelectorAll('.mobile-menu, .mobile-menu-btn')
.forEach(button => {
button.addEventListener('click', toggleMenu);
});
}

function updateYear() {
document
.querySelectorAll('[data-year], #currentYear')
.forEach(element => {
element.textContent = new Date().getFullYear();
});
}

function setupLogoutButtons() {
document
.querySelectorAll(
'[data-logout], .logout-button, #logoutButton, #logoutBtn'
)
.forEach(button => {
button.addEventListener('click', event => {
event.preventDefault();
logout();
});
});
}

function setupScrollAnimations() {
document
.querySelectorAll(
'.feature-card, .stat-card, .card, .card-panel, .section'
)
.forEach(element => {
element.classList.add('visible');
});
}

function updateSystemStatus() {
document
.querySelectorAll('[data-system-status]')
.forEach(element => {
element.textContent =
SYSTEM_CONFIG.officiallyApproved
? 'Офіційно підтверджено'
: 'У розробці';
});
}

function setupConsentButtons() {
const buttons = [
['acceptAllRules', 'all'],
['acceptRequiredRules', 'required'],
['acceptCustomRules', 'custom']
];

buttons.forEach(([id, type]) => {
    const button = document.getElementById(id);

    if (!button) return;

    button.addEventListener('click', () => {
        saveConsent(type);
        location.href = 'login.html';
    });
});

}

async function updateUserElements() {
const profile = await getCurrentProfile();

document
    .querySelectorAll('[data-user-name]')
    .forEach(element => {
        element.textContent =
            profile?.full_name ||
            profile?.email ||
            'Користувач';
    });

document
    .querySelectorAll('[data-user-email]')
    .forEach(element => {
        element.textContent =
            profile?.email || '';
    });

document
    .querySelectorAll('[data-user-role]')
    .forEach(element => {
        element.textContent =
            getRoleName(profile?.role);
    });

document
    .querySelectorAll('[data-user-requested-role]')
    .forEach(element => {
        element.textContent =
            getRequestedRoleName(profile?.role);
    });

}

function showPendingMessage() {
const container =
document.querySelector('[data-pending-user]');

if (!container) return;

container.hidden = false;

}

async function handlePendingUser() {
const page = getCurrentPage();

if (page !== 'login.html') {
    return false;
}

const user = await getCurrentUser();

if (!user) {
    return false;
}

const profile = await getCurrentProfile();

if (!profile) {
    return false;
}

if (isPendingRole(profile.role)) {
    showPendingMessage();

    document
        .querySelectorAll('[data-pending-role]')
        .forEach(element => {
            element.textContent =
                getRequestedRoleName(profile.role);
        });

    document
        .querySelectorAll('[data-pending-email]')
        .forEach(element => {
            element.textContent =
                profile.email || user.email || '';
        });

    return true;
}

return false;

}

async function initializeApp() {
setupMobileMenu();
setupLogoutButtons();
setupConsentButtons();
updateYear();
updateSystemStatus();
setupScrollAnimations();

const page = getCurrentPage();

if (page === 'login.html') {
    await handlePendingUser();
    await updateUserElements();
    return;
}

if (page !== 'login.html') {
    const maintenanceBlocked =
        await checkMaintenance();

    if (maintenanceBlocked) {
        return;
    }
}

const authenticated =
    await checkAuthentication();

if (!authenticated) {
    return;
}

const roleAllowed =
    await checkRoleAccess();

if (!roleAllowed) {
    return;
}

await updateUserElements();

}

document.addEventListener(
'DOMContentLoaded',
initializeApp
);