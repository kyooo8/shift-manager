//routes/api/appLogout.ts
export const handler = (req: Request) => {
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    const headers = new Headers();
    headers.append(
        "Set-Cookie",
        "accessToken=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0", // クッキーを無効化
    );

    return new Response("ログアウト成功", {
        status: 200,
        headers,
    });
};
