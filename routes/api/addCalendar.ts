// routes/api/addCalendar.ts
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

    const newCalendar: Calendar = await req.json();

    try {
        // 1. 既存のカレンダーを取得
        const { data: user, error: fetchError } = await supabase
            .from("users")
            .select("calendars")
            .eq("id", googleUserId)
            .single();

        if (fetchError) throw fetchError;

        const calendars = user?.calendars as Calendar[] || [];

        // 2. 新しいカレンダーを追加
        calendars.push(newCalendar);

        // 3. 更新されたカレンダーを保存
        const { data, error: updateError } = await supabase
            .from("users")
            .update({ calendars })
            .eq("id", googleUserId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error adding calendar:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
