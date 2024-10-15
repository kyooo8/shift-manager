// routes/_middleware.ts
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { verifyAccessToken } from "../lib/verifyAccessToken.ts";

export async function handler(req: Request, ctx: MiddlewareHandlerContext) {
    const url = new URL(req.url);

    // ログインページや静的ファイルのリクエストは認証をスキップ
    if (
        url.pathname === "/login" || url.pathname === "/api/login" ||
        url.pathname === "/api/callback" ||
        url.pathname.startsWith("/static") || // 静的ファイルをスキップ
        url.pathname.endsWith(".js") || // JavaScriptファイルをスキップ
        url.pathname.endsWith(".css") // CSSファイルをスキップ
    ) {
        return await ctx.next();
    }

    const cookieHeader = req.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => {
            const [key, ...v] = c.split("=");
            return [key.trim(), decodeURIComponent(v.join("="))];
        }),
    );

    let accessToken = cookies.accessToken;

    if (!accessToken) {
        return new Response(null, {
            status: 302,
            headers: { Location: "/login" },
        });
    }

    const isValid = await verifyAccessToken(accessToken);

    if (!isValid) {
        // アクセストークンをリフレッシュ
        const refreshResponse = await fetch(
            "http://localhost:8000/api/refreshAccessToken",
            {
                method: "POST",
                headers: {
                    Cookie: cookieHeader,
                },
            },
        );

        if (!refreshResponse.ok) {
            return new Response(null, {
                status: 302,
                headers: { Location: "/" },
            });
        }

        // 新しいアクセストークンを取得
        const newCookies = refreshResponse.headers.get("set-cookie");
        if (newCookies) {
            accessToken = newCookies.match(/accessToken=([^;]+)/)?.[1] || "";
        }
    }

    return await ctx.next();
}
