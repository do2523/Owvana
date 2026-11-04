import { useState } from 'react'
import { CaretLeft, CaretRight, MagnifyingGlass, PencilSimple, Trash } from '@phosphor-icons/react'
import GroupLayout from '../components/GroupLayout'
import Select from '../components/Select'
import EditGroupModal from '../components/EditGroupModal'
import { Avatar, CategoryTag, Modal, PlusIcon } from '../components/ui'
import { navigate } from '../router'
import { deleteExpense, firstName, groupCategories, groupStats, ownerParticipant, useDb } from '../store'
import type { Expense, Group } from '../store'
import { dateRange, downloadCsv, money, shortDate } from '../utils'

const PAGE_SIZE = 8
const SPLIT_LABELS = { equal: 'Equal', exact: 'Exact', percent: 'Percent', shares: 'Shares' }

export default function GroupExpensesPage({ group }: { group: Group }) {
  const db = useDb()
  const stats = groupStats(group._id)
  const owner = ownerParticipant(group._id)
  const categories = groupCategories(group._id)
  const people = db.participants.filter((p) => p.group_id === group._id)

  const [search, setSearch] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [sort, setSort] = useState('newest')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState('')
  const [showManage, setShowManage] = useState(false)
  const [deleting, setDeleting] = useState<Expense | null>(null)

  const label = (id: string) => (id === owner?._id ? 'You' : firstName(people.find((p) => p._id === id)?.name ?? ''))
  const splitsFor = (expenseId: string) => db.expense_splits.filter((s) => s.expense_id === expenseId)

  const all = db.expenses.filter((e) => e.group_id === group._id)
  const filtered = all
    .filter((e) => e.title.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((e) => !paidBy || e.paid_by === paidBy)
    .filter((e) => !categoryId || e.category_id === categoryId)
    .sort((a, b) => {
      if (sort === 'oldest') return a.expense_date.localeCompare(b.expense_date)
      if (sort === 'highest') return b.total_amount - a.total_amount
      if (sort === 'lowest') return a.total_amount - b.total_amount
      return b.expense_date.localeCompare(a.expense_date) || b.created_at.localeCompare(a.created_at)
    })

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const firstIndex = (safePage - 1) * PAGE_SIZE
  const visible = filtered.slice(firstIndex, firstIndex + PAGE_SIZE)
  const selected = all.find((e) => e._id === selectedId) ?? visible[0]

  // chart numbers, biggest category first
  const breakdown = categories
    .map((c) => ({ category: c, amount: all.filter((e) => e.category_id === c._id).reduce((sum, e) => sum + e.total_amount, 0) }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
  const uncategorized = all.filter((e) => !e.category_id).reduce((sum, e) => sum + e.total_amount, 0)

  function exportCsv() {
    downloadCsv(`${group.name} expenses.csv`, [
      ['Date', 'Expense', 'Category', 'Paid by', 'Split', 'Amount'],
      ...filtered.map((e) => [
        e.expense_date,
        e.title,
        categories.find((c) => c._id === e.category_id)?.name ?? '',
        label(e.paid_by),
        `${SPLIT_LABELS[e.split_type]} ${splitsFor(e._id).length}`,
        e.total_amount.toFixed(2),
      ]),
    ])
  }

  const subtitle = (
    <>
      <span>
        {stats.ongoing ? 'Ongoing · ' : stats.start ? `${dateRange(stats.start, stats.end, true)} · ` : ''}you’re the owner
      </span>
      <span className="avatar-stack">
        {people.slice(0, 6).map((p) => (
          <Avatar key={p._id} name={p.name} size={32} isYou={p._id === owner?._id} />
        ))}
      </span>
    </>
  )

  const actions = (
    <>
      <button className="btn-banner" onClick={() => setShowManage(true)}>
        Edit or delete
      </button>
      <button className="btn-coral" onClick={() => navigate(`/groups/${group._id}/expenses/new`)}>
        <PlusIcon /> Add expense
      </button>
    </>
  )

  return (
    <GroupLayout group={group} tab="expenses" subtitle={subtitle} actions={actions}>
      <section className="tile-row">
        <div className="tile">
          <p className="tile-label">Total spent</p>
          <p className="tile-amount">{money(stats.total)}</p>
          <p className="tile-sub">{stats.expenseCount} {stats.expenseCount === 1 ? 'expense' : 'expenses'}</p>
        </div>
        <div className="tile">
          <p className="tile-label">Marked sent</p>
          <p className="tile-amount amount-sent">{money(stats.sent)}</p>
          <p className="tile-sub">{money(stats.waiting)} waiting on you</p>
        </div>
        <div className="tile">
          <p className="tile-label">Confirmed</p>
          <p className="tile-amount amount-confirmed">{money(stats.confirmed)}</p>
          <p className="tile-sub">of {money(stats.owed)} owed to you</p>
        </div>
        <div className="tile tile-red">
          <p className="tile-label">Still owed</p>
          <p className="tile-amount">{money(stats.stillOwed)}</p>
          <p className="tile-sub">owed minus confirmed</p>
        </div>
      </section>

      <div className="two-col">
        <section className="panel">
          <div className="filters">
            <span className="search-wrap">
              <MagnifyingGlass size={16} aria-hidden="true" />
              <input
              className="search-input"
              type="search"
              aria-label="Search expenses"
              placeholder="Search expenses"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
            </span>
            <Select
              className="inline-select"
              label="Paid by"
              value={paidBy}
              options={[{ value: '', label: 'Anyone' }, ...people.map((p) => ({ value: p._id, label: label(p._id) }))]}
              onChange={(next) => {
                setPaidBy(next)
                setPage(1)
              }}
            />
            <Select
              className="inline-select"
              label="Sort"
              value={sort}
              options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'highest', label: 'Highest amount' },
                { value: 'lowest', label: 'Lowest amount' },
              ]}
              onChange={setSort}
            />
            <button className="btn-plain" onClick={exportCsv} disabled={filtered.length === 0}>
              Export CSV
            </button>
          </div>

          <div className="chip-row">
            <button
              className={categoryId === '' ? 'chip chip-all active' : 'chip chip-all'}
              onClick={() => {
                setCategoryId('')
                setPage(1)
              }}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                className={categoryId === c._id ? 'chip active' : 'chip'}
                style={{ background: `color-mix(in srgb, ${c.color} 18%, white)`, color: `color-mix(in srgb, ${c.color} 60%, black)` }}
                onClick={() => {
                  setCategoryId(c._id)
                  setPage(1)
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {all.length === 0 ? (
            <div className="empty">
              <p>No expenses yet.</p>
              <button className="btn btn-primary btn-small" onClick={() => navigate(`/groups/${group._id}/expenses/new`)}>
                Add the first one
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty"><p>Nothing matches those filters.</p></div>
          ) : (
            <table className="data-table expenses-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Paid by</th>
                  <th>Split</th>
                  <th className="right">Amount</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((e) => (
                  <tr key={e._id} className={selected?._id === e._id ? 'selected' : ''} onClick={() => setSelectedId(e._id)}>
                    <td className="muted-cell cell-date">{shortDate(e.expense_date)}</td>
                    <td className="cell-title">
                      <button className="row-title" onClick={() => setSelectedId(e._id)}>{e.title}</button>
                    </td>
                    <td className="cell-cat"><CategoryTag category={categories.find((c) => c._id === e.category_id)} /></td>
                    <td className="cell-paid" data-label="Paid by">{label(e.paid_by)}</td>
                    <td className="muted-cell cell-split">{SPLIT_LABELS[e.split_type]} · {splitsFor(e._id).length}</td>
                    <td className="right strong cell-amount">{money(e.total_amount)}</td>
                    {/* stopPropagation so these dont also select the row */}
                    <td className="row-actions" onClick={(event) => event.stopPropagation()}>
                      <button aria-label={`Edit ${e.title}`} title="Edit" onClick={() => navigate(`/groups/${group._id}/expenses/${e._id}`)}>
                        <PencilSimple size={16} aria-hidden="true" />
                      </button>
                      <button className="danger" aria-label={`Delete ${e.title}`} title="Delete" onClick={() => setDeleting(e)}>
                        <Trash size={16} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {filtered.length > 0 && (
            <div className="pager">
              <span className="muted-cell">
                Showing {firstIndex + 1}–{firstIndex + visible.length} of {filtered.length}
              </span>
              <div className="pager-buttons">
                <button aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}><CaretLeft size={14} weight="bold" /></button>
                {Array.from({ length: pages }, (_, i) => (
                  <button key={i} className={safePage === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
                ))}
                <button aria-label="Next page" disabled={safePage === pages} onClick={() => setPage(safePage + 1)}><CaretRight size={14} weight="bold" /></button>
              </div>
            </div>
          )}
        </section>

        <aside className="side-stack">
          <section className="panel-pad">
            <h2 className="panel-title">Spending by category</h2>
            {breakdown.length === 0 && uncategorized === 0 && <p className="muted">Add an expense to see this.</p>}
            {stats.total > 0 && (
              <>
                <div className="stack-bar" role="img" aria-label="Spending by category chart">
                  {breakdown.map((row) => (
                    <span key={row.category._id} style={{ width: `${(row.amount / stats.total) * 100}%`, background: row.category.color }} />
                  ))}
                  {uncategorized > 0 && <span style={{ width: `${(uncategorized / stats.total) * 100}%`, background: '#c6cad6' }} />}
                </div>
                <ul className="legend">
                  {breakdown.map((row) => (
                    <li key={row.category._id}>
                      <span><i style={{ background: row.category.color }} />{row.category.name}</span>
                      <strong>{money(row.amount)}</strong>
                    </li>
                  ))}
                  {uncategorized > 0 && (
                    <li>
                      <span><i style={{ background: '#c6cad6' }} />No category</span>
                      <strong>{money(uncategorized)}</strong>
                    </li>
                  )}
                </ul>
              </>
            )}
          </section>

          {selected && <WhoOwes expense={selected} group={group} label={label} />}
        </aside>
      </div>

      {deleting && (
        <Modal title={`Delete ${deleting.title}?`} onClose={() => setDeleting(null)}>
          <p className="danger-text">
            This takes {money(deleting.total_amount)} off the group total and off everyone’s share. You can’t undo this.
          </p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setDeleting(null)}>Keep expense</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                deleteExpense(deleting._id)
                setDeleting(null)
              }}
            >
              Yes, delete it
            </button>
          </div>
        </Modal>
      )}

      {showManage && <EditGroupModal group={group} onClose={() => setShowManage(false)} />}
    </GroupLayout>
  )
}

function WhoOwes({ expense, group, label }: { expense: Expense; group: Group; label: (id: string) => string }) {
  const db = useDb()
  const splits = db.expense_splits.filter((s) => s.expense_id === expense._id)
  const howSplit = { equal: 'split equally', exact: 'split by exact amounts', percent: 'split by percent', shares: 'split by shares' }

  return (
    <section className="panel-pad who-owes">
      <p className="eyebrow-teal">Who owes what</p>
      <h2 className="panel-title">{expense.title} · {money(expense.total_amount)}</h2>
      <p className="muted">Paid by {label(expense.paid_by).toLowerCase() === 'you' ? 'you' : label(expense.paid_by)} · {howSplit[expense.split_type]}</p>
      <ul className="owe-list">
        {splits.map((s) => (
          <li key={s._id}>
            <span>{label(s.participant_id)}</span>
            <strong>{money(s.amount_owed)}</strong>
          </li>
        ))}
      </ul>
      <button className="link" onClick={() => navigate(`/groups/${group._id}/expenses/${expense._id}`)}>
        Edit this expense
      </button>
    </section>
  )
}
