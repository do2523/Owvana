import { useEffect } from 'react'
import { PinIcon } from '../components/Logo'
import { GroupScene } from '../components/Scenes'
import { sceneFor, useGroupTheme } from '../groupTheme'
import { LockSimple } from '@phosphor-icons/react'
import SendPaymentForm from '../components/SendPaymentForm'
import { Avatar, CategoryTag, CheckIcon, StatusBadge } from '../components/ui'
import { confirmPayment, debtsFrom, debtsTo, firstName, groupCategories, loadLink, ownerParticipant, participantBalance, participantName, participantShare, paymentTo, sessionStatus, useDb } from '../store'
import { money, shortDate, timeAgo } from '../utils'
import './Group.css'

// the private page people open from their link. no login on purpose
export default function ParticipantLinkPage({ token }: { token: string }) {
  const db = useDb()
  const state = sessionStatus()
  const me = db.participants.find((p) => p.access_token === token)
  const group = db.groups.find((g) => g._id === me?.group_id)
  useGroupTheme(group ? sceneFor(group) : '')

  // the link itself is the login, so ask the backend for everything this person may see
  useEffect(() => {
    void loadLink(token)
  }, [token])

  if (state !== 'link' && state !== 'failed') {
    return (
      <main className="link-missing">
        <p className="muted">Loading your share...</p>
      </main>
    )
  }

  if (state === 'failed') {
    return (
      <main className="link-missing">
        <h1>Can’t reach the server</h1>
        <p className="muted">Check your connection and refresh the page.</p>
      </main>
    )
  }

  if (!me || !group) {
    return (
      <main className="link-missing">
        <h1>That link didn’t work</h1>
        <p className="muted">It may have been removed. Ask whoever sent it for a new one.</p>
      </main>
    )
  }

  const person = me
  const owner = ownerParticipant(group._id)
  const balance = participantBalance(me._id)
  const iOwe = debtsFrom(me._id).filter((d) => d.remaining > 0)
  const owedToMe = debtsTo(me._id).filter((d) => d.remaining > 0)
  const nameOf = (id: string) => firstName(participantName(id))
  const categories = groupCategories(group._id)
  const paidPct = balance.owed > 0 ? Math.min(100, (balance.confirmed / balance.owed) * 100) : 0

  const splits = db.expense_splits.filter((s) => s.participant_id === me._id)
  const rows = splits
    .map((s) => ({ split: s, expense: db.expenses.find((e) => e._id === s.expense_id) }))
    .filter((r) => r.expense)
  const payments = db.payments
    .filter((p) => p.participant_id === me._id || paymentTo(p) === me._id)
    .sort((a, b) => (b.sent_at ?? '').localeCompare(a.sent_at ?? ''))
  const toConfirm = payments.filter((p) => p.status === 'sent' && paymentTo(p) === me._id)

  function paidByName(id: string) {
    if (id === person._id) return 'you'
    return firstName(db.participants.find((p) => p._id === id)?.name ?? '')
  }

  return (
    <div className="link-page">
      <header className="link-hero">
        <GroupScene scene={sceneFor(group)} />
        <div className="link-column">
          <div className="link-hero-top">
            <span className="logo logo-light">
              <span className="logo-mark"><PinIcon /></span>
              Owvana
            </span>
            <span className="private-pill"><LockSimple size={14} aria-hidden="true" /> Private link · no login needed</span>
          </div>
          <p className="link-owner">{owner?.name ?? 'Your'}’s group</p>
          <h1>{group.name}</h1>
          <p className="link-hi">Hi {firstName(me.name)}, here’s your share of the trip.</p>
        </div>
      </header>

      <main className="link-column link-body">
        {toConfirm.length > 0 && (
          <section className="panel-pad confirm-card">
            <div className="side-title">
              <h2 className="panel-title">Did this money arrive?</h2>
              <span className="count-pill">{toConfirm.length}</span>
            </div>
            {toConfirm.map((p) => (
              <div key={p._id} className="pending-row">
                <div className="pending-info">
                  <Avatar name={participantName(p.participant_id)} />
                  <div>
                    <p className="pending-main">
                      <strong>{nameOf(p.participant_id)}</strong> sent you <strong>{money(p.amount)}</strong> · {p.payment_method}
                    </p>
                    <p className="pending-sub">
                      {p.transaction_id && `Note: “${p.transaction_id}” · `}
                      {p.sent_at && timeAgo(p.sent_at)}
                    </p>
                  </div>
                </div>
                <div className="pending-actions">
                  <button className="btn btn-primary btn-small" onClick={() => confirmPayment(p._id, 'confirmed')}>Confirm received</button>
                  <button className="btn btn-outline btn-small" onClick={() => confirmPayment(p._id, 'disputed')}>Dispute</button>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="panel-pad link-main-card">
          <p className="tile-label">You still owe</p>
          <div className="side-title">
            <p className="link-amount">{money(balance.balance)}</p>
            <StatusBadge status={balance.status} />
          </div>
          <div className="progress progress-big">
            <span className="bar bar-done" style={{ width: `${paidPct}%` }} />
          </div>
          {iOwe.length > 0 && (
            <ul className="owe-list">
              {iOwe.map((d) => (
                <li key={d.to}>
                  <span>{nameOf(d.to)}</span>
                  <strong>{money(d.remaining)}</strong>
                </li>
              ))}
            </ul>
          )}
          <p className="muted">
            You owed <strong>{money(balance.owed)}</strong> and <strong>{money(balance.confirmed)}</strong> of it is confirmed
          </p>
          <hr className="plain-line" />

          <SendPaymentForm me={person} />
        </section>

        {owedToMe.length > 0 && (
          <section className="panel-pad">
            <h2 className="panel-title">Owed to you</h2>
            <ul className="owe-list">
              {owedToMe.map((d) => (
                <li key={d.from}>
                  <span>{nameOf(d.from)}</span>
                  <strong>{money(d.remaining)}</strong>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="panel-pad">
          <div className="side-title">
            <h2 className="panel-title">Your share of each expense</h2>
            <span className="muted-cell">{rows.length} {rows.length === 1 ? 'expense' : 'expenses'}</span>
          </div>
          {rows.length === 0 && <p className="muted">Nothing added for you yet.</p>}
          <ul className="share-list">
            {rows.map(({ split, expense }) => (
              <li key={split._id}>
                <div>
                  <h3>{expense!.title}</h3>
                  <p className="share-meta">
                    <CategoryTag category={categories.find((c) => c._id === expense!.category_id)} />
                    <span>{money(expense!.total_amount)} · paid by {paidByName(expense!.paid_by)}</span>
                  </p>
                </div>
                <strong>{money(split.amount_owed)}</strong>
              </li>
            ))}
          </ul>
          <div className="share-total">
            <span>Your total share</span>
            <span>{money(participantShare(me._id))}</span>
          </div>
        </section>

        <section className="panel-pad">
          <h2 className="panel-title">Your payments</h2>
          {payments.length === 0 && <p className="muted">No payments yet.</p>}
          <ul className="history-list">
            {payments.map((p) => {
              const incoming = paymentTo(p) === me._id
              const other = nameOf(incoming ? p.participant_id : paymentTo(p))
              return (
                <li key={p._id}>
                  <p>{incoming ? `From ${other}` : `To ${other}`} · {money(p.amount)} · {p.payment_method} · {shortDate(p.paid_at ?? p.sent_at ?? '')}</p>
                  {p.status === 'confirmed' && <StatusBadge status="confirmed"><CheckIcon /> Confirmed{incoming ? '' : ` by ${other}`}</StatusBadge>}
                  {p.status === 'sent' && <StatusBadge status="sent">Waiting on {incoming ? 'you' : other}</StatusBadge>}
                  {p.status === 'disputed' && <StatusBadge status="disputed">{incoming ? 'You said it didn’t arrive' : `${other} says it didn’t arrive`}</StatusBadge>}
                </li>
              )
            })}
          </ul>
        </section>
      </main>
    </div>
  )
}
