import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

function App() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = (await response.json()) as { message?: string }

      if (!response.ok) {
        setMessage(data.message ?? 'Unable to create your account.')
        return
      }

      setMessage('Account created successfully. You can now sign in.')
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch {
      setMessage('Unable to reach the server. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="signup-page">
      <section className="signup-card">
        <p className="eyebrow">EXPENSE TRACKER</p>
        <h1>Create your account</h1>
        <p className="intro">Keep your shared expenses organized in one place.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Full name
            <input required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Email address
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
            <span className="hint">Use at least 8 characters.</span>
          </label>
          <label>
            Confirm password
            <input type="password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>
          {message && <p className="message" role="status">{message}</p>}
        </form>
      </section>
    </main>
  )
}

export default App
