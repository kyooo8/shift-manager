// routes/api/getUserName.ts

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

  try {
    const kv = await Deno.openKv();

    // Deno KVからユーザー名を取得
    const userKey = ["users", googleUserId];
    console.log("Looking for key:", userKey);
    const user = await kv.get<
      { id: string; name: string; refresh_token?: string }
    >(userKey);
    console.log("user", user);

    if (!user.value || !user.value.name) {
      console.error("ユーザー情報の取得に失敗しました");
      return new Response(
        JSON.stringify({ error: "ユーザー情報の取得に失敗しました" }),
        { status: 404 },
      );
    }

    console.log("Fetched user name:", user.value.name); // ログ追加

    return new Response(JSON.stringify({ name: user.value.name }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error retrieving user information:", error);
    return new Response(
      JSON.stringify({ error: "サーバーエラーが発生しました" }),
      { status: 500 },
    );
  }
}
