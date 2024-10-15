// routes/list.tsx
import { Handlers } from "$fresh/server.ts";
import { List } from "../islands/List.tsx";
import { Header } from "../components/header.tsx";
import { verifyAccessToken } from "../lib/verifyAccessToken.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
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

    return ctx.render();
  },
};

export default function ListPage() {
  return (
    <>
      <Header title="シフト時間管理" />
      <List />
    </>
  );
}
