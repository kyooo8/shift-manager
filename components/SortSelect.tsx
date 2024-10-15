// components/SortSelect.tsx

type SortOption = "name" | "calendar" | "hours";

interface SortSelectProps {
    sortOption: SortOption;
    onSortOptionChange: (option: SortOption) => void;
    loading: boolean;
}

export function SortSelect({
    sortOption,
    onSortOptionChange,
    loading,
}: SortSelectProps) {
    return (
        <div class="">
            <select
                id="sort"
                class="p-1 text-sm rounded-lg"
                value={sortOption}
                onChange={(e) =>
                    onSortOptionChange(e.currentTarget.value as SortOption)}
                disabled={loading}
            >
                <option value="name">名前順</option>
                <option value="calendar">カレンダー順</option>
                <option value="hours">勤務時間順</option>
            </select>
        </div>
    );
}
