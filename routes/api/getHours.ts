// routes/api/getHours.ts

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
