// islands/UserProfile.tsx
import { useEffect, useState } from "preact/hooks";
import { Calendar } from "../interface/Calendar.ts";
import { COLOR_OPTIONS } from "../colors.ts";

interface newCalendar extends Calendar {
    id: string;
}

export default function CalendarSetting() {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [newCalendar, setNewCalendar] = useState<newCalendar>({
        uniqueId: "",
        id: "",
        name: "",
        color: COLOR_OPTIONS[0].value,
    });
    const [loading, setLoading] = useState(false);
    const getCalendars = async () => {
        try {
            const response = await fetch("/api/getCalendars", {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            const calendarsArray: Calendar[] = await response.json();
            setCalendars(calendarsArray);
        } catch (error) {
            console.error(
                "カレンダーの取得中にエラーが発生しました:",
                error,
            );
            setErrorMessage("カレンダーの取得に失敗しました。");
        }
    };
    useEffect(() => {
        getCalendars();
    }, []);

    const addCalendar = async () => {
        setLoading(true);
        try {
            if (!newCalendar.id) {
                setErrorMessage("カレンダーIDを入力してください。");
                return;
            }
            const calendarData = {
                ...newCalendar,
            };
            const response = await fetch(`/api/addCalendar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(calendarData),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            await getCalendars();
            setSuccessMessage("カレンダーが正常に追加されました。");
            setErrorMessage(null);
            setNewCalendar({
                uniqueId: "",
                id: "",
                name: "",
                color: COLOR_OPTIONS[0].value,
            });
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (error) {
            console.error("カレンダーの追加中にエラーが発生しました:", error);
            setErrorMessage("カレンダーの追加に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    const handleCalendarChange = (
        index: number,
        field: keyof Calendar,
        value: string,
    ) => {
        setCalendars((prevCalendars) => {
            const newCalendars = [...prevCalendars];
            newCalendars[index] = { ...newCalendars[index], [field]: value };
            return newCalendars;
        });
    };

    const saveCalendar = async (index: number) => {
        setLoading(true);
        const calendar = calendars[index];
        try {
            const response = await fetch(`/api/updateCalendar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(calendar),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            await getCalendars();
            setSuccessMessage("カレンダーが正常に更新されました。");
            setErrorMessage(null);
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (error) {
            console.error("カレンダーの更新中にエラーが発生しました:", error);
            setErrorMessage("カレンダーの更新に失敗しました。");
            setSuccessMessage(null);
        } finally {
            setLoading(false);
        }
    };

    const deleteCalendar = async (index: number) => {
        setLoading(true);
        const calendar = calendars[index];
        try {
            const response = await fetch(`/api/deleteCalendar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ uniqueId: calendar.uniqueId }),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            await getCalendars();
            setSuccessMessage("カレンダーが正常に削除されました。");
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (error) {
            console.error("カレンダーの削除中にエラーが発生しました:", error);
            setErrorMessage("カレンダーの削除に失敗しました。");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (successMessage || errorMessage) {
            const handleClickOutside = () => {
                setSuccessMessage(null);
                setErrorMessage(null);
            };

            window.addEventListener("click", handleClickOutside);
            return () =>
                window.removeEventListener("click", handleClickOutside);
        }
    }, [successMessage, errorMessage]);
    return (
        <div class="w-full relative">
            {errorMessage && (
                <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <p class="relative  text-red-600 bg-white p-2 rounded shadow-md">
                        {errorMessage}
                    </p>
                </div>
            )}
            {successMessage && (
                <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <p class="relative text-green-600 bg-white p-4 rounded shadow-md">
                        {successMessage}
                    </p>
                </div>
            )}

            <div class="w-2/3 mx-auto mt-8 bg-white rounded-lg shadow p-4">
                <h3 class="text-lg mb-4">新しいカレンダーを追加</h3>
                <div class="flex items-center mt-2">
                    <label class="mr-2">名前:</label>
                    <input
                        type="text"
                        class="bg-gray-50 border border-gray-300 rounded-lg px-2 w-2/3"
                        value={newCalendar.name}
                        onChange={(e) =>
                            setNewCalendar({
                                ...newCalendar,
                                name: e.currentTarget.value,
                            })}
                    />
                </div>
                <div class="flex items-center mt-2 ">
                    <label class="mr-2">ID:</label>
                    <input
                        type="text"
                        class="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-2 w-2/3"
                        value={newCalendar.id}
                        placeholder="GoogleカレンダーのカレンダーIDを入力"
                        onChange={(e) =>
                            setNewCalendar({
                                ...newCalendar,
                                id: e.currentTarget.value,
                            })}
                    />
                </div>
                <div class="flex items-center mt-2 ">
                    <label class="mr-2">色:</label>
                    <select
                        class="border border-gray-300 rounded-lg p-1 w-32 text-white"
                        style={{ background: `${newCalendar.color}` }}
                        value={newCalendar.color}
                        onChange={(e) =>
                            setNewCalendar({
                                ...newCalendar,
                                color: e.currentTarget.value,
                            })}
                    >
                        {COLOR_OPTIONS.map((colorOption) => (
                            <option
                                class="text-white font-bold"
                                key={colorOption.value}
                                value={colorOption.value}
                                style={{ background: `${colorOption.value}` }}
                            >
                                {colorOption.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    class="mt-2  p-2 bg-white border rounded-lg border-gray-100 shadow hover:bg-gray-50"
                    onClick={addCalendar}
                    disabled={loading}
                >
                    {loading ? "追加中..." : "追加"}
                </button>
            </div>
            <div class="w-2/3 mx-auto mt-8 bg-white rounded-lg shadow p-4">
                <h2 class="text-lg mb-4">登録済みカレンダー</h2>
                <ul class="max-w-96 mx-auto">
                    {calendars.map((calendar, index) => (
                        <li
                            key={calendar.uniqueId}
                            class="w-full mt-4 p-2 rounded-lg text-white shadow-sm"
                            style={{ backgroundColor: calendar.color }}
                        >
                            <details class="w-full">
                                <summary class="">
                                    {calendar.name}
                                </summary>
                                <div class="flex flex-col mt-2">
                                    <div class="flex items-center mt-2">
                                        <label class="mr-2">名前:</label>
                                        <input
                                            type="text"
                                            class="flex-1 bg-white bg-opacity-40 px-1 rounded shadow-sm w-2/3"
                                            value={calendar.name}
                                            onChange={(e) =>
                                                handleCalendarChange(
                                                    index,
                                                    "name",
                                                    e.currentTarget.value,
                                                )}
                                        />
                                    </div>
                                    <div class="flex items-center mt-2">
                                        <label class="mr-2">色:</label>
                                        <select
                                            class="flex-1 bg-white bg-opacity-40 px-1 rounded shadow-sm "
                                            value={calendar.color}
                                            onChange={(e) =>
                                                handleCalendarChange(
                                                    index,
                                                    "color",
                                                    e.currentTarget.value,
                                                )}
                                        >
                                            {COLOR_OPTIONS.map((
                                                colorOption,
                                            ) => (
                                                <option
                                                    key={colorOption.value}
                                                    value={colorOption.value}
                                                    style={{
                                                        background:
                                                            `${colorOption.value}`,
                                                    }}
                                                >
                                                    {colorOption.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div class="flex mt-4">
                                        <button
                                            class="mr-2 px-2 py-1 bg-green-500   rounded-lg  shadow"
                                            onClick={() => saveCalendar(index)}
                                            disabled={loading}
                                        >
                                            {loading ? "保存中..." : "保存"}
                                        </button>
                                        <button
                                            class="px-2 py-1 bg-red-500 shadow rounded-lg"
                                            onClick={() =>
                                                deleteCalendar(index)}
                                            disabled={loading}
                                        >
                                            {loading ? "削除中..." : "削除"}
                                        </button>
                                    </div>
                                </div>
                            </details>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
