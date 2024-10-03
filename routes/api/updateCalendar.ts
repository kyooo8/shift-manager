// routes/api/updateCalendar.ts
import { HandlerContext } from "$fresh/server.ts";
import { supabase } from "../../lib/supabase.ts";
import { Calendar } from "../../interface/Calendar.ts";

export const handler = async (
    req: Request,
    _ctx: HandlerContext,
): Promise<Response> => {
    try {
        const updatedCalendar: Calendar = await req.json();

        const cookieHeader = req.headers.get("Cookie") || "";
        const cookies = Object.fromEntries(
            cookieHeader.split("; ").map((c) => {
                const [key, ...v] = c.split("=");
                return [key.trim(), decodeURIComponent(v.join("="))];
            }),
        );

        const googleUserId = cookies.googleUserId;

        if (!googleUserId) {
            return new Response(
                JSON.stringify({ error: "ユーザーが認証されていません。" }),
                {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // カレンダー情報を更新
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

        const currentCalendars = data.calendars || [];
        const updatedCalendars = currentCalendars.map((cal: Calendar) =>
            cal.uniqueId === updatedCalendar.uniqueId ? updatedCalendar : cal
        );

        const { error: updateError } = await supabase
            .from("users")
            .update({ calendars: updatedCalendars })
            .eq("id", googleUserId);

        if (updateError) {
            return new Response(
                JSON.stringify({ error: updateError.message }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
