import { FreshContext } from "$fresh/server.ts";
import { supabase } from "../../lib/supabase.ts";

export const handler = async (req: Request, ctx: FreshContext) => {
    const newCalendar = await req.json();

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

    const updatedCalendars = [...data.calendars, newCalendar];

    const { error: updateError } = await supabase
        .from("users")
        .update({ calendars: updatedCalendars })
        .eq("id", googleUserId);

    if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
    });
};
