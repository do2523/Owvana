import { useState } from 'react'
import type { FormEvent } from 'react'
import AppHeader from '../components/AppHeader'
import Select from '../components/Select'
import { Avatar, BackLink, CheckIcon, MinusIcon, Modal, PlusIcon } from '../components/ui'
import { navigate } from '../router'
import {
  TAG_COLORS,
  computeSplit,
  createCategory,
  currentUser,
  deleteExpense,
  firstName,
  groupCategories,
  ownerParticipant,
  saveExpense,
  useDb,
} from '../store'
import type { Group, SplitRow, SplitType } from '../store'
import { allocate, amountText, money, today } from '../utils'
import { sceneFor, useGroupTheme } from '../groupTheme'
import './Group.css'

const MODES: { key: SplitType; label: string }[] = [
  { key: 'equal', label: 'Equal' },
  { key: 'exact', label: 'Exact $' },
  { key: 'percent', label: 'Percent' },
  { key: 'shares', label: 'Shares' },
]

export default function ExpenseFormPage({ group, expenseId }: { group: Group; expenseId?: string }) {
  const db = useDb()
  const people = db.participants.filter((p) => p.group_id === group._id)
  const owner = ownerParticipant(group._id)
  const existing = db.expenses.find((e) => e._id === expenseId && e.group_id === group._id)
  const existingSplits = db.expense_splits.filter((s) => s.expense_id === existing?._id)
  const back = `/groups/${group._id}`
  useGroupTheme(sceneFor(group))

  const [total, setTotal] = useState(existing ? String(existing.total_amount) : '')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [date, setDate] = useState(() => existing?.expense_date ?? today())
  const [paidBy, setPaidBy] = useState(existing?.paid_by ?? owner?._id ?? '')
  const [categoryId, setCategoryId] = useState(existing?.category_id ?? '')
  const [mode, setMode] = useState<SplitType>(existing?.split_type ?? 'equal')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // values are kept as typed text so the inputs dont fight you while typing
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(people.map((p) => [p._id, existing ? existingSplits.some((s) => s.participant_id === p._id) : true])),
  )
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(people.map((p) => [p._id, String(existingSplits.find((s) => s.participant_id === p._id)?.split_value ?? '')])),
  )
  const [shares, setShares] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      people.map((p) => [p._id, existing?.split_type === 'shares' ? (existingSplits.find((s) => s.participant_id === p._id)?.split_value ?? 1) : 1]),
    ),
  )

  const amount = Math.round((parseFloat(total) || 0) * 100) / 100
  const rows: SplitRow[] = people.map((p) => ({
    participant_id: p._id,
    included: Boolean(checked[p._id]),
    value: mode === 'shares' ? (shares[p._id] ?? 1) : mode === 'equal' ? 1 : parseFloat(values[p._id]) || 0,
  }))
  const split = computeSplit(amount, mode, rows)
  const activeCount = rows.filter((r) => r.included).length
  const shareTotal = rows.filter((r) => r.included).reduce((sum, r) => sum + r.value, 0)
  const name = (id: string) => (id === owner?._id ? `You (${firstName(currentUser()?.name ?? '')})` : (people.find((p) => p._id === id)?.name ?? ''))
  const canSave = title.trim() !== '' && date !== '' && paidBy !== '' && amount > 0 && split.balanced

  function switchMode(next: SplitType) {
    // start percent and exact off evenly so you only have to change the ones that are different
    if ((next === 'percent' || next === 'exact') && next !== mode && activeCount > 0) {
      const active = rows.filter((r) => r.included)
      const even = allocate(next === 'percent' ? 100 : amount, active.map(() => 1))
      setValues(Object.fromEntries(active.map((r, i) => [r.participant_id, even[i].toFixed(2)])))
    }
    setMode(next)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) return
    saveExpense(
      { group_id: group._id, title: title.trim(), total_amount: amount, expense_date: date, paid_by: paidBy, category_id: categoryId || undefined, split_type: mode, rows },
      existing?._id,
    )
    navigate(back)
  }

  function hint() {
    if (mode === 'equal') return `${activeCount} ${activeCount === 1 ? 'person' : 'people'} × ${money(activeCount ? amount / activeCount : 0)}. Uncheck anyone who wasn’t part of it.`
    if (mode === 'exact') return 'Type what each person owes. It has to add up to the total.'
    if (mode === 'percent') return 'Type each person’s percent. It has to add up to 100%.'
    return `${shareTotal} ${shareTotal === 1 ? 'share' : 'shares'} × ${money(shareTotal ? amount / shareTotal : 0)}. Give someone 2 if they brought a guest.`
  }

  function balanceText() {
    if (mode === 'percent' && split.percentTotal !== 100) return `Percents add up to ${split.percentTotal}% of 100%`
    return `Split total ${money(split.splitTotal)} of ${money(amount)}`
  }

  return (
    <div className="page">
      <AppHeader userName={currentUser()?.name ?? ''} active="groups" />
      <main className="form-main">
        <BackLink to={back} label={group.name} onGo={navigate} />
        <h1 className="page-title">{existing ? 'Edit expense' : 'Add an expense'}</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-columns">
            <section className="panel-pad">
              <h2 className="step-title"><span>1</span>Details</h2>
              <label className="total-box">
                Total amount
                <span className="total-input">
                  $
                  <input type="text" inputMode="decimal" placeholder="0.00" value={total} onChange={(e) => setTotal(amountText(e.target.value))} />
                </span>
              </label>
              <label className="field">
                Title
                <input maxLength={255} placeholder="Sunset boat tour" value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <div className="field-row">
                <label className="field">
                  Date
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </label>
                <Select
                  label="Paid by"
                  value={paidBy}
                  options={people.map((p) => ({ value: p._id, label: name(p._id) }))}
                  onChange={setPaidBy}
                />
              </div>
              <div className="field">
                Category
                <div className="chip-row chip-row-tight">
                  {groupCategories(group._id).map((c) => (
                    <button
                      type="button"
                      key={c._id}
                      aria-pressed={categoryId === c._id}
                      className={categoryId === c._id ? 'chip picked' : 'chip'}
                      style={{ background: `color-mix(in srgb, ${c.color} 18%, white)`, color: `color-mix(in srgb, ${c.color} 60%, black)` }}
                      onClick={() => setCategoryId(categoryId === c._id ? '' : c._id)}
                    >
                      {categoryId === c._id && <CheckIcon />}{c.name}
                    </button>
                  ))}
                  <button type="button" className="chip chip-new" onClick={() => setShowNewCategory(true)}><PlusIcon size={13} /> New</button>
                </div>
              </div>
            </section>

            <section className="panel-pad">
              <h2 className="step-title"><span>2</span>Split it</h2>
              <div className="tabs split-tabs" role="tablist">
                {MODES.map((m) => (
                  <button type="button" role="tab" key={m.key} aria-selected={mode === m.key} className={mode === m.key ? 'active' : ''} onClick={() => switchMode(m.key)}>
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="hint split-hint">{hint()}</p>

              <ul className="split-list">
                {people.map((p) => {
                  const included = Boolean(checked[p._id])
                  return (
                    <li key={p._id} className={mode === 'shares' && included && (shares[p._id] ?? 1) > 1 ? 'highlight' : ''}>
                      <input
                        type="checkbox"
                        aria-label={`Include ${p.name}`}
                        checked={included}
                        onChange={(e) => setChecked({ ...checked, [p._id]: e.target.checked })}
                      />
                      <Avatar name={p.name} size={36} isYou={p._id === owner?._id} />
                      <span className="split-name">{p._id === owner?._id ? 'You' : p.name}</span>

                      {mode === 'shares' && included && (
                        <span className="stepper">
                          <button type="button" aria-label="Fewer shares" onClick={() => setShares({ ...shares, [p._id]: Math.max(1, (shares[p._id] ?? 1) - 1) })}><MinusIcon size={13} /></button>
                          <span>{shares[p._id] ?? 1}</span>
                          <button type="button" aria-label="More shares" onClick={() => setShares({ ...shares, [p._id]: (shares[p._id] ?? 1) + 1 })}><PlusIcon size={13} /></button>
                        </span>
                      )}
                      {(mode === 'exact' || mode === 'percent') && included && (
                        <span className="value-input">
                          {mode === 'exact' && '$'}
                          <input
                            type="text"
                            inputMode="decimal"
                            aria-label={`${p.name} ${mode === 'exact' ? 'amount' : 'percent'}`}
                            value={values[p._id] ?? ''}
                            onChange={(e) => setValues({ ...values, [p._id]: amountText(e.target.value) })}
                          />
                          {mode === 'percent' && '%'}
                        </span>
                      )}
                      <strong className="split-amount">{included ? money(split.byPerson[p._id] ?? 0) : '—'}</strong>
                    </li>
                  )
                })}
              </ul>

              <div className={split.balanced ? 'balance-bar ok' : 'balance-bar off'} role="status">
                <span>{balanceText()}</span>
                <span>{split.balanced ? <><CheckIcon size={15} /> Balanced</> : 'Doesn’t add up yet'}</span>
              </div>
            </section>
          </div>

          <div className="form-footer">
            {existing && (
              <button type="button" className="link link-danger" onClick={() => setConfirmDelete(true)}>
                Delete expense
              </button>
            )}
            <span className="spacer" />
            <button type="button" className="btn btn-outline btn-auto" onClick={() => navigate(back)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-auto" disabled={!canSave}>Save expense</button>
          </div>
        </form>
      </main>

      {showNewCategory && (
        <NewCategory
          onClose={() => setShowNewCategory(false)}
          onSave={(categoryName) => {
            const used = groupCategories(group._id).length
            setCategoryId(createCategory(group._id, categoryName, TAG_COLORS[used % TAG_COLORS.length])._id)
            setShowNewCategory(false)
          }}
        />
      )}

      {confirmDelete && existing && (
        <Modal title="Delete this expense?" onClose={() => setConfirmDelete(false)}>
          <p className="muted">{existing.title} comes off everyone’s balance. You can’t undo it.</p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setConfirmDelete(false)}>Keep it</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                deleteExpense(existing._id)
                navigate(back)
              }}
            >
              Yes, delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function NewCategory({ onClose, onSave }: { onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <Modal title="New category" onClose={onClose}>
      <label className="field">
        Name
        <input autoFocus maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" disabled={!name.trim()} onClick={() => onSave(name.trim())}>Add</button>
      </div>
    </Modal>
  )
}
