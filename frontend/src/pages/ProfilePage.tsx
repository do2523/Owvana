import { useState } from 'react'
import type { FormEvent } from 'react'
import AppHeader from '../components/AppHeader'
import { Avatar, CheckIcon } from '../components/ui'
import { clearToken, sendResetLink } from '../api'
import { navigate } from '../router'
import { currentUser, updateProfile, useDb } from '../store'
import { longDate } from '../utils'
import './Group.css'

export default function ProfilePage() {
  useDb()
  const user = currentUser()
  const parts = (user?.name ?? '').split(' ')

  const [first, setFirst] = useState(parts[0] ?? '')
  const [last, setLast] = useState(parts.slice(1).join(' '))
  const [email, setEmail] = useState(user?.email ?? '')
  const [saved, setSaved] = useState('')
  const [error, setError] = useState('')
  const [resetStatus, setResetStatus] = useState('')
  const [resetLink, setResetLink] = useState('')

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved('')
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('That email doesn’t look right.')
      return
    }
    updateProfile(`${first.trim()} ${last.trim()}`.trim(), email.trim())
    setSaved('Saved.')
  }

  async function handleReset() {
    setResetStatus('')
    setResetLink('')
    const address = user?.email ?? ''
    try {
      const res = await sendResetLink(address)
      if (import.meta.env.DEV && res.status >= 500) {
        setResetStatus('Local testing: no email goes out with the backend off.')
        setResetLink(`/reset-password?email=${encodeURIComponent(address)}&token=local`)
      } else {
        setResetStatus(res.ok ? `Reset link sent to ${address}.` : (res.data.message ?? 'Couldn’t send the link. Try again later.'))
      }
    } catch {
      setResetStatus('Can’t reach the server right now. Try again in a sec.')
    }
  }

  function logOut() {
    clearToken()
    navigate('/login')
  }

  return (
    <div className="page">
      <AppHeader userName={user?.name ?? ''} active="profile" />
      <main className="profile-main">
        <h1 className="page-title">Your profile</h1>

        <form className="panel-pad profile-card" onSubmit={handleSave} noValidate>
          <div className="profile-top">
            <Avatar name={user?.name ?? ''} size={84} isYou />
            <div>
              <h2>{user?.name}</h2>
              {user && <p className="muted">Joined {longDate(user.created_at)}</p>}
            </div>
          </div>
          <div className="field-row">
            <label className="field">
              First name
              <input value={first} onChange={(e) => setFirst(e.target.value)} />
            </label>
            <label className="field">
              Last name
              <input value={last} onChange={(e) => setLast(e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>
              Email{' '}
              {user?.email_verified ? <span className="status status-confirmed"><CheckIcon /> Verified</span> : <span className="status status-sent">Not verified</span>}
            </span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {!user?.email_verified && (
            <button type="button" className="link" onClick={() => navigate(`/check-email?email=${encodeURIComponent(user?.email ?? '')}`)}>
              Verify this email
            </button>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-footer form-footer-tight">
            {saved && <span className="form-status" role="status">{saved}</span>}
            <button type="submit" className="btn btn-primary btn-auto" disabled={!first.trim() || !email.trim()}>Save changes</button>
          </div>
        </form>

        <section className="panel-pad profile-row">
          <div>
            <h2 className="panel-title">Password</h2>
            <p className="muted">We’ll email you a link to set a new one.</p>
            {resetStatus && <p className="form-status" role="status">{resetStatus}</p>}
            {resetLink && <button className="link" onClick={() => navigate(resetLink)}>Open the reset page</button>}
          </div>
          <button className="btn btn-outline btn-auto" onClick={handleReset}>Send reset link</button>
        </section>

        <button className="btn-logout" onClick={logOut}>Log out</button>
      </main>
    </div>
  )
}
