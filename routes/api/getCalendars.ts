import { FreshContext } from "$fresh/server.ts";
import { supabase } from "../../lib/supabase.ts";
import { Calendar } from "../../interface/Calendar.ts";

export const handler = async (
    req: Request,
    ctx: FreshContext,
): Promise<Response> => {
    const cookieHeader = req.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => {
            const [key, ...v] = c.split("=");
            return [key.trim(), decodeURIComponent(v.join("="))];
        }),
    );

    const googleUserId = cookies.googleUserId;

    const { data, error } = await supabase
        .from("users")
        .select("calendars")
        .eq("id", googleUserId)
        .single();

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    const calendarsArray = data.calendars as Calendar[]; // calendarsが配列であると仮定

    return new Response(JSON.stringify(calendarsArray), {
        headers: { "Content-Type": "application/json" },
    });
};
