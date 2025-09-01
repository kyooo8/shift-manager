import { Hono } from "hono";
import { Calendar } from "../../interface/Calendar.ts";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

interface User {
  id: string;
  name: string;
  refresh_token?: string;
  calendars?: Calendar[];
}

const calendar = new Hono();

// calendar
calendar.post("/update", async (c) => {
  const googleUserId = getCookie(c, "googleUserId");

  if (!googleUserId) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const updatedCalendar: Calendar = await c.req.json();

  try {
    if (
      !updatedCalendar.uniqueId ||
      !updatedCalendar.name || !updatedCalendar.color
    ) {
      return c.json({ error: "Invalid calendar data" }, 400);
    }

    const kv = await Deno.openKv();

    interface User {
      calendars: Calendar[];
    }

    const userKey = ["users", googleUserId];
    const user = await kv.get<User>(userKey);

    if (!user.value) {
      return c.json({ error: "User not found" }, 404);
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
      ? c.json({ savedCalendar }, 200)
      : c.json({ error: "Calendar not found after update" }, 400);
  } catch (error: any) {
    console.error("Error updating calendar:", error);
    return c.json({ error: error.message }, 500);
  }
});
calendar.post("/delete", async (c) => {
  const googleUserId = getCookie(c, "googleUserId");

  if (!googleUserId) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const { uniqueId } = await c.req.json();

  try {
    if (!uniqueId) {
      return c.json({ error: "Calendar ID is required" }, 400);
    }

    const kv = await Deno.openKv();

    const userKey = ["users", googleUserId];
    const user = await kv.get<{ calendars: Calendar[] }>(userKey);

    if (!user.value || !user.value.calendars) {
      return c.json({ error: "User or calendars not found" }, 404);
    }

    const calendars = user.value.calendars;

    const updatedCalendars = calendars.filter((calendar) =>
      calendar.uniqueId !== uniqueId
    );

    user.value.calendars = updatedCalendars;
    await kv.set(userKey, user.value);

    return c.json({ success: true }, 200);
  } catch (error: any) {
    console.error("Error deleting calendar:", error);
    return c.json({ error: error.message }, 500);
  }
});
calendar.post("/add", async (c) => {
  const googleUserId = getCookie(c, "googleUserId");

  if (!googleUserId) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const newCalendar: Calendar = await c.req.json();

  try {
    if (!newCalendar.name || !newCalendar.color) {
      return c.json({ error: "Invalid calendar data" }, 400);
    }

    const uniqueId = crypto.randomUUID();
    const calendarToAdd = { ...newCalendar, uniqueId };

    const kv = await Deno.openKv();
    const userKey = ["users", googleUserId];

    const user = await kv.get<User & { calendars?: Calendar[] }>(userKey);

    if (!user.value) {
      return c.json({ error: "ユーザーが見つかりません" }, 404);
    }

    const calendars = user.value.calendars || [];
    calendars.push(calendarToAdd);

    const updatedUser = { ...user.value, calendars };
    await kv.set(userKey, updatedUser);

    return c.json({ calendarToAdd }, 200);
  } catch (error: any) {
    console.error("Error adding calendar:", error);
    return c.json({ error: "カレンダーの追加中にエラーが発生しました" }, 500);
  }
});
calendar.get("/get", async (c) => {
  const userId = getCookie(c, "googleUserId");

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "ユーザーが認証されていません" }),
      { status: 401 },
    );
  }

  try {
    const kv = await Deno.openKv();

    const userKey = ["users", userId];
    const user = await kv.get<{ calendars: Calendar[] }>(userKey);

    if (!user.value || !user.value.calendars) {
      return c.json({ calendars: [] }, 200);
    }

    const calendars: Calendar[] = user.value.calendars.map((cal) => ({
      uniqueId: cal.uniqueId,
      name: cal.name,
      color: cal.color,
    }));

    return c.json({ calendars }, 200);
  } catch (error: any) {
    console.error("Error fetching calendars:", error);
    return c.json({ error: "カレンダー情報の取得に失敗しました" }, 500);
  }
});

export default calendar;
