const SUPABASE_URL = "https://atfhyyarjqiwlaxixbrd.supabase.co";

const SUPABASE_ANON_KEY =
"sb_publishable_2rtmu-1UkcDR4D35qkGwgw_AQDBR8Lw";

(function initializeSupabase() {
"use strict";

function createClient() {
    if (!window.supabase) {
        console.error(
            "Supabase CDN не завантажився. Перевір підключення @supabase/supabase-js."
        );
        return false;
    }

    try {
        window.supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        console.log("Supabase успішно підключено.");

        return true;
    } catch (error) {
        console.error(
            "Помилка створення Supabase client:",
            error
        );

        window.supabaseClient = null;

        return false;
    }
}

if (!window.supabaseClient) {
    createClient();
}

})();