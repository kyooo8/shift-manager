import { Header } from "../components/header.tsx";
import UserProfile from "../islands/CalendarSetting.tsx";

export default function SettingPage() {
    return (
        <>
            <Header title="設定" />
            <UserProfile />
        </>
    );
}
