//routes/api/shitsHandler.ts
import { getTotalHours } from "../../lib/googleCalendar.ts";

export const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const namesQuery = url.searchParams.get("names");
    const names = typeof namesQuery === "string" ? namesQuery.split(",") : [];
    const month = parseInt(url.searchParams.get("month") || "");

    if (isNaN(month) || month < 1 || month > 12) {
      return new Response(JSON.stringify({ error: "invalid month value" }), {
        status: 400,
        headers: { "Content-type": "application/json" },
      });
    }

    const year = new Date().getFullYear();
    const timeMin = new Date(year, month - 1, 1).toISOString();
    const timeMax = new Date(year, month, 0, 23, 59, 59).toISOString();

    const cookieHeader = req.headers.get("Cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [key, ...v] = c.split("=");
        return [key.trim(), decodeURIComponent(v.join("="))];
      }),
    );

    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // getTotalHours関数でシフトデータを取得
    const hoursByName = await getTotalHours(accessToken, timeMin, timeMax);

    // フィルタされた結果を返す
    const filteredResults = names.length
      ? Object.fromEntries(
        Object.entries(hoursByName).filter(([name]) => names.includes(name)),
      )
      : hoursByName;

    return new Response(JSON.stringify(filteredResults), {
      status: 200,
      headers: { "Content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to retrieve shifts" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
