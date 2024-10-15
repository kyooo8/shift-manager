// components/SearchBox.tsx

interface SearchBoxProps {
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
}

export function SearchBox({ searchTerm, onSearchTermChange }: SearchBoxProps) {
    return (
        <div class="w-full text-center mt-4">
            <input
                type="text"
                placeholder="名前で検索"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.currentTarget.value)}
                class="mb-3 w-1/2 p-2 rounded-lg border border-gray-100 shadow"
            />
        </div>
    );
}
