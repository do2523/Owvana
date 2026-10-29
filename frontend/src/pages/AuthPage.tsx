import { useState } from 'react'
import type { FormEvent } from 'react'
import Logo from '../components/Logo'
import PasswordChecklist from '../components/PasswordChecklist'
import { login, passwordProblem, register, saveToken } from '../api'
import { navigate } from '../router'

type Props = { startTab: 'login' | 'signup' }

export default function AuthPage({ startTab }: Props) {
  const [tab, setTab] = useState(startTab)

  function switchTab(next: 'login' | 'signup') {
    setTab(next)
    window.history.replaceState(null, '', next === 'login' ? '/login' : '/signup')
  }

  return (
    <main className="split">
      <section className="split-hero">
        <Logo light />
        <div className="hero-copy">
          <h1>Go on the trip. We’ll handle the math.</h1>
          <p>
            Track every shared cost, split it fairly, and send each friend a private link showing exactly what
            they owe. No app or account needed for them.
          </p>
        </div>
      </section>

      <section className="split-form">
        <div className="card auth-card">
          <h2>{tab === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="muted">{tab === 'login' ? 'Log in to manage your groups.' : 'Start splitting trip costs in a minute.'}</p>

          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'active' : ''} onClick={() => switchTab('login')}>
              Log in
            </button>
            <button role="tab" aria-selected={tab === 'signup'} className={tab === 'signup' ? 'active' : ''} onClick={() => switchTab('signup')}>
              Sign up
            </button>
          </div>

          {tab === 'login' ? <LoginForm onSignup={() => switchTab('signup')} /> : <SignupForm onLogin={() => switchTab('login')} />}

          <div className="participant-note">
            <span className="note-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </span>
            <p>Got a link from a friend? Just open it. Participants never need to log in.</p>
          </div>
        </div>
      </section>
    </main>
  )
}

function LoginForm({ onSignup }: { onSignup: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await login(email.trim(), password)

      // 403 = account exists but email isnt verified yet, send them to the inbox screen
      if (res.status === 403) {
        navigate(`/check-email?email=${encodeURIComponent(email.trim())}`)
        return
      }

      if (!res.ok || !res.data.token) {
        setError(res.data.message ?? 'Wrong email or password.')
        return
      }

      saveToken(res.data.token)
      navigate('/dashboard')
    } catch {
      setError('Can’t reach the server right now. Try again in a sec.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className="field">
        Email
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field">
        Password
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>

      <div className="forgot-row">
        <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password') }} className="link">
          Forgot password?
        </a>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={isSubmitting || !email || !password}>
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </button>

      <p className="switch-line">
        New here?{' '}
        <button type="button" className="link" onClick={onSignup}>
          Create an account
        </button>
      </p>
    </form>
  )
}

export function SignupForm({ onLogin }: { onLogin?: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const pwError = passwordProblem(password)
    if (pwError) {
      setError(pwError)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      // backend only has one name field so first + last get joined
      const name = `${firstName.trim()} ${lastName.trim()}`.trim()
      const res = await register(name, email.trim(), password, confirmPassword)

      if (!res.ok) {
        setError(res.data.message ?? 'Couldn’t create your account.')
        return
      }

      navigate(`/check-email?email=${encodeURIComponent(email.trim())}`)
    } catch {
      setError('Can’t reach the server right now. Try again in a sec.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field-row">
        <label className="field">
          First name
          <input autoComplete="given-name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label className="field">
          Last name
          <input autoComplete="family-name" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
      </div>
      <label className="field">
        Email
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field">
        Password
        <input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <PasswordChecklist password={password} />
      <label className="field">
        Confirm password
        <input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={isSubmitting || !firstName || !lastName || !email || !password || !confirmPassword}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </button>

      {onLogin && (
        <p className="switch-line">
          Already have an account?{' '}
          <button type="button" className="link" onClick={onLogin}>
            Log in
          </button>
        </p>
      )}
    </form>
  )
}
