//interface/EmployeeData
interface ShiftDetail {
  start: string;
  end: string;
  hours: number;
}

export default interface EmployeeData {
  details: ShiftDetail[];
  totalHours: number;
}
