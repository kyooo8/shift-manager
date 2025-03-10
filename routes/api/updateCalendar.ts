// routes/api/updateCalendar.ts

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

  const updatedCalendar: Calendar = await req.json();

  try {
    // 必須フィールドのチェック
    if (
      !updatedCalendar.uniqueId ||
      !updatedCalendar.name || !updatedCalendar.color
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid calendar data" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const kv = await Deno.openKv();

    // ユーザー情報の型定義
    interface User {
      calendars: Calendar[];
    }

    // ユーザーのカレンダーを取得
    const userKey = ["users", googleUserId];
    const user = await kv.get<User>(userKey);

    if (!user.value) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const calendars = user.value.calendars || [];

    // 特定のカレンダーを更新
    const updatedCalendars = calendars.map((calendar) =>
      calendar.uniqueId === updatedCalendar.uniqueId
        ? { ...calendar, ...updatedCalendar } // nameとcolorのみ更新
        : calendar
    );

    // 更新されたカレンダーを保存
    user.value.calendars = updatedCalendars;
    await kv.set(userKey, user.value);

    // 更新されたカレンダーを返す
    const savedCalendar = updatedCalendars.find(
      (cal) => cal.uniqueId === updatedCalendar.uniqueId,
    );

    return savedCalendar
      ? new Response(JSON.stringify(savedCalendar), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
      : new Response(
        JSON.stringify({ error: "Calendar not found after update" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
  } catch (error: any) {
    console.error("Error updating calendar:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
