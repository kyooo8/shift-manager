// routes/api/getHours.ts
import { supabase } from "../../lib/supabase.ts";

interface EmployeeHourDetail {
  name: string; // 名前を追加
  totalHours: number;
  calendarUniqueId: string;
}

interface GetHoursResponse {
  hoursByName: EmployeeHourDetail[]; // 配列に変更
  updateDate: { [key: string]: string };
  error?: string;
}

export const handler = async (req: Request): Promise<Response> => {
  try {
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    const calendar_unique_ids = url.searchParams.get("calendar_unique_ids");
    const calendarUniqueIds: string[] = calendar_unique_ids
      ? calendar_unique_ids.split(",")
      : [];

    if (
      !month || isNaN(parseInt(month)) || parseInt(month) < 1 ||
      parseInt(month) > 12
    ) {
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

    // データベースから該当する従業員のデータを取得
    const { data, error } = await supabase
      .from("employee_hours")
      .select("*")
      .eq("year", year)
      .eq("month", parseInt(month))
      .in("calendar_unique_id", calendarUniqueIds);

    if (error) {
      throw new Error(
        `Supabaseからのデータ取得に失敗しました: ${error.message}`,
      );
    }

    const hoursByName: EmployeeHourDetail[] = []; // 配列に変更
    const updateDate: { [key: string]: string } = {};

    data.forEach((entry: any) => {
      // 各従業員のデータを配列に追加
      hoursByName.push({
        name: entry.name,
        totalHours: entry.total_hours,
        calendarUniqueId: entry.calendar_unique_id,
      });

      // 各カレンダーの最新のupdateDateを取得
      const existingDate = updateDate[entry.calendar_unique_id];
      if (
        !existingDate || new Date(entry.update_date) > new Date(existingDate)
      ) {
        updateDate[entry.calendar_unique_id] = entry.update_date;
      }
    });

    const response: GetHoursResponse = {
      hoursByName,
      updateDate,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching hours:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
