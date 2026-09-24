const SUPABASE_URL = "https://atfhyyarjqiwlaxixbrd.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_2rtmu-1UkcDR4D35qkGwgw_AQDBR8Lw";

(function () {

function connectSupabase() {

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {
        console.error(
            "Supabase CDN не завантажився."
        );

        return false;
    }

    try {

        if (!window.supabaseClient) {

            window.supabaseClient =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_ANON_KEY
                );
        }

        console.log(
            "Supabase успішно підключено."
        );

        return true;

    } catch (error) {

        console.error(
            "Помилка створення Supabase client:",
            error
        );

        return false;
    }
}


if (!connectSupabase()) {

    window.addEventListener(
        "load",
        function () {

            connectSupabase();

        },
        { once: true }
    );
}

})();