// routes/api/deleteCalendar.ts

import { Calendar } from "../../interface/Calendar.ts";

export const handler = async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cookieHeader = req.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, ...v] = c.split("=");
      return [key.trim(), decodeURIComponent(v.join("="))];
    }),
  );

  const googleUserId = cookies.googleUserId;

  if (!googleUserId) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { uniqueId } = await req.json();

  try {
    if (!uniqueId) {
      return new Response(
        JSON.stringify({ error: "Calendar ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const kv = await Deno.openKv();

    // ユーザー情報を取得
    const userKey = ["users", googleUserId];
    const user = await kv.get<{ calendars: Calendar[] }>(userKey);

    if (!user.value || !user.value.calendars) {
      return new Response(
        JSON.stringify({ error: "User or calendars not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const calendars = user.value.calendars;

    // 指定されたカレンダーを削除
    const updatedCalendars = calendars.filter((calendar) =>
      calendar.uniqueId !== uniqueId
    );

    // 更新されたカレンダー情報を保存
    user.value.calendars = updatedCalendars;
    await kv.set(userKey, user.value);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error deleting calendar:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
