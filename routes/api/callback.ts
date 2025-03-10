// routes/api/callback.ts

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("認証コードが見つかりません", { status: 400 });
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
  const redirectUri = Deno.env.get("REDIRECT_URL") ||
    "https://shift-manager.deno.dev/api/callback";

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

  // Deno KVに保存
  const kv = await Deno.openKv();

  const userKey = ["users", googleUserId];
  const existingUser = await kv.get<User>(userKey);

  if (!existingUser.value) {
    // 新規ユーザーを登録
    await saveUser(kv, googleUserId, userInfo);
  }

  // リフレッシュトークンを保存または更新
  await saveRefreshToken(kv, googleUserId, refreshToken);

  // クッキーにアクセストークンとユーザーIDを設定
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `accessToken=${accessToken}; Path=/; HttpOnly; SameSite=Lax;`,
  );
  headers.append(
    "Set-Cookie",
    `googleUserId=${googleUserId}; Path=/; HttpOnly; SameSite=Lax;`,
  );
  headers.append("Location", "/");

  // /listにリダイレクト
  return new Response(null, {
    status: 302,
    headers: headers,
  });
}

// ユーザー型の定義
interface User {
  id: string;
  name: string;
  refresh_token?: string; // オプショナルに設定
}

// ユーザーをDeno KVに保存する関数
async function saveUser(kv: Deno.Kv, googleUserId: string, userInfo: any) {
  console.log("username", userInfo.name);

  const userKey = ["users", googleUserId];
  await kv.set(userKey, {
    id: googleUserId,
    name: userInfo.name,
  });
  console.log("新規ユーザーが登録されました:", googleUserId);
}

// リフレッシュトークンをDeno KVに保存または更新する関数
async function saveRefreshToken(
  kv: Deno.Kv,
  googleUserId: string,
  refreshToken: string,
) {
  const userKey = ["users", googleUserId];
  const user = await kv.get<User>(userKey);

  if (user.value) {
    user.value.refresh_token = refreshToken;
    await kv.set(userKey, user.value);
    console.log("リフレッシュトークンが更新されました:", googleUserId);
  } else {
    console.error("ユーザーが見つかりません:", googleUserId);
  }
}
