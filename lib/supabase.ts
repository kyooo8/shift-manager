// src/lib/supabase.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import "$std/dotenv/load.ts";

// const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseUrl = "https://mfzcsojkjhbncuixqffq.supabase.co";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseUrl) {
    throw new Error("環境変数 SUPABASE_URL が設定されていません。");
}

if (!supabaseAnonKey) {
    throw new Error("環境変数 SUPABASE_ANON_KEY が設定されていません。");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: fetch.bind(globalThis),
    },
});
