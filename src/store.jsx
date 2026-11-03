import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { USERS, ROLES, NOTIFS } from './data.js'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)
const IDLE_MS = 15 * 60 * 1000 // placeholder: session timeout needs stakeholder confirmation

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem('hr-user')) } catch { return null } })
  const [roles, setRoles] = useState(ROLES)
  const [users, setUsers] = useState(USERS)
  const [notifs, setNotifs] = useState(NOTIFS)
  const [toast, setToast] = useState('')

  const say = useCallback(m => { setToast(m); setTimeout(() => setToast(''), 2600) }, [])
  const can = p => !!user && (roles[user.role] || []).includes(p)

  const login = (email, pw) => {
    const u = users.find(x => x.email === email.trim().toLowerCase() && x.password === pw)
    if (!u) return false
    const s = { id: u.id, name: u.name, email: u.email, role: u.role }
    sessionStorage.setItem('hr-user', JSON.stringify(s)); setUser(s); return true
  }
  const logout = useCallback(() => { sessionStorage.removeItem('hr-user'); setUser(null) }, [])

  useEffect(() => {
    if (!user) return
    let t = setTimeout(logout, IDLE_MS)
    const reset = () => { clearTimeout(t); t = setTimeout(logout, IDLE_MS) }
    const evs = ['click', 'keydown', 'mousemove']
    evs.forEach(e => window.addEventListener(e, reset))
    return () => { clearTimeout(t); evs.forEach(e => window.removeEventListener(e, reset)) }
  }, [user, logout])

  const value = { user, can, login, logout, roles, setRoles, users, setUsers, notifs, setNotifs, toast, say }
  return (
    <Ctx.Provider value={value}>
      {children}
      {toast && <div className="toast" role="status">{toast}</div>}
    </Ctx.Provider>
  )
}
