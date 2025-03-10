// routes/list.tsx
import { List } from "../islands/List.tsx";
import { Header } from "../components/header.tsx";

export default function ListPage() {
  return (
    <>
      <Header title="シフト時間管理" />
      <List />
    </>
  );
}
