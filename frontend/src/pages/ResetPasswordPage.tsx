import { useState } from 'react'
import type { FormEvent } from 'react'
import TopBar from '../components/TopBar'
import PasswordChecklist from '../components/PasswordChecklist'
import { login, passwordProblem, saveToken, sendResetLink, setNewPassword } from '../api'
import { navigate } from '../router'

// without a token you just ask for the link, the link brings you back here with ?email=&token=
export default function ResetPasswordPage({ email: emailFromLink, token }: { email: string; token: string }) {
  const [email, setEmail] = useState(emailFromLink)
  const [sendStatus, setSendStatus] = useState('')
  const [isSending, setIsSending] = useState(false)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSendStatus('')
    setIsSending(true)
    try {
      const res = await sendResetLink(email.trim())
      // say the same thing either way so people cant fish for which emails have accounts
      setSendStatus(
        res.ok || res.status === 404
          ? 'If that email has an account, a reset link is on its way.'
          : (res.data.message ?? 'Couldn’t send the link. Try again later.'),
      )
    } catch {
      setSendStatus('Can’t reach the server right now. Try again in a sec.')
    } finally {
      setIsSending(false)
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError('')

    const pwError = passwordProblem(password)
    if (pwError) {
      setSaveError(pwError)
      return
    }
    if (password !== confirm) {
      setSaveError('Passwords don’t match.')
      return
    }

    setIsSaving(true)
    try {
      const res = await setNewPassword(email.trim(), token, password)
      if (!res.ok) {
        setSaveError(res.data.message ?? 'That reset link expired. Send a new one above.')
        return
      }

      // "save and log in" so try logging in right away
      const loginRes = await login(email.trim(), password)
      if (loginRes.ok && loginRes.data.token) {
        saveToken(loginRes.data.token)
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    } catch {
      setSaveError('Can’t reach the server right now. Try again in a sec.')
    } finally {
      setIsSaving(false)
    }
  }

  const hasToken = Boolean(token)

  return (
    <div className="page">
      <TopBar />
      <main className="page-body">
        <section className="card step-card">
          <span className="badge badge-purple">Forgot password</span>
          <h1>Reset your password</h1>
          <p className="muted">Enter your email and we’ll send a reset link. The link opens the form below.</p>

          <form onSubmit={handleSend} noValidate>
            <label className="field">
              Email
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button type="submit" className="btn btn-dark" disabled={isSending || !email}>
              {isSending ? 'Sending...' : 'Send reset link'}
            </button>
            {sendStatus && <p className="form-status" role="status">{sendStatus}</p>}
          </form>

          <hr className="dashed" />

          <form onSubmit={handleSave} noValidate>
            <fieldset disabled={!hasToken} className="plain-fieldset">
              <label className="field">
                New password
                <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              {hasToken && <PasswordChecklist password={password} />}
              <label className="field">
                Confirm new password
                <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                {!hasToken && <span className="hint">Open the link from your email to set a new password.</span>}
              </label>

              {saveError && <p className="form-error" role="alert">{saveError}</p>}

              <button type="submit" className="btn btn-primary" disabled={isSaving || !password || !confirm}>
                {isSaving ? 'Saving...' : 'Save and log in'}
              </button>
            </fieldset>
          </form>

          <button className="link back-link" onClick={() => navigate('/login')}>
            Back to log in
          </button>
        </section>
      </main>
    </div>
  )
}
