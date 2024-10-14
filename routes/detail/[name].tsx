//detail/[name]
import { Handlers, PageProps } from "$fresh/server.ts";
import Detail from "../../islands/Detail.tsx";
import { supabase } from "../../lib/supabase.ts";

export const handler: Handlers = {
    async GET(req, ctx) {
        const { name } = ctx.params;
        const decodedName = decodeURIComponent(name);
        const url = new URL(req.url);
        const month = url.searchParams.get("month") ||
            String(new Date().getMonth() + 1);
        const calendarId = url.searchParams.get("calendarId");
        const year = new Date().getFullYear();
        const monthInt = Number(month);

        const docId = `${year}-${monthInt}-${calendarId}-${decodedName}`;
        console.log(docId);

        const { data, error } = await supabase.from("employee_hours").select(
            "details,total_hours",
        ).eq("id", docId).maybeSingle();

        if (error || !data) {
            console.log("Error fetching user details:", error);
            return ctx.render({
                error: "ユーザーの詳細情報の取得に失敗しました",
            });
        }

        return ctx.render({
            name,
            details: data.details,
            totalHours: data.total_hours,
            selectedMonth: Number(month),
        });
    },
};

export default function DetailPage(props: PageProps) {
    const { name, details, totalHours, selectedMonth, error } = props.data;

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div class="w-full">
            <Detail
                name={name}
                details={details}
                totalHours={totalHours}
                selectedMonth={selectedMonth}
            />
        </div>
    );
}
