import { useState } from 'react'
import { useApp } from '../store.jsx'

const TYPES = [['all', 'All'], ['unread', 'Unread'], ['leave', 'Leave'], ['attendance', 'Attendance'], ['announcement', 'Announcements']]

export default function Notifications() {
  const { notifs, setNotifs, can, say } = useApp()
  const [f, setF] = useState('all'); const [title, setTitle] = useState(''); const [body, setBody] = useState('')
  const [email, setEmail] = useState({ leave: true, attendance: false, announcement: true })
  const list = notifs.filter(n => f === 'all' ? true : f === 'unread' ? !n.read : n.type === f)
  const post = e => {
    e.preventDefault(); if (!title.trim() || !body.trim()) return say('Add a title and a message first')
    setNotifs(n => [{ id: Date.now(), type: 'announcement', title: title.trim(), body: body.trim(), at: new Date().toISOString().slice(0, 16).replace('T', ' '), read: false }, ...n])
    setTitle(''); setBody(''); say('Announcement posted')
  }
  return (
    <>
      <h1>Notifications</h1>
      <div className="grid2 wideleft">
        <section className="panel">
          <div className="between"><div className="tabs">{TYPES.map(([k, l]) => <button key={k} aria-selected={f === k} onClick={() => setF(k)}>{l}</button>)}</div>
            <button className="link" onClick={() => setNotifs(n => n.map(x => ({ ...x, read: true })))}>Mark all as read</button></div>
          {list.length === 0 ? <div className="empty"><h2>You’re all caught up</h2><p>New leave, attendance and HR updates will appear here.</p></div> :
            <ul className="nlist">{list.map(n => <li key={n.id} className={n.read ? '' : 'unread'}>
              <div><strong>{n.title}</strong><p>{n.body}</p><small className="muted">{n.at} · {n.type}</small></div>
              {!n.read && <button className="link" onClick={() => setNotifs(a => a.map(x => x.id === n.id ? { ...x, read: true } : x))}>Mark as read</button>}</li>)}</ul>}
        </section>
        <div>
          {can('notifications.announce') && <form className="panel" onSubmit={post}><h2>Post an announcement</h2>
            <label>Title<input value={title} onChange={e => setTitle(e.target.value)} /></label>
            <label>Message<textarea rows="3" value={body} onChange={e => setBody(e.target.value)} /></label>
            <button className="btn">Post announcement</button></form>}
          <section className="panel"><h2>Email me about</h2>
            {Object.keys(email).map(k => <label key={k} className="check"><input type="checkbox" checked={email[k]} onChange={() => { setEmail(e => ({ ...e, [k]: !e[k] })); say('Email preference saved') }} />{k === 'announcement' ? 'HR announcements' : k === 'leave' ? 'Leave requests and decisions' : 'Attendance alerts'}</label>)}</section>
        </div>
      </div>
    </>
  )
}
