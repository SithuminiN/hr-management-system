export interface AuthUser {
  id: number;
  email: string;
  role: string;
  employeeId: number | null;
}
