import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { DEPTS, WEEK, PENDING_LEAVE } from '../data.js'

const sum = k => DEPTS.reduce((a, d) => a + d[k], 0)
const lkr = n => 'LKR ' + n.toLocaleString('en-LK')

export function Dashboard() {
  const { user, can, notifs } = useApp()
  const total = sum('employees'), present = sum('present')
  const recent = notifs.slice(0, 3)
  const max = Math.max(...DEPTS.map(d => d.employees))
  return (
    <>
      <h1>Good day, {user.name.split(' ')[0]}</h1>
      {can('reports.view') && <>
        <div className="stats">
          <div><span>Employees</span><strong>{total}</strong></div>
          <div><span>Present today</span><strong>{present}</strong><small>{Math.round(present / total * 100)}% of staff</small></div>
          <div><span>Absent today</span><strong>{sum('absent')}</strong></div>
          <div className="warn"><span>Leave waiting for approval</span><strong>{PENDING_LEAVE.length}</strong></div>
        </div>
        <div className="grid2">
          <section className="panel"><h2>Attendance this week</h2>
            <div className="bars" role="img" aria-label="Attendance percentage by weekday">{WEEK.map(([d, v]) => <div key={d}><i style={{ height: v + '%' }} /><b>{v}%</b><span>{d}</span></div>)}</div></section>
          <section className="panel"><h2>Headcount by department</h2>
            {DEPTS.map(d => <div className="hrow" key={d.name}><span>{d.name}</span><div><i style={{ width: d.employees / max * 100 + '%' }} /></div><b>{d.employees}</b></div>)}</section>
        </div>
        <section className="panel"><h2>Pending leave requests</h2>
          <table><thead><tr><th>Employee</th><th>Department</th><th>Type</th><th>Dates</th></tr></thead>
            <tbody>{PENDING_LEAVE.map(l => <tr key={l.id}><td>{l.name}</td><td>{l.dept}</td><td>{l.type}</td><td>{l.from === l.to ? l.from : `${l.from} to ${l.to}`}</td></tr>)}</tbody></table>
          <p className="muted">Approving or rejecting is handled in Leave Management (another module).</p></section>
      </>}
      <section className="panel"><h2>Latest notifications</h2>
        {recent.map(n => <p key={n.id} className={n.read ? '' : 'unread'}>{n.title}<small className="muted block">{n.at}</small></p>)}
        <Link to="/notifications" className="link">See all notifications</Link></section>
    </>
  )
}

const REPORTS = {
  headcount: { label: 'Employee headcount', cols: ['Department', 'Employees'], rows: d => [d.name, d.employees] },
  attendance: { label: 'Attendance summary', cols: ['Department', 'Present', 'Late', 'Absent', 'Avg. hours'], rows: d => [d.name, d.present, d.late, d.absent, d.hours] },
  payroll: { label: 'Payroll summary (sample values)', cols: ['Department', 'Gross', 'Deductions', 'Net'], rows: d => [d.name, lkr(d.gross), lkr(d.ded), lkr(d.gross - d.ded)], perm: 'reports.payroll' },
}

export function Reports() {
  const { can, say } = useApp()
  const avail = Object.entries(REPORTS).filter(([, r]) => !r.perm || can(r.perm))
  const [key, setKey] = useState(avail[0][0]); const [dept, setDept] = useState('All'); const [month, setMonth] = useState('2026-10')
  const r = REPORTS[key]
  const data = DEPTS.filter(d => dept === 'All' || d.name === dept).map(r.rows)
  const csv = () => {
    const text = [r.cols, ...data].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
    a.download = `${key}-${month}.csv`; a.click(); say('Excel file (CSV) downloaded')
  }
  return (
    <>
      <h1>Reports</h1>
      <div className="filters">
        <label>Report<select value={key} onChange={e => setKey(e.target.value)}>{avail.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
        <label>Department<select value={dept} onChange={e => setDept(e.target.value)}><option>All</option>{DEPTS.map(d => <option key={d.name}>{d.name}</option>)}</select></label>
        <label>Month<input type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>
        {can('reports.export') && <div className="actions"><button className="btn ghost" onClick={() => window.print()}>Export PDF</button><button className="btn" onClick={csv}>Export Excel</button></div>}
      </div>
      <section className="panel">
        <h2>{r.label}<small className="muted"> · {dept} · {month}</small></h2>
        {data.length === 0 ? <p className="muted">No data for these filters.</p> :
          <div className="scroll"><table><thead><tr>{r.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{data.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>}
      </section>
    </>
  )
}
