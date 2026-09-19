```javascript
/* =========================================================
   ЛІЦЕЙ №2 — APP.JS
   ========================================================= */

"use strict";


/* =========================================================
   CONFIG
   ========================================================= */

const SYSTEM_CONFIG = {

    // Версия интерфейса
    version: "0.1.0",

    // Сайт пока не подтверждён школой
    officiallyApproved: false,

    // Режим технических работ
    maintenanceMode: false,

    // Версия правил
    rulesVersion: "1.0"

};


/* =========================================================
   MOBILE MENU
   ========================================================= */

function toggleMenu() {

    const navigation = document.querySelector(".navigation");

    if (!navigation) {
        return;
    }

    navigation.classList.toggle("mobile-open");

}


/* =========================================================
   SYSTEM STATUS
   ========================================================= */

function updateSystemStatus() {

    const statusElements =
        document.querySelectorAll(".status-badge");

    statusElements.forEach((element) => {

        if (SYSTEM_CONFIG.maintenanceMode) {

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
   MAINTENANCE MODE
   ========================================================= */

function isMaintenanceMode() {

    return SYSTEM_CONFIG.maintenanceMode === true;

}


function enableMaintenanceMode() {

    SYSTEM_CONFIG.maintenanceMode = true;

    updateSystemStatus();

}


function disableMaintenanceMode() {

    SYSTEM_CONFIG.maintenanceMode = false;

    updateSystemStatus();

}


/* =========================================================
   USER CONSENT
   ========================================================= */

const CONSENT_STORAGE_KEY =
    "lyceum2_consent";


function getConsent() {

    try {

        const saved =
            localStorage.getItem(
                CONSENT_STORAGE_KEY
            );

        if (!saved) {
            return null;
        }

        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "Не вдалося прочитати згоду:",
            error
        );

        return null;

    }

}


function saveConsent(settings) {

    const consentData = {

        rulesVersion:
            SYSTEM_CONFIG.rulesVersion,

        acceptedAt:
            new Date().toISOString(),

        settings:
            settings

    };

    localStorage.setItem(

        CONSENT_STORAGE_KEY,

        JSON.stringify(consentData)

    );

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
   FIRST VISIT
   ========================================================= */

function checkFirstVisit() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();

    const publicPages = [

        "",
        "index.html",
        "consent.html",
        "login.html"

    ];

    if (
        publicPages.includes(currentPage)
    ) {
        return;
    }

    if (!hasValidConsent()) {

        window.location.href =
            "consent.html";

    }

}


/* =========================================================
   SCROLL ANIMATION
   ========================================================= */

function setupScrollAnimation() {

    const cards =
        document.querySelectorAll(
            ".feature-card"
        );

    if (!cards.length) {
        return;
    }

    const observer =
        new IntersectionObserver(

            (entries) => {

                entries.forEach(
                    (entry) => {

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


    cards.forEach((card) => {

        card.classList.add(
            "scroll-hidden"
        );

        observer.observe(card);

    });

}


/* =========================================================
   CURRENT YEAR
   ========================================================= */

function updateCurrentYear() {

    const year =
        new Date().getFullYear();

    document
        .querySelectorAll(
            "[data-current-year]"
        )
        .forEach(
            (element) => {

                element.textContent =
                    year;

            }
        );

}


/* =========================================================
   GLOBAL INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateSystemStatus();

        checkFirstVisit();

        setupScrollAnimation();

        updateCurrentYear();

    }
);
```
