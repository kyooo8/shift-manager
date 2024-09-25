import { useEffect, useState } from "preact/hooks";

import { TableTr } from "../components/TableTr.tsx";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

export function List() {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [hoursByName, setHoursByName] = useState<{ [key: string]: number }>({});
  const [total, setTotal] = useState(0);
  const [updateDate, setUpdateDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchTotalHours = async (update = false) => {
    setLoading(true);
    setError(null);

    try {
      if (update) {
        await fetch(`api/shifts?month=${selectedMonth}`, {
          credentials: "include",
        });
      }

      const response = await fetch(`/api/getHours?month=${selectedMonth}`, {
        credentials: "include",
      });

      const data = await response.json();
      setHoursByName(data.hoursByName);
      if (data.updateDate) {
        const formatedDate = formatDate(data.updateDate);
        setUpdateDate(formatedDate);
      }

      const totalHours: number = Object.values(data.hoursByName).reduce<number>(
        (sum, hours) => sum + (hours as number),
        0,
      );
      setTotal(totalHours);
    } catch (error) {
      setHoursByName({});
      setTotal(0);
      setUpdateDate("");
      setError("データがありません");
      console.error("Error fetching total hours:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalHours();
  }, [selectedMonth]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        window.location.href = "/";
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div class="w-full">
      <div class="flex justify-between mt-4">
        <button
          class="ml-3 p-2 border border-gray-100 rounded-md hover:bg-gray-100 shadow bg-gray-50"
          onClick={() => fetchTotalHours(true)}
        >
          最新データ取得
        </button>
        <div class="flex">
          <button
            class="mr-3 p-2 border border-gray-100 rounded-md hover:bg-gray-100 shadow bg-gray-50"
            onClick={handleLogout}
          >
            ログアウト
          </button>
        </div>
      </div>
      <div class="mt-4 flex justify-between">
        <div class="ml-3 border border-gray-100 rounded-md shadow">
          <label htmlFor="month">
            <select
              class="bg-gray-50 hover:bg-gray-100 p-2"
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.currentTarget.value))}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}月
                </option>
              ))}
            </select>
          </label>
        </div>
        <p class="mr-3">最終更新：{updateDate}</p>
      </div>

      {loading
        ? <p class="w-full mt-40 text-center">読み込み中</p>
        : error
        ? <p>{error}</p>
        : (
          <table class="mx-auto mt-8 w-2/3 rounded-xl overflow-hidden ring-1 ring-gray-100 shadow-lg bg-white">
            <thead class="text-center bg-gray-200">
              <tr>
                <th class="p-2 border-r border-gray-100 rounded-tl-xl">名前</th>
                <th class="p-2 rounded-tr-xl">勤務時間</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(hoursByName).map(([name, totalHours]) => (
                <TableTr
                  name={name}
                  hours={totalHours}
                  selectedMonth={selectedMonth}
                />
              ))}
              <tr class="text-center bg-gray-100">
                <td class="p-2 border-r border-gray-100 rounded-bl-xl">合計</td>
                <td class="p-2 rounded-br-xl">{total}時間</td>
              </tr>
            </tbody>
          </table>
        )}
      <div class="h-20 w-full"></div>
    </div>
  );
}
