import { Calendar } from "../../interface/Calendar.ts";
interface User {
  id: string;
  name: string;
  refresh_token?: string;
  calendars?: Calendar[];
}

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

  const newCalendar: Calendar = await req.json();

  try {
    if (!newCalendar.name || !newCalendar.color) {
      return new Response(
        JSON.stringify({ error: "Invalid calendar data" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const uniqueId = crypto.randomUUID();
    const calendarToAdd = { ...newCalendar, uniqueId };

    const kv = await Deno.openKv();
    const userKey = ["users", googleUserId];

    // 既存のユーザーデータを取得
    const user = await kv.get<User & { calendars?: Calendar[] }>(userKey);

    if (!user.value) {
      return new Response(
        JSON.stringify({ error: "ユーザーが見つかりません" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 既存のカレンダーをマージ
    const calendars = user.value.calendars || [];
    calendars.push(calendarToAdd);

    // 統合されたデータを保存
    const updatedUser = { ...user.value, calendars };
    await kv.set(userKey, updatedUser);

    return new Response(JSON.stringify(calendarToAdd), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error adding calendar:", error);
    return new Response(
      JSON.stringify({ error: "カレンダーの追加中にエラーが発生しました" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
