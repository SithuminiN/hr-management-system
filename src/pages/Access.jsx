import { useState } from 'react'
import { useApp } from '../store.jsx'
import { PERMS, ROLES } from '../data.js'

export default function Access() {
  const { roles, setRoles, users, setUsers, say, user } = useApp()
  const [tab, setTab] = useState('roles')
  const names = Object.keys(ROLES)
  const toggle = (role, p) => setRoles(r => ({ ...r, [role]: r[role].includes(p) ? r[role].filter(x => x !== p) : [...r[role], p] }))
  return (
    <>
      <h1>Roles & access</h1>
      <p className="note">Roles and permissions below are placeholders. Needs stakeholder confirmation before use.</p>
      <div className="tabs" role="tablist">{[['roles', 'Permissions'], ['users', 'Users']].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === 'roles' ? (
        <div className="scroll"><table>
          <thead><tr><th>Permission</th>{names.map(n => <th key={n}>{n}</th>)}</tr></thead>
          <tbody>{PERMS.map(([p, label]) => <tr key={p}><td>{label}<small className="muted block">{p}</small></td>
            {names.map(n => <td key={n} className="c"><input type="checkbox" aria-label={`${n}: ${label}`} checked={roles[n].includes(p)} disabled={n === 'Admin'} onChange={() => toggle(n, p)} /></td>)}</tr>)}</tbody>
        </table></div>
      ) : (
        <div className="scroll"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>{users.map(u => <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>
            <select value={u.role} disabled={u.id === user.id} aria-label={`Role for ${u.name}`} onChange={e => { setUsers(us => us.map(x => x.id === u.id ? { ...x, role: e.target.value } : x)); say(`${u.name} is now ${e.target.value}`) }}>
              {names.map(n => <option key={n}>{n}</option>)}</select>
            {u.id === user.id && <small className="muted"> (you)</small>}</td></tr>)}</tbody>
        </table></div>
      )}
    </>
  )
}
