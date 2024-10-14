// routes/api/getHours.ts
import { supabase } from "../../lib/supabase.ts";
import { FreshContext } from "$fresh/server.ts";

export const handler = async (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get("month");
    const calendarIdsQuery = url.searchParams.get("calendar_ids");
    const calendarIds = calendarIdsQuery ? calendarIdsQuery.split(",") : [];
    const year = new Date().getFullYear();

    // 月のバリデーション
    const monthInt = month ? parseInt(month, 10) : NaN;
    if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
      return new Response(
        JSON.stringify({ error: "有効な月を指定してください。" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!Array.isArray(calendarIds) || calendarIds.length === 0) {
      return new Response(
        JSON.stringify({
          error: "少なくとも1つのカレンダーIDを指定してください。",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Supabase クエリの最適化: 複数の calendar_id を一度に取得
    const { data, error } = await supabase
      .from("employee_hours")
      .select("name, total_hours, update_date, calendar_id")
      .eq("year", year)
      .eq("month", monthInt)
      .in("calendar_id", calendarIds);

    if (error) {
      console.error("Supabaseエラー:", error);
      throw new Error("データの取得に失敗しました。");
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: "指定された月のデータが見つかりません。" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const hoursByName: { [key: string]: { totalHours: number } } = {};
    let lastUpdateDate = "";

    data.forEach((entry: any) => {
      const { name, total_hours, update_date } = entry;

      if (!hoursByName[name]) {
        hoursByName[name] = { totalHours: 0 };
      }
      hoursByName[name].totalHours += total_hours;

      if (
        update_date &&
        (!lastUpdateDate || new Date(update_date) > new Date(lastUpdateDate))
      ) {
        lastUpdateDate = update_date;
      }
    });

    console.log("getHours", hoursByName);

    return new Response(
      JSON.stringify({ hoursByName, updateDate: lastUpdateDate }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error fetching total hours:", error);

    return new Response(
      JSON.stringify({
        error: "シフトの取得に失敗しました。",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
