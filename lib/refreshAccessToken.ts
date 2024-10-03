// lib/refreshAccessToken.ts
export async function refreshAccessToken(
    refreshToken: string,
): Promise<string | null> {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }).toString(),
    });

    if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error(
            "アクセストークンのリフレッシュに失敗しました:",
            errorText,
        );
        return null;
    }

    const tokenData = await tokenResponse.json();
    const newAccessToken = tokenData.access_token;

    return newAccessToken;
}
