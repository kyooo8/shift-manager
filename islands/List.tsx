import { useEffect, useMemo, useState } from "preact/hooks";
import { Calendar } from "../interface/Calendar.ts";
import { TableTr } from "../components/TableTr.tsx";
import { CalendarSelection } from "../components/CalendarSelection.tsx";
import { SearchBox } from "../components/SearchBox.tsx";
import { SortSelect } from "../components/SortSelect.tsx";

interface GetHoursResponse {
  hoursByName: Array<{
    name: string;
    totalHours: number;
    calendarUniqueId: string;
  }>;
  updateDate: { [key: string]: string };
  error?: string;
}

type SortOption = "name" | "calendar" | "hours";

const formatUpdateDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${month}/${day} ${hours}:${minutes}`;
};

export function List() {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1,
  );
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoursByName, setHoursByName] = useState<
    Array<{
      name: string;
      totalHours: number;
      calendarUniqueId: string;
    }>
  >([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("name");
  const [searchTerm, setSearchTerm] = useState("");
  const [updateDate, setUpdateDate] = useState<{ [key: string]: string }>(
    {},
  );

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const response = await fetch("/api/calendar/get", {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const calendarsArray = await response.json();
        setCalendars(calendarsArray.calendars);
      } catch (error) {
        console.error("カレンダーの取得中にエラーが発生しました:", error);
        setError("カレンダーの取得に失敗しました。");
      }
    };

    fetchCalendars();
    console.log("calendars", calendars);
  }, []);

  const fetchTotalHours = async (update = false) => {
    setLoading(true);
    setError(null);
    try {
      if (calendars.length === 0) return;
      const calendarsToFetch = selectedCalendars.length > 0
        ? selectedCalendars
        : calendars.map((calendar) => calendar.uniqueId);

      if (update) {
        const response = await fetch("/api/shift/acquire", {
          method: "POST",
          body: JSON.stringify({
            month: selectedMonth,
            calendar_unique_ids: calendarsToFetch,
          }),
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(
            (await response.json()).error || "データの取得に失敗しました",
          );
        }
      }

      const url = new URL("/api/shift/getHours", globalThis.location.origin);
      url.searchParams.set("month", String(selectedMonth));
      url.searchParams.set(
        "calendar_unique_ids",
        calendarsToFetch.join(","),
      );
      const response = await fetch(url.toString(), {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).error || "データの取得に失敗しました。",
        );
      }

      const data: GetHoursResponse = await response.json();
      console.log("data", data);

      setHoursByName(data.hoursByName);

      setTotal(
        data.hoursByName.reduce(
          (sum, entry) => sum + entry.totalHours,
          0,
        ),
      );
      setUpdateDate(data.updateDate);
    } catch (error: any) {
      console.error("Error fetching total hours:", error);
      setHoursByName([]);
      setTotal(0);
      setError(error.message || "データがありません");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalHours();
  }, [selectedMonth, selectedCalendars, calendars]);

  const handleCalendarSelection = (calendarUniqueId: string) => {
    setSelectedCalendars((prev) =>
      prev.includes(calendarUniqueId)
        ? prev.filter((id) => id !== calendarUniqueId)
        : [...prev, calendarUniqueId]
    );
  };

  const filteredAndSortedEntries = useMemo(() => {
    return hoursByName
      .filter((data) => {
        const calendarFilter = selectedCalendars.length === 0 ||
          selectedCalendars.includes(data.calendarUniqueId);
        const nameFilter = data.name.toLowerCase().includes(
          searchTerm.toLowerCase(),
        );
        return calendarFilter && nameFilter;
      })
      .sort((dataA, dataB) => {
        switch (sortOption) {
          case "name":
            return dataA.name.localeCompare(dataB.name);
          case "calendar": {
            const calendarA = calendars.find(
              (cal) => cal.uniqueId === dataA.calendarUniqueId,
            );
            const calendarB = calendars.find(
              (cal) => cal.uniqueId === dataB.calendarUniqueId,
            );
            const calendarNameA = calendarA ? calendarA.name : "";
            const calendarNameB = calendarB ? calendarB.name : "";
            return calendarNameA.localeCompare(calendarNameB);
          }
          case "hours":
            return dataB.totalHours - dataA.totalHours;
          default:
            return 0;
        }
      });
  }, [hoursByName, sortOption, searchTerm, calendars, selectedCalendars]);

  return (
    <div class="w-full">
      <div class="mt-4 mx-10 flex justify-between items-center">
        <CalendarSelection
          calendars={calendars}
          selectedCalendars={selectedCalendars}
          loading={loading}
          onSelectCalendar={handleCalendarSelection}
        />
        <div class="w-1/2 text-right">
          <button
            class="p-2 bg-white border rounded-lg border-gray-100 shadow hover:bg-gray-50"
            onClick={async () => {
              await fetchTotalHours(true);
              await fetchTotalHours();
            }}
            disabled={loading}
          >
            最新データ取得
          </button>
          <div class="w-full"></div>
          <details class="relative mt-4 z-10 inline-block">
            <summary>最新取得時間</summary>
            <ul
              class="absolute text-right bg-white rounded-lg shadow p-1 w-44"
              style="left: -50px;"
            >
              {Object.entries(updateDate).map(
                ([calendarUniqueId, lastUpdate]) => {
                  const calendar = calendars.find(
                    (cal) => cal.uniqueId === calendarUniqueId,
                  );
                  return (
                    <li key={calendarUniqueId} class="flex justify-between">
                      <span
                        class="truncate ... mr-0.5 w-1/2"
                        style={{ color: calendar ? calendar.color : "black" }}
                      >
                        {calendar ? calendar.name : "不明なカレンダー"}
                      </span>
                      <span class="text-sm">
                        {lastUpdate
                          ? formatUpdateDate(lastUpdate as string)
                          : "情報なし"}
                      </span>
                    </li>
                  );
                },
              )}
            </ul>
          </details>
        </div>
      </div>

      <SearchBox
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
      />

      <div class="mt-4 flex flex-col items-center">
        <div class="w-2/3 flex justify-between items-end mb-3">
          <SortSelect
            sortOption={sortOption}
            onSortOptionChange={setSortOption}
            loading={loading}
          />

          <label htmlFor="month">
            <select
              class="text-lg p-1 rounded-lg"
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

        {loading
          ? (
            <div class="w-full mt-40 text-center">
              <svg
                class="animate-spin h-10 w-10 text-blue-500 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                >
                </circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C4.477 0 0 4.477 0 10h4z"
                >
                </path>
              </svg>
              <p>読み込み中...</p>
            </div>
          )
          : error
          ? <p class="text-red-500">{error}</p>
          : (
            <table class="mx-auto w-2/3 rounded-xl overflow-hidden ring-1 ring-gray-100 shadow-lg bg-white">
              <thead class="text-center bg-gray-200">
                <tr>
                  <th class="p-2 border-r border-gray-100 rounded-tl-xl w-1/2">
                    名前
                  </th>
                  <th class="p-2 rounded-tr-xl w-1/2">勤務時間</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedEntries.map((entry, index) => {
                  const { name, totalHours, calendarUniqueId } = entry;
                  const employeeCalendar = calendars.find(
                    (cal) => cal.uniqueId === calendarUniqueId,
                  );
                  const color = employeeCalendar
                    ? employeeCalendar.color
                    : "black";
                  return (
                    <TableTr
                      key={`${name}_${calendarUniqueId}_${index}`}
                      name={name}
                      totalHours={totalHours}
                      selectedMonth={selectedMonth}
                      color={color}
                      calendarUniqueId={calendarUniqueId}
                    />
                  );
                })}
                <tr class="text-center bg-gray-100">
                  <td class="p-2 border-r border-gray-100 rounded-bl-xl w-1/2">
                    合計
                  </td>
                  <td class="p-2 rounded-br-xl truncate ... w-1/2 ">
                    {total}時間
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        <div class="h-20 w-full"></div>
      </div>
    </div>
  );
}
