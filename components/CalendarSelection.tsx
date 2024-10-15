// components/CalendarSelection.tsx

import { Calendar } from "../interface/Calendar.ts";

interface CalendarSelectionProps {
    calendars: Calendar[];
    selectedCalendars: string[];
    loading: boolean;
    onSelectCalendar: (calendarId: string) => void;
}

export function CalendarSelection({
    calendars,
    selectedCalendars,
    loading,
    onSelectCalendar,
}: CalendarSelectionProps) {
    return (
        <div class="relative w-32">
            <details class="relative z-10 bg-white p-2 rounded-lg shadow">
                <summary class="text-base">
                    カレンダー
                </summary>
                <div class="absolute top-full left-0 w-full bg-white p-2 rounded-lg shadow">
                    {calendars.map((calendar) => (
                        <label
                            key={calendar.uniqueId}
                            class="flex items-center space-x-2 truncate ..."
                        >
                            <input
                                type="checkbox"
                                value={calendar.uniqueId}
                                checked={selectedCalendars.includes(
                                    calendar.uniqueId,
                                )}
                                onChange={() =>
                                    onSelectCalendar(calendar.uniqueId)}
                                disabled={loading}
                            />
                            <span
                                class="truncate ..."
                                style={{ color: calendar.color }}
                            >
                                {calendar.name}
                            </span>
                        </label>
                    ))}
                </div>
            </details>
        </div>
    );
}
