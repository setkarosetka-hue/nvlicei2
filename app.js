"use strict";

/* =========================================================
   ЛІЦЕЙ №2 — ОСНОВНОЙ JAVASCRIPT
   Версия 0.3.0
   ========================================================= */


/* =========================================================
   1. НАСТРОЙКИ
   ========================================================= */

const SYSTEM_CONFIG = {
    version: "0.3.0",
    officiallyApproved: false,
    rulesVersion: "1.0",
    testMode: true
};


/* =========================================================
   2. КЛЮЧИ LOCAL STORAGE
   ========================================================= */

const USER_STORAGE_KEY = "lyceum2_user";
const CONSENT_STORAGE_KEY = "lyceum2_consent";
const MAINTENANCE_STORAGE_KEY = "lyceum2_maintenance";


/* =========================================================
   3. СТРАНИЦЫ
   ========================================================= */

const PUBLIC_PAGES = [
    "",
    "index.html",
    "consent.html",
    "login.html",
    "maintenance.html"
];


/* Какие роли могут открывать страницы */

const PAGE_ROLES = {
    "admin.html": ["admin"],

    "teacher.html": [
        "teacher",
        "admin"
    ],

    "student.html": [
        "student",
        "admin"
    ],

    "parent.html": [
        "parent",
        "admin"
    ]
};


/* =========================================================
   4. МОБИЛЬНОЕ МЕНЮ
   ========================================================= */

function toggleMenu() {

    const navigation =
        document.querySelector(".navigation");

    if (!navigation) {
        return;
    }

    navigation.classList.toggle(
        "mobile-open"
    );
}


/* Закрытие меню после перехода */

document.addEventListener("click", function (event) {

    const navigation =
        document.querySelector(".navigation");

    if (!navigation) {
        return;
    }

    const link =
        event.target.closest("a");

    if (
        link &&
        navigation.classList.contains(
            "mobile-open"
        )
    ) {
        navigation.classList.remove(
            "mobile-open"
        );
    }
});


/* =========================================================
   5. ОПРЕДЕЛЕНИЕ ТЕКУЩЕЙ СТРАНИЦЫ
   ========================================================= */

function getCurrentPage() {

    let page =
        window.location.pathname
            .split("/")
            .pop();

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

        const savedUser =
            localStorage.getItem(
                USER_STORAGE_KEY
            );

        if (!savedUser) {
            return null;
        }

        const user =
            JSON.parse(savedUser);

        if (
            !user ||
            typeof user !== "object"
        ) {
            return null;
        }

        return user;

    } catch (error) {

        console.error(
            "Ошибка чтения пользователя:",
            error
        );

        localStorage.removeItem(
            USER_STORAGE_KEY
        );

        return null;
    }
}


/* Проверка входа */

function isLoggedIn() {

    const user =
        getCurrentUser();

    return !!(
        user &&
        user.loggedIn === true &&
        user.role
    );
}


/* =========================================================
   7. СОГЛАСИЕ
   ========================================================= */

function getConsent() {

    try {

        const savedConsent =
            localStorage.getItem(
                CONSENT_STORAGE_KEY
            );

        if (!savedConsent) {
            return null;
        }

        return JSON.parse(
            savedConsent
        );

    } catch (error) {

        console.error(
            "Ошибка чтения согласия:",
            error
        );

        localStorage.removeItem(
            CONSENT_STORAGE_KEY
        );

        return null;
    }
}


function hasValidConsent() {

    const consent =
        getConsent();

    if (!consent) {
        return false;
    }

    return (
        consent.rulesVersion ===
        SYSTEM_CONFIG.rulesVersion
    );
}


/* Сохранение согласия */

function saveConsent(settings = {}) {

    const consentData = {

        rulesVersion:
            SYSTEM_CONFIG.rulesVersion,

        acceptedAt:
            new Date().toISOString(),

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
   8. ПЕРЕХОД НА СТРАНИЦУ
   ========================================================= */

function redirectTo(page) {

    if (!page) {
        return;
    }

    window.location.href = page;
}


/* =========================================================
   9. ПРОВЕРКА СОГЛАСИЯ
   ========================================================= */

function checkConsent() {

    const currentPage =
        getCurrentPage();

    /*
       Публичные страницы можно открывать
       без предварительного согласия.
    */

    if (
        PUBLIC_PAGES.includes(
            currentPage
        )
    ) {
        return true;
    }

    /*
       Если согласие отсутствует —
       отправляем пользователя на правила.
    */

    if (!hasValidConsent()) {

        redirectTo(
            "consent.html"
        );

        return false;
    }

    return true;
}


/* =========================================================
   10. ПРОВЕРКА АВТОРИЗАЦИИ
   ========================================================= */

function checkAuthentication() {

    const currentPage =
        getCurrentPage();

    /*
       Публичные страницы
    */

    if (
        PUBLIC_PAGES.includes(
            currentPage
        )
    ) {
        return true;
    }

    /*
       Пользователь должен быть авторизован.
    */

    if (!isLoggedIn()) {

        redirectTo(
            "login.html"
        );

        return false;
    }

    return true;
}


/* =========================================================
   11. ПРОВЕРКА РОЛИ
   ========================================================= */

function checkRoleAccess() {

    const currentPage =
        getCurrentPage();

    /*
       Если страница не имеет
       специального ограничения,
       её могут открыть все авторизованные.
    */

    if (!PAGE_ROLES[currentPage]) {
        return true;
    }

    const user =
        getCurrentUser();

    if (
        !user ||
        !user.role
    ) {

        redirectTo(
            "login.html"
        );

        return false;
    }

    const allowedRoles =
        PAGE_ROLES[currentPage];

    if (
        !allowedRoles.includes(
            user.role
        )
    ) {

        alert(
            "Ця сторінка недоступна для вашої ролі."
        );

        redirectTo(
            "dashboard.html"
        );

        return false;
    }

    return true;
}


/* =========================================================
   12. ВЫХОД
   ========================================================= */

function logout() {

    localStorage.removeItem(
        USER_STORAGE_KEY
    );

    window.location.href =
        "login.html";
}


/* =========================================================
   13. ТЕХНИЧЕСКИЕ РАБОТЫ
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

        const state =
            JSON.parse(saved);

        return {

            enabled:
                state.enabled === true,

            reason:
                state.reason || "",

            endAt:
                state.endAt || "",

            updatedAt:
                state.updatedAt || null
        };

    } catch (error) {

        console.error(
            "Ошибка чтения технических работ:",
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


/* Сохранение режима */

function setMaintenanceState(
    enabled,
    reason = "",
    endAt = ""
) {

    const state = {

        enabled:
            enabled === true,

        reason:
            String(reason || ""),

        endAt:
            String(endAt || ""),

        updatedAt:
            new Date().toISOString()
    };

    localStorage.setItem(
        MAINTENANCE_STORAGE_KEY,
        JSON.stringify(state)
    );

    updateSystemStatus();

    return state;
}


/* Включение */

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


/* Выключение */

function disableMaintenanceMode() {

    return setMaintenanceState(
        false,
        "",
        ""
    );
}


/* Проверка */

function isMaintenanceMode() {

    const state =
        getMaintenanceState();

    return state.enabled === true;
}


/* =========================================================
   14. ПРОВЕРКА ТЕХНИЧЕСКИХ РАБОТ
   ========================================================= */

function checkMaintenanceAccess() {

    const currentPage =
        getCurrentPage();

    /*
       Страница технических работ
       должна открываться всегда.
    */

    if (
        currentPage ===
        "maintenance.html"
    ) {
        return true;
    }

    /*
       Публичные страницы доступны.
    */

    if (
        PUBLIC_PAGES.includes(
            currentPage
        )
    ) {
        return true;
    }

    const maintenance =
        getMaintenanceState();

    /*
       Технические работы выключены.
    */

    if (!maintenance.enabled) {
        return true;
    }

    const user =
        getCurrentUser();

    /*
       Администратор имеет доступ
       во время технических работ.
    */

    if (
        user &&
        user.role === "admin"
    ) {
        return true;
    }

    /*
       Остальных отправляем
       на maintenance.html.
    */

    redirectTo(
        "maintenance.html"
    );

    return false;
}


/* =========================================================
   15. СТАТУС СИСТЕМЫ
   ========================================================= */

function updateSystemStatus() {

    const statusElements =
        document.querySelectorAll(
            ".status-badge"
        );

    const maintenance =
        getMaintenanceState();

    statusElements.forEach(
        function (element) {

            if (
                maintenance.enabled
            ) {

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
        }
    );
}


/* =========================================================
   16. АНИМАЦИИ
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
       Старые браузеры:
       просто показываем карточки.
    */

    if (
        !(
            "IntersectionObserver"
            in window
        )
    ) {

        cards.forEach(
            function (card) {

                card.classList.add(
                    "visible"
                );
            }
        );

        return;
    }

    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(
                    function (entry) {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "visible"
                            );

                            observer.unobserve(
                                entry.target
                            );
                        }
                    }
                );
            },
            {
                threshold: 0.12
            }
        );

    cards.forEach(
        function (card) {

            card.classList.add(
                "scroll-hidden"
            );

            observer.observe(card);
        }
    );
}


/* =========================================================
   17. ТЕКУЩИЙ ГОД
   ========================================================= */

function updateCurrentYear() {

    const year =
        new Date().getFullYear();

    document
        .querySelectorAll(
            "[data-current-year]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    year;
            }
        );
}


/* =========================================================
   18. НАЗВАНИЕ РОЛИ
   ========================================================= */

function getRoleName(role) {

    const roles = {

        admin:
            "Адміністратор",

        teacher:
            "Вчитель",

        student:
            "Учень",

        parent:
            "Батько / мати"
    };

    return (
        roles[role] ||
        "Користувач"
    );
}


/* =========================================================
   19. ДАННЫЕ ПОЛЬЗОВАТЕЛЯ НА СТРАНИЦЕ
   ========================================================= */

function updateUserElements() {

    const user =
        getCurrentUser();

    if (!user) {
        return;
    }


    /*
       Логин
    */

    document
        .querySelectorAll(
            "[data-user-login]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    user.login ||
                    "Користувач";
            }
        );


    /*
       Роль
    */

    document
        .querySelectorAll(
            "[data-user-role]"
        )
        .forEach(
            function (element) {

                element.textContent =
                    getRoleName(
                        user.role
                    );
            }
        );
}


/* =========================================================
   20. ФОРМАТ ДАТЫ
   ========================================================= */

function formatDateTime(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleString(
        "uk-UA",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   21. ИНИЦИАЛИЗАЦИЯ
   ========================================================= */

function initializeApp() {

    /*
       Сначала обновляем статус.
    */

    updateSystemStatus();


    /*
       Проверяем согласие.
    */

    if (!checkConsent()) {
        return;
    }


    /*
       Проверяем авторизацию.
    */

    if (!checkAuthentication()) {
        return;
    }


    /*
       Проверяем роль.
    */

    if (!checkRoleAccess()) {
        return;
    }


    /*
       Проверяем технические работы.
    */

    if (!checkMaintenanceAccess()) {
        return;
    }


    /*
       Остальные функции.
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
