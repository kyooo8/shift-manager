import { useState } from "preact/hooks";

export function Profile() {
    const [error, setError] = useState<string | null>(null);
    const handleLogout = async () => {
        try {
            const response = await fetch("/api/logout", {
                method: "POST",
                credentials: "include",
            });
            if (response.ok) {
                window.location.href = "/login";
            } else {
                console.error("Logout failed.");
                setError("ログアウトに失敗しました。");
            }
        } catch (error) {
            console.error("Error logging out:", error);
            setError("ログアウト中にエラーが発生しました。");
        }
    };
    return (
        <div class="w-full text-center mt-8">
            <button
                class="text-sm mr-3 p-2 bg-white border rounded-lg border-gray-100 shadow hover:bg-gray-50"
                onClick={handleLogout}
            >
                ログアウト
            </button>
        </div>
    );
}
