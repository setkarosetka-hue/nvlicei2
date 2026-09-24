const SYSTEM_CONFIG = {
version: '1.2.0',
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

'messages.html': [
    'admin',
    'teacher',
    'student',
    'parent'
],

'announcements.html': [
    'admin',
    'teacher',
    'student',
    'parent'
],

'schedule.html': [
    'admin',
    'teacher',
    'student',
    'parent'
],

'homework.html': [
    'admin',
    'teacher',
    'student',
    'parent'
],

'tests.html': [
    'admin',
    'teacher',
    'student',
    'parent'
],

'events.html': [
    'admin',
    'teacher',
    'student',
    'parent'
],

'attendance.html': [
    'admin',
    'teacher',
    'student',
    'parent'
]

};

const ROLE_NAMES = {
admin: 'Адміністратор',
teacher: 'Вчитель',
student: 'Учень',
parent: 'Батьки',

teacher_pending: 'Вчитель — очікує підтвердження',
student_pending: 'Учень — очікує підтвердження',
parent_pending: 'Батьки — очікують підтвердження',

pending: 'Очікує підтвердження'

};

function getCurrentPage() {

const path = window.location.pathname;

return (
    path.substring(
        path.lastIndexOf('/') + 1
    ) || 'index.html'
);

}

/* =========================
AUTH
========================= */

async function getCurrentUser() {

if (
    typeof supabaseClient === 'undefined' ||
    !supabaseClient?.auth
) {
    return null;
}

try {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        console.error(
            'Auth error:',
            error
        );

        return null;
    }

    return data?.user || null;

} catch (error) {

    console.error(
        'Auth error:',
        error
    );

    return null;
}

}

async function getCurrentProfile() {

const user = await getCurrentUser();

if (
    !user ||
    typeof supabaseClient === 'undefined'
) {
    return null;
}

try {

    /*
     * Не запрашиваем profiles.email.
     * Email берём напрямую из Supabase Auth.
     */

    const {
        data,
        error
    } = await supabaseClient
        .from('profiles')
        .select('id,full_name,role,created_at,updated_at')
        .eq('id', user.id)
        .maybeSingle();

    if (error) {

        console.error(
            'Profile error:',
            error
        );

        return null;
    }

    return data || null;

} catch (error) {

    console.error(
        'Profile error:',
        error
    );

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

if (role === 'teacher_pending') {
    return 'teacher';
}

if (role === 'student_pending') {
    return 'student';
}

if (role === 'parent_pending') {
    return 'parent';
}

return null;

}

function getRequestedRoleName(role) {

const requestedRole =
    getRequestedRole(role);

const names = {
    teacher: 'Вчитель',
    student: 'Учень',
    parent: 'Батьки'
};

return names[requestedRole] || 'роль';

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

/* =========================
CONSENT
========================= */

function getConsent() {

try {

    return JSON.parse(
        localStorage.getItem(
            CONSENT_STORAGE_KEY
        )
    );

} catch {

    return null;
}

}

function hasValidConsent() {

const consent = getConsent();

return !!(
    consent?.accepted &&
    consent.version ===
        SYSTEM_CONFIG.rulesVersion
);

}

function saveConsent(type = 'all') {

localStorage.setItem(
    CONSENT_STORAGE_KEY,
    JSON.stringify({
        accepted: true,
        type,
        version:
            SYSTEM_CONFIG.rulesVersion,
        acceptedAt:
            new Date().toISOString()
    })
);

}

function clearConsent() {
localStorage.removeItem(
CONSENT_STORAGE_KEY
);
}

function setupConsentButtons() {

const button =
    document.getElementById(
        'acceptAllRules'
    );

if (!button) {
    return;
}

button.addEventListener(
    'click',
    () => {

        saveConsent('all');

        window.location.href =
            'login.html';
    }
);

}

/*

* Перше відкриття сайту:
* якщо правила ще не прийняті,
* користувача відправляємо на consent.html.
  */

function checkConsentAccess() {

const page =
    getCurrentPage();

if (page === 'consent.html') {
    return true;
}

if (
    page === 'verify-email.html' ||
    page === 'reset-password.html' ||
    page === 'maintenance.html'
) {
    return true;
}

if (!hasValidConsent()) {

    window.location.href =
        'consent.html';

    return false;
}

return true;

}

/* =========================
LOGOUT
========================= */

async function logout() {

try {

    if (
        typeof supabaseClient !==
            'undefined' &&
        supabaseClient?.auth
    ) {

        /*
         * Global logout.
         * Це завершує активну сесію
         * Supabase, а не тільки локальний стан.
         */

        const {
            error
        } =
            await supabaseClient.auth.signOut({
                scope: 'global'
            });

        if (error) {
            console.error(
                'Logout error:',
                error
            );
        }
    }

} catch (error) {

    console.error(
        'Logout error:',
        error
    );

} finally {

    localStorage.removeItem(
        'lyceum2_user'
    );

    /*
     * Замість звичайного переходу
     * використовуємо replace,
     * щоб сторінка адмінки не залишалась
     * доступною через просте повернення назад.
     */

    window.location.replace(
        'login.html'
    );
}

}

function setupLogoutButtons() {

document
    .querySelectorAll(
        '[data-logout], .logout-button, #logoutButton, #logoutBtn'
    )
    .forEach(button => {

        button.addEventListener(
            'click',
            event => {

                event.preventDefault();

                logout();
            }
        );

    });

}

/* =========================
MAINTENANCE
========================= */

function getMaintenanceState() {

try {

    return JSON.parse(
        localStorage.getItem(
            MAINTENANCE_STORAGE_KEY
        )
    );

} catch {

    return null;
}

}

function isMaintenanceEnabled() {

return !!(
    getMaintenanceState()?.enabled
);

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
        updatedAt:
            new Date().toISOString()
    })
);

}

async function checkMaintenance() {

const state =
    getMaintenanceState();

if (!state?.enabled) {
    return false;
}

/*
 * Якщо час завершення вже настав,
 * автоматично вимикаємо режим.
 */

if (state.endTime) {

    const end =
        new Date(state.endTime);

    if (
        !Number.isNaN(end.getTime()) &&
        end.getTime() <= Date.now()
    ) {

        setMaintenanceState(
            false,
            '',
            ''
        );

        return false;
    }
}

const page =
    getCurrentPage();

if (
    page === 'maintenance.html'
) {
    return true;
}

/*
 * Сторінки правил, входу,
 * підтвердження пошти та відновлення
 * не блокуються самим maintenance.
 */

if (
    page === 'consent.html' ||
    page === 'login.html' ||
    page === 'verify-email.html' ||
    page === 'reset-password.html'
) {
    return false;
}

/*
 * Адміністратор залишається в системі.
 */

const profile =
    await getCurrentProfile();

if (profile?.role === 'admin') {
    return false;
}

window.location.href =
    'maintenance.html';

return true;

}

/* =========================
AUTHENTICATION GUARD
========================= */

async function checkAuthentication() {

const page =
    getCurrentPage();

if (
    PUBLIC_PAGES.includes(page)
) {
    return true;
}

const loggedIn =
    await isLoggedIn();

if (!loggedIn) {

    window.location.replace(
        'login.html'
    );

    return false;
}

return true;

}

/* =========================
ROLE GUARD
========================= */

async function checkRoleAccess() {

const page =
    getCurrentPage();

if (!PAGE_ROLES[page]) {
    return true;
}

const profile =
    await getCurrentProfile();

if (!profile) {

    /*
     * Auth існує, але профілю немає.
     * Не показуємо помилку сторінки —
     * повертаємо користувача на вхід.
     */

    window.location.replace(
        'login.html'
    );

    return false;
}

const role =
    profile.role;

if (isPendingRole(role)) {

    window.location.replace(
        'login.html'
    );

    return false;
}

const allowedRoles =
    PAGE_ROLES[page];

if (
    !allowedRoles.includes(role)
) {

    window.location.replace(
        getRoleHome(role)
    );

    return false;
}

return true;

}

/* =========================
MOBILE MENU
========================= */

function toggleMenu() {

document
    .querySelectorAll(
        '.navigation, .main-nav'
    )
    .forEach(nav => {

        nav.classList.toggle(
            'mobile-open'
        );

    });

}

function setupMobileMenu() {

document
    .querySelectorAll(
        '.mobile-menu, .mobile-menu-btn'
    )
    .forEach(button => {

        button.addEventListener(
            'click',
            toggleMenu
        );

    });

}

/* =========================
COMMON UI
========================= */

function updateYear() {

document
    .querySelectorAll(
        '[data-year], #currentYear'
    )
    .forEach(element => {

        element.textContent =
            new Date().getFullYear();

    });

}

function setupScrollAnimations() {

document
    .querySelectorAll(
        '.feature-card, .stat-card, .card, .card-panel, .section, .admin-card'
    )
    .forEach(element => {

        element.classList.add(
            'visible'
        );

    });

}

function updateSystemStatus() {

document
    .querySelectorAll(
        '[data-system-status]'
    )
    .forEach(element => {

        element.textContent =
            SYSTEM_CONFIG.officiallyApproved
                ? 'Офіційно підтверджено'
                : 'У розробці';

    });

}

/* =========================
USER DATA
========================= */

async function updateUserElements() {

const user =
    await getCurrentUser();

const profile =
    await getCurrentProfile();

document
    .querySelectorAll(
        '[data-user-name]'
    )
    .forEach(element => {

        element.textContent =
            profile?.full_name ||
            user?.user_metadata?.full_name ||
            user?.email ||
            'Користувач';

    });

document
    .querySelectorAll(
        '[data-user-email]'
    )
    .forEach(element => {

        /*
         * Email беремо з Auth,
         * а не з profiles.email.
         */

        element.textContent =
            user?.email || '';

    });

document
    .querySelectorAll(
        '[data-user-role]'
    )
    .forEach(element => {

        element.textContent =
            getRoleName(
                profile?.role
            );

    });

document
    .querySelectorAll(
        '[data-user-requested-role]'
    )
    .forEach(element => {

        element.textContent =
            getRequestedRoleName(
                profile?.role
            );

    });

}

/* =========================
PENDING USER
========================= */

function showPendingMessage() {

const container =
    document.querySelector(
        '[data-pending-user]'
    );

if (!container) {
    return;
}

container.hidden = false;

}

async function handlePendingUser() {

const page =
    getCurrentPage();

if (
    page !== 'login.html'
) {
    return false;
}

const user =
    await getCurrentUser();

if (!user) {
    return false;
}

const profile =
    await getCurrentProfile();

if (!profile) {
    return false;
}

if (
    isPendingRole(
        profile.role
    )
) {

    showPendingMessage();

    document
        .querySelectorAll(
            '[data-pending-role]'
        )
        .forEach(element => {

            element.textContent =
                getRequestedRoleName(
                    profile.role
                );

        });

    document
        .querySelectorAll(
            '[data-pending-email]'
        )
        .forEach(element => {

            element.textContent =
                user.email || '';

        });

    return true;
}

return false;

}

/* =========================
AUTH STATE LISTENER
========================= */

function setupAuthStateListener() {

if (
    typeof supabaseClient ===
        'undefined' ||
    !supabaseClient?.auth
) {
    return;
}

supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        /*
         * Якщо користувача реально
         * вивело із системи —
         * захищені сторінки не повинні
         * залишатися відкритими.
         */

        if (
            event === 'SIGNED_OUT' &&
            getCurrentPage() !==
                'login.html'
        ) {

            window.location.replace(
                'login.html'
            );
        }
    }
);

}

/* =========================
INITIALIZATION
========================= */

async function initializeApp() {

setupMobileMenu();
setupLogoutButtons();
setupConsentButtons();

updateYear();
updateSystemStatus();
setupScrollAnimations();

setupAuthStateListener();

const page =
    getCurrentPage();

/*
 * Сторінка правил завжди
 * доступна для прийняття правил.
 */

if (
    page === 'consent.html'
) {
    return;
}

/*
 * Перше відкриття сайту:
 * автоматично показуємо правила.
 */

const consentAllowed =
    checkConsentAccess();

if (!consentAllowed) {
    return;
}

/*
 * Технічні роботи перевіряємо
 * до звичайної авторизації.
 */

const maintenanceBlocked =
    await checkMaintenance();

if (maintenanceBlocked) {
    return;
}

/*
 * На login.html окремо
 * обробляємо очікування підтвердження.
 */

if (
    page === 'login.html'
) {

    await handlePendingUser();
    await updateUserElements();

    return;
}

/*
 * Захищені сторінки.
 */

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

/*

* Не запускаємо код до завантаження DOM.
  */

if (
document.readyState ===
'loading'
) {

document.addEventListener(
    'DOMContentLoaded',
    initializeApp
);

} else {

initializeApp();

}