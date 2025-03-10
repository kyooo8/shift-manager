// routes/api/getCalendars.ts

import { Calendar } from "../../interface/Calendar.ts";

export const handler = async (req: Request): Promise<Response> => {
  const cookieHeader = req.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, ...v] = c.split("=");
      return [key.trim(), decodeURIComponent(v.join("="))];
    }),
  );

  const userId = cookies.googleUserId;

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "ユーザーが認証されていません" }),
      { status: 401 },
    );
  }

  try {
    const kv = await Deno.openKv();

    // Deno KVからカレンダー情報を取得
    const userKey = ["users", userId];
    const user = await kv.get<{ calendars: Calendar[] }>(userKey);

    if (!user.value || !user.value.calendars) {
      return new Response(
        JSON.stringify({ error: "カレンダー情報が見つかりません" }),
        { status: 404 },
      );
    }

    const calendars: Calendar[] = user.value.calendars.map((cal) => ({
      uniqueId: cal.uniqueId,
      name: cal.name,
      color: cal.color,
    }));

    console.log(calendars);

    return new Response(JSON.stringify(calendars), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching calendars:", error);
    return new Response(
      JSON.stringify({ error: "カレンダー情報の取得に失敗しました" }),
      { status: 500 },
    );
  }
};
