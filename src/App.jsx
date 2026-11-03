import { Routes, Route, Navigate, NavLink, Link, Outlet, useLocation } from 'react-router-dom'
import { useApp } from './store.jsx'
import { Login, Forgot } from './pages/Auth.jsx'
import Access from './pages/Access.jsx'
import { Dashboard, Reports } from './pages/Dashboard.jsx'
import Notifications from './pages/Notifications.jsx'
import Recruitment from './pages/Recruitment.jsx'

const NAV = [
  ['/', 'Dashboard', 'dashboard.view'],
  ['/reports', 'Reports', 'reports.view'],
  ['/notifications', 'Notifications', null],
  ['/recruitment', 'Recruitment', 'recruitment.view'],
  ['/access', 'Roles & access', 'roles.manage'],
]

function Layout() {
  const { user, can, logout, notifs } = useApp()
  const loc = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  const unread = notifs.filter(n => !n.read).length
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">HR<span>MS</span></div>
        <nav aria-label="Main">
          {NAV.filter(([, , p]) => !p || can(p)).map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}{label === 'Notifications' && unread > 0 && <b className="dot">{unread}</b>}</NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="top">
          <Link to="/notifications" className="bell" aria-label={`${unread} unread notifications`}>Alerts{unread > 0 && <b className="dot">{unread}</b>}</Link>
          <div className="who"><strong>{user.name}</strong><small>{user.role}</small></div>
          <button className="btn ghost" onClick={logout}>Log out</button>
        </header>
        <main className="page"><Outlet /></main>
      </div>
    </div>
  )
}

function Need({ perm, children }) {
  const { can } = useApp()
  if (perm && !can(perm)) return (
    <div className="empty"><h2>You don’t have access to this page</h2><p>Ask an administrator to grant the “{perm}” permission to your role.</p><Link className="btn" to="/">Back to dashboard</Link></div>
  )
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route element={<Layout />}>
        <Route index element={<Need perm="dashboard.view"><Dashboard /></Need>} />
        <Route path="reports" element={<Need perm="reports.view"><Reports /></Need>} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="recruitment" element={<Need perm="recruitment.view"><Recruitment /></Need>} />
        <Route path="access" element={<Need perm="roles.manage"><Access /></Need>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
