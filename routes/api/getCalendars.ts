// routes/api/getCalendars.ts
import { supabase } from "../../lib/supabase.ts";
import { FreshContext } from "$fresh/server.ts";
import { Calendar } from "../../interface/Calendar.ts";

export const handler = async (
    req: Request,
    _ctx: FreshContext,
): Promise<Response> => {
    const cookieHeader = req.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => {
            const [key, ...v] = c.split("=");
            return [key.trim(), decodeURIComponent(v.join("="))];
        }),
    );

    const userId = cookies.googleUserId;
    try {
        const { data, error } = await supabase
            .from("users")
            .select("calendars")
            .eq("id", userId)
            .single();

        if (error) {
            throw error;
        }

        const calendars: Calendar[] = data.calendars;

        return new Response(JSON.stringify(calendars), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error fetching calendars:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
