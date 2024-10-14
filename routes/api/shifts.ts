// routes/api/shifts.ts
import { supabase } from "../../lib/supabase.ts";
import { EmployeeHourDetail, getTotalHours } from "../../lib/googleCalendar.ts";

export const handler = async (req: Request): Promise<Response> => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { month, calendar_ids } = await req.json();
    const calendarIds: string[] = calendar_ids;

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

    if (!Array.isArray(calendarIds) || calendarIds.length === 0) {
      return new Response(
        JSON.stringify({
          error: "少なくとも1つのカレンダーIDを指定してください。",
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

    const accessToken = cookies.accessToken;
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "認証されていません。" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

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
        const calendarId = calendarIds[index];
        const insertData = Object.entries(hoursByName).map(([
          name,
          { totalHours, details },
        ]) => {
          const id = `${year}-${monthInt}-${calendarId}-${name}`;
          updatedIds.push(id); // アップサート対象のIDを記録
          return {
            id,
            name,
            total_hours: totalHours,
            update_date: new Date().toISOString(),
            calendar_id: calendarId,
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

    // 削除処理: 今回のアップサートで使用したIDと一致しないエントリを削除
    const { error: deleteError } = await supabase
      .from("employee_hours")
      .delete()
      .eq("year", year)
      .eq("month", monthInt)
      .in("calendar_id", calendarIds)
      .not("id", "in", updatedIds); // 今回アップサートしたID以外を削除

    if (deleteError) {
      throw new Error(`古いデータの削除に失敗しました: ${deleteError.message}`);
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
