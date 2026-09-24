const SUPABASE_URL = "https://atfhyyarjqiwlaxixbrd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2rtmu-1UkcDR4D35qkGwgw_AQDBR8Lw";

(function () {
function connectSupabase() {
if (!window.supabase || typeof window.supabase.createClient !== "function") {
console.error("Supabase CDN не завантажився.");
window.supabaseClient = null;
return false;
}

    try {
        window.supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY
        );

        console.log("Supabase підключено успішно.");
        return true;
    } catch (error) {
        console.error("Помилка створення Supabase client:", error);
        window.supabaseClient = null;
        return false;
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connectSupabase);
} else {
    connectSupabase();
}

})();