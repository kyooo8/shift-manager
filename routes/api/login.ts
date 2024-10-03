// routes/api/login.ts
export function handler(req: Request): Response {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const redirectUrl = Deno.env.get("REDIRECT_URL") ||
    "http://localhost:8000/api/callback";
  const scope = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" ");

  const authUrl =
    `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUrl}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return Response.redirect(authUrl, 302);
}
