// routes/api/getUserName.ts
import { supabase } from "../../lib/supabase.ts";

export async function handler(req: Request): Promise<Response> {
    const cookieHeader = req.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => {
            const [key, ...v] = c.split("=");
            return [key.trim(), decodeURIComponent(v.join("="))];
        }),
    );

    const googleUserId = cookies.googleUserId;
    console.log("Received googleUserId:", googleUserId); // ログ追加

    if (!googleUserId) {
        console.error("ユーザーが認証されていません");
        return new Response(
            JSON.stringify({ error: "ユーザーが認証されていません" }),
            { status: 401 },
        );
    }

    const { data: user, error } = await supabase
        .from("users")
        .select("name")
        .eq("id", googleUserId)
        .single();

    if (error || !user) {
        console.error("ユーザー情報の取得に失敗しました:", error);
        return new Response(
            JSON.stringify({ error: "ユーザー情報の取得に失敗しました" }),
            { status: 500 },
        );
    }

    console.log("Fetched user name:", user.name); // ログ追加

    return new Response(JSON.stringify({ name: user.name }), {
        headers: { "Content-Type": "application/json" },
    });
}
