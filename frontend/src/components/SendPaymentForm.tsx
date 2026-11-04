import { useState } from 'react'
import type { FormEvent } from 'react'
import Select from './Select'
import { debtsFrom, firstName, participantName, sendPayment } from '../store'
import type { Participant } from '../store'
import { amountText, money } from '../utils'

// "I sent it" form, used on the private link page and by the owner on the payments tab
export default function SendPaymentForm({ me }: { me: Participant }) {
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Venmo')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')

  // whatever isnt already waiting on a confirm is what they can still send
  const targets = debtsFrom(me._id)
    .map((d) => ({ to: d.to, left: Math.round((d.remaining - d.waiting) * 100) / 100 }))
    .filter((d) => d.left > 0)
  const target = targets.find((d) => d.to === toId) ?? targets[0]

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!target) return
    setError('')
    setSentTo('')
    const value = Math.round((parseFloat(amount || String(target.left)) || 0) * 100) / 100
    if (value <= 0) {
      setError('Enter an amount above $0.')
      return
    }
    if (value > target.left) {
      setError(`You only have ${money(target.left)} left to send.`)
      return
    }
    sendPayment(me, target.to, value, method.trim() || 'Other', note.trim())
    setSentTo(firstName(participantName(target.to)))
    setAmount('')
    setNote('')
  }

  const sentMessage = sentTo && <p className="form-status" role="status">Sent. {sentTo} will get a note to confirm it.</p>

  if (!target) {
    return (
      <>
        <p className="all-sent">
          {debtsFrom(me._id).some((d) => d.remaining > 0) ? 'You’ve marked everything as sent. Waiting on them to confirm.' : 'You’re all paid up. Nothing left to send.'}
        </p>
        {sentMessage}
      </>
    )
  }

  const toFirst = firstName(participantName(target.to))

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2 className="panel-title">Paid someone? Let them know.</h2>
      <Select
        label="Who did you pay?"
        value={target.to}
        options={targets.map((d) => ({ value: d.to, label: `${firstName(participantName(d.to))} · ${money(d.left)} left` }))}
        onChange={(next) => {
          setToId(next)
          setAmount('')
        }}
      />
      <div className="field-row">
        <label className="field">
          Amount
          <input type="text" inputMode="decimal" placeholder={target.left.toFixed(2)} value={amount} onChange={(e) => setAmount(amountText(e.target.value))} />
        </label>
        <label className="field">
          Method
          <input maxLength={50} value={method} onChange={(e) => setMethod(e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Note <span className="field-note">(optional)</span></span>
        <input maxLength={255} placeholder="e.g. Venmo note or reference" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button type="submit" className="btn btn-coral-full">I sent it</button>
      <p className="muted center-text">What you owe goes down once {toFirst} confirms the money arrived.</p>
      {sentMessage}
    </form>
  )
}
