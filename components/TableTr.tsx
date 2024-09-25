interface Props {
    name: string;
    hours: number;
    selectedMonth: number;
}

export function TableTr({ name, selectedMonth, hours }: Props) {
    return (
        <tr
            class="text-center cursor-pointer hover:bg-gray-100"
            key={name}
            onClick={() => (window.location.href = `/detail/${
                encodeURIComponent(name)
            }?month=${selectedMonth}`)}
        >
            <td class="p-2 border-r border-b border-gray-100">{name}</td>
            <td class="p-2 border-b border-gray-100">{hours}時間</td>
        </tr>
    );
}
