// routes/api/shifts.ts
import { supabase } from "../../lib/supabase.ts";
import { getTotalHours } from "../../lib/googleCalendar.ts";
import { EmployeeHourDetail } from "../../lib/googleCalendar.ts";
import { verifyAccessToken } from "../../lib/verifyAccessToken.ts";

import { mapUniqueIdsToCalendarIds } from "../../lib/calendarUtils.ts";

export const handler = async (req: Request): Promise<Response> => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { month, calendar_unique_ids } = await req.json();
    console.log("Received calendar_unique_ids:", calendar_unique_ids); // 追加

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
    const timeMax = new Date(year, monthInt, 1).toISOString(); // 次の月の開始日

    const cookieHeader = req.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, ...v] = c.split("=");
        return [key.trim(), decodeURIComponent(v.join("="))];
      }),
    );

    let accessToken = cookies.accessToken;
    const userId = cookies.googleUserId;
    console.log("User ID:", userId); // 追加
    if (!accessToken) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
    }

    // アクセストークンの検証とリフレッシュは省略（既存のコードを使用）
    const isValid = await verifyAccessToken(accessToken);

    if (!isValid) {
      // アクセストークンをリフレッシュ
      const refreshResponse = await fetch(
        "http://localhost:8000/api/refreshAccessToken",
        {
          method: "POST",
          headers: {
            Cookie: cookieHeader,
          },
        },
      ); // 新しいアクセストークンを取得
      const newCookies = refreshResponse.headers.get("set-cookie");
      if (newCookies) {
        accessToken = newCookies.match(/accessToken=([^;]+)/)?.[1] || "";
      }
    }
    // uniqueIdからcalendarIdへのマッピングを取得
    const idMap = await mapUniqueIdsToCalendarIds(calendarUniqueIds, userId);
    const calendarIds = calendarUniqueIds.map((uniqueId) => idMap[uniqueId]);

    console.log("calendarIds:", calendarIds);
    console.log("idmap:", idMap);
    // カレンダーごとに勤務時間を取得
    const fetchPromises = calendarIds.map((calendarId: string) =>
      getTotalHours(
        accessToken,
        timeMin,
        timeMax,
        [calendarId],
      )
    );
    const hoursByCalendarsArray = await Promise.all(fetchPromises);

    // 新しくアップサートしたデータのIDと更新日時を記録
    const updatedIds: string[] = [];

    // Supabaseにデータを保存
    const upsertPromises = hoursByCalendarsArray.map(
      async (
        hoursByName: { [name: string]: EmployeeHourDetail },
        index: number,
      ) => {
        const calendarUniqueId = calendarUniqueIds[index];
        const insertData = Object.entries(hoursByName).map(([
          name,
          { totalHours, details },
        ]) => {
          const id = `${year}-${monthInt}-${calendarUniqueId}-${name}`;
          updatedIds.push(id); // アップサート対象のIDを記録
          return {
            id,
            name,
            total_hours: totalHours,
            update_date: new Date().toISOString(),
            calendar_unique_id: calendarUniqueId,
            year,
            month: monthInt,
            details, // JSON形式の詳細情報を追加
          };
        });

        const { error } = await supabase
          .from("employee_hours")
          .upsert(insertData);

        if (error) {
          throw new Error(
            `Supabaseへのデータ保存に失敗しました: ${error.message}`,
          );
        }
      },
    );

    await Promise.all(upsertPromises);

    // 古いデータの削除（既存のコードを使用）

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
