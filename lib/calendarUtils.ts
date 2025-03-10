export async function mapUniqueIdsToCalendarIds(
  uniqueIds: string[],
  userId: string,
): Promise<{ [uniqueId: string]: string }> {
  const kv = await Deno.openKv();

  // ユーザー情報をDeno KVから取得
  const userKey = ["users", userId];
  const user = await kv.get<{ calendars: { uniqueId: string; id: string }[] }>(
    userKey,
  );

  if (!user.value || !user.value.calendars) {
    throw new Error("カレンダー情報の取得に失敗しました");
  }

  console.log("Fetched user data from Deno KV:", user.value);

  const calendars = user.value.calendars;
  const idMap: { [uniqueId: string]: string } = {};

  // uniqueIdをkeyに、対応するcalendarIdをマッピング
  uniqueIds.forEach((uniqueId) => {
    const calendar = calendars.find((cal) => cal.uniqueId === uniqueId);
    if (calendar) {
      idMap[uniqueId] = calendar.id;
    }
  });

  return idMap;
}
