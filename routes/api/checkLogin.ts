// サーバーサイドハンドラーでのログイン状態の確認
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
    async GET(req, ctx) {
        const cookieHeader = req.headers.get("Cookie") || "";
        const cookies = Object.fromEntries(
            cookieHeader.split("; ").map((c) => {
                const [key, ...v] = c.split("=");
                return [key.trim(), decodeURIComponent(v.join("="))];
            }),
        );

        const accessToken = cookies.accessToken;
        if (!accessToken) {
            return new Response(null, {
                status: 302,
                headers: { Location: "/" },
            });
        }

        return ctx.render();
    },
};
