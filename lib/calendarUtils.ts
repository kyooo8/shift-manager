import { supabase } from "./supabase.ts";

export async function mapUniqueIdsToCalendarIds(
    uniqueIds: string[],
    userId: string,
): Promise<{ [uniqueId: string]: string }> {
    const { data, error } = await supabase
        .from("users")
        .select("calendars")
        .eq("id", userId)
        .single();

    if (error || !data) {
        throw new Error("カレンダー情報の取得に失敗しました");
    }
    console.log("data", data);

    const calendars = data.calendars || [];
    const idMap: { [uniqueId: string]: string } = {};

    uniqueIds.forEach((uniqueId) => {
        const calendar = calendars.find((cal: any) =>
            cal.uniqueId === uniqueId
        );
        if (calendar) {
            idMap[uniqueId] = calendar.id;
        }
    });

    return idMap;
}
