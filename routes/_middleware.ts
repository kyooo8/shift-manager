import { FreshContext } from "$fresh/server.ts";
import { verifyAccessToken } from "../lib/verifyAccessToken.ts";

export async function handler(req: Request, ctx: FreshContext) {
  const url = new URL(req.url);

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
  console.log("accessToken", accessToken);

  if (!accessToken) {
    return new Response(null, {
      status: 302,
      headers: { Location: "/login" },
    });
  }

  const isValid = await verifyAccessToken(accessToken);

  if (!isValid) {
    // 環境変数からAPIのURLを取得
    const API_URL = Deno.env.get("API_URL") || "http://localhost:8000";

    // アクセストークンをリフレッシュ
    const refreshResponse = await fetch(`${API_URL}/api/refreshAccessToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      credentials: "include",
    });

    // 失敗した場合、ログイン画面にリダイレクト
    if (!refreshResponse.ok) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    // `Set-Cookie` ヘッダーから新しい `accessToken` を取得
    const newCookies = refreshResponse.headers.get("set-cookie");
    if (newCookies) {
      accessToken = newCookies.match(/accessToken=([^;]+)/)?.[1] || "";
    }

    // トークンがない場合はログイン画面へ
    if (!accessToken) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }

    // クライアントに新しい `accessToken` をセット
    const response = await ctx.next();
    response.headers.append(
      "Set-Cookie",
      `accessToken=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    );
    return response;
  }

  return await ctx.next();
}
