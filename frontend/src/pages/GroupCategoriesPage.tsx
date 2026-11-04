import { useState } from 'react'
import type { FormEvent } from 'react'
import GroupLayout from '../components/GroupLayout'
import { CategoryTag, Modal } from '../components/ui'
import { TAG_COLORS, createCategory, deleteCategory, groupCategories, renameCategory, useDb } from '../store'
import type { Category, Group } from '../store'
import { money } from '../utils'

export default function GroupCategoriesPage({ group }: { group: Group }) {
  const db = useDb()
  const categories = groupCategories(group._id)
  const [name, setName] = useState('')
  const [color, setColor] = useState(TAG_COLORS[4])
  const [renaming, setRenaming] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [error, setError] = useState('')

  const isTaken = (value: string, except?: string) => categories.some((c) => c._id !== except && c.name.toLowerCase() === value.toLowerCase())

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (isTaken(name.trim())) {
      setError('This group already has that category.')
      return
    }
    createCategory(group._id, name.trim(), color)
    setName('')
  }

  return (
    <GroupLayout group={group} tab="categories">
      <div className="two-col">
        <section>
          <p className="muted section-intro">Every group starts with the default categories. Add your own for this group.</p>
          <div className="category-grid">
            {categories.map((c) => {
              const expenses = db.expenses.filter((e) => e.group_id === group._id && e.category_id === c._id)
              const isDefault = c.group_id === null
              return (
                <article key={c._id} className="category-card">
                  <div className="side-title">
                    <CategoryTag category={c} />
                    {isDefault ? (
                      <span className="default-label">Default</span>
                    ) : (
                      <span className="category-actions">
                        <button className="link" onClick={() => setRenaming(c)}>Rename</button>
                        <button className="link link-danger" onClick={() => setDeleting(c)}>Delete</button>
                      </span>
                    )}
                  </div>
                  <div className="side-title category-foot">
                    <span className="muted-cell">
                      {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}{!isDefault && ' · custom'}
                    </span>
                    <strong>{money(expenses.reduce((sum, e) => sum + e.total_amount, 0))}</strong>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="side-stack">
          <form className="panel-pad" onSubmit={handleAdd} noValidate>
            <h2 className="panel-title">New category for this group</h2>
            <label className="field">
              Name
              <input maxLength={50} placeholder="Souvenirs" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <div className="field">
              Tag color
              <div className="swatches">
                {TAG_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    aria-label={`Color ${c}`}
                    aria-pressed={color === c}
                    className={color === c ? 'swatch picked' : 'swatch'}
                    style={{ background: c, color: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <p className="preview-line">
              Preview <CategoryTag category={{ _id: 'preview', group_id: group._id, name: name.trim() || 'Souvenirs', color }} />
            </p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Add category</button>
          </form>
        </aside>
      </div>

      {renaming && <RenameCategory category={renaming} isTaken={isTaken} onClose={() => setRenaming(null)} />}

      {deleting && (
        <Modal title={`Delete ${deleting.name}?`} onClose={() => setDeleting(null)}>
          <p className="muted">Expenses in this category stay, they just won’t have a category anymore.</p>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setDeleting(null)}>Keep it</button>
            <button
              className="btn btn-danger"
              onClick={() => {
                deleteCategory(deleting._id)
                setDeleting(null)
              }}
            >
              Yes, delete
            </button>
          </div>
        </Modal>
      )}
    </GroupLayout>
  )
}

function RenameCategory({ category, isTaken, onClose }: { category: Category; isTaken: (v: string, except?: string) => boolean; onClose: () => void }) {
  const [name, setName] = useState(category.name)
  const taken = isTaken(name.trim(), category._id)

  return (
    <Modal title="Rename category" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim() || taken) return
          renameCategory(category._id, name.trim())
          onClose()
        }}
        noValidate
      >
        <label className="field">
          Name
          <input autoFocus maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        {taken && <p className="form-error" role="alert">This group already has that category.</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim() || taken}>Save</button>
        </div>
      </form>
    </Modal>
  )
}
