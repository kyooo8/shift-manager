import { HandlerContext } from "$fresh/server.ts";
import { supabase } from "../../lib/supabase.ts";

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
        // 新しいデータを取得・更新する処理をここに追加

        // 更新された人のIDリストを取得
        const updatedIds = ["id1", "id2", "id3"]; // 実際には更新されたデータのIDを取得

        // 更新されなかったデータを削除
        const { error } = await supabase
            .from("employee_hours")
            .delete()
            .eq("year", year)
            .eq("month", month)
            .not("id", "in", `(${updatedIds.join(",")})`);

        if (error) {
            throw error;
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
