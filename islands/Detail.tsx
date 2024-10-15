// islands/Detail
import DetailProps from "../interface/DetailProps.ts";

export default function Detail({
    name,
    details,
    totalHours,
    selectedMonth,
}: DetailProps) {
    const decodedName = decodeURIComponent(name);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const handleMonthChange = (e: Event) => {
        const selected = (e.target as HTMLSelectElement).value;
        window.location.href = `/detail/${decodedName}?month=${selected}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}/${date.getMonth() + 1}/${
            date
                .getDate()
                .toString()
                .padStart(2, "0")
        }`;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getHours().toString().padStart(2, "0")}:${
            date
                .getMinutes()
                .toString()
                .padStart(2, "0")
        }`;
    };

    return (
        <div class="w-full mx-3">
            <div class="flex justify-between mt-4">
                <h1 class="text-2xl ml-3 font-bold">{decodedName}</h1>
                <button
                    class="mr-3 p-2 border border-gray-100 rounded-md hover:bg-gray-100 shadow bg-gray-50"
                    onClick={() => history.back()}
                >
                    戻る
                </button>
            </div>
            <div class="mt-4 ml-3">
                <label htmlFor="month">
                    <select
                        class="bg-gray-50 hover:bg-gray-100 p-2 border border-gray-100 rounded-md shadow"
                        id="month"
                        value={selectedMonth}
                        onChange={handleMonthChange}
                    >
                        {months.map((month) => (
                            <option key={month} value={month}>
                                {month}月
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <table class="mx-auto mt-8 rounded-xl overflow-hidden ring-1 ring-gray-100 shadow-lg bg-white w-2/3">
                <thead class="text-center bg-gray-200">
                    <tr>
                        <th class="p-2 border-r border-gray-100">日付</th>
                        <th class="p-2 border-r border-gray-100">開始時間</th>
                        <th class="p-2 border-r border-gray-100">終了時間</th>
                        <th class="p-2">合計</th>
                    </tr>
                </thead>
                <tbody>
                    {details.map((shift) => (
                        <tr class="text-center">
                            <td class="p-2 border-r border-gray-100">
                                {formatDate(shift.start)}
                            </td>
                            <td class="p-2 border-r border-gray-100">
                                {formatTime(shift.start)}
                            </td>
                            <td class="p-2 border-r border-gray-100">
                                {formatTime(shift.end)}
                            </td>
                            <td class="p-2">{shift.hours}時間</td>
                        </tr>
                    ))}
                    <tr class="text-center bg-gray-100">
                        <td class="p-2 border-r border-gray-100 font-bold">
                            合計
                        </td>
                        <td class="p-2"></td>
                        <td class="p-2"></td>
                        <td class="p-2 font-bold">{totalHours}時間</td>
                    </tr>
                </tbody>
            </table>
            <div class="h-20 w-full"></div>
        </div>
    );
}
