import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import { verifyEmail } from '../api'
import { navigate } from '../router'

type Status = 'checking' | 'verified' | 'failed'

// this is the page the link in the verification email opens
export default function VerifyEmailPage({ email, token }: { email: string; token: string }) {
  const [status, setStatus] = useState<Status>(token ? 'checking' : 'failed')

  useEffect(() => {
    if (!token) return
    let cancelled = false

    verifyEmail(token)
      .then((res) => {
        if (cancelled) return
        // api list says this gives back true/false, so handle a bare boolean too
        const body = res.data as unknown
        const ok = res.ok && body !== false && res.data?.verified !== false
        setStatus(ok ? 'verified' : 'failed')
      })
      .catch(() => !cancelled && setStatus('failed'))

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="page">
      <TopBar />
      <main className="page-body">
        <section className="card step-card center">
          <span className="badge badge-teal">Step 2 · Verify email</span>

          {status === 'checking' && (
            <>
              <h1>Verifying your email...</h1>
              <p className="muted big">Hang on a second.</p>
            </>
          )}

          {status === 'verified' && (
            <>
              <h1>You’re verified</h1>
              <p className="muted big">Your account is active. Log in to start your first group.</p>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>
                Log in
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <h1>That link didn’t work</h1>
              <p className="muted big">It may have expired or already been used. Try logging in, or request a new link.</p>
              <button className="btn btn-outline" onClick={() => navigate(`/check-email?email=${encodeURIComponent(email)}`)}>
                Get a new link
              </button>
              <button className="link" onClick={() => navigate('/login')}>
                Back to log in
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
