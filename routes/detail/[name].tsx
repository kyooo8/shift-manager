// detail/[name]

import { Handlers, PageProps } from "$fresh/server.ts";
import Detail from "../../islands/Detail.tsx";
import { Header } from "../../components/header.tsx";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { name } = ctx.params;
    const decodedName = decodeURIComponent(name);
    const url = new URL(req.url);
    const month = url.searchParams.get("month") ||
      String(new Date().getMonth() + 1);
    const calendarUniqueId = url.searchParams.get("calendar_unique_id");

    if (!calendarUniqueId) {
      return ctx.render({
        error: "カレンダーIDが指定されていません",
      });
    }

    const year = new Date().getFullYear();
    const monthInt = Number(month);

    try {
      const kv = await Deno.openKv();

      // Deno KVからデータを取得
      const data = await kv.get<{ details: any; total_hours: number }>([
        "employee_hours",
        year,
        monthInt,
        calendarUniqueId,
        decodedName,
      ]);

      if (!data.value) {
        console.error("No data found for docId:", decodedName);
        return ctx.render({
          error: "ユーザーの詳細情報の取得に失敗しました",
        });
      }

      return ctx.render({
        name,
        details: data.value.details,
        totalHours: data.value.total_hours,
        selectedMonth: Number(month),
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      return ctx.render({
        error: "ユーザーの詳細情報の取得中にエラーが発生しました",
      });
    }
  },
};

export default function DetailPage(props: PageProps) {
  const { name, details, totalHours, selectedMonth, error } = props.data;

  if (error) {
    return <p>{error}</p>;
  }

  const decodedName = decodeURIComponent(name);

  return (
    <>
      <Header title={decodedName} />
      <Detail
        name={name}
        details={details}
        totalHours={totalHours}
        selectedMonth={selectedMonth}
      />
    </>
  );
}
