//routes/api/shits.ts
import { handler as shiftsHandler } from "./shiftsHandler.ts";
import EmployeeData from "../../interface/EmployeeData.ts";
import { supabase } from "../../lib/supabase.ts";

export const handler = async (req: Request): Promise<Response> => {
  const shiftsResponse = await shiftsHandler(req);

  if (!shiftsResponse.ok) {
    const errorData = await shiftsResponse.json();
    console.error("Error fetching shifts:", errorData.error);
    return new Response(
      JSON.stringify({
        error: errorData.error,
        status: shiftsResponse.status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  const hoursByName = await shiftsResponse.json();
  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const year = new Date().getFullYear();
  const docId = `${year}-${month}`;
  const updateDate = new Date();

  try {
    const entries = Object.entries(hoursByName).map(([name, data]) => {
      const { details, totalHours = 0 } = data as EmployeeData;
      return {
        id: `${docId}-${name}`,
        name,
        total_hours: totalHours,
        details,
        update_date: updateDate.toISOString(),
      };
    });

    const { error } = await supabase
      .from("employee_hours")
      .upsert(entries, { onConflict: "id" });

    if (error) {
      throw new Error(
        `Failed to save data to Supabase: ${error.message || error}`,
      );
    }
  } catch (error) {
    console.error("Error adding document:", error);
    return new Response(JSON.stringify({ error: "Failed to save data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(hoursByName), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
