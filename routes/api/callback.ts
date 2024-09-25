//routes/api/callback.ts
import { supabase } from "../../lib/supabase.ts";

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("認証コードが見つかりません", { status: 400 });
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
  const redirectUri = "http://localhost:8000/api/callback";

  // トークンを取得
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error("アクセストークンの取得に失敗しました:", errorText);
    return new Response("アクセストークンの取得に失敗しました", {
      status: 500,
    });
  }

  // レスポンスをJSONとしてパース
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;

  if (!accessToken) {
    console.error(
      "アクセストークンが取得できませんでした。トークンデータ:",
      tokenData,
    );
    return new Response("アクセストークンが取得できませんでした", {
      status: 500,
    });
  }

  // ユーザー情報を取得
  const userInfoResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!userInfoResponse.ok) {
    const errorText = await userInfoResponse.text();
    console.error("ユーザー情報の取得に失敗しました:", errorText);
    return new Response("ユーザー情報の取得に失敗しました", {
      status: 500,
    });
  }

  const userInfo = await userInfoResponse.json();
  const googleUserId = userInfo.sub; // OpenID Connect では "sub" がユーザーID

  // 新規ユーザーを登録
  await saveUserIfNew(googleUserId, userInfo);
  await saveRefreshToken(googleUserId, refreshToken);

  // クッキーにアクセストークンを設定
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `accessToken=${accessToken}; Path=/; HttpOnly; SameSite=Lax;`,
  );
  headers.append("Location", "/list");

  // /listにリダイレクト
  return new Response(null, {
    status: 302,
    headers: headers,
  });
}

// 既存の関数はそのまま

// 新しいユーザーをデータベースに保存する関数
async function saveUserIfNew(googleUserId: string, userInfo: any) {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", googleUserId)
    .single();

  if (!data && !error) {
    const { error: insertError } = await supabase.from("users").insert({
      id: googleUserId,
      name: userInfo.name,
    });

    if (insertError) {
      console.log("ユーザーの作成に失敗しました:", insertError);
    }
  }
}

// リフレッシュトークンを保存する関数
async function saveRefreshToken(googleUserId: string, refreshToken: string) {
  const { error } = await supabase
    .from("users")
    .upsert({ id: googleUserId, refresh_token: refreshToken });

  if (error) {
    console.error("Supabaseへの保存中にエラーが発生しました:", error);
  }
}
