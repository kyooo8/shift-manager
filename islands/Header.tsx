import { useEffect, useState } from "preact/hooks";

export const HeaderItem = () => {
    const [userName, setUserName] = useState("");
    const [error, setError] = useState<string | null>(null);
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
    useEffect(() => {
        fetchUserName();
    }, []);

    return (
        <>
            {userName
                ? (
                    <div>
                        <span
                            class="text-sm mr-3"
                            onClick={() => {
                                window.location.href = "/profile";
                            }}
                        >
                            {userName}さん
                        </span>

                        <button
                            class="text-sm"
                            onClick={() => {
                                window.location.href = "/setting";
                            }}
                        >
                            設定
                        </button>
                    </div>
                )
                : <p>ログインしてください</p>}
        </>
    );
};
