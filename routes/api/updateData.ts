// api/updateData
import { HandlerContext } from "$fresh/server.ts";

export const handler = async (req: Request, _ctx: HandlerContext) => {
  const url = new URL(req.url);
  const month = url.searchParams.get("month");
  const year = url.searchParams.get("year");

  if (!month || !year) {
    return new Response(
      JSON.stringify({ error: "年月を指定してください。" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const kv = await Deno.openKv();

    // 新しいデータを取得・更新する処理をここに追加
    const updatedIds = ["id1", "id2", "id3"]; // 実際には更新されたデータのIDを取得

    // 既存のデータを走査し、削除対象を決定
    const iterator = kv.list({ prefix: [`employee_hours`, year, month] });
    for await (const entry of iterator) {
      const id = String(entry.key[3]); // 明示的に string に変換
      if (!updatedIds.includes(id)) {
        await kv.delete(entry.key); // 不要なデータを削除
      }
    }

    // 更新されたデータを追加または更新
    for (const id of updatedIds) {
      const key = [`employee_hours`, year, month, id];
      await kv.set(key, { year, month, id, updated: true }); // 必要に応じて適切なデータを設定
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating data:", error);
    return new Response(
      JSON.stringify({ error: "データの更新に失敗しました。" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
