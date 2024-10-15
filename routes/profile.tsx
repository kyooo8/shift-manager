import { Header } from "../components/header.tsx";
import { Profile } from "../islands/Profile.tsx";

export default function ProfilePage() {
    return (
        <>
            <Header title="プロフィール" />
            <Profile />
        </>
    );
}
