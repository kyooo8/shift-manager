import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or anon key is missing");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: fetch.bind(globalThis), // Denoのfetchを使用
    },
});
