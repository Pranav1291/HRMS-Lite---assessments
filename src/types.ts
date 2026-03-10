/// <reference types="vite/client" />

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
}

export interface AttendanceRecord {
  id?: number;
  employee_id: string;
  employee_name?: string;
  date: string;
  status: 'Present' | 'Absent';
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
}
