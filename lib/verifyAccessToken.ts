// lib/verifyAccessToken.ts
export async function verifyAccessToken(accessToken: string): Promise<boolean> {
    const response = await fetch(
        "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" +
            accessToken,
    );

    if (response.ok) {
        return true;
    } else {
        return false;
    }
}
