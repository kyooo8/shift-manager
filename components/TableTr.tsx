// components/TableTr.tsx

interface TableTrProps {
  name: string;
  totalHours: number;
  selectedMonth: number;
  color: string;
  calendarUniqueId: string;
}

export const TableTr = (
  { name, totalHours, selectedMonth, color, calendarUniqueId }: TableTrProps,
) => {
  return (
    <tr
      onClick={() => {
        globalThis.location.href =
          `/detail/${name}?month=${selectedMonth}&calendar_unique_id=${calendarUniqueId}`;
      }}
    >
      <td
        class="p-2 border-r border-gray-100 truncate ... w-1/2 text-center"
        style={{ color: `${color}` }}
      >
        {name}
      </td>
      <td class="p-2 w-1/2 truncate ... text-center">
        {totalHours}時間
      </td>
    </tr>
  );
};
