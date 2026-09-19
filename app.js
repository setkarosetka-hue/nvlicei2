"use strict";

/* =========================================================
   ЛІЦЕЙ №2 — ОСНОВНОЙ JAVASCRIPT
   Версия: 0.2.0
   ========================================================= */


/* =========================================================
   1. НАСТРОЙКИ СИСТЕМЫ
   ========================================================= */

const SYSTEM_CONFIG = {
    version: "0.2.0",
    officiallyApproved: false,
    rulesVersion: "1.0",

    // Пока работает локальный тестовый режим.
    // Позже это будет перенесено в Supabase.
    testMode: true
};


/* =========================================================
   2. СТРАНИЦЫ И РОЛИ
   ========================================================= */

const PAGE_ROLES = {
    "admin.html": ["admin"],
    "teacher.html": ["teacher", "admin"],
    "student.html": ["student", "admin"],
    "parent.html": ["parent", "admin"]
};

const PUBLIC_PAGES = [
    "",
    "index.html",
    "consent.html",
    "login.html"
];


/* =========================================================
   3. КЛЮЧИ LOCAL STORAGE
   ========================================================= */

const USER_STORAGE_KEY = "lyceum2_user";
const CONSENT_STORAGE_KEY = "lyceum2_consent";
const MAINTENANCE_STORAGE_KEY = "lyceum2_maintenance";


/* =========================================================
   4. МОБИЛЬНОЕ МЕНЮ
   ========================================================= */

function toggleMenu() {
    const navigation = document.querySelector(".navigation");

    if (!navigation) {
        return;
    }

    navigation.classList.toggle("mobile-open");
}


/* Закрываем мобильное меню после перехода */

document.addEventListener("click", (event) => {
    const navigation = document.querySelector(".navigation");

    if (!navigation) {
        return;
    }

    const link = event.target.closest("a");

    if (link && navigation.classList.contains("mobile-open")) {
        navigation.classList.remove("mobile-open");
    }
});


/* =========================================================
   5. ТЕКУЩАЯ СТРАНИЦА
   ========================================================= */

function getCurrentPage() {
    let page = window.location.pathname.split("/").pop();

    if (!page) {
        page = "index.html";
    }

    return page.toLowerCase();
}


/* =========================================================
   6. ПОЛЬЗОВАТЕЛЬ
   ========================================================= */

function getCurrentUser() {
    try {
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);

        if (!savedUser) {
            return null;
        }

        const user = JSON.parse(savedUser);

        if (!user || typeof user !== "object") {
            return null;
        }

        return user;

    } catch (error) {
        console.error("Ошибка чтения пользователя:", error);

        localStorage.removeItem(USER_STORAGE_KEY);

        return null;
    }
}


function isLoggedIn() {
    const user = getCurrentUser();

    return !!(
        user &&
        user.loggedIn === true &&
        user.role
    );
}


/* =========================================================
   7. СОГЛАСИЕ С ПРАВИЛАМИ
   ========================================================= */

function getConsent() {
    try {
        const savedConsent =
            localStorage.getItem(CONSENT_STORAGE_KEY);

        if (!savedConsent) {
            return null;
        }

        return JSON.parse(savedConsent);

    } catch (error) {
        console.error(
            "Ошибка чтения согласия:",
            error
        );

        localStorage.removeItem(CONSENT_STORAGE_KEY);

        return null;
    }
}


function hasValidConsent() {
    const consent = getConsent();

    if (!consent) {
        return false;
    }

    return (
        consent.rulesVersion ===
        SYSTEM_CONFIG.rulesVersion
    );
}


/* =========================================================
   8. СОХРАНЕНИЕ СОГЛАСИЯ
   ========================================================= */

function saveConsent(settings = {}) {
    const consentData = {
        rulesVersion: SYSTEM_CONFIG.rulesVersion,

        acceptedAt: new Date().toISOString(),

        settings: {
            required: true,
            ...settings
        }
    };

    localStorage.setItem(
        CONSENT_STORAGE_KEY,
        JSON.stringify(consentData)
    );

    return consentData;
}


/* =========================================================
   9. ПЕРЕНАПРАВЛЕНИЕ
   ========================================================= */

function redirectTo(page) {
    if (!page) {
        return;
    }

    window.location.href = page;
}


/* =========================================================
   10. ПРОВЕРКА СОГЛАСИЯ
   ========================================================= */

function checkConsent() {
    const currentPage = getCurrentPage();

    /*
       На публичных страницах согласие не требуется.
    */

    if (PUBLIC_PAGES.includes(currentPage)) {
        return true;
    }

    /*
       Если согласия нет или версия правил устарела —
       отправляем пользователя на страницу согласия.
    */

    if (!hasValidConsent()) {
        redirectTo("consent.html");
        return false;
    }

    return true;
}


/* =========================================================
   11. ПРОВЕРКА АВТОРИЗАЦИИ
   ========================================================= */

function checkAuthentication() {
    const currentPage = getCurrentPage();

    if (PUBLIC_PAGES.includes(currentPage)) {
        return true;
    }

    if (!isLoggedIn()) {
        redirectTo("login.html");
        return false;
    }

    return true;
}


/* =========================================================
   12. ПРОВЕРКА РОЛИ
   ========================================================= */

function checkRoleAccess() {
    const currentPage = getCurrentPage();

    /*
       Если для страницы нет ограничений по роли,
       она доступна любому авторизованному пользователю.
    */

    if (!PAGE_ROLES[currentPage]) {
        return true;
    }

    const user = getCurrentUser();

    if (!user || !user.role) {
        redirectTo("login.html");
        return false;
    }

    const allowedRoles = PAGE_ROLES[currentPage];

    if (!allowedRoles.includes(user.role)) {

        alert(
            "Ця сторінка недоступна для вашої ролі."
        );

        redirectTo("dashboard.html");

        return false;
    }

    return true;
}


/* =========================================================
   13. ВЫХОД
   ========================================================= */

function logout() {
    localStorage.removeItem(USER_STORAGE_KEY);

    window.location.href = "login.html";
}


/* =========================================================
   14. ТЕХНИЧЕСКИЕ РАБОТЫ
   ========================================================= */

function getMaintenanceState() {
    try {
        const saved =
            localStorage.getItem(
                MAINTENANCE_STORAGE_KEY
            );

        if (!saved) {
            return {
                enabled: false,
                reason: "",
                endAt: "",
                updatedAt: null
            };
        }

        const state = JSON.parse(saved);

        return {
            enabled: state.enabled === true,
            reason: state.reason || "",
            endAt: state.endAt || "",
            updatedAt: state.updatedAt || null
        };

    } catch (error) {
        console.error(
            "Ошибка чтения режима технических работ:",
            error
        );

        return {
            enabled: false,
            reason: "",
            endAt: "",
            updatedAt: null
        };
    }
}


function setMaintenanceState(
    enabled,
    reason = "",
    endAt = ""
) {
    const state = {
        enabled: enabled === true,
        reason: reason,
        endAt: endAt,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem(
        MAINTENANCE_STORAGE_KEY,
        JSON.stringify(state)
    );

    updateSystemStatus();

    return state;
}


function enableMaintenanceMode(
    reason = "Проводятся технические работы.",
    endAt = ""
) {
    return setMaintenanceState(
        true,
        reason,
        endAt
    );
}


function disableMaintenanceMode() {
    return setMaintenanceState(
        false,
        "",
        ""
    );
}


function isMaintenanceMode() {
    const state = getMaintenanceState();

    return state.enabled === true;
}


/* =========================================================
   15. СТАТУС СИСТЕМЫ
   ========================================================= */

function updateSystemStatus() {
    const statusElements =
        document.querySelectorAll(".status-badge");

    const maintenance =
        getMaintenanceState();

    statusElements.forEach((element) => {

        if (maintenance.enabled) {

            element.innerHTML = `
                <span class="status-dot maintenance"></span>
                Технічні роботи
            `;

        } else {

            element.innerHTML = `
                <span class="status-dot"></span>
                Система працює
            `;
        }
    });
}


/* =========================================================
   16. ЗАЩИТА ОТ ТЕХНИЧЕСКИХ РАБОТ
   ========================================================= */

/*
   Пока отдельной maintenance.html нет,
   поэтому мы НЕ блокируем страницы автоматически.

   Режим уже сохраняется в localStorage,
   а полноценная блокировка будет подключена
   после создания maintenance.html.
*/

function checkMaintenanceAccess() {
    return true;
}


/* =========================================================
   17. АНИМАЦИИ ПРИ ПРОКРУТКЕ
   ========================================================= */

function setupScrollAnimation() {
    const cards =
        document.querySelectorAll(
            ".feature-card"
        );

    if (!cards.length) {
        return;
    }

    /*
       Если браузер не поддерживает
       IntersectionObserver — просто показываем карточки.
    */

    if (!("IntersectionObserver" in window)) {

        cards.forEach((card) => {
            card.classList.add("visible");
        });

        return;
    }

    const observer =
        new IntersectionObserver(
            (entries) => {

                entries.forEach((entry) => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );
                    }
                });
            },
            {
                threshold: 0.12
            }
        );

    cards.forEach((card) => {

        card.classList.add(
            "scroll-hidden"
        );

        observer.observe(card);
    });
}


/* =========================================================
   18. ТЕКУЩИЙ ГОД
   ========================================================= */

function updateCurrentYear() {
    const year =
        new Date().getFullYear();

    document
        .querySelectorAll(
            "[data-current-year]"
        )
        .forEach((element) => {

            element.textContent = year;
        });
}


/* =========================================================
   19. ЗАПОЛНЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
   ========================================================= */

function updateUserElements() {
    const user = getCurrentUser();

    if (!user) {
        return;
    }

    /*
       Можно использовать:

       <span data-user-login></span>
       <span data-user-role></span>
    */

    document
        .querySelectorAll(
            "[data-user-login]"
        )
        .forEach((element) => {

            element.textContent =
                user.login || "Пользователь";
        });

    document
        .querySelectorAll(
            "[data-user-role]"
        )
        .forEach((element) => {

            element.textContent =
                getRoleName(user.role);
        });
}


/* =========================================================
   20. НАЗВАНИЯ РОЛЕЙ
   ========================================================= */

function getRoleName(role) {

    const roles = {
        admin: "Адміністратор",
        teacher: "Вчитель",
        student: "Учень",
        parent: "Батько / мати"
    };

    return roles[role] || "Користувач";
}


/* =========================================================
   21. ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ
   ========================================================= */

function initializeApp() {

    /*
       1. Статус
    */

    updateSystemStatus();


    /*
       2. Согласие
    */

    if (!checkConsent()) {
        return;
    }


    /*
       3. Авторизация
    */

    if (!checkAuthentication()) {
        return;
    }


    /*
       4. Роли
    */

    if (!checkRoleAccess()) {
        return;
    }


    /*
       5. Технические работы
    */

    if (!checkMaintenanceAccess()) {
        return;
    }


    /*
       6. Остальные функции
    */

    setupScrollAnimation();

    updateCurrentYear();

    updateUserElements();
}


/* =========================================================
   22. ЗАПУСК
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
