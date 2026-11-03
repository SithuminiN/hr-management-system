import { useState } from 'react'
import { useApp } from '../store.jsx'
import { VACANCIES, APPLICANTS, STAGES, INTERVIEWS, ONBOARD_DOCS, PROBATION, DEPTS } from '../data.js'

const TABS = ['Vacancies', 'Applicants', 'Interviews', 'Onboarding', 'Probation']

export default function Recruitment() {
  const { can, say } = useApp()
  const m = can('recruitment.manage')
  const [tab, setTab] = useState('Vacancies')
  const [vacs, setVacs] = useState(VACANCIES); const [apps, setApps] = useState(APPLICANTS)
  const [ivs, setIvs] = useState(INTERVIEWS); const [docs, setDocs] = useState({ 4: { 'NIC copy': true } })
  const [prob, setProb] = useState(PROBATION)
  const name = id => apps.find(a => a.id === id)?.name
  const vac = id => vacs.find(v => v.id === id)?.title

  return (
    <>
      <h1>Recruitment & onboarding</h1>
      {!m && <p className="note">You can view this area but not make changes.</p>}
      <div className="tabs" role="tablist">{TABS.map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === 'Vacancies' && <Vacancies {...{ vacs, setVacs, m, say }} />}
      {tab === 'Applicants' && <div className="board">{STAGES.map(s => (
        <section key={s} className={`col ${s.toLowerCase()}`}><h2>{s}<b>{apps.filter(a => a.stage === s).length}</b></h2>
          {apps.filter(a => a.stage === s).map(a => <div className="card" key={a.id}><strong>{a.name}</strong><small className="muted block">{vac(a.vac)}</small>
            <select disabled={!m} aria-label={`Stage for ${a.name}`} value={a.stage} onChange={e => { setApps(x => x.map(y => y.id === a.id ? { ...y, stage: e.target.value } : y)); say(`${a.name} moved to ${e.target.value}`) }}>{STAGES.map(o => <option key={o}>{o}</option>)}</select></div>)}
          {apps.every(a => a.stage !== s) && <p className="muted">No applicants</p>}</section>))}</div>}
      {tab === 'Interviews' && <Interviews {...{ ivs, setIvs, apps, name, m, say }} />}
      {tab === 'Onboarding' && <section className="panel"><h2>Document collection</h2>
        {apps.filter(a => a.stage === 'Selected').length === 0 ? <p className="muted">Selected applicants will appear here.</p> :
          apps.filter(a => a.stage === 'Selected').map(a => { const d = docs[a.id] || {}; const n = ONBOARD_DOCS.filter(x => d[x]).length
            return <div className="onb" key={a.id}><div className="between"><strong>{a.name}</strong><span>{n} of {ONBOARD_DOCS.length} received</span></div>
              <div className="meter"><i style={{ width: n / ONBOARD_DOCS.length * 100 + '%' }} /></div>
              {ONBOARD_DOCS.map(x => <label key={x} className="check"><input type="checkbox" disabled={!m} checked={!!d[x]} onChange={() => setDocs(s => ({ ...s, [a.id]: { ...d, [x]: !d[x] } }))} />{x}</label>)}</div> })}</section>}
      {tab === 'Probation' && <section className="panel"><h2>Probation tracking</h2><div className="scroll"><table>
        <thead><tr><th>Employee</th><th>Department</th><th>Period</th><th>Progress</th><th>Status</th></tr></thead>
        <tbody>{prob.map(p => { const s = new Date(p.start), e = new Date(s); e.setMonth(e.getMonth() + p.months)
          const pct = Math.max(0, Math.min(100, (Date.now() - s) / (e - s) * 100)); const end = e.toISOString().slice(0, 10)
          return <tr key={p.id}><td>{p.name}</td><td>{p.dept}</td><td>{p.start} to {end}</td>
            <td><div className="meter"><i style={{ width: (p.status === 'Confirmed' ? 100 : pct) + '%' }} /></div></td>
            <td>{p.status === 'Confirmed' ? 'Confirmed' : m ? <button className="btn small" onClick={() => { setProb(x => x.map(y => y.id === p.id ? { ...y, status: 'Confirmed' } : y)); say(`${p.name} confirmed`) }}>Confirm employee</button> : p.status}</td></tr> })}</tbody></table></div></section>}
    </>
  )
}

function Vacancies({ vacs, setVacs, m, say }) {
  const [f, setF] = useState({ title: '', dept: DEPTS[0].name, openings: 1, closes: '' }); const [err, setErr] = useState('')
  const add = e => {
    e.preventDefault()
    if (!f.title.trim() || !f.closes || f.openings < 1) return setErr('Add a job title, a closing date and at least 1 opening.')
    setErr(''); setVacs(v => [...v, { id: Date.now(), ...f, title: f.title.trim(), openings: +f.openings, status: 'Open' }]); setF({ ...f, title: '', closes: '' }); say('Vacancy added')
  }
  return (
    <div className="grid2 wideleft">
      <section className="panel"><h2>Vacancies</h2><div className="scroll"><table><thead><tr><th>Role</th><th>Department</th><th>Openings</th><th>Closes</th><th>Status</th></tr></thead>
        <tbody>{vacs.map(v => <tr key={v.id}><td>{v.title}</td><td>{v.dept}</td><td>{v.openings}</td><td>{v.closes}</td>
          <td><span className={`tag ${v.status.toLowerCase()}`}>{v.status}</span> {m && <button className="link" onClick={() => setVacs(x => x.map(y => y.id === v.id ? { ...y, status: y.status === 'Open' ? 'Closed' : 'Open' } : y))}>{v.status === 'Open' ? 'Close' : 'Reopen'}</button>}</td></tr>)}</tbody></table></div></section>
      {m && <form className="panel" onSubmit={add} noValidate><h2>Add a vacancy</h2>
        <label>Job title<input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></label>
        <label>Department<select value={f.dept} onChange={e => setF({ ...f, dept: e.target.value })}>{DEPTS.map(d => <option key={d.name}>{d.name}</option>)}</select></label>
        <label>Openings<input type="number" min="1" value={f.openings} onChange={e => setF({ ...f, openings: e.target.value })} /></label>
        <label>Closing date<input type="date" value={f.closes} onChange={e => setF({ ...f, closes: e.target.value })} /></label>
        {err && <p className="err" role="alert">{err}</p>}<button className="btn">Add vacancy</button></form>}
    </div>
  )
}

function Interviews({ ivs, setIvs, apps, name, m, say }) {
  const cands = apps.filter(a => a.stage === 'Interview' || a.stage === 'Shortlisted')
  const [f, setF] = useState({ applicant: '', date: '', time: '10:00', mode: 'Online', panel: '' }); const [err, setErr] = useState('')
  const add = e => {
    e.preventDefault()
    if (!f.applicant || !f.date || !f.panel.trim()) return setErr('Choose an applicant, a date and the interview panel.')
    setErr(''); setIvs(v => [...v, { id: Date.now(), ...f, applicant: +f.applicant }]); setF({ ...f, applicant: '', date: '', panel: '' }); say('Interview scheduled')
  }
  return (
    <div className="grid2 wideleft">
      <section className="panel"><h2>Scheduled interviews</h2>
        {ivs.length === 0 ? <p className="muted">No interviews scheduled yet.</p> : <table><thead><tr><th>Applicant</th><th>When</th><th>Mode</th><th>Panel</th></tr></thead>
          <tbody>{[...ivs].sort((a, b) => a.date.localeCompare(b.date)).map(i => <tr key={i.id}><td>{name(i.applicant)}</td><td>{i.date} {i.time}</td><td>{i.mode}</td><td>{i.panel}</td></tr>)}</tbody></table>}</section>
      {m && <form className="panel" onSubmit={add} noValidate><h2>Schedule an interview</h2>
        <label>Applicant<select value={f.applicant} onChange={e => setF({ ...f, applicant: e.target.value })}><option value="">Choose…</option>{cands.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
        <label>Date<input type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></label>
        <label>Time<input type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /></label>
        <label>Mode<select value={f.mode} onChange={e => setF({ ...f, mode: e.target.value })}><option>Online</option><option>On-site</option></select></label>
        <label>Panel<input value={f.panel} onChange={e => setF({ ...f, panel: e.target.value })} /></label>
        {err && <p className="err" role="alert">{err}</p>}<button className="btn">Schedule interview</button></form>}
    </div>
  )
}
