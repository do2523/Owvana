import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Copy, EnvelopeSimple, LockSimple } from '@phosphor-icons/react'
import GroupLayout from '../components/GroupLayout'
import { Avatar, StatusBadge } from '../components/ui'
import { addToGroup, currentUser, ownerParticipant, participantBalance, removeFromGroup, updateParticipant, useDb } from '../store'
import type { Group, Participant } from '../store'
import { money } from '../utils'

export default function GroupParticipantsPage({ group }: { group: Group }) {
  const db = useDb()
  const owner = ownerParticipant(group._id)
  const people = db.participants.filter((p) => p.group_id === group._id && p._id !== owner?._id)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [justAdded, setJustAdded] = useState('')

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('That email doesn’t look right.')
      return
    }
    const added = addToGroup(group._id, name.trim(), email.trim())
    setJustAdded(added._id)
    setName('')
    setEmail('')
  }

  return (
    <GroupLayout group={group} tab="participants">
      <div className="two-col">
        <section>
          <h2 className="count-title">
            {people.length} {people.length === 1 ? 'participant' : 'participants'} <span>+ you (owner)</span>
          </h2>
          {people.length === 0 && <div className="panel empty"><p>Nobody here yet. Add the people going on the trip and send them their links.</p></div>}
          <div className="person-list">
            {people.map((p) => (
              <PersonCard key={p._id} person={p} group={group} highlight={p._id === justAdded} />
            ))}
          </div>
        </section>

        <aside className="side-stack">
          <form className="panel-pad" onSubmit={handleAdd} noValidate>
            <h2 className="panel-title">Add a participant</h2>
            <label className="field">
              Name
              <input maxLength={100} placeholder="e.g. Taylor Brooks" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span>Email <span className="field-note">(optional, so you can email their link)</span></span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Add and create link</button>
          </form>

          <div className="purple-note">
            <LockSimple size={22} aria-hidden="true" />
            <p>Each person gets their own private link. No account needed, and it only shows their share.</p>
          </div>
        </aside>
      </div>
    </GroupLayout>
  )
}

function PersonCard({ person, group, highlight }: { person: Participant; group: Group; highlight: boolean }) {
  const balance = participantBalance(person._id)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(person.name)
  const [email, setEmail] = useState(person.email ?? '')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const path = `/p/${person.access_token}`
  const fullLink = `${window.location.origin}${path}`

  async function copyLink() {
    await navigator.clipboard.writeText(fullLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // opens their email app for now, real sending needs sendgrid/nodemailer on the backend
  const owner = currentUser()?.name ?? 'Your friend'
  const mailto = `mailto:${person.email}?subject=${encodeURIComponent(`Your share of ${group.name}`)}&body=${encodeURIComponent(
    `Hi ${person.name},\n\n${owner} added you to ${group.name} on Owvana. Here's your private link showing what you owe:\n\n${fullLink}\n\nNo account needed.`,
  )}`

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('That email doesn’t look right.')
      return
    }
    updateParticipant(person._id, name.trim(), email.trim())
    setError('')
    setEditing(false)
  }

  function handleRemove() {
    if (!removeFromGroup(person._id)) {
      setError(`${person.name} is on an expense or payment, so take them off those first.`)
    }
  }

  return (
    <article className={highlight ? 'person-card highlight' : 'person-card'}>
      <div className="person-top">
        <Avatar name={person.name} size={52} />
        <div className="person-name">
          <h3>{person.name}</h3>
          <p>{person.email ?? 'No email on file'}</p>
        </div>
        <span className="owes-label">Owes</span>
        <strong className="owes-amount">{money(balance.balance)}</strong>
        <StatusBadge status={balance.status}>
          {balance.status === 'sent' ? `Sent ${money(balance.waiting)} · check it` : undefined}
        </StatusBadge>
      </div>

      <div className="link-row">
        <span className="link-text">
          {window.location.host}/p/<strong>{person.access_token}</strong>
        </span>
        <button className="btn-link-action primary" onClick={copyLink}>{copied ? <><Check size={15} weight="bold" aria-hidden="true" /> Copied</> : <><Copy size={15} aria-hidden="true" /> Copy link</>}</button>
        {person.email && <a className="btn-link-action" href={mailto}><EnvelopeSimple size={15} aria-hidden="true" /> Email link</a>}
        <a className="link" href={path} target="_blank" rel="noreferrer">Preview</a>
      </div>

      {editing ? (
        <form className="edit-person" onSubmit={saveEdit} noValidate>
          <label className="field">
            Name
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="field">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" className="btn-link-action primary">Save</button>
          <button type="button" className="btn-link-action" onClick={() => setEditing(false)}>Cancel</button>
        </form>
      ) : (
        <div className="person-actions">
          <button className="link" onClick={() => setEditing(true)}>Edit</button>
          <button className="link link-danger" onClick={handleRemove}>Remove</button>
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </article>
  )
}
