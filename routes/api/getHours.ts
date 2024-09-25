import { FreshContext } from "$fresh/server.ts";
import { supabase } from "../../lib/supabase.ts";

export const handler = async (
  _req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const url = new URL(_req.url);
  const month = url.searchParams.get("month");
  const year = new Date().getFullYear();
  const docId = `${year}-${month}`;

  try {
    const { data, error } = await supabase
      .from("employee_hours")
      .select("name,total_hours,update_date")
      .like("id", `%${docId}%`);

    if (error) {
      throw new Error("Failed to retrieve data from Supabase");
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: "No data found for the given month" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const hoursByName: {
      [key: string]: number;
    } = {};
    let lastUpdateDate = "";

    data.forEach((entry) => {
      hoursByName[entry.name] = entry.total_hours;
      if (
        entry.update_date &&
        (!lastUpdateDate ||
          new Date(entry.update_date) > new Date(lastUpdateDate))
      ) {
        lastUpdateDate = entry.update_date;
      }
    });

    return new Response(
      JSON.stringify({ hoursByName, updateDate: lastUpdateDate }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching total hours:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to retrieve shifts",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
