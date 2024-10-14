// components/TableTr.tsx

interface TableTrProps {
    name: string;
    totalHours: number;
    selectedMonth: number;
    color: string;
    calendarId: string;
}

export const TableTr = (
    { name, totalHours, selectedMonth, color, calendarId }: TableTrProps,
) => {
    return (
        <tr>
            <td
                class="p-2 border-r border-gray-100"
                style={{ color: `${color}` }}
            >
                <a
                    href={`/detail/${name}?month=${selectedMonth}&calendarId=${calendarId}`}
                >
                    {name}
                </a>
            </td>
            <td class="p-2">
                <a href={`/detail/${name}?month=${selectedMonth}`}>
                    {totalHours}時間
                </a>
            </td>
        </tr>
    );
};
