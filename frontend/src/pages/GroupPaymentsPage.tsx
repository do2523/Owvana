import { useState } from 'react'
import type { FormEvent } from 'react'
import GroupLayout from '../components/GroupLayout'
import SendPaymentForm from '../components/SendPaymentForm'
import Select from '../components/Select'
import { Avatar, StatusBadge } from '../components/ui'
import { confirmPayment, debtsFrom, firstName, groupStats, ownerParticipant, pairBalance, participantName, paymentTo, recordPayment, useDb } from '../store'
import type { Group, Payment } from '../store'
import { amountText, downloadCsv, money, shortDate, timeAgo } from '../utils'

export default function GroupPaymentsPage({ group }: { group: Group }) {
  const db = useDb()
  const stats = groupStats(group._id)
  const owner = ownerParticipant(group._id)
  const people = db.participants.filter((p) => p.group_id === group._id && p._id !== owner?._id)
  const payments = db.payments.filter((p) => p.group_id === group._id)
  const pending = payments.filter((p) => p.status === 'sent' && paymentTo(p) === owner?._id)
  const history = [...payments].sort((a, b) => (b.sent_at ?? '').localeCompare(a.sent_at ?? ''))
  const nameOf = (id: string) => participantName(id)
  const shortName = (id: string) => (id === owner?._id ? 'you' : firstName(nameOf(id)))
  const iOwe = owner ? debtsFrom(owner._id).filter((d) => d.remaining > 0) : []

  function historyLine(p: Payment) {
    if (p.recorded_by_owner) return `Recorded by you ${shortDate(p.paid_at ?? '')}`
    if (p.status === 'confirmed') return `Confirmed ${shortDate(p.paid_at ?? '')}`
    const to = paymentTo(p)
    if (p.status === 'disputed') return `Marked sent ${shortDate(p.sent_at ?? '')} · ${to === owner?._id ? 'you said it never arrived' : `${shortName(to)} said it never arrived`}`
    if (to !== owner?._id) return `Marked sent ${shortDate(p.sent_at ?? '')} · waiting on ${shortName(to)} to confirm`
    return `Marked sent ${shortDate(p.sent_at ?? '')}`
  }

  function exportCsv() {
    downloadCsv(`${group.name} balances.csv`, [
      ['Person', 'Owed to you', 'Confirmed', 'Remaining', 'Status'],
      ...people.map((p) => {
        const b = pairBalance(p._id, owner?._id ?? '')
        return [p.name, b.owed.toFixed(2), b.confirmed.toFixed(2), b.balance.toFixed(2), b.status]
      }),
      [],
      ['From', 'To', 'Amount', 'Method', 'Status', 'Sent', 'Confirmed', 'Note'],
      ...history.map((p) => [nameOf(p.participant_id), nameOf(paymentTo(p)), p.amount.toFixed(2), p.payment_method, p.status, p.sent_at ?? '', p.paid_at ?? '', p.transaction_id ?? '']),
    ])
  }

  const confirmedPct = stats.owed > 0 ? Math.min(100, (stats.confirmed / stats.owed) * 100) : 0
  const sentPct = stats.owed > 0 ? Math.min(100 - confirmedPct, (stats.waiting / stats.owed) * 100) : 0

  return (
    <GroupLayout group={group} tab="payments">
      {pending.map((p) => (
        <section key={p._id} className="pending-banner">
          <Avatar name={nameOf(p.participant_id)} size={44} />
          <div className="pending-banner-text">
            <p>
              <strong>{firstName(nameOf(p.participant_id))}</strong> marked <strong>{money(p.amount)}</strong> as sent · {p.payment_method}
            </p>
            <p className="pending-sub">
              {p.transaction_id && `Note: “${p.transaction_id}” · `}
              {p.sent_at && timeAgo(p.sent_at)}
            </p>
          </div>
          <button className="btn btn-primary btn-small" onClick={() => confirmPayment(p._id, 'confirmed')}>Confirm received</button>
          <button className="btn btn-outline btn-small" onClick={() => confirmPayment(p._id, 'disputed')}>Dispute</button>
        </section>
      ))}

      <div className="two-col">
        <div className="main-stack">
          <section className="panel-pad">
            <div className="summary-row">
              <div>
                <p className="tile-label">Marked sent</p>
                <p className="summary-amount amount-sent">{money(stats.sent)}</p>
              </div>
              <div>
                <p className="tile-label">Confirmed</p>
                <p className="summary-amount amount-confirmed">{money(stats.confirmed)}</p>
              </div>
              <div>
                <p className="tile-label">Owed to you in total</p>
                <p className="summary-amount">{money(stats.owed)}</p>
              </div>
            </div>
            <div className="progress progress-big" role="img" aria-label={`${money(stats.confirmed)} confirmed of ${money(stats.owed)} owed`}>
              <span className="bar bar-done" style={{ width: `${confirmedPct}%` }} />
              <span className="bar bar-sent" style={{ width: `${sentPct}%` }} />
            </div>
            <p className="muted">Only confirmed payments lower someone’s balance.</p>
          </section>

          <section className="panel">
            <h2 className="panel-title table-title">Balances</h2>
            {people.length === 0 ? (
              <div className="empty"><p>Add people to the group to see their balances.</p></div>
            ) : (
              <table className="data-table balances-table">
                <thead>
                  <tr><th>Person</th><th>Owed to you</th><th>Confirmed</th><th>Remaining</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {people.map((p) => {
                    const b = pairBalance(p._id, owner?._id ?? '')
                    return (
                      <tr key={p._id} className="no-click">
                        <td className="cell-person"><span className="person-cell"><Avatar name={p.name} size={36} /><strong>{firstName(p.name)}</strong></span></td>
                        <td data-label="Owed to you">{money(b.owed)}</td>
                        <td data-label="Confirmed">{money(b.confirmed)}</td>
                        <td data-label="Remaining" className={b.balance > 0 ? 'strong' : 'muted-cell'}>{money(b.balance)}</td>
                        <td><StatusBadge status={b.status} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section className="panel-pad">
            <div className="side-title">
              <h2 className="panel-title">Payment history</h2>
              <button className="btn-plain" onClick={exportCsv}>Export CSV</button>
            </div>
            {history.length === 0 && <p className="muted">No payments yet.</p>}
            <ul className="history-list">
              {history.map((p) => (
                <li key={p._id}>
                  <div>
                    <p><strong>{firstName(nameOf(p.participant_id))} to {shortName(paymentTo(p))} · {money(p.amount)}</strong> · {p.payment_method}</p>
                    <p className="pending-sub">{historyLine(p)}</p>
                  </div>
                  <StatusBadge status={p.status}>{p.status === 'confirmed' ? 'Confirmed' : undefined}</StatusBadge>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="side-stack">
          {owner && iOwe.length > 0 && (
            <section className="panel-pad">
              <h2 className="panel-title">You owe</h2>
              <ul className="owe-list">
                {iOwe.map((d) => (
                  <li key={d.to}>
                    <span>{firstName(nameOf(d.to))}</span>
                    <strong>{money(d.remaining)}</strong>
                  </li>
                ))}
              </ul>
              <SendPaymentForm me={owner} />
            </section>
          )}
          <RecordPayment group={group} />
          <section className="panel-pad">
            <h2 className="panel-title">How payments work</h2>
            <ol className="how-list">
              <li><span className="how-1">1</span>Whoever owes pays outside the app and taps “I sent it.”</li>
              <li><span className="how-2">2</span>Whoever receives it confirms it arrived, or disputes it.</li>
              <li><span className="how-3">3</span>A disputed payment goes back to unpaid.</li>
            </ol>
          </section>
        </aside>
      </div>
    </GroupLayout>
  )
}

function RecordPayment({ group }: { group: Group }) {
  const db = useDb()
  const owner = ownerParticipant(group._id)
  const people = db.participants.filter((p) => p.group_id === group._id && p._id !== owner?._id)

  const [fromId, setFromId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('Cash')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  const from = people.find((p) => p._id === fromId) ?? people[0]
  const balance = from ? pairBalance(from._id, owner?._id ?? '').balance : 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSaved('')
    const value = Math.round((parseFloat(amount) || 0) * 100) / 100
    if (!from) return
    if (value <= 0) {
      setError('Enter an amount above $0.')
      return
    }
    if (value > balance) {
      setError(`${firstName(from.name)} only owes ${money(balance)}.`)
      return
    }
    recordPayment(from, value, method.trim() || 'Cash', note.trim())
    setSaved(`Saved ${money(value)} from ${firstName(from.name)}.`)
    setAmount('')
    setNote('')
  }

  return (
    <form className="panel-pad" onSubmit={handleSubmit} noValidate>
      <h2 className="panel-title">Record a payment</h2>
      <p className="muted">For money you got in person, like cash. It counts as confirmed right away.</p>
      <Select
        label="From"
        value={from?._id ?? ''}
        disabled={people.length === 0}
        options={people.map((p) => ({ value: p._id, label: `${firstName(p.name)} · owes ${money(pairBalance(p._id, owner?._id ?? '').balance)}` }))}
        onChange={(next) => {
          setFromId(next)
          setAmount('')
        }}
      />
      <div className="field-row">
        <label className="field">
          Amount
          <input type="text" inputMode="decimal" placeholder={balance.toFixed(2)} value={amount} onChange={(e) => setAmount(amountText(e.target.value))} />
        </label>
        <label className="field">
          Method
          <input maxLength={50} value={method} onChange={(e) => setMethod(e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Note <span className="field-note">(optional)</span></span>
        <input maxLength={255} placeholder="e.g. paid at the airport" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {saved && <p className="form-status" role="status">{saved}</p>}
      <button type="submit" className="btn btn-primary" disabled={!from || !amount}>Save payment</button>
    </form>
  )
}
