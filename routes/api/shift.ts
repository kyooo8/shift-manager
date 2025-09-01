import { Hono } from "hono";
import { mapUniqueIdsToCalendarIds } from "../../lib/calendarUtils.ts";
import { getTotalHours } from "../../lib/googleCalendar.ts";
import { getCookie } from "hono/cookie";

interface EmployeeHourDetail {
  name: string;
  totalHours: number;
  calendarUniqueId: string;
}

interface GetHoursResponse {
  hoursByName: EmployeeHourDetail[];
  updateDate: { [key: string]: string };
  error?: string;
}

const kv = await Deno.openKv();

const shift = new Hono();

shift.post("/acquire", async (c) => {
  try {
    const { month, calendar_unique_ids } = await c.req.json();
    const calendarUniqueIds: string[] = calendar_unique_ids;

    // 月のバリデーション
    const monthInt = month ? parseInt(month, 10) : NaN;
    if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
      return c.json({ error: "有効な月を指定してください。" }, 400);
    }

    if (!Array.isArray(calendarUniqueIds) || calendarUniqueIds.length === 0) {
      return c.json({
        error: "少なくとも1つのカレンダーを指定してください。",
      }, 400);
    }

    const year = new Date().getFullYear();
    const timeMin = new Date(year, monthInt - 1, 1).toISOString();
    const timeMax = new Date(year, monthInt, 1).toISOString();

    let accessToken = getCookie(c, "accessToken");
    const userId = getCookie(c, "googleUserId");

    if (!accessToken || !userId) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
    }

    const idMap = await mapUniqueIdsToCalendarIds(calendarUniqueIds, userId);
    const calendarIds = calendarUniqueIds.map((uniqueId) => idMap[uniqueId]);

    const fetchPromises = calendarIds.map((calendarId: string) =>
      getTotalHours(
        accessToken,
        timeMin,
        timeMax,
        [calendarId],
      )
    );

    const hoursByCalendarsArray = await Promise.all(fetchPromises);

    const kv = await Deno.openKv();

    // 新しくアップサートしたデータのIDを記録
    const updatedIds: string[] = [];

    // Deno KVにデータを保存
    for (const [index, hoursByName] of hoursByCalendarsArray.entries()) {
      const calendarUniqueId = calendarUniqueIds[index];

      for (
        const [name, { totalHours, details }] of Object.entries(
          hoursByName,
        )
      ) {
        const key = [
          "employee_hours",
          year,
          monthInt,
          calendarUniqueId,
          name,
        ];
        const id = `${year}-${monthInt}-${calendarUniqueId}-${name}`;
        updatedIds.push(id);

        await kv.set(key, {
          name,
          total_hours: totalHours,
          update_date: new Date().toISOString(),
          calendar_unique_id: calendarUniqueId,
          year,
          month: monthInt,
          details,
        });
      }
    }

    // 古いデータの削除
    const iterator = kv.list({ prefix: ["employee_hours", year, monthInt] });
    for await (const entry of iterator) {
      const calendarUniqueId = entry.key[3] as string;
      const name = entry.key[4] as string;

      const id = `${year}-${monthInt}-${calendarUniqueId}-${name}`;
      if (!updatedIds.includes(id)) {
        await kv.delete(entry.key);
      }
    }

    return c.json({
      message: "シフトが正常に保存され、古いデータが削除されました。",
    }, 200);
  } catch (error: any) {
    console.error("Error saving shifts:", error);
    return c.json({ error: error.message }, 500);
  }
});

shift.get("/getHours", async (c) => {
  try {
    const url = new URL(c.req.url);
    const month = url.searchParams.get("month");
    const calendar_unique_ids = url.searchParams.get("calendar_unique_ids") ||
      "";
    const calendarUniqueIds: string[] = calendar_unique_ids
      ? calendar_unique_ids.split(",")
      : [];

    if (
      !month || isNaN(parseInt(month)) || parseInt(month) < 1 ||
      parseInt(month) > 12
    ) {
      return c.json({ error: "有効な月を指定してください。" }, 400);
    }

    if (!Array.isArray(calendarUniqueIds) || calendarUniqueIds.length === 0) {
      return c.json({
        error: "少なくとも1つのカレンダーを指定してください。",
      }, 400);
    }

    const year = new Date().getFullYear();

    const kv = await Deno.openKv();

    const hoursByName: EmployeeHourDetail[] = [];
    const updateDate: { [key: string]: string } = {};

    // 各カレンダーIDに対してデータを取得
    for (const calendarUniqueId of calendarUniqueIds) {
      const prefix = [
        "employee_hours",
        year,
        parseInt(month),
        calendarUniqueId,
      ];

      const iterator = kv.list({ prefix });

      // for await (const entry of iterator) {
      //   console.log("Found entry:", entry.key, entry.value);
      // }

      for await (const entry of iterator) {
        const data = entry.value as {
          name: string;
          total_hours: number;
          update_date: string;
          calendar_unique_id: string;
        };

        hoursByName.push({
          name: data.name,
          totalHours: data.total_hours,
          calendarUniqueId: data.calendar_unique_id,
        });

        const existingDate = updateDate[data.calendar_unique_id];
        if (
          !existingDate || new Date(data.update_date) > new Date(existingDate)
        ) {
          updateDate[data.calendar_unique_id] = data.update_date;
        }
      }
    }

    return c.json({ hoursByName, updateDate }, 200);
  } catch (error: any) {
    console.error("Error fetching hours:", error);
    return c.json({ error: error.message }, 500);
  }
});

shift.get("/updateData", async (c) => {
  const url = new URL(c.req.url);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  if (!month || !year) {
    return c.json({ error: "年月を指定してください。" }, 400);
  }

  try {
    const kv = await Deno.openKv();

    // 新しいデータを取得・更新する処理をここに追加
    const updatedIds = ["id1", "id2", "id3"]; // 実際には更新されたデータのIDを取得

    // 既存のデータを走査し、削除対象を決定
    const iterator = kv.list({ prefix: [`employee_hours`, year, month] });
    for await (const entry of iterator) {
      const id = String(entry.key[3]); // 明示的に string に変換
      if (!updatedIds.includes(id)) {
        await kv.delete(entry.key); // 不要なデータを削除
      }
    }

    // 更新されたデータを追加または更新
    for (const id of updatedIds) {
      const key = [`employee_hours`, year, month, id];
      await kv.set(key, { year, month, id, updated: true }); // 必要に応じて適切なデータを設定
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating data:", error);
    return c.json({ error: "データの更新に失敗しました。" }, 500);
  }
});

export default shift;
