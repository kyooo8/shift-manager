// List.tsx
import { useEffect, useState } from "preact/hooks";
import { Calendar } from "../interface/Calendar.ts";
import { TableTr } from "../components/TableTr.tsx";
interface ShiftDetail {
  start: string;
  end: string;
  hours: number;
}
interface GetHoursResponse {
  hoursByName: {
    [key: string]: { totalHours: number; details: ShiftDetail[] };
  };
  updateDate: string;
  error?: string;
}

export function List() {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoursByName, setHoursByName] = useState<
    { [key: string]: { totalHours: number; details: ShiftDetail[] } }
  >(
    {},
  );
  const [total, setTotal] = useState(0);
  const [updateDate, setUpdateDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);

  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await fetch("/api/getUserName", {
          credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
          setUserName(data.name);
        } else {
          console.error(data.error);
          setError("ユーザー名の取得に失敗しました。");
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
        setError("ユーザー名の取得中にエラーが発生しました。");
      }
    };

    const fetchCalendars = async () => {
      try {
        const response = await fetch("/api/getCalendars", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const calendarsArray: Calendar[] = await response.json();
        console.log(calendarsArray);
        setCalendars(calendarsArray);
      } catch (error) {
        console.error("カレンダーの取得中にエラーが発生しました:", error);
        setError("カレンダーの取得に失敗しました。");
      }
    };

    fetchUserName();
    fetchCalendars();
  }, []);

  // 修正後
  const fetchTotalHours = async (update = false) => {
    setLoading(true);
    setError(null);
    try {
      const calendarsToFetch = selectedCalendars.length > 0
        ? selectedCalendars
        : calendars.map((calendar) => calendar.id);

      if (calendarsToFetch.length === 0) {
        throw new Error("対象となるカレンダーが選択されていません。");
      }

      if (update) {
        // データを更新
        const response = await fetch("/api/shifts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            month: selectedMonth,
            calendar_ids: calendarsToFetch,
          }),
          credentials: "include",
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "データの取得に失敗しました");
        }
      }

      // Supabaseからデータを取得
      const url = new URL("/api/getHours", window.location.origin);
      url.searchParams.set("month", String(selectedMonth));
      url.searchParams.set("calendar_ids", calendarsToFetch.join(","));

      const response = await fetch(url.toString(), {
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "データの取得に失敗しました。");
      }

      const data: GetHoursResponse = await response.json();

      setHoursByName(data.hoursByName);
      setTotal(
        Object.values(data.hoursByName).reduce(
          (sum, entry) => sum + entry.totalHours,
          0,
        ),
      );
      setUpdateDate(data.updateDate);
    } catch (error: any) {
      console.error("Error fetching total hours:", error);
      setHoursByName({});
      setTotal(0);
      setUpdateDate("");
      setError(error.message || "データがありません");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalHours();
  }, [selectedMonth, selectedCalendars]); // `calendars` を依存配列に追加

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
        setError("ログアウトに失敗しました。");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      setError("ログアウト中にエラーが発生しました。");
    }
  };

  const handleCalendarSelection = (calendarId: string) => {
    setSelectedCalendars((prev) =>
      prev.includes(calendarId)
        ? prev.filter((id) => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  return (
    <div class="w-full">
      <div class="flex justify-between mt-4">
        <button
          class="ml-3 p-2 border border-gray-100 rounded-md hover:bg-gray-100 shadow bg-gray-50"
          onClick={async () => {
            await fetchTotalHours(true);
            await fetchTotalHours();
          }}
          disabled={loading} // ローディング中は無効化
        >
          最新データ取得
        </button>
        <div class="flex">
          <button
            class="mr-6 p-2 border border-gray-100 rounded-md hover:bg-gray-100 shadow bg-gray-50"
            onClick={() => {
              window.location.href = "/profile";
            }}
          >
            {userName}さん
          </button>
          <button
            class="mr-3 p-2 border border-gray-100 rounded-md hover:bg-gray-100 shadow bg-gray-50"
            onClick={handleLogout}
            disabled={loading} // ローディング中は無効化
          >
            ログアウト
          </button>
        </div>
      </div>
      <div class="mt-4 flex justify-between">
        <div class="ml-3 border border-gray-100 rounded-md shadow p-2">
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
        <div class="ml-3 border border-gray-100 rounded-md shadow p-2">
          <span class="mr-2">カレンダー:</span>
          {calendars.map((calendar) => (
            <label key={calendar.id} class="mr-4 flex items-center">
              <input
                type="checkbox"
                value={calendar.id} // GoogleカレンダーIDを使用
                checked={selectedCalendars.includes(calendar.id)}
                onChange={() =>
                  handleCalendarSelection(calendar.id)}
                disabled={loading} // ローディング中は無効化
              />
              <span
                class="ml-1"
                style={{ color: calendar.color }}
              >
                {calendar.name}
              </span>
            </label>
          ))}
        </div>
        <p class="mr-3">最終更新：{updateDate}</p>
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
          <table class="mx-auto mt-8 w-2/3 rounded-xl overflow-hidden ring-1 ring-gray-100 shadow-lg bg-white">
            <thead class="text-center bg-gray-200">
              <tr>
                <th class="p-2 border-r border-gray-100 rounded-tl-xl">名前</th>
                <th class="p-2 rounded-tr-xl">勤務時間</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(hoursByName).map(
                ([name, { totalHours }]) => {
                  // カレンダーのフィルタリング
                  const employeeCalendar = calendars.find((cal) =>
                    selectedCalendars.includes(cal.id)
                  );
                  console.log("employeeCalendar", employeeCalendar);

                  // 色とカレンダーIDを取得
                  const color = employeeCalendar
                    ? employeeCalendar.color
                    : "black";
                  const calendarId = employeeCalendar
                    ? employeeCalendar.id
                    : "";

                  console.log(color, calendarId);

                  return (
                    <TableTr
                      key={name}
                      name={name}
                      totalHours={totalHours}
                      selectedMonth={selectedMonth}
                      color={color}
                      calendarId={calendarId}
                    />
                  );
                },
              )}

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
