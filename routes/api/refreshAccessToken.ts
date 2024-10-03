// routes/api/refreshAccessToken.ts
import { supabase } from "../../lib/supabase.ts";
import { refreshAccessToken } from "../../lib/refreshAccessToken.ts";

export async function handler(req: Request): Promise<Response> {
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
            JSON.stringify({ error: "ユーザーが認証されていません" }),
            { status: 401 },
        );
    }

    // データベースからリフレッシュトークンを取得
    const { data: user, error } = await supabase
        .from("users")
        .select("refresh_token")
        .eq("id", googleUserId)
        .single();

    if (error || !user) {
        return new Response(
            JSON.stringify({
                error: "リフレッシュトークンの取得に失敗しました",
            }),
            { status: 500 },
        );
    }

    const refreshToken = user.refresh_token;

    if (!refreshToken) {
        return new Response(
            JSON.stringify({ error: "リフレッシュトークンが存在しません" }),
            { status: 500 },
        );
    }

    const newAccessToken = await refreshAccessToken(refreshToken);

    if (!newAccessToken) {
        return new Response(
            JSON.stringify({
                error: "アクセストークンのリフレッシュに失敗しました",
            }),
            { status: 500 },
        );
    }

    // 新しいアクセストークンをクッキーに設定
    const headers = new Headers();
    headers.append(
        "Set-Cookie",
        `accessToken=${newAccessToken}; Path=/; HttpOnly; SameSite=Lax;`,
    );

    return new Response(
        JSON.stringify({ message: "アクセストークンを更新しました" }),
        {
            status: 200,
            headers,
        },
    );
}
