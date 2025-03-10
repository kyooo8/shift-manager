import { verifyAccessToken } from "../../lib/verifyAccessToken.ts";
import { mapUniqueIdsToCalendarIds } from "../../lib/calendarUtils.ts";
import { getTotalHours } from "../../lib/googleCalendar.ts";

export const handler = async (req: Request): Promise<Response> => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { month, calendar_unique_ids } = await req.json();
    const calendarUniqueIds: string[] = calendar_unique_ids;

    // 月のバリデーション
    const monthInt = month ? parseInt(month, 10) : NaN;
    if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
      return new Response(
        JSON.stringify({ error: "有効な月を指定してください。" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!Array.isArray(calendarUniqueIds) || calendarUniqueIds.length === 0) {
      return new Response(
        JSON.stringify({
          error: "少なくとも1つのカレンダーを指定してください。",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const year = new Date().getFullYear();
    const timeMin = new Date(year, monthInt - 1, 1).toISOString();
    const timeMax = new Date(year, monthInt, 1).toISOString();

    const cookieHeader = req.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, ...v] = c.split("=");
        return [key.trim(), decodeURIComponent(v.join("="))];
      }),
    );

    let accessToken = cookies.accessToken;
    const userId = cookies.googleUserId;
    if (!accessToken) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
    }

    // アクセストークンの検証とリフレッシュ
    const isValid = await verifyAccessToken(accessToken);
    if (!isValid) {
      const refreshResponse = await fetch(
        "http://localhost:8000/api/refreshAccessToken",
        {
          method: "POST",
          headers: {
            Cookie: cookieHeader,
          },
        },
      );
      const newCookies = refreshResponse.headers.get("set-cookie");
      if (newCookies) {
        accessToken = newCookies.match(/accessToken=([^;]+)/)?.[1] || "";
      }
    }

    // uniqueIdからcalendarIdへのマッピングを取得
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

    return new Response(
      JSON.stringify({
        message: "シフトが正常に保存され、古いデータが削除されました。",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error saving shifts:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
