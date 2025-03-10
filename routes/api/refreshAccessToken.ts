// routes/api/refreshAccessToken.ts

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

  try {
    const kv = await Deno.openKv();

    // Deno KVからリフレッシュトークンを取得
    const userKey = ["users", googleUserId];
    const user = await kv.get<{ refresh_token: string }>(userKey);

    if (!user.value || !user.value.refresh_token) {
      return new Response(
        JSON.stringify({
          error: "リフレッシュトークンが存在しません",
        }),
        { status: 500 },
      );
    }

    const refreshToken = user.value.refresh_token;

    // リフレッシュトークンを使用してアクセストークンをリフレッシュ
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

    console.log("アクセストークンを更新しました");

    return new Response(
      JSON.stringify({ message: "アクセストークンを更新しました" }),
      {
        status: 200,
        headers,
      },
    );
  } catch (error: any) {
    console.error("Error refreshing access token:", error);
    return new Response(
      JSON.stringify({ error: "リフレッシュ処理に失敗しました" }),
      { status: 500 },
    );
  }
}
