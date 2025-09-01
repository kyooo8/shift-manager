import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Calendar } from "../../interface/Calendar.ts";

const APP_URL = Deno.env.get("URL") || "http://localhost:8000";
const isProduction = APP_URL.startsWith("https://");

interface User {
  id: string;
  name: string;
  refresh_token?: string;
  calendars?: Calendar[];
}

const auth = new Hono();

auth.get("/login", (c) => {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const redirectUrl = `${APP_URL}/api/auth/callback`;
  const scope = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" ");

  const authUrl =
    `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUrl}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return c.redirect(authUrl, 302);
});

auth.get("/callback", async (c) => {
  const url = new URL(c.req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return c.json({ error: "認証コードが見つかりません" }, 400);
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
  const redirectUri = `${APP_URL}/api/auth/callback`;

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
    return c.json({ error: "アクセストークンの取得に失敗しました" }, 500);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;

  if (!accessToken) {
    console.error(
      "アクセストークンが取得できませんでした。トークンデータ:",
      tokenData,
    );
    return c.json({ error: "アクセストークンが取得できませんでした" }, 500);
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
    return c.json({ error: "ユーザー情報の取得に失敗しました" }, 500);
  }

  const userInfo = await userInfoResponse.json();
  const googleUserId = userInfo.sub;

  const kv = await Deno.openKv();

  const userKey = ["users", googleUserId];
  const existingUser = await kv.get(userKey);

  if (!existingUser.value) {
    await saveUser(kv, googleUserId, userInfo);
  }

  if (refreshToken) {
    await saveRefreshToken(kv, googleUserId, refreshToken);
  }

  setCookie(c, "accessToken", accessToken, {
    path: "/",
    secure: isProduction,
    httpOnly: true,
    sameSite: "Lax",
  });
  setCookie(c, "googleUserId", googleUserId, {
    path: "/",
    secure: isProduction,
    httpOnly: true,
    sameSite: "Lax",
  });

  return c.redirect("/");
});

auth.get("/logout", (c) => {
  deleteCookie(c, "accessToken", { path: "/", secure: true });
  deleteCookie(c, "googleUserId", { path: "/", secure: true });

  return c.redirect("/login");
});

auth.get("/getUserName", async (c) => {
  const googleUserId = getCookie(c, "googleUserId");
  if (!googleUserId) {
    return c.json({ error: "ログインしていません" }, 401);
  }

  const kv = await Deno.openKv();
  const userKey = ["users", googleUserId];
  const user = await kv.get<User>(userKey);

  if (user.value) {
    return c.json({ name: user.value.name });
  } else {
    return c.json({ error: "ユーザーが見つかりません" }, 404);
  }
});

export default auth;

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
