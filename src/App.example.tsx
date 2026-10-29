// EXAMPLE ONLY. Shows how to plug my 3 pages into the router.
// Frontend Intern 1 owns the real App/router, so copy the 3 <Route> lines and the CSS import into theirs.
import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import "./styles/modules.css";
import { AuthProvider, DEMO_USERS, useAuth } from "./context/AuthContext";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";

function Shell() {
  const { user, switchUser } = useAuth();
  return (
    <>
      <nav className="hr-nav">
        <NavLink to="/attendance">Attendance</NavLink>
        <NavLink to="/leave">Leave</NavLink>
        <NavLink to="/payroll">Payroll</NavLink>
        {/* demo-only role switcher: remove when real login exists */}
        <select value={user.id} onChange={(e) => switchUser(Number(e.target.value))} aria-label="Switch demo user">
          {DEMO_USERS.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </nav>
      <Routes>
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="*" element={<Navigate to="/attendance" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
