// routes/api/deleteCalendar.ts
import { supabase } from "../../lib/supabase.ts";
import { Calendar } from "../../interface/Calendar.ts";

export const handler = async (req: Request): Promise<Response> => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    const cookieHeader = req.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => {
            const [key, ...v] = c.split("=");
            return [key.trim(), decodeURIComponent(v.join("="))];
        }),
    );

    const googleUserId = cookies.googleUserId;

    if (!googleUserId) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { uniqueId } = await req.json();

    try {
        if (!uniqueId) {
            return new Response(
                JSON.stringify({ error: "Calendar ID is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // 既存のカレンダーを取得
        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("calendars")
            .eq("id", googleUserId)
            .single();

        if (fetchError) throw fetchError;

        const calendars = user?.calendars as Calendar[] || [];

        // カレンダーを削除
        const updatedCalendars = calendars.filter((calendar) =>
            calendar.uniqueId !== uniqueId
        );

        // 更新されたカレンダーを保存
        const { error: updateError } = await supabase
            .from("users")
            .update({ calendars: updatedCalendars })
            .eq("id", googleUserId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error deleting calendar:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
