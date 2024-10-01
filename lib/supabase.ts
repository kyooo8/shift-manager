import { createClient } from "https://esm.sh/@supabase/supabase-js";

// const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseUrl = "https://mfzcsojkjhbncuixqffq.supabase.co";
// const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1memNzb2pramhibmN1aXhxZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUyODc1NTAsImV4cCI6MjA0MDg2MzU1MH0.yViyJUvTwNOOkDzuG-AaEGKCuWpJUFtErgwe-8yaiBQ";

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or anon key is missing");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: fetch.bind(globalThis), // Denoのfetchを使用
    },
});
