import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { resendVerification } from '../api'
import { navigate } from '../router'

const WAIT_SECONDS = 60

export default function CheckEmailPage({ email }: { email: string }) {
  const [secondsLeft, setSecondsLeft] = useState(WAIT_SECONDS)
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  async function handleResend() {
    setStatus('')
    setIsSubmitting(true)
    try {
      const res = await resendVerification(email)
      if (!res.ok) {
        setStatus(res.data.message ?? 'Couldn’t resend the email. Try again later.')
        return
      }
      setStatus('Sent! Check your inbox again.')
      setSecondsLeft(WAIT_SECONDS)
    } catch {
      setStatus('Can’t reach the server right now. Try again in a sec.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const mins = Math.floor(secondsLeft / 60)
  const secs = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="page">
      <TopBar />
      <main className="page-body">
        <section className="card step-card center">
          <span className="badge badge-teal">Step 2 · Verify email</span>
          <div className="mail-circle" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </div>
          <h1>Check your inbox</h1>
          <p className="muted big">
            We sent a verification link to {email ? <strong>{email}</strong> : 'your email'}. Click it to activate your
            account, then log in.
          </p>

          <div className="info-box">
            {secondsLeft > 0 ? (
              <>Can’t find it? Check spam, or resend in <strong>{mins}:{secs}</strong>.</>
            ) : (
              <>Can’t find it? Check spam, or resend it now.</>
            )}
          </div>

          {status && <p className="form-status" role="status">{status}</p>}

          <button className="btn btn-outline" onClick={handleResend} disabled={isSubmitting || secondsLeft > 0 || !email}>
            {isSubmitting ? 'Sending...' : 'Resend email'}
          </button>
          <button className="link" onClick={() => navigate('/login')}>
            Back to log in
          </button>
        </section>
      </main>
    </div>
  )
}
