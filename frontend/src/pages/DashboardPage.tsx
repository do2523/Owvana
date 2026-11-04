import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check, ClockCountdown, CurrencyDollar, PencilSimple } from '@phosphor-icons/react'
import AppHeader from '../components/AppHeader'
import EditGroupModal from '../components/EditGroupModal'
import { GroupScene } from '../components/Scenes'
import { sceneFor } from '../groupTheme'
import { Avatar, Modal, PlusIcon } from '../components/ui'
import { navigate } from '../router'
import { confirmPayment, createGroup, currentUser, firstName, groupStats, ownerParticipant, paymentTo, useDb } from '../store'
import type { Group, Payment } from '../store'
import { dateRange, money, shortDate, timeAgo } from '../utils'
import './Dashboard.css'

type ActivityItem = { id: string; date: string; text: 'confirmed' | 'disputed' | 'expense'; name: string; amount: number }

export default function DashboardPage() {
  const db = useDb()
  const [showNewGroup, setShowNewGroup] = useState(false)
  const user = currentUser()

  const groups = db.groups.filter((g) => g.owner_id === user?._id)
  const groupIds = new Set(groups.map((g) => g._id))
  const stats = groups.map((g) => groupStats(g._id))
  const stillOwed = stats.reduce((sum, s) => sum + s.stillOwed, 0)
  const waiting = stats.reduce((sum, s) => sum + s.waiting, 0)
  const confirmed = stats.reduce((sum, s) => sum + s.confirmed, 0)

  // only payments coming to you, friends confirm their own
  const comingToMe = db.payments.filter((p) => groupIds.has(p.group_id) && paymentTo(p) === ownerParticipant(p.group_id)?._id)
  const pending = comingToMe
    .filter((p) => p.status === 'sent')
    .sort((a, b) => (b.sent_at ?? '').localeCompare(a.sent_at ?? ''))

  // built from paid_at, sent_at and created_at like the feature list says
  const personName = (id: string) => firstName(db.participants.find((p) => p._id === id)?.name ?? '')
  const activity: ActivityItem[] = [
    ...comingToMe
      .filter((p) => p.status !== 'sent')
      .map((p) => ({
        id: p._id,
        date: (p.status === 'confirmed' ? p.paid_at : p.sent_at) ?? '',
        text: p.status as 'confirmed' | 'disputed',
        name: personName(p.participant_id),
        amount: p.amount,
      })),
    ...db.expenses
      .filter((e) => groupIds.has(e.group_id))
      .map((e) => ({ id: e._id, date: e.created_at, text: 'expense' as const, name: e.title, amount: e.total_amount })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  return (
    <div className="page">
      <AppHeader userName={user?.name ?? ''} active="groups" />

      <main className="dash">
        <div className="dash-top">
          <h1>
            Hey {firstName(user?.name ?? 'there')}, {stillOwed > 0 ? <>you’re owed {money(stillOwed)}</> : 'you’re all settled up'}
          </h1>
          <button className="btn btn-primary btn-small" onClick={() => setShowNewGroup(true)}>
            <PlusIcon /> New group
          </button>
        </div>

        <section className="stat-row" aria-label="Totals">
          <StatCard tone="red" icon="$" label="Still owed to you" amount={stillOwed} />
          <StatCard tone="amber" icon="clock" label="Sent, waiting on you" amount={waiting} />
          <StatCard tone="green" icon="check" label="Confirmed" amount={confirmed} />
        </section>

        <div className="dash-grid">
          <section>
            <h2 className="section-title">Your groups</h2>
            <div className="group-grid">
              {groups.map((group) => (
                <GroupCard key={group._id} group={group} />
              ))}
              <button className="group-card create-card" onClick={() => setShowNewGroup(true)}>
                <span className="create-plus"><PlusIcon size={22} /></span>
                Create a group
              </button>
            </div>
          </section>

          <aside className="dash-side">
            <section className={pending.length > 0 ? 'side-card confirm-card' : 'side-card'}>
              <div className="side-title">
                <h2>Needs confirmation</h2>
                {pending.length > 0 && <span className="count-pill">{pending.length}</span>}
              </div>
              {pending.length === 0 && <p className="muted">Nothing waiting on you right now.</p>}
              {pending.map((payment) => (
                <PendingRow key={payment._id} payment={payment} />
              ))}
            </section>

            <section className="side-card">
              <h2>Recent activity</h2>
              {activity.length === 0 && <p className="muted">No activity yet.</p>}
              <ul className="activity-list">
                {activity.map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.text === 'confirmed' && <>You confirmed <strong>{item.name}’s {money(item.amount)}</strong></>}
                      {item.text === 'disputed' && <>You disputed <strong>{item.name}’s {money(item.amount)}</strong></>}
                      {item.text === 'expense' && <>You added <strong>{item.name} · {money(item.amount)}</strong></>}
                    </span>
                    <time dateTime={item.date}>{shortDate(item.date)}</time>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>

      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
    </div>
  )
}

function StatCard({ tone, icon, label, amount }: { tone: string; icon: string; label: string; amount: number }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon stat-${tone}`} aria-hidden="true">
        {icon === '$' && <CurrencyDollar weight="bold" />}
        {icon === 'clock' && <ClockCountdown weight="bold" />}
        {icon === 'check' && <Check weight="bold" />}
      </span>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-amount">{money(amount)}</p>
      </div>
    </div>
  )
}

function GroupCard({ group }: { group: Group }) {
  const [editing, setEditing] = useState(false)
  const stats = groupStats(group._id)
  const owed = stats.owed
  const allConfirmed = owed > 0 && stats.confirmed >= owed
  const confirmedPct = owed > 0 ? Math.min(100, (stats.confirmed / owed) * 100) : 0
  const sentPct = owed > 0 ? Math.min(100 - confirmedPct, (stats.waiting / owed) * 100) : 0
  const range = stats.ongoing ? 'Ongoing' : stats.start ? dateRange(stats.start, stats.end) : null

  return (
    <div className="group-card-wrap">
      <button className="group-card group-card-link" onClick={() => navigate(`/groups/${group._id}`)}>
        <div className="group-cover">
          <GroupScene scene={sceneFor(group)} />
          {range && <span className={stats.ongoing ? 'cover-pill ongoing' : 'cover-pill'}>{range}</span>}
        </div>
        <div className="group-body">
          <h3>{group.name}</h3>
          <div className="group-meta">
            <span>
              {stats.people} {stats.people === 1 ? 'person' : 'people'} · {stats.expenseCount} {stats.expenseCount === 1 ? 'expense' : 'expenses'}
            </span>
            <strong>{money(stats.total)}</strong>
          </div>
  
          <div className="progress" role="img" aria-label={`${money(stats.confirmed)} confirmed of ${money(owed)} owed`}>
            {allConfirmed ? (
              <span className="bar bar-done" style={{ width: '100%' }} />
            ) : (
              <>
                <span className="bar bar-confirmed" style={{ width: `${confirmedPct}%` }} />
                <span className="bar bar-sent" style={{ width: `${sentPct}%` }} />
              </>
            )}
          </div>
  
          <div className="group-foot">
            {allConfirmed ? (
              <>
                <span className="text-done"><Check size={13} weight="bold" aria-hidden="true" /> All confirmed</span>
                <span className="muted-amount">{money(stats.confirmed)}</span>
              </>
            ) : owed === 0 ? (
              <span className="muted-amount">Nobody owes you here yet</span>
            ) : (
              <>
                <span className="text-confirmed">Confirmed {money(stats.confirmed)}</span>
                <span className="text-sent">Sent {money(stats.sent)}</span>
              </>
            )}
          </div>
        </div>
      </button>
      <button className="group-edit-btn" aria-label={`Edit ${group.name}`} onClick={() => setEditing(true)}>
        <PencilSimple size={14} weight="bold" aria-hidden="true" /> Edit
      </button>
      {editing && <EditGroupModal group={group} onClose={() => setEditing(false)} />}
    </div>
  )
}

function PendingRow({ payment }: { payment: Payment }) {
  const db = useDb()
  const person = db.participants.find((p) => p._id === payment.participant_id)
  const group = db.groups.find((g) => g._id === payment.group_id)
  const name = person?.name ?? ''

  return (
    <div className="pending-row">
      <div className="pending-info">
        <Avatar name={name} />
        <div>
          <p className="pending-main">
            <strong>{firstName(name)}</strong> sent <strong>{money(payment.amount)}</strong> · {payment.payment_method}
          </p>
          <p className="pending-sub">
            {group?.name}
            {payment.sent_at && ` · ${timeAgo(payment.sent_at)}`}
          </p>
          {payment.transaction_id && <p className="pending-sub">Note: “{payment.transaction_id}”</p>}
        </div>
      </div>
      <div className="pending-actions">
        <button className="btn btn-primary btn-small" onClick={() => confirmPayment(payment._id, 'confirmed')}>
          Confirm
        </button>
        <button className="btn btn-outline btn-small" onClick={() => confirmPayment(payment._id, 'disputed')}>
          Dispute
        </button>
      </div>
    </div>
  )
}

function NewGroupModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    const group = createGroup(name.trim())
    // straight to the people tab so you can invite everyone
    navigate(`/groups/${group._id}/participants`)
  }

  return (
    <Modal title="New group" onClose={onClose}>
      <p className="muted">Give it a name, then add the people going.</p>
      <form onSubmit={handleSubmit} noValidate>
        <label className="field">
          Group name
          <input autoFocus maxLength={100} placeholder="Miami Spring Break" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            Create group
          </button>
        </div>
      </form>
    </Modal>
  )
}
