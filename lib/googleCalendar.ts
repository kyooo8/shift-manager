//lib/googleCalendar.ts
import EmployeeData from "../interface/EmployeeData.ts";

const CALENDAR_ID = Deno.env.get("GOOGLE_CALENDAR_ID")!;
const GOOGLE_API_BASE_URL = "https://www.googleapis.com/calendar/v3";

export async function getTotalHours(
  accessToken: string,
  timeMin: string,
  timeMax: string,
): Promise<Record<string, EmployeeData>> {
  const results: Record<string, EmployeeData> = {};
  let pageToken: string | undefined = undefined;

  console.log("Access Token:", accessToken);
  console.log("Time Min:", timeMin);
  console.log("Time Max:", timeMax);

  do {
    const url = new URL(
      `${GOOGLE_API_BASE_URL}/calendars/${
        encodeURIComponent(CALENDAR_ID)
      }/events`,
    );
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("maxResults", "2500");
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    console.log("Request URL:", url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("Response Status:", response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to fetch events:", error);
      throw new Error(`Failed to fetch events: ${error}`);
    }

    const data = await response.json();
    console.log("Data received:", JSON.stringify(data, null, 2));

    const events = data.items || [];
    console.log("Number of events fetched:", events.length);

    for (const event of events) {
      const summary = event.summary || "";
      console.log("Event Summary:", summary);

      const name = summary.split(" ")[0];
      console.log("Extracted Name:", name);

      // 名前が空、null、またはerrorという名前の場合、スキップ
      if (!name || name === "error" || summary.includes("★募集")) {
        console.log("Skipping event due to invalid name or summary.");
        continue;
      }

      const startDate = event.start?.dateTime || event.start?.date;
      const endDate = event.end?.dateTime || event.end?.date;

      console.log("Start Date:", startDate);
      console.log("End Date:", endDate);

      if (!startDate || !endDate) {
        console.log("Skipping event due to missing start or end date.");
        continue;
      }

      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();
      const hours = (new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60);

      console.log("Calculated Hours:", hours);

      if (!results[name]) {
        results[name] = { totalHours: 0, details: [] };
        console.log(`Created new entry for ${name}.`);
      }

      results[name].totalHours += hours;
      results[name].details.push({ start, end, hours });

      console.log(
        `Updated total hours for ${name}:`,
        results[name].totalHours,
      );
    }

    pageToken = data.nextPageToken || undefined;
    console.log("Next Page Token:", pageToken);
  } while (pageToken);

  console.log("Final Results:", JSON.stringify(results, null, 2));

  return results;
}
