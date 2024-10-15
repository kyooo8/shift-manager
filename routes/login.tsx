import { Login } from "../islands/Login.tsx";
import { Header } from "../components/header.tsx";

export default function ShiftListPage() {
    return (
        <>
            <Header title="シフト時間管理" />
            <Login />
        </>
    );
}
