import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { USERS } from '../data.js'

function Frame({ title, sub, children }) {
  return (
    <div className="authwrap">
      <section className="authside"><div className="brand big">HR<span>MS</span></div><h1>One place for people, time and hiring.</h1><p>Sign in with your work email to continue.</p></section>
      <section className="authform"><h2>{title}</h2>{sub && <p className="muted">{sub}</p>}{children}</section>
    </div>
  )
}

export function Login() {
  const { user, login } = useApp()
  const nav = useNavigate()
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [err, setErr] = useState(''); const [tries, setTries] = useState(0); const [show, setShow] = useState(false)
  if (user) return <Navigate to="/" replace />
  const locked = tries >= 5 // placeholder lockout rule: needs stakeholder confirmation
  const submit = e => {
    e.preventDefault()
    if (!email || !pw) return setErr('Enter your email and password.')
    if (locked) return
    if (login(email, pw)) nav('/')
    else { setTries(t => t + 1); setErr('Email or password is incorrect.') }
  }
  return (
    <Frame title="Log in">
      <form onSubmit={submit} noValidate>
        <label>Work email<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" /></label>
        <label>Password<span className="pw"><input type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" /><button type="button" className="link" onClick={() => setShow(s => !s)}>{show ? 'Hide' : 'Show'}</button></span></label>
        {locked ? <p className="err" role="alert">Too many attempts. Try again later or reset your password.</p> : err && <p className="err" role="alert">{err}</p>}
        <button className="btn" disabled={locked}>Log in</button>
        <Link to="/forgot" className="link">Forgot password?</Link>
      </form>
      <details className="demo"><summary>Demo accounts (sample data)</summary>
        {USERS.map(u => <button key={u.id} type="button" className="chip" onClick={() => { setEmail(u.email); setPw(u.password) }}>{u.role}</button>)}
      </details>
    </Frame>
  )
}

const rules = [['At least 8 characters', p => p.length >= 8], ['One uppercase letter', p => /[A-Z]/.test(p)], ['One number', p => /\d/.test(p)]]

export function Forgot() {
  const [step, setStep] = useState(1); const [email, setEmail] = useState('')
  const [code, setCode] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('')
  const ok = rules.every(([, f]) => f(pw))
  return (
    <Frame title="Reset your password" sub={step === 1 ? 'We’ll email a 6-digit code if the account exists.' : step === 2 ? `Enter the code sent to ${email} and choose a new password.` : ''}>
      {step === 1 && <form onSubmit={e => { e.preventDefault(); if (!/\S+@\S+\.\S+/.test(email)) return setErr('Enter a valid email address.'); setErr(''); setStep(2) }} noValidate>
        <label>Work email<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        {err && <p className="err" role="alert">{err}</p>}<button className="btn">Send code</button>
      </form>}
      {step === 2 && <form onSubmit={e => { e.preventDefault(); if (code !== '123456') return setErr('That code is not right. (Demo code: 123456)'); if (!ok) return setErr('Your new password doesn’t meet all the rules.'); setErr(''); setStep(3) }} noValidate>
        <label>6-digit code<input inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value)} /></label>
        <label>New password<input type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" /></label>
        <ul className="rules">{rules.map(([t, f]) => <li key={t} className={f(pw) ? 'met' : ''}>{t}</li>)}</ul>
        {err && <p className="err" role="alert">{err}</p>}<button className="btn">Save new password</button>
      </form>}
      {step === 3 && <><p>Your password has been changed. Log in with the new password.</p><Link className="btn" to="/login">Go to log in</Link></>}
      {step < 3 && <Link to="/login" className="link">Back to log in</Link>}
    </Frame>
  )
}
