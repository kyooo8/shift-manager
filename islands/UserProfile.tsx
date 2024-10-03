import { useEffect, useState } from "preact/hooks";
import { Calendar } from "../interface/Calendar.ts";

export default function UserProfile() {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [newCalendar, setNewCalendar] = useState<Calendar>({
        uniqueId: "",
        id: "",
        name: "",
        color: "#ffffff",
    });

    useEffect(() => {
        const getCalendars = async () => {
            try {
                const response = await fetch("api/getCalendars", {
                    credentials: "include",
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                const calendarsArray: Calendar[] = (await response.json()).map((
                    calendar: Calendar,
                ) => ({
                    ...calendar,
                    uniqueId: crypto.randomUUID(),
                }));
                setCalendars(calendarsArray);
            } catch (error) {
                console.error(
                    "カレンダーの取得中にエラーが発生しました:",
                    error,
                );
                setErrorMessage("カレンダーの取得に失敗しました。");
            }
        };
        getCalendars();
    }, []);

    const addCalendar = async () => {
        try {
            if (!newCalendar.id) {
                setErrorMessage("カレンダーIDを入力してください。");
                return;
            }
            const calendarData = {
                ...newCalendar,
                uniqueId: crypto.randomUUID(),
            };
            const response = await fetch(`api/addCalendar`, {
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
            setCalendars((prevCalendars) => [...prevCalendars, calendarData]);
            setNewCalendar({
                uniqueId: "",
                id: "",
                name: "",
                color: "#ffffff",
            });
            setSuccessMessage("カレンダーが正常に追加されました。");
            setErrorMessage(null);
        } catch (error) {
            console.error("カレンダーの追加中にエラーが発生しました:", error);
            setErrorMessage("カレンダーの追加に失敗しました。");
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
        const calendar = calendars[index];
        try {
            const response = await fetch(`api/updateCalendar`, {
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
            setSuccessMessage("カレンダーが正常に更新されました。");
            setErrorMessage(null);
        } catch (error) {
            console.error("カレンダーの更新中にエラーが発生しました:", error);
            setErrorMessage("カレンダーの更新に失敗しました。");
            setSuccessMessage(null);
        }
    };

    const deleteCalendar = async (index: number) => {
        const calendar = calendars[index];
        try {
            const response = await fetch(`api/deleteCalendar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ id: calendar.id }),
            });
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            setCalendars((prevCalendars) =>
                prevCalendars.filter((_, i) => i !== index)
            );
            setSuccessMessage("カレンダーが正常に削除されました。");
        } catch (error) {
            console.error("カレンダーの削除中にエラーが発生しました:", error);
            setErrorMessage("カレンダーの削除に失敗しました。");
        }
    };

    return (
        <div class="w-full">
            <h2>登録済みカレンダー</h2>
            {errorMessage && <p class="text-red-500">{errorMessage}</p>}
            {successMessage && <p class="text-green-500">{successMessage}</p>}

            <div class="w-2/3 mx-auto mb-4">
                <h3>新しいカレンダーを追加</h3>
                <div class="flex items-center mt-2">
                    <label class="mr-2">名前:</label>
                    <input
                        type="text"
                        class="flex-1"
                        value={newCalendar.name}
                        onChange={(e) =>
                            setNewCalendar({
                                ...newCalendar,
                                name: e.currentTarget.value,
                            })}
                    />
                </div>
                <div class="flex items-center mt-2">
                    <label class="mr-2">ID:</label>
                    <input
                        type="text"
                        class="flex-1"
                        value={newCalendar.id}
                        placeholder="GoogleカレンダーのカレンダーIDを入力"
                        onChange={(e) =>
                            setNewCalendar({
                                ...newCalendar,
                                id: e.currentTarget.value,
                            })}
                    />
                </div>
                <div class="flex items-center mt-2">
                    <label class="mr-2">色:</label>
                    <input
                        type="color"
                        class="flex-1"
                        value={newCalendar.color}
                        onChange={(e) =>
                            setNewCalendar({
                                ...newCalendar,
                                color: e.currentTarget.value,
                            })}
                    />
                </div>
                <button class="mt-2" onClick={addCalendar}>
                    追加
                </button>
            </div>

            <ul class="w-2/3 mx-auto">
                {calendars.map((calendar, index) => (
                    <li
                        key={calendar.uniqueId}
                        class="w-full"
                        style={{ backgroundColor: calendar.color }}
                    >
                        <details class="w-full">
                            <summary class="no-marker">{calendar.name}</summary>
                            <div class="flex flex-col mt-2">
                                <div class="flex items-center mt-2">
                                    <label class="mr-2">名前:</label>
                                    <input
                                        type="text"
                                        class="flex-1"
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
                                    <label class="mr-2">ID:</label>
                                    <input
                                        class="overflow-x-scroll flex-1"
                                        value={calendar.id}
                                        onChange={(e) =>
                                            handleCalendarChange(
                                                index,
                                                "id",
                                                e.currentTarget.value,
                                            )}
                                    />
                                </div>
                                <div class="flex items-center mt-2">
                                    <label class="mr-2">色:</label>
                                    <input
                                        type="color"
                                        class="flex-1"
                                        value={calendar.color}
                                        onChange={(e) =>
                                            handleCalendarChange(
                                                index,
                                                "color",
                                                e.currentTarget.value,
                                            )}
                                    />
                                </div>
                                <button
                                    class="mt-2"
                                    onClick={() => saveCalendar(index)}
                                >
                                    保存
                                </button>
                                <button
                                    class="mt-2 ml-2 text-red-500"
                                    onClick={() => deleteCalendar(index)}
                                >
                                    削除
                                </button>
                            </div>
                        </details>
                    </li>
                ))}
            </ul>
        </div>
    );
}
