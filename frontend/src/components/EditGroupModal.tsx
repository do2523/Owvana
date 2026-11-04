import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check } from '@phosphor-icons/react'
import { GroupScene } from './Scenes'
import { Modal } from './ui'
import { SCENE_OPTIONS, sceneFor } from '../groupTheme'
import { navigate } from '../router'
import { deleteGroup, groupStats, updateGroup } from '../store'
import type { Group } from '../store'

// edit popup, delete opens a second popup so you cant do it by accident
export default function EditGroupModal({ group, onClose }: { group: Group; onClose: () => void }) {
  const [name, setName] = useState(group.name)
  const [scene, setScene] = useState(sceneFor(group))
  const [confirming, setConfirming] = useState(false)
  const stats = groupStats(group._id)

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    updateGroup(group._id, name.trim(), scene)
    onClose()
  }

  if (confirming) {
    return (
      <Modal title={`Delete ${group.name}?`} onClose={() => setConfirming(false)}>
        <p className="danger-text">
          This permanently deletes the group, its {stats.expenseCount} {stats.expenseCount === 1 ? 'expense' : 'expenses'} and all of its payments. Everyone’s private links stop working too. You can’t undo this.
        </p>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={() => setConfirming(false)}>Keep group</button>
          <button
            className="btn btn-danger"
            onClick={() => {
              deleteGroup(group._id)
              navigate('/dashboard')
            }}
          >
            Yes, delete it
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Edit group" onClose={onClose}>
      <form onSubmit={handleSave} noValidate>
        <label className="field">
          Group name
          <input autoFocus maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="field">
          Background
          <div className="scene-picker">
            {SCENE_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.key}
                aria-pressed={scene === option.key}
                className={scene === option.key ? 'scene-option picked' : 'scene-option'}
                onClick={() => setScene(option.key)}
              >
                <span className="scene-thumb">
                  <GroupScene scene={option.key} />
                  {scene === option.key && <span className="scene-check"><Check size={13} weight="bold" aria-hidden="true" /></span>}
                </span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Save changes</button>
        </div>
      </form>
      <hr className="dashed" />
      <button className="link link-danger" onClick={() => setConfirming(true)}>Delete this group</button>
    </Modal>
  )
}
