import { UserName } from "../islands/Header.tsx";

interface Props {
    title: string;
}

export const Header = ({ title }: Props) => {
    return (
        <header class="w-full flex justify-between items-center h-16 bg-white shadow">
            <h1 class="ml-10 text-lg">
                <a href="/">{title}</a>
            </h1>
            <div class="mr-5">
                <UserName />
            </div>
        </header>
    );
};
