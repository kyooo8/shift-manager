export default interface DetailProps {
    name: string;
    details: ShiftDetail[];
    totalHours: number;
    selectedMonth: number;
}
interface ShiftDetail {
    start: string;
    end: string;
    hours: number;
}
